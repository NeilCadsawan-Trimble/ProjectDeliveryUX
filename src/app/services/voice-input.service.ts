import { Injectable, NgZone, inject, signal } from '@angular/core';
import { DeepgramClient } from '@deepgram/sdk';
import { DataStoreService } from '../data/data-store.service';
import { buildVoiceKeyterms } from '../data/voice-vocabulary';

/**
 * Discriminator for surfaceable error states. The mic button uses this to
 * pick a tooltip and to decide whether the next click should retry.
 */
export type VoiceInputErrorKind =
  | 'denied'
  | 'token-failed'
  | 'network'
  | 'unsupported'
  | 'connect-failed';

/**
 * Callback shape passed by the composer pill. The service emits the
 * concatenation of all committed (final) text plus the current interim tail,
 * so the textarea always shows the best transcript so far. `isFinal` is true
 * only on the result whose tail has just been committed; the caller can use
 * it as a signal that the textarea contents have stabilised.
 */
export type VoiceTranscriptCallback = (text: string, isFinal: boolean) => void;

interface DeepgramTokenResponse {
  readonly token: string;
  readonly expiresAt: number;
}

/**
 * Real-time voice-input pipeline backed by Deepgram Nova-3 streaming STT.
 *
 * Lifecycle
 * ---------
 *   start()
 *     -> GET /api/deepgram-token (server mints ephemeral JWT)
 *     -> getUserMedia({ audio: true })  -- single permission grant
 *     -> AudioContext + AnalyserNode    -- live RMS level meter
 *     -> DeepgramClient.listen.v1.connect(...) with keyterms
 *     -> MediaRecorder.start(250)       -- 250ms opus chunks fed via socket
 *     <- Deepgram emits "Results" frames; service merges committed + interim
 *        text and pushes to the consumer via `onTranscript`
 *
 *   stop() / cleanup() funnel through one path: socket.close, recorder.stop,
 *   AudioContext.close, MediaStream tracks stop, cancel rAF loop, reset all
 *   signals. Any error path also lands here.
 *
 * NgZone discipline
 * -----------------
 * WebSocket and MediaRecorder events fire outside Angular's zone. Every
 * signal write that the UI binds to runs through `zone.run(...)` so change
 * detection actually picks them up. The 60fps level-meter loop deliberately
 * stays *outside* the zone -- it only writes a CSS variable, never a signal.
 *
 * Singleton, so multiple composer pills share one mic session: subsequent
 * `start()` calls while `listening()` is true are no-ops.
 *
 * Out of scope (deferred): Whisper fallback, find-and-replace post-processing,
 * speaker diarization, recording playback, per-agent vocabulary contributions.
 */
@Injectable({ providedIn: 'root' })
export class VoiceInputService {
  private readonly zone = inject(NgZone);
  private readonly dataStore = inject(DataStoreService);

  /**
   * Feature gate: true only when every browser API we require is present
   * (audio capture, audio analysis, container-encoded recording, and a
   * real WebSocket implementation). Stays the same for the lifetime of the
   * page; callers can read it once.
   */
  readonly supported = signal<boolean>(this.detectSupport());

  /** Mic is open, audio is flowing, transcripts are streaming. */
  readonly listening = signal<boolean>(false);

  /** Token fetch + WebSocket handshake in flight. UI uses this for a
   *  brief "spinning up" state on the mic button. */
  readonly connecting = signal<boolean>(false);

  /**
   * Current normalised audio RMS (0..1). Updated outside Angular's zone via
   * requestAnimationFrame; mirrored to the `--mic-level` CSS variable on
   * `<html>` so the pulsing-ring shadow can breathe at 60fps without
   * triggering change detection. Bind to this signal only when you really
   * need the value in a template -- prefer the CSS variable for visuals.
   */
  readonly level = signal<number>(0);

  /** Discriminated error state; mic button picks a tooltip from this. */
  readonly error = signal<VoiceInputErrorKind | null>(null);

  // Live-session resources. All five are owned by start()/cleanup() and are
  // null whenever `listening()` is false. The cleanup path is idempotent so
  // it is safe to call from any error branch.
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recorder: MediaRecorder | null = null;
  // The Deepgram SDK's `listen.v1.connect()` returns a typed Socket wrapper.
  // We keep it loosely typed to avoid coupling to internal SDK types that
  // are not exported on the public surface; the runtime API we use --
  // `.on()`, `.connect()`, `.waitForOpen()`, `.close()`, `.socket.send()`,
  // `.sendCloseStream()` -- is all present on the V1Socket class.
  private connection: DeepgramListenSocket | null = null;
  private rafId: number | null = null;

  /** Buffer of committed (Deepgram is_final=true) text. Interim segments are
   *  appended to this on the fly but only persist once finalised. */
  private committedText = '';
  /** Latest interim text -- replaced on every Results frame until is_final. */
  private interimText = '';
  /** The current consumer callback, captured in start() and cleared in cleanup(). */
  private onTranscript: VoiceTranscriptCallback | null = null;

  /**
   * Toggle convenience for the mic button: starts a session if idle,
   * otherwise stops the active one. Returns the same promise as start() so
   * the caller can await connection failures.
   */
  async toggle(onTranscript: VoiceTranscriptCallback): Promise<void> {
    if (this.listening() || this.connecting()) {
      this.stop();
      return;
    }
    await this.start(onTranscript);
  }

  /**
   * Open the mic, mint an ephemeral Deepgram token, connect the WebSocket,
   * and start streaming. Resolves once the socket is open and audio chunks
   * are flowing -- not when the first transcript arrives.
   *
   * Sets `error` and runs cleanup on any failure (token, permission, socket).
   * No-op if a session is already in progress.
   */
  async start(onTranscript: VoiceTranscriptCallback): Promise<void> {
    if (this.listening() || this.connecting()) return;
    if (!this.supported()) {
      this.error.set('unsupported');
      return;
    }

    this.zone.run(() => {
      this.error.set(null);
      this.connecting.set(true);
    });
    this.onTranscript = onTranscript;
    this.committedText = '';
    this.interimText = '';

    let token: string;
    try {
      const tokenRes = await fetch('/api/deepgram-token', { cache: 'no-store' });
      if (!tokenRes.ok) {
        this.fail('token-failed');
        return;
      }
      const json = (await tokenRes.json()) as DeepgramTokenResponse;
      if (!json.token) {
        this.fail('token-failed');
        return;
      }
      token = json.token;
    } catch {
      this.fail('token-failed');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      // DOMException name === 'NotAllowedError' covers both user-denied and
      // policy-denied. Other errors (NotFoundError, OverconstrainedError)
      // also surface as a denial-class problem from the user's perspective.
      const denied =
        err && typeof err === 'object' && 'name' in err && err.name === 'NotAllowedError';
      this.fail(denied ? 'denied' : 'network');
      return;
    }
    this.stream = stream;

    // Audio graph for the level meter. Reads from the same MediaStream as
    // MediaRecorder; `getUserMedia` is granted once but the stream feeds two
    // consumers (analyser + recorder).
    try {
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      src.connect(analyser);
      this.audioCtx = ctx;
      this.analyser = analyser;
      this.startLevelLoop(analyser);
    } catch {
      // A failed AudioContext does not break dictation -- it only loses the
      // visual level meter. Continue without it; cleanup still runs in stop().
      this.audioCtx = null;
      this.analyser = null;
    }

    // Deepgram WebSocket. The SDK's CustomDeepgramClient builds the proper
    // browser auth (Sec-WebSocket-Protocol: bearer, <jwt>) from the
    // accessToken option -- we cannot set Authorization headers on browser
    // WebSockets directly. The Authorization arg below is a TypeScript
    // requirement on the auto-generated ConnectArgs; the wrapped client
    // ignores it at runtime. Keep it empty to avoid leaking the JWT into
    // anywhere it does not need to go.
    let dgClient: DeepgramClient;
    try {
      dgClient = new DeepgramClient({ accessToken: token });
    } catch {
      this.fail('connect-failed');
      return;
    }

    let connection: DeepgramListenSocket;
    try {
      // Deepgram SDK v5 expects boolean parameters as the strings 'true' /
      // 'false' so they survive URL serialisation unchanged. See README
      // example "Note: string booleans required in v5".
      connection = (await dgClient.listen.v1.connect({
        model: 'nova-3',
        language: 'en-US',
        smart_format: 'true',
        interim_results: 'true',
        punctuate: 'true',
        encoding: 'opus',
        // Construction glossary + live project/persona names. Deepgram
        // accepts an array; the SDK serialises it as repeated `keyterm=...`
        // URL params (well under the WebSocket URL length cap with our
        // ~120-entry list).
        keyterm: buildVoiceKeyterms(this.dataStore) as string[],
        // Required by the auto-generated ConnectArgs type even though the
        // browser-aware wrapped client builds auth from accessToken.
        Authorization: '',
      })) as DeepgramListenSocket;
    } catch {
      this.fail('connect-failed');
      return;
    }
    this.connection = connection;

    connection.on('open', () => {
      this.zone.run(() => {
        this.connecting.set(false);
        this.listening.set(true);
      });
      this.startRecording(stream, connection);
    });

    connection.on('message', (raw: unknown) => {
      // Binary messages (none expected from listen) and metadata frames are
      // ignored here; only text "Results" carries transcripts.
      if (typeof raw !== 'object' || raw === null) return;
      const msg = raw as DeepgramListenMessage;
      if (msg.type !== 'Results') return;
      const alt = msg.channel?.alternatives?.[0];
      if (!alt) return;
      const transcript = alt.transcript ?? '';
      if (!transcript) return;
      this.zone.run(() => this.handleTranscript(transcript, msg.is_final ?? false));
    });

    connection.on('error', () => {
      this.zone.run(() => this.fail('network'));
    });

    connection.on('close', () => {
      // Server-initiated close OR our own stop(). Idempotent cleanup handles
      // both; in the stop() case `listening` is already false and cleanup is
      // a no-op for already-released resources.
      this.zone.run(() => this.cleanup());
    });

    try {
      connection.connect();
      await connection.waitForOpen();
    } catch {
      this.fail('connect-failed');
    }
  }

  /**
   * User-initiated stop. Sends Deepgram a CloseStream frame so the final
   * transcript flushes, then funnels through `cleanup()` to release every
   * resource. Safe to call when not listening (no-op).
   */
  stop(): void {
    if (!this.listening() && !this.connecting()) return;
    try {
      this.connection?.sendCloseStream({ type: 'CloseStream' });
    } catch {
      // ignored
    }
    this.cleanup();
  }

  // ---- internals -----------------------------------------------------------

  private detectSupport(): boolean {
    if (typeof window === 'undefined') return false;
    if (!navigator.mediaDevices?.getUserMedia) return false;
    if (typeof MediaRecorder === 'undefined') return false;
    if (typeof WebSocket === 'undefined') return false;
    if (typeof AudioContext === 'undefined' && typeof (window as WindowWithWebkitAudio).webkitAudioContext === 'undefined') return false;
    return true;
  }

  /**
   * Pick the best opus container that this browser supports. Chrome/Firefox
   * prefer audio/webm;codecs=opus; Safari historically rejects webm but ships
   * opus inside an mp4 container. Deepgram accepts either when
   * `encoding=opus` is set on the URL.
   */
  private pickMimeType(): string | undefined {
    if (typeof MediaRecorder === 'undefined') return undefined;
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    for (const mt of candidates) {
      if (MediaRecorder.isTypeSupported(mt)) return mt;
    }
    return undefined;
  }

  private startRecording(stream: MediaStream, connection: DeepgramListenSocket): void {
    const mimeType = this.pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      this.fail('connect-failed');
      return;
    }
    this.recorder = recorder;
    recorder.ondataavailable = ev => {
      if (ev.data.size === 0) return;
      try {
        // Deepgram's V1Socket has both sendMedia(binary) and the underlying
        // socket.send -- we use sendMedia since it's the typed entry point
        // and asserts the socket is OPEN before forwarding.
        connection.sendMedia(ev.data);
      } catch {
        // The socket may have closed mid-flight; cleanup will run from the
        // close handler.
      }
    };
    recorder.start(250);
  }

  /**
   * 60fps RMS loop running outside Angular's zone. Writes a CSS custom
   * property on `<html>` for the pulsing-ring shadow and mirrors the value
   * to a signal in case any consumer wants the number directly. The signal
   * write is intentionally NOT zone-scoped -- the value is consumed via CSS
   * variable, so no change detection is needed.
   */
  private startLevelLoop(analyser: AnalyserNode): void {
    const buf = new Uint8Array(analyser.fftSize);
    const root = typeof document !== 'undefined' ? document.documentElement : null;

    const tick = (): void => {
      if (this.analyser !== analyser) return; // analyser swapped out by cleanup
      analyser.getByteTimeDomainData(buf);
      // Compute RMS over the time-domain samples. Each byte is centred at
      // 128; we shift to [-1, 1], square, average, and sqrt. The empirical
      // boost (clamped to 1) makes typical speech reach ~0.5-0.8 instead of
      // a small fraction so the visual ring is actually visible.
      let sumSquares = 0;
      for (let i = 0; i < buf.length; i++) {
        const s = (buf[i] - 128) / 128;
        sumSquares += s * s;
      }
      const rms = Math.sqrt(sumSquares / buf.length);
      const boosted = Math.min(1, rms * 4);
      this.level.set(boosted);
      if (root) root.style.setProperty('--mic-level', boosted.toFixed(3));
      this.rafId = requestAnimationFrame(tick);
    };

    this.zone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(tick);
    });
  }

  /**
   * Merge a Deepgram Results frame into the textarea-bound transcript. Final
   * results commit to a permanent buffer; interim results replace the
   * trailing edit so the textarea visibly self-corrects as the speaker
   * disambiguates words.
   */
  private handleTranscript(transcript: string, isFinal: boolean): void {
    if (isFinal) {
      this.committedText = this.appendChunk(this.committedText, transcript);
      this.interimText = '';
    } else {
      this.interimText = transcript;
    }
    const merged = this.committedText
      ? this.interimText
        ? `${this.committedText} ${this.interimText}`
        : this.committedText
      : this.interimText;
    this.onTranscript?.(merged, isFinal);
  }

  /** Insert a space between committed segments so consecutive sentences read
   *  cleanly. Trims to avoid double-spacing if Deepgram already padded. */
  private appendChunk(prev: string, chunk: string): string {
    const trimmedPrev = prev.trimEnd();
    const trimmedChunk = chunk.trimStart();
    if (!trimmedPrev) return trimmedChunk;
    if (!trimmedChunk) return trimmedPrev;
    return `${trimmedPrev} ${trimmedChunk}`;
  }

  private fail(kind: VoiceInputErrorKind): void {
    this.zone.run(() => this.error.set(kind));
    this.cleanup();
  }

  /**
   * Idempotent. Releases every resource the session owns and resets state.
   * Called from stop(), the WebSocket close handler, and every error path.
   */
  private cleanup(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--mic-level', '0');
    }

    if (this.recorder) {
      try {
        if (this.recorder.state !== 'inactive') this.recorder.stop();
      } catch {
        // ignored
      }
      this.recorder.ondataavailable = null;
      this.recorder = null;
    }

    if (this.connection) {
      try {
        this.connection.close();
      } catch {
        // ignored
      }
      this.connection = null;
    }

    if (this.audioCtx) {
      try {
        // close() is async but we don't await -- nothing else depends on it
        // and we've already released the MediaStream tracks below.
        void this.audioCtx.close();
      } catch {
        // ignored
      }
      this.audioCtx = null;
      this.analyser = null;
    }

    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        try {
          track.stop();
        } catch {
          // ignored
        }
      }
      this.stream = null;
    }

    this.committedText = '';
    this.interimText = '';
    this.onTranscript = null;
    this.zone.run(() => {
      this.level.set(0);
      this.connecting.set(false);
      this.listening.set(false);
    });
  }
}

// ----- Local typings for Deepgram SDK runtime objects we touch -----
//
// The SDK's V1Socket and V1 Results message types are auto-generated into
// deeply-namespaced exports that aren't part of the public TS surface. We
// declare a narrow shape here covering only the methods/fields we actually
// use, so the service file stays decoupled from internal SDK paths.

interface DeepgramListenSocket {
  on(event: 'open', cb: () => void): void;
  on(event: 'message', cb: (msg: unknown) => void): void;
  on(event: 'close', cb: (event: { code: number; reason?: string }) => void): void;
  on(event: 'error', cb: (err: Error) => void): void;
  connect(): unknown;
  waitForOpen(): Promise<unknown>;
  close(): void;
  sendMedia(data: ArrayBuffer | Blob | ArrayBufferView): void;
  sendCloseStream(message: { type: 'CloseStream' }): void;
}

interface DeepgramListenMessage {
  readonly type: string;
  readonly is_final?: boolean;
  readonly channel?: {
    readonly alternatives?: ReadonlyArray<{ readonly transcript?: string }>;
  };
}

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

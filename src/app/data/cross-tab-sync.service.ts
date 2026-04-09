import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';

interface SyncMessage {
  method: string;
  args: unknown[];
  persona: string;
}

@Injectable({ providedIn: 'root' })
export class CrossTabSyncService implements OnDestroy {
  private readonly zone = inject(NgZone);
  private channel: BroadcastChannel | null = null;
  private handler: ((msg: SyncMessage) => void) | null = null;
  private currentPersona = 'frank';

  init(persona: string, onReceive: (method: string, args: unknown[]) => void): void {
    this.currentPersona = persona;
    this.channel = new BroadcastChannel('pdu-data-store');
    this.handler = onReceive as unknown as (msg: SyncMessage) => void;
    this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const { method, args, persona: msgPersona } = event.data;
      if (msgPersona !== this.currentPersona) return;
      this.zone.run(() => onReceive(method, args));
    };
  }

  setPersona(persona: string): void {
    this.currentPersona = persona;
  }

  broadcast(method: string, args: unknown[]): void {
    this.channel?.postMessage({ method, args, persona: this.currentPersona } satisfies SyncMessage);
  }

  ngOnDestroy(): void {
    this.channel?.close();
    this.channel = null;
    this.handler = null;
  }
}

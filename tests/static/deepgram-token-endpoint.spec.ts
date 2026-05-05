import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));

const ENDPOINT_PATH = resolve(__dir, '../../api/deepgram-token.ts');
const DEV_PROXY_PATH = resolve(__dir, '../../dev-proxy.mjs');

describe('Deepgram ephemeral-token endpoint', () => {
  it('the api/deepgram-token.ts Edge Function file exists', () => {
    expect(existsSync(ENDPOINT_PATH)).toBe(true);
  });

  describe('production Edge Function (api/deepgram-token.ts)', () => {
    const SRC = readFileSync(ENDPOINT_PATH, 'utf-8');

    it('declares Vercel Edge Runtime', () => {
      // Same shape as api/weather.ts and api/chat.ts — keeps cold starts low
      // and avoids leaking the master key into a Node.js function lifetime.
      expect(SRC).toMatch(/export\s+const\s+config\s*=\s*\{\s*runtime:\s*'edge'/);
    });

    it('reads DEEPGRAM_API_KEY from process.env (never imported from a frontend module)', () => {
      expect(SRC).toMatch(/process\.env\[['"]DEEPGRAM_API_KEY['"]\]/);
    });

    it('handles OPTIONS preflight with 204 + CORS headers', () => {
      expect(SRC).toMatch(/req\.method\s*===\s*['"]OPTIONS['"]/);
      expect(SRC).toMatch(/status:\s*204/);
      expect(SRC).toContain('Access-Control-Allow-Origin');
      expect(SRC).toContain('Access-Control-Allow-Methods');
    });

    it('rejects non-GET requests with 405 (mirrors weather.ts shape)', () => {
      expect(SRC).toMatch(/req\.method\s*!==\s*['"]GET['"]/);
      expect(SRC).toMatch(/status:\s*405|Method not allowed/);
    });

    it('returns 500 when DEEPGRAM_API_KEY is missing (clear setup error, no leak)', () => {
      expect(SRC).toMatch(/DEEPGRAM_API_KEY not configured/);
    });

    it('calls the Deepgram auth grant endpoint with Token-prefixed Authorization', () => {
      expect(SRC).toContain('https://api.deepgram.com/v1/auth/grant');
      // Token <key> is the documented scheme for master API keys.
      expect(SRC).toMatch(/Authorization:\s*`Token \$\{apiKey\}`/);
    });

    it('returns { token, expiresAt } on success', () => {
      expect(SRC).toMatch(/token:\s*grant\.access_token/);
      expect(SRC).toMatch(/expiresAt:/);
    });

    it('sets Cache-Control: no-store so tokens never sit in any cache', () => {
      expect(SRC).toMatch(/Cache-Control['"]?\s*:\s*['"]no-store/);
    });

    it('does NOT log or echo the master API key in any error or response branch', () => {
      // The whole point of the ephemeral-token architecture is that the
      // master key never reaches the browser or any log line. This test is
      // a structural guard against accidental concat into messages.
      expect(SRC).not.toMatch(/console\.[a-z]+\(.*apiKey/);
      expect(SRC).not.toMatch(/error:.*apiKey/i);
      expect(SRC).not.toMatch(/details:.*apiKey/i);
      // Don't return upstream Deepgram body verbatim either — it can contain
      // headers that reflect what was sent.
      expect(SRC).not.toMatch(/await\s+grantRes\.text\(\)/);
    });

    it('upstream Deepgram failures return 502, not the upstream status code', () => {
      // Squash 4xx/5xx from Deepgram into a generic gateway error so the
      // browser cannot infer specifics about the master key by probing.
      expect(SRC).toMatch(/grantRes\.ok/);
      expect(SRC).toMatch(/status:\s*502|, 502/);
    });
  });

  describe('local dev-proxy parity (dev-proxy.mjs)', () => {
    const PROXY_SRC = readFileSync(DEV_PROXY_PATH, 'utf-8');

    it('routes /api/deepgram-token in the dev-proxy router (npm start parity)', () => {
      // Without this, hitting the mic locally would fail because the
      // Edge Function only runs on Vercel.
      expect(PROXY_SRC).toContain('/api/deepgram-token');
      expect(PROXY_SRC).toContain('handleDeepgramToken');
    });

    it('dev-proxy handler rejects non-GET, mirrors prod env-var guard, and forwards to grant API', () => {
      expect(PROXY_SRC).toMatch(/handleDeepgramToken\([^)]*\)\s*\{[\s\S]*?req\.method\s*!==\s*['"]GET['"]/);
      expect(PROXY_SRC).toMatch(/process\.env\.DEEPGRAM_API_KEY/);
      expect(PROXY_SRC).toContain('https://api.deepgram.com/v1/auth/grant');
      expect(PROXY_SRC).toMatch(/Cache-Control['"]?\s*:\s*['"]no-store/);
    });

    it('dev-proxy startup log mentions the new Deepgram endpoint', () => {
      // Surfaces the new route in the developer's terminal without forcing
      // them to read source.
      expect(PROXY_SRC).toMatch(/Deepgram token proxy/);
    });
  });

  describe('environment documentation', () => {
    it('.env.example documents DEEPGRAM_API_KEY so contributors know to set it', () => {
      const EXAMPLE = readFileSync(resolve(__dir, '../../.env.example'), 'utf-8');
      expect(EXAMPLE).toMatch(/DEEPGRAM_API_KEY=/);
    });

    it('.gitignore covers .env so the master key never reaches the repo', () => {
      const GITIGNORE = readFileSync(resolve(__dir, '../../.gitignore'), 'utf-8');
      // matches `.env` and `.env.*.local` etc.
      expect(GITIGNORE).toMatch(/^\.env\b/m);
    });
  });
});

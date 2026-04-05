import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SERVICE_SRC = readFileSync(
  resolve(__dir, '../../src/app/services/weather.service.ts'),
  'utf-8',
);
const API_PROXY_SRC = readFileSync(
  resolve(__dir, '../../api/weather.ts'),
  'utf-8',
);
const SEED_SRC = readFileSync(
  resolve(__dir, '../../src/app/data/dashboard-data.seed.ts'),
  'utf-8',
);

describe('WeatherService (regression)', () => {
  describe('initialization guard (no one-shot initPromise)', () => {
    it('does NOT use initPromise (prevents re-fetch after HMR)', () => {
      expect(SERVICE_SRC).not.toContain('initPromise');
    });

    it('uses fetchInProgress guard for concurrent fetch prevention', () => {
      expect(SERVICE_SRC).toContain('fetchInProgress');
    });

    it('uses lastSuccessTimestamp for cache TTL-based retry', () => {
      expect(SERVICE_SRC).toContain('lastSuccessTimestamp');
    });

    it('uses CACHE_TTL_MS constant', () => {
      expect(SERVICE_SRC).toContain('CACHE_TTL_MS');
    });

    it('resets fetchInProgress in finally block', () => {
      expect(SERVICE_SRC).toContain('.finally(() =>');
      expect(SERVICE_SRC).toContain('this.fetchInProgress = false');
    });
  });

  describe('forecast date filtering (no stale dates)', () => {
    it('filters past dates with < comparison, not === today', () => {
      expect(SERVICE_SRC).toContain("if (dateKey < today) continue");
      expect(SERVICE_SRC).not.toContain("if (dateKey === today) continue");
    });
  });

  describe('error visibility', () => {
    it('logs success count after fetch', () => {
      expect(SERVICE_SRC).toContain('[WeatherService] Live weather updated');
    });

    it('warns on complete failure', () => {
      expect(SERVICE_SRC).toContain('[WeatherService] All weather API calls failed');
    });

    it('warns on individual city fetch failure', () => {
      expect(SERVICE_SRC).toContain('[WeatherService] Fetch failed for');
    });

    it('warns on non-OK API response', () => {
      expect(SERVICE_SRC).toContain('[WeatherService] API returned');
    });
  });

  describe('API proxy endpoint', () => {
    it('uses OpenWeatherMap base URL', () => {
      expect(API_PROXY_SRC).toContain('https://api.openweathermap.org/data/2.5');
    });

    it('reads API key from environment', () => {
      expect(API_PROXY_SRC).toContain("process.env['OPENWEATHERMAP_API_KEY']");
    });

    it('fetches both current and forecast endpoints', () => {
      expect(API_PROXY_SRC).toContain('/weather?q=');
      expect(API_PROXY_SRC).toContain('/forecast?q=');
    });

    it('uses imperial units', () => {
      expect(API_PROXY_SRC).toContain('units=imperial');
    });

    it('requires city and state query params', () => {
      expect(API_PROXY_SRC).toContain("city and state query params required");
    });

    it('returns combined { current, forecast } response', () => {
      expect(API_PROXY_SRC).toContain('return json({ current, forecast }');
    });
  });

  describe('seed data uses dynamic dates', () => {
    it('has buildForecast helper for dynamic date generation', () => {
      expect(SEED_SRC).toContain('buildForecast');
    });

    it('does NOT have hardcoded forecast date strings', () => {
      const hardcodedDatePattern = /forecast:\s*\[\s*\{[^}]*day:\s*'(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\w+\s+\d+'/;
      expect(SEED_SRC).not.toMatch(hardcodedDatePattern);
    });
  });
});

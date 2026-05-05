export const config = {
  runtime: 'edge',
};

const DEEPGRAM_GRANT_URL = 'https://api.deepgram.com/v1/auth/grant';

/**
 * Mints a short-lived Deepgram ephemeral access token (JWT) so the browser can
 * open a streaming WebSocket without ever seeing the master API key. Default
 * TTL is ~30 seconds; that is plenty for the WebSocket handshake — the
 * connection itself stays alive past expiry. Requests a fresh token per
 * dictation session rather than caching.
 *
 * Mirrors the structure of api/weather.ts (CORS preamble, env-var guard,
 * method gate, JSON helper) so the codebase has one consistent edge-function
 * shape. Production runs this; local dev uses the matching handleDeepgramToken
 * branch in dev-proxy.mjs.
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env['DEEPGRAM_API_KEY'];
  if (!apiKey) {
    return json({ error: 'DEEPGRAM_API_KEY not configured' }, 500);
  }

  try {
    const grantRes = await fetch(DEEPGRAM_GRANT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    if (!grantRes.ok) {
      // Intentionally do NOT echo the master key, the upstream response body,
      // or any header that could leak credentials. The status code alone is
      // enough for the client to surface a useful error.
      return json({ error: `Deepgram auth grant failed: ${grantRes.status}` }, 502);
    }

    const grant = (await grantRes.json()) as { access_token?: string; expires_in?: number };
    if (!grant.access_token) {
      return json({ error: 'Deepgram auth grant returned no access_token' }, 502);
    }

    const ttlSec = typeof grant.expires_in === 'number' ? grant.expires_in : 30;
    return json({ token: grant.access_token, expiresAt: Date.now() + ttlSec * 1000 }, 200);
  } catch {
    return json({ error: 'Failed to mint Deepgram token' }, 502);
  }
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}

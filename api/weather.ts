export const config = {
  runtime: 'edge',
};

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

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

  const apiKey = process.env['OPENWEATHERMAP_API_KEY'];
  if (!apiKey) {
    return json({ error: 'OPENWEATHERMAP_API_KEY not configured' }, 500);
  }

  const url = new URL(req.url);
  const city = url.searchParams.get('city');
  const state = url.searchParams.get('state');

  if (!city || !state) {
    return json({ error: 'city and state query params required' }, 400);
  }

  const q = `${city},${state},US`;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${OWM_BASE}/weather?q=${encodeURIComponent(q)}&appid=${apiKey}&units=imperial`),
      fetch(`${OWM_BASE}/forecast?q=${encodeURIComponent(q)}&appid=${apiKey}&units=imperial`),
    ]);

    if (!currentRes.ok) {
      const err = await currentRes.text();
      return json({ error: `OpenWeatherMap current error: ${currentRes.status}`, details: err }, currentRes.status);
    }
    if (!forecastRes.ok) {
      const err = await forecastRes.text();
      return json({ error: `OpenWeatherMap forecast error: ${forecastRes.status}`, details: err }, forecastRes.status);
    }

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    return json({ current, forecast }, 200);
  } catch (err) {
    return json({ error: 'Failed to fetch weather data', details: String(err) }, 502);
  }
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
    },
  });
}

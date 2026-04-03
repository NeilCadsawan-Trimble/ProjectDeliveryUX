import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';

const PORT = 3001;

function loadEnv() {
  const envPath = new URL('.env', import.meta.url).pathname;
  if (!existsSync(envPath)) {
    console.error('No .env file found. Create one with ANTHROPIC_API_KEY=sk-...');
    process.exit(1);
  }
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    process.env[key] = val;
  }
}

loadEnv();

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 2048;

const SYSTEM_PROMPT = `You are Trimble AI, a project delivery assistant for construction and infrastructure projects. You help project managers understand status, risks, budgets, schedules, and team allocation.

Rules:
- Be concise: 2-3 sentences by default, expand only when asked for detail.
- Use the provided context to ground your answers in real project data.
- When no context is available, give helpful general guidance.
- Do not use markdown formatting (no bold, headers, or bullet lists). Use plain text only since your responses display in a chat bubble.
- If you don't know something, say so honestly rather than fabricating data.
- When relevant, suggest a follow-up question the user could ask.
- When tools are available and the user asks to change, update, or set a value, use the appropriate tool. Always explain what you are about to change before calling the tool.`;

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url?.startsWith('/api/weather')) {
    await handleWeather(req, res);
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/chat') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in .env' }));
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const { messages, context, agentPrompt } = parsed;
  let systemPrompt = SYSTEM_PROMPT;
  if (agentPrompt) systemPrompt = `${agentPrompt}\n\n${systemPrompt}`;
  if (context) systemPrompt = `${systemPrompt}\n\nCurrent context:\n${context}`;

  const anthropicBody = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
  };

  if (parsed.tools && parsed.tools.length > 0) {
    anthropicBody.tools = parsed.tools;
  }

  try {
    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicBody),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      res.writeHead(anthropicRes.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Anthropic API error: ${anthropicRes.status}`, details: errText }));
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    });

    const reader = anthropicRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let toolName = '';
    let toolJsonBuffer = '';
    let inToolUse = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const event = JSON.parse(data);

          if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
            inToolUse = true;
            toolName = event.content_block.name || '';
            toolJsonBuffer = '';
          } else if (event.type === 'content_block_delta') {
            if (inToolUse && event.delta?.type === 'input_json_delta') {
              toolJsonBuffer += event.delta.partial_json || '';
            } else if (event.delta?.type === 'text_delta' && event.delta?.text) {
              res.write(event.delta.text);
            }
          } else if (event.type === 'content_block_stop' && inToolUse) {
            const marker = `\n<!--TOOL_CALL:${JSON.stringify({ name: toolName, args: JSON.parse(toolJsonBuffer || '{}') })}-->\n`;
            res.write(marker);
            inToolUse = false;
            toolName = '';
            toolJsonBuffer = '';
          }
        } catch {
          // skip malformed JSON
        }
      }
    }

    res.end();
  } catch (err) {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy error' }));
    } else {
      res.end();
    }
  }
});

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

async function handleWeather(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const owmKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!owmKey) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'OPENWEATHERMAP_API_KEY not set in .env' }));
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const city = url.searchParams.get('city');
  const state = url.searchParams.get('state');
  if (!city || !state) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'city and state query params required' }));
    return;
  }

  const q = `${city},${state},US`;
  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${OWM_BASE}/weather?q=${encodeURIComponent(q)}&appid=${owmKey}&units=imperial`),
      fetch(`${OWM_BASE}/forecast?q=${encodeURIComponent(q)}&appid=${owmKey}&units=imperial`),
    ]);

    if (!currentRes.ok) {
      const err = await currentRes.text();
      res.writeHead(currentRes.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `OWM error: ${currentRes.status}`, details: err }));
      return;
    }
    if (!forecastRes.ok) {
      const err = await forecastRes.text();
      res.writeHead(forecastRes.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `OWM error: ${forecastRes.status}`, details: err }));
      return;
    }

    const current = await currentRes.json();
    const forecast = await forecastRes.json();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900' });
    res.end(JSON.stringify({ current, forecast }));
  } catch (err) {
    console.error('Weather proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to fetch weather' }));
  }
}

server.listen(PORT, () => {
  console.log(`AI proxy running at http://localhost:${PORT}/api/chat`);
  console.log(`Weather proxy at http://localhost:${PORT}/api/weather`);
  console.log('Requests from Angular dev server will be proxied here.');
});

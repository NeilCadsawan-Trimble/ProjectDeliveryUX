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
- When relevant, suggest a follow-up question the user could ask.`;

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
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
          if (event.type === 'content_block_delta' && event.delta?.text) {
            res.write(event.delta.text);
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

server.listen(PORT, () => {
  console.log(`AI proxy running at http://localhost:${PORT}/api/chat`);
  console.log('Requests from Angular dev server will be proxied here.');
});

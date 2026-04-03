export const config = {
  runtime: 'edge',
};

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
- When tools are available and the user asks to change, update, or set a value, you MUST use the appropriate tool immediately. Use the Project ID from the context to populate the projectId parameter. Briefly explain what you are changing, then call the tool in the same response.
- Parse human-friendly amounts: "$2M" means 2000000, "$500K" means 500000, "$1.5M" means 1500000.`;

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: string;
  agentPrompt?: string;
  tools?: Array<{ name: string; description: string; input_schema: object }>;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, context, agentPrompt, tools } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let systemPrompt = SYSTEM_PROMPT;
  if (agentPrompt) systemPrompt = `${agentPrompt}\n\n${systemPrompt}`;
  if (context) systemPrompt = `${systemPrompt}\n\nCurrent context:\n${context}`;

  const anthropicBody: Record<string, unknown> = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
  };

  if (tools && tools.length > 0) {
    anthropicBody['tools'] = tools;
  }

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
    return new Response(JSON.stringify({ error: `Anthropic API error: ${anthropicRes.status}`, details: errText }), {
      status: anthropicRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = anthropicRes.body!.getReader();
      let buffer = '';
      let toolName = '';
      let toolJsonBuffer = '';
      let inToolUse = false;

      try {
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
                  controller.enqueue(encoder.encode(event.delta.text));
                }
              } else if (event.type === 'content_block_stop' && inToolUse) {
                const marker = `\n<!--TOOL_CALL:${JSON.stringify({ name: toolName, args: JSON.parse(toolJsonBuffer || '{}') })}-->\n`;
                controller.enqueue(encoder.encode(marker));
                inToolUse = false;
                toolName = '';
                toolJsonBuffer = '';
              }
            } catch {
              // skip malformed JSON lines
            }
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}

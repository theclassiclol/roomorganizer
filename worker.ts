interface Env {
  GROQ_API_KEY: string;
  GROQ_CHAT_MODEL?: string;
  GROQ_VISION_MODEL?: string;
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

type GroqRole = 'system' | 'user' | 'assistant';

interface GroqMessage {
  role: GroqRole;
  content:
    | string
    | Array<
        | {
            type: 'text';
            text: string;
          }
        | {
            type: 'image_url';
            image_url: {
              url: string;
            };
          }
      >;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_CHAT_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_VISION_MODEL = 'llama-3.2-11b-vision-preview';

const ANALYZE_PROMPT = `You are a professional interior organizer and minimalist design expert.
Analyze this image of a room.
1. Identify the type of room and its current state (cluttered, organized, chaotic, etc.).
2. Provide a list of 3-5 specific, actionable "Quick Wins" to immediately improve the space.
3. Suggest a long-term organizational strategy for this specific layout.
4. Suggest a storage solution that would work well here.

Format the output in clean Markdown with bold headings and bullet points. Be encouraging and non-judgmental.`;

const CHAT_SYSTEM_INSTRUCTION =
  'You are RoomOrganizer, a helpful, encouraging, and knowledgeable home organization assistant. You help users declutter, organize, and beautify their living spaces. Keep answers concise but helpful.';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

const extractInlineData = (imageBase64: string): { mimeType: string; data: string } | null => {
  const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    data: match[2],
  };
};

const toDataUrl = (mimeType: string, data: string): string => `data:${mimeType};base64,${data}`;

const readGroqText = (payload: any): string => {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item: { type?: string; text?: string }) => (item?.type === 'text' ? item.text ?? '' : ''))
      .join('')
      .trim();
  }

  return '';
};

const callGroq = async (env: Env, model: string, messages: GroqMessage[]): Promise<string> => {
  if (!env.GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY secret');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
    }),
  });

  const payload = await response.json<any>();

  if (!response.ok) {
    const detail = payload?.error?.message ?? JSON.stringify(payload);
    throw new Error(`Groq error: ${response.status} ${detail}`);
  }

  return readGroqText(payload);
};

const handleAnalyze = async (request: Request, env: Env): Promise<Response> => {
  const body = await request.json<{ imageBase64?: string }>();
  const imageBase64 = body?.imageBase64;

  if (!imageBase64) {
    return json({ error: 'imageBase64 is required' }, 400);
  }

  const inlineData = extractInlineData(imageBase64);
  if (!inlineData) {
    return json({ error: 'Invalid image data URL' }, 400);
  }

  const model = env.GROQ_VISION_MODEL || DEFAULT_VISION_MODEL;
  const text = await callGroq(env, model, [
    {
      role: 'system',
      content: CHAT_SYSTEM_INSTRUCTION,
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: ANALYZE_PROMPT,
        },
        {
          type: 'image_url',
          image_url: {
            url: toDataUrl(inlineData.mimeType, inlineData.data),
          },
        },
      ],
    },
  ]);

  return json({ text: text || "I couldn't generate an analysis for this image. Please try again." });
};

const handleChat = async (request: Request, env: Env): Promise<Response> => {
  const body = await request.json<{ messages?: ChatMessage[] }>();
  const messages = body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'messages is required' }, 400);
  }

  const chatTurns: GroqMessage[] = messages
    .filter((msg) => msg && (msg.role === 'user' || msg.role === 'model') && typeof msg.text === 'string' && msg.text.trim())
    .map((msg) => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.text,
    }));

  while (chatTurns.length > 0 && chatTurns[0].role !== 'user') {
    chatTurns.shift();
  }

  if (!chatTurns.length) {
    return json({ error: 'Conversation must include a user message' }, 400);
  }

  const model = env.GROQ_CHAT_MODEL || DEFAULT_CHAT_MODEL;
  const text = await callGroq(env, model, [
    {
      role: 'system',
      content: CHAT_SYSTEM_INSTRUCTION,
    },
    ...chatTurns,
  ]);

  return json({ text: text || "I'm sorry, I encountered an issue. Please try again." });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (url.pathname === '/api/analyze' && request.method === 'POST') {
        return await handleAnalyze(request, env);
      }

      if (url.pathname === '/api/chat' && request.method === 'POST') {
        return await handleChat(request, env);
      }
    } catch (error) {
      console.error('Worker API error:', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      return json({ error: message }, 500);
    }

    return env.ASSETS.fetch(request);
  },
};

interface Env {
  GEMINI_API_KEY: string;
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const MODEL_NAME = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

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

const readGeminiText = (payload: any): string => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map((part: { text?: string }) => part?.text ?? '')
    .join('')
    .trim();
};

const callGemini = async (env: Env, body: unknown): Promise<string> => {
  const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json<any>();

  if (!response.ok) {
    throw new Error(`Gemini error: ${response.status} ${JSON.stringify(payload)}`);
  }

  return readGeminiText(payload);
};

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

  const text = await callGemini(env, {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: inlineData.mimeType,
              data: inlineData.data,
            },
          },
          {
            text: ANALYZE_PROMPT,
          },
        ],
      },
    ],
  });

  return json({ text: text || "I couldn't generate an analysis for this image. Please try again." });
};

const handleChat = async (request: Request, env: Env): Promise<Response> => {
  const body = await request.json<{ messages?: ChatMessage[] }>();
  const messages = body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'messages is required' }, 400);
  }

  const contents = messages
    .filter((msg) => msg && (msg.role === 'user' || msg.role === 'model') && typeof msg.text === 'string' && msg.text.trim())
    .map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

  if (!contents.length) {
    return json({ error: 'No valid messages provided' }, 400);
  }

  // Gemini expects a user turn to start the conversation.
  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift();
  }

  if (!contents.length) {
    return json({ error: 'Conversation must include a user message' }, 400);
  }

  const text = await callGemini(env, {
    system_instruction: {
      parts: [{ text: CHAT_SYSTEM_INSTRUCTION }],
    },
    contents,
  });

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

import { ChatMessage } from '../types';

export const analyzeRoomImage = async (base64Image: string): Promise<string> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ imageBase64: base64Image }),
  });

  if (!response.ok) {
    throw new Error(`Analyze failed with status ${response.status}`);
  }

  const data = (await response.json()) as { text?: string };
  if (!data.text) {
    throw new Error('Analyze response missing text');
  }
  return data.text;
};

export const sendMessageToChat = async (messages: ChatMessage[]): Promise<string> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(`Chat failed with status ${response.status}`);
  }

  const data = (await response.json()) as { text?: string };
  if (!data.text) {
    throw new Error('Chat response missing text');
  }
  return data.text;
};

// Tipos de la API de Google Gemini (generativelanguage v1beta).
export type GeminiResult = {
  text: string;
  model: string;
  tokensIn?: number;
  tokensOut?: number;
};

export type GeminiResponse = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

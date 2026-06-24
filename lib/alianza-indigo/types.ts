export type AlianzaIndigoGenerateRequest = {
  prompt: string;
  model: string;
  input: unknown;
};

export type AlianzaIndigoGenerateResponse = {
  text: string;
  requestId?: string;
  model?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

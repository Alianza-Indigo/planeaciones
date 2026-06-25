import { getGeminiEnv } from "@/lib/env";
import type { GeminiResponse, GeminiResult } from "@/lib/alianza-indigo/types";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Llama al endpoint generateContent de Google Gemini con el prompt maestro.
export async function callGemini(prompt: string): Promise<GeminiResult> {
  const env = getGeminiEnv();
  const model = env.GEMINI_MODEL;

  const response = await fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini respondió ${response.status}: ${details}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    const blocked = data.promptFeedback?.blockReason;
    throw new Error(
      blocked
        ? `Gemini bloqueó la solicitud por políticas de contenido (${blocked}).`
        : `Gemini no devolvió contenido (finishReason: ${candidate?.finishReason ?? "desconocido"}).`,
    );
  }

  return {
    text,
    model,
    tokensIn: data.usageMetadata?.promptTokenCount,
    tokensOut: data.usageMetadata?.candidatesTokenCount,
  };
}

import { getAlianzaEnv } from "@/lib/env";
import type {
  AlianzaIndigoGenerateRequest,
  AlianzaIndigoGenerateResponse,
} from "@/lib/alianza-indigo/types";

export async function callAlianzaIndigo(
  payload: AlianzaIndigoGenerateRequest,
): Promise<AlianzaIndigoGenerateResponse> {
  const env = getAlianzaEnv();
  const response = await fetch(`${env.ALIANZA_INDIGO_API_URL}/v1/generate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.ALIANZA_INDIGO_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Alianza Indigo respondio ${response.status}: ${details}`);
  }

  return response.json() as Promise<AlianzaIndigoGenerateResponse>;
}

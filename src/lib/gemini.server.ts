const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
];

const TRANSCRIBE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest",
];

function apiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || undefined;
}

type Part =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

type Content = { role?: "user" | "model"; parts: Part[] };

export async function geminiGenerate(input: {
  system: string;
  contents: Content[];
  models?: string[];
}): Promise<{ ok: true; text: string } | { ok: false; error: string; status?: number }> {
  const key = apiKey();
  if (!key) {
    return { ok: false, error: "Falta la clave de Gemini." };
  }

  let lastStatus = 0;
  let lastMsg = "Gemini no respondió.";

  for (const model of input.models ?? MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": key,
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: input.system }] },
            contents: input.contents,
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 2048,
            },
          }),
        },
      );
      lastStatus = res.status;
      const body = (await res.json()) as {
        error?: { message?: string };
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      if (!res.ok) {
        lastMsg = body.error?.message ?? `Gemini ${res.status}`;
        if (res.status === 404 || res.status === 503) continue;
        return { ok: false, error: lastMsg, status: res.status };
      }
      const text =
        body.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("")
          .trim() ?? "";
      if (!text) {
        lastMsg = "Gemini no devolvió texto.";
        continue;
      }
      return { ok: true, text };
    } catch {
      lastMsg = "Falló la conexión con Gemini.";
    }
  }

  return { ok: false, error: lastMsg, status: lastStatus };
}

export async function geminiTranscribe(input: {
  mimeType: string;
  base64: string;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  return geminiGenerate({
    models: TRANSCRIBE_MODELS,
    system:
      "Transcribís audios de clases de Derecho en Venezuela. Devolvé solo la transcripción en español, con puntuación. Conservá nombres de leyes, artículos y doctrina. Si no se entiende un tramo, marcá [inaudible].",
    contents: [
      {
        role: "user",
        parts: [
          {
            inline_data: {
              mime_type: input.mimeType,
              data: input.base64,
            },
          },
          {
            text: "Transcribí este audio. Solo el texto.",
          },
        ],
      },
    ],
  });
}

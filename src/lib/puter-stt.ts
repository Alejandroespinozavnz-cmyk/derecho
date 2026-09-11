/**
 * Browser speech-to-text via Puter.js (no API key in IUS).
 * @see https://docs.puter.com/AI/speech2txt/
 */

export type Speech2TxtResult = {
  text?: string;
  duration?: number;
  words?: Array<{ start?: number; end?: number; text?: string; speaker?: string }>;
  segments?: Array<{ speaker?: string; text?: string }>;
};

type Speech2TxtFn = (
  source:
    | Blob
    | File
    | string
    | {
        audio?: Blob | File | string;
        file?: Blob | File | string;
        provider?: string;
        model?: string;
        language?: string;
        prompt?: string;
        format?: boolean;
        translate?: boolean;
        response_format?: string;
      },
  optionsOrTest?: Record<string, unknown> | boolean,
  testMode?: boolean,
) => Promise<string | Speech2TxtResult>;

type PuterHost = { ai?: { speech2txt?: Speech2TxtFn } };

declare global {
  interface Window {
    puter?: PuterHost;
  }
}

const SCRIPT_SRC = "https://js.puter.com/v2/";
const LEGAL_PROMPT =
  "Clase de Derecho venezolano. Transcribí en español con puntuación. Conservá nombres de leyes, artículos, lapsos y doctrina. No traduzcas al inglés.";

function extractText(result: string | Speech2TxtResult | null | undefined): string {
  if (!result) return "";
  if (typeof result === "string") return result.trim();
  const fromSegments = result.segments
    ?.map((s) => {
      const who = s.speaker ? `${s.speaker}: ` : "";
      return `${who}${s.text ?? ""}`.trim();
    })
    .filter(Boolean)
    .join("\n");
  return (result.text ?? fromSegments ?? "").trim();
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function loadPuter(timeoutMs = 10_000): Promise<PuterHost> {
  if (window.puter?.ai?.speech2txt) return window.puter;

  if (!document.querySelector("script[data-folio-puter]")) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.dataset.folioPuter = "1";
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("No pude cargar el transcriptor."));
      document.head.appendChild(script);
    });
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.puter?.ai?.speech2txt) return window.puter;
    await sleep(40);
  }
  throw new Error("El transcriptor no arrancó.");
}

export async function transcribeWithPuter(
  source: Blob | File,
): Promise<{ text: string; durationSec?: number }> {
  const puter = await loadPuter();
  const speech2txt = puter.ai?.speech2txt;
  if (!speech2txt) throw new Error("Transcriptor no disponible.");

  const attempts: Array<Parameters<Speech2TxtFn>[0]> = [
    {
      audio: source,
      language: "es",
      model: "gpt-4o-mini-transcribe",
      prompt: LEGAL_PROMPT,
    },
    {
      file: source,
      provider: "xai",
      language: "es",
      format: true,
    },
    {
      audio: source,
      model: "whisper-1",
      language: "es",
      prompt: LEGAL_PROMPT,
    },
  ];

  let lastError = "No pude transcribir el audio.";
  for (const opts of attempts) {
    try {
      const result = await speech2txt(opts);
      const text = extractText(result);
      if (!text) {
        lastError = "El transcriptor no devolvió texto.";
        continue;
      }
      const durationSec =
        typeof result === "object" && typeof result.duration === "number"
          ? Math.round(result.duration)
          : undefined;
      return { text, durationSec };
    } catch (err) {
      lastError = err instanceof Error ? err.message : lastError;
    }
  }
  throw new Error(lastError);
}

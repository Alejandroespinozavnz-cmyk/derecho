import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { tutorSystemPrompt } from "@/lib/tutor-prompt";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  subjectSlug: z.string().max(40),
  messages: z.array(MessageSchema).min(1).max(10),
});

export type TutorResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

function publicAiError(raw?: string | null): string {
  const t = (raw ?? "").trim();
  if (
    !t ||
    /api\s*key|unauthorized|forbidden|401|403|gemini|xai|openai|bearer|quota|clave/i.test(
      t,
    )
  ) {
    return "El tutor no está disponible en este momento.";
  }
  return t;
}

export const askTutor = createServerFn({ method: "POST" })
  .validator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<TutorResult> => {
    const last = data.messages[data.messages.length - 1];
    if (!last || last.role !== "user") {
      return { ok: false, error: "Falta la pregunta." };
    }

    const history = data.messages.slice(-8);
    const contents = history.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

    const { geminiGenerate } = await import("./gemini.server");
    const gemini = await geminiGenerate({
      system: tutorSystemPrompt(data.subjectSlug),
      contents,
    });
    if (gemini.ok) return gemini;
    return {
      ok: false,
      error: publicAiError(gemini.error) || "Falló la conexión con el tutor.",
    };
  });

export const transcribeAudio = createServerFn({ method: "POST" })
  .validator(
    z.object({
      mimeType: z.string().min(3).max(80),
      base64: z.string().min(20).max(12_000_000),
    }),
  )
  .handler(async ({ data }): Promise<TutorResult> => {
    const mime = data.mimeType.split(";")[0]?.trim() || "audio/webm";
    if (!mime.startsWith("audio/") && mime !== "video/webm") {
      return { ok: false, error: "Subí un archivo de audio." };
    }
    const { geminiTranscribe } = await import("./gemini.server");
    return geminiTranscribe({
      mimeType: mime,
      base64: data.base64,
    });
  });

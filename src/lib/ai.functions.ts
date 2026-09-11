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
    return "Temiño no está disponible en este momento.";
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
      error: publicAiError(gemini.error) || "Falló la conexión con Temiño.",
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

export const geminiKeyStatus = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(10).max(200) }))
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; set: boolean; last4: string | null; needsSchema: boolean }
      | { ok: false; error: string }
    > => {
      const { parseSessionToken } = await import("./gate.server");
      const session = parseSessionToken(data.token);
      if (!session || session.role !== "owner") {
        return { ok: false, error: "Tenés que entrar como dueño." };
      }
      const env =
        process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
      if (env) {
        const { maskGeminiKey } = await import("./gemini.server");
        return { ok: true, set: true, last4: maskGeminiKey(env), needsSchema: false };
      }
      const { readGeminiKey } = await import("./supabase.server");
      const remote = await readGeminiKey();
      if (remote.status === "ok") {
        const { maskGeminiKey } = await import("./gemini.server");
        return {
          ok: true,
          set: true,
          last4: maskGeminiKey(remote.data),
          needsSchema: false,
        };
      }
      return {
        ok: true,
        set: false,
        last4: null,
        needsSchema: remote.status === "needs_schema",
      };
    },
  );

export const saveGeminiKey = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(10).max(200),
      key: z.string().min(20).max(200),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<
      { ok: true; last4: string } | { ok: false; error: string; needsSchema?: boolean }
    > => {
      const { parseSessionToken } = await import("./gate.server");
      const session = parseSessionToken(data.token);
      if (!session || session.role !== "owner") {
        return { ok: false, error: "Tenés que entrar como dueño." };
      }
      const key = data.key.trim();
      if (!/^(AIza[0-9A-Za-z_-]{20,}|AQ\.[0-9A-Za-z_-]{20,})$/.test(key)) {
        return { ok: false, error: "Esa clave de Gemini no se ve válida." };
      }
      const { writeGeminiKeyRemote } = await import("./supabase.server");
      const written = await writeGeminiKeyRemote(key);
      if (written === "needs_schema") {
        return {
          ok: false,
          error: "Falta el SQL de Gemini. Copialo en Nube y dale Run.",
          needsSchema: true,
        };
      }
      if (written !== "ok") {
        return { ok: false, error: "No pude guardar la clave en la nube." };
      }
      const { rememberGeminiKey, maskGeminiKey } = await import("./gemini.server");
      rememberGeminiKey(key);
      return { ok: true, last4: maskGeminiKey(key) };
    },
  );

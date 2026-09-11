import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PROGRAM, YEAR, syllabusForPrompt } from "@/lib/program";
import { SUBJECTS } from "@/lib/subjects";

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

function systemPrompt(slug: string): string {
  const catalog = SUBJECTS.map((s) => {
    const p = PROGRAM[s.slug];
    return p
      ? `- ${s.fullName} (${p.code}, ${p.weeklyHours} h/sem, ${p.credits} UC)`
      : `- ${s.fullName}`;
  }).join("\n");

  const focus = PROGRAM[slug]
    ? `Materia en foco:\n${SUBJECTS.find((s) => s.slug === slug)?.fullName ?? slug}\n${syllabusForPrompt(slug)}`
    : "El estudiante no eligió una materia concreta. Preguntá cuál, o contestá con el plan de estudio.";

  return `Sos el tutor de IUS, el cuaderno de estudio de Derecho en la ${YEAR.university} (${YEAR.faculty}).

Plan oficial: ${YEAR.subjectCount} materias anuales, ${YEAR.weeklyHours} horas semanales, ${YEAR.credits} unidades de crédito.
${catalog}

${focus}

Reglas:
- Español de Venezuela, claro y directo. Trato de vos. Sin relleno.
- Derecho venezolano vigente: Constitución de 1999, Código Civil, CPC, Código de Comercio, LOTTT, LOPA, LOJCA, leyes especiales. No mezcles derecho argentino/español como si fuera el local.
- Cuando cites un artículo, sé preciso. Si no estás seguro del número, decilo y describí la regla.
- Estructura las respuestas: definición, fundamento, requisitos/elementos, efectos, lapsos si aplica, y un cierre útil para el parcial.
- Si piden un escrito (demanda, contestación, recurso), entregá un modelo breve con encabezado, hechos, derecho y petitorio, y advertí que hay que adaptarlo al caso.
- Si piden preguntas de examen, mezclá V/F, desarrollo y un caso corto, al estilo UCAT.
- No inventes jurisprudencia con datos falsos. Preferí doctrina clásica venezolana (Aguilar Gorrondona, Rengel Romberg, Brewer-Carías, Morles Hernández, etc.) cuando ayude.
- No des asesoría para un caso real de un cliente: esto es estudio académico.
- Máximo ~700 palabras salvo que pidan un escrito o un temario largo.`;
}

async function askXai(
  slug: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<TutorResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "El tutor no está disponible en este momento." };
  }
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.4,
      max_tokens: 1400,
      messages: [
        { role: "system", content: systemPrompt(slug) },
        ...history,
      ],
    }),
  });
  if (!res.ok) {
    return {
      ok: false,
      error:
        res.status === 429
          ? "El tutor está saturado. Probá de nuevo en un minuto."
          : `No pude consultar al tutor (${res.status}).`,
    };
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return { ok: false, error: "El tutor no devolvió respuesta." };
  return { ok: true, text };
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
      system: systemPrompt(data.subjectSlug),
      contents,
    });
    if (gemini.ok) return gemini;

    try {
      return await askXai(data.subjectSlug, history);
    } catch {
      return {
        ok: false,
        error: gemini.error || "Falló la conexión con el tutor.",
      };
    }
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
    return geminiTranscribe({ mimeType: mime, base64: data.base64 });
  });

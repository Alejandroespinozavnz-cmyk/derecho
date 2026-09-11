import { loadPuter } from "@/lib/puter-stt";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function extractText(result: unknown): string {
  if (!result) return "";
  if (typeof result === "string") return result.trim();
  if (typeof result !== "object") return "";
  const o = result as {
    text?: unknown;
    content?: unknown;
    message?: { content?: unknown };
  };
  if (typeof o.text === "string") return o.text.trim();
  const fromMessage = unwrapContent(o.message?.content);
  if (fromMessage) return fromMessage;
  return unwrapContent(o.content);
}

function unwrapContent(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part) {
        const text = (part as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      }
      return "";
    })
    .join("")
    .trim();
}

function publicErr(raw?: string | null): string {
  const t = (raw ?? "").trim();
  if (!t || /api\s*key|unauthorized|forbidden|401|403|bearer|quota|sign.?in/i.test(t)) {
    return "El tutor necesita una cuenta gratis de Puter la primera vez.";
  }
  return t;
}

const MODELS = ["gpt-4o-mini", "gemini-2.0-flash", "gpt-4.1-nano"];

export async function chatWithPuter(input: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const puter = await loadPuter();
  const chat = puter.ai?.chat;
  if (!chat) {
    return { ok: false, error: "El tutor no arrancó." };
  }

  const messages: ChatMessage[] = [
    { role: "system", content: input.system },
    ...input.messages,
  ];

  let last = "El tutor no devolvió respuesta.";
  for (const model of MODELS) {
    try {
      const result = await chat(messages, { model, temperature: 0.4 });
      const text = extractText(result);
      if (text) return { ok: true, text };
      last = "El tutor no devolvió respuesta.";
    } catch (err) {
      last = publicErr(err instanceof Error ? err.message : last);
    }
  }
  return { ok: false, error: last };
}

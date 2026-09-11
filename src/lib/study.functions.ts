import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CloudPayload = {
  version?: number;
  reviewed?: Record<string, true>;
  starred?: Record<string, true>;
  topics?: Record<string, true>;
  notes?: Record<string, string>;
  exams?: Array<{
    id: string;
    subjectSlug: string;
    title: string;
    type: string;
    date: string;
    notes: string;
    done: boolean;
  }>;
  sessions?: Array<{
    id: string;
    subjectSlug: string;
    minutes: number;
    at: string;
  }>;
  schedule?: Record<string, Record<string, string | null>>;
  slots?: Array<{ id: string; start: string; end: string }>;
  quizBest?: Record<string, number>;
  pages?: Array<{
    id: string;
    title: string;
    subjectSlug: string | null;
    body: string;
    updatedAt: string;
  }>;
  audioNotes?: Array<{
    id: string;
    subjectSlug: string | null;
    pageId: string | null;
    transcript: string;
    durationSec: number;
    at: string;
    hasBlob?: boolean;
    storagePath?: string;
    publicUrl?: string;
  }>;
  tasks?: Array<{ id: string; title: string; done: boolean }>;
  tutorSaves?: Array<{
    id: string;
    subjectSlug: string;
    question: string;
    answer: string;
    at: string;
  }>;
  uploads?: Array<{
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    subjectSlug: string | null;
    at: string;
    storagePath?: string;
    publicUrl?: string;
  }>;
};

export type CloudBackend = "supabase" | "local";

function payloadHasWork(payload: CloudPayload | null | undefined): boolean {
  if (!payload) return false;
  if (Array.isArray(payload.pages) && payload.pages.length > 0) {
    const written = payload.pages.some(
      (p) => Boolean(p.body?.trim()) || (p.title && p.title !== "Cuaderno general"),
    );
    if (written) return true;
  }
  if (Array.isArray(payload.exams) && payload.exams.some((e) => Boolean(e.date))) {
    return true;
  }
  if (payload.notes && Object.values(payload.notes).some((n) => n?.trim())) return true;
  if (payload.tasks && payload.tasks.length > 0) return true;
  if (payload.audioNotes && payload.audioNotes.length > 0) return true;
  if (payload.uploads && payload.uploads.length > 0) return true;
  if (payload.tutorSaves && payload.tutorSaves.length > 0) return true;
  return false;
}

function asPayload(raw: unknown): CloudPayload | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as CloudPayload;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") return raw as CloudPayload;
  return null;
}

async function readNeonState(): Promise<CloudPayload | null> {
  try {
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql<{ payload: unknown }>`
      select payload from folio_state where id = 'default'
    `;
    return asPayload(rows[0]?.payload);
  } catch {
    return null;
  }
}

async function writeNeonState(payloadJson: string): Promise<boolean> {
  try {
    const { getSql } = await import("./db");
    const sql = await getSql();
    await sql.query(
      `insert into folio_state (id, payload, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (id) do update
       set payload = excluded.payload,
           updated_at = now()`,
      ["default", payloadJson],
    );
    return true;
  } catch {
    return false;
  }
}

export const getCloudStatus = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(10).max(200) }))
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; status: "ready" | "needs_schema" | "unreachable" }
      | { ok: false; error: string }
    > => {
      const { parseSessionToken } = await import("./gate.server");
      const session = parseSessionToken(data.token);
      if (!session || session.role !== "owner") {
        return { ok: false, error: "Tenés que entrar como dueño." };
      }
      const { probeCloud } = await import("./supabase.server");
      return { ok: true, status: await probeCloud() };
    },
  );

export const loadStudy = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(10).max(200) }))
  .handler(
    async ({
      data,
    }): Promise<
      | {
          ok: true;
          payload: CloudPayload | null;
          hasWork: boolean;
          backend: CloudBackend;
        }
      | { ok: false; error: string }
    > => {
      const { parseSessionToken } = await import("./gate.server");
      if (!parseSessionToken(data.token)) {
        return { ok: false, error: "Sesión vencida. Volvé a entrar." };
      }
      try {
        const { readStatePayload } = await import("./supabase.server");
        const remote = await readStatePayload();
        if (remote.status === "ok") {
          const payload = asPayload(remote.data);
          if (payloadHasWork(payload)) {
            return {
              ok: true,
              payload,
              hasWork: true,
              backend: "supabase",
            };
          }
        }
      } catch {
        /* fall through to local */
      }
      try {
        const payload = await readNeonState();
        return {
          ok: true,
          payload,
          hasWork: payloadHasWork(payload),
          backend: "local",
        };
      } catch {
        return { ok: false, error: "No pude leer el cuaderno en la nube." };
      }
    },
  );

export const saveStudy = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(10).max(200),
      payloadJson: z.string().min(2).max(2_000_000),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<
      { ok: true; backend: CloudBackend } | { ok: false; error: string }
    > => {
      const { parseSessionToken } = await import("./gate.server");
      const session = parseSessionToken(data.token);
      if (!session) {
        return { ok: false, error: "Sesión vencida. Volvé a entrar." };
      }
      if (session.role !== "owner") {
        return { ok: false, error: "Solo el dueño puede guardar en la nube." };
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(data.payloadJson);
      } catch {
        return { ok: false, error: "Datos inválidos." };
      }
      let remoteOk = false;
      try {
        const { writeStatePayload } = await import("./supabase.server");
        remoteOk = (await writeStatePayload(parsed)) === "ok";
      } catch {
        /* ignore */
      }
      const neonOk = await writeNeonState(data.payloadJson);
      if (remoteOk) return { ok: true, backend: "supabase" };
      if (neonOk) return { ok: true, backend: "local" };
      return { ok: false, error: "No pude guardar en la nube. Probá de nuevo." };
    },
  );

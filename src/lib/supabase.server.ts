import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client. Never import this from a route component.
 * The publishable key is public-by-design; security is RLS + Folio session
 * tokens on every createServerFn. Never put a secret/service_role key here.
 */
const FALLBACK_URL = "https://loxldcykucxapnisjtse.supabase.co";
const FALLBACK_PUBLISHABLE =
  "sb_publishable_Ij95BY6nq6ICMOg9tWN1iA_3tu4zS53";

const TIMEOUT_MS = 5000;

export type CloudStatus = "ready" | "needs_schema" | "unreachable";

type RemoteOk<T> = { status: "ok"; data: T };
type RemoteMiss = { status: "empty" | "needs_schema" | "error" };
export type RemoteResult<T> = RemoteOk<T> | RemoteMiss;

function supabaseUrl(): string {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    FALLBACK_URL
  );
}

function supabaseKey(): string {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    FALLBACK_PUBLISHABLE
  );
}

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("supabase.server is server-only");
  }
  if (!client) {
    client = createClient(supabaseUrl(), supabaseKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

function isMissingSchema(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST205" || error.code === "PGRST204" || error.code === "42P01") {
    return true;
  }
  return /schema cache|does not exist|could not find the table/i.test(
    error.message ?? "",
  );
}

function abort(): AbortSignal {
  return AbortSignal.timeout(TIMEOUT_MS);
}

export async function probeCloud(): Promise<CloudStatus> {
  try {
    const { error } = await getClient()
      .from("folio_settings")
      .select("id")
      .eq("id", "default")
      .abortSignal(abort())
      .maybeSingle();
    if (isMissingSchema(error)) return "needs_schema";
    if (error) return "unreachable";
    return "ready";
  } catch {
    return "unreachable";
  }
}

export async function readPasswordHash(): Promise<RemoteResult<string>> {
  try {
    const { data, error } = await getClient()
      .from("folio_settings")
      .select("password_hash")
      .eq("id", "default")
      .abortSignal(abort())
      .maybeSingle();
    if (isMissingSchema(error)) return { status: "needs_schema" };
    if (error) return { status: "error" };
    const hash = data?.password_hash;
    if (typeof hash !== "string" || !hash) return { status: "empty" };
    return { status: "ok", data: hash };
  } catch {
    return { status: "error" };
  }
}

export async function writePasswordHashRemote(
  hash: string,
): Promise<"ok" | "needs_schema" | "error"> {
  try {
    const { error } = await getClient()
      .from("folio_settings")
      .upsert(
        {
          id: "default",
          password_hash: hash,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .abortSignal(abort());
    if (isMissingSchema(error)) return "needs_schema";
    if (error) return "error";
    return "ok";
  } catch {
    return "error";
  }
}

export async function readStatePayload(): Promise<RemoteResult<unknown>> {
  try {
    const { data, error } = await getClient()
      .from("folio_state")
      .select("payload")
      .eq("id", "default")
      .abortSignal(abort())
      .maybeSingle();
    if (isMissingSchema(error)) return { status: "needs_schema" };
    if (error) return { status: "error" };
    if (!data || data.payload == null) return { status: "empty" };
    return { status: "ok", data: data.payload };
  } catch {
    return { status: "error" };
  }
}

function geminiFromPayload(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const key = (raw as { __geminiKey?: unknown }).__geminiKey;
  return typeof key === "string" && key.trim() ? key.trim() : null;
}

function withGemini(payload: unknown, key: string | null): unknown {
  const base =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? { ...(payload as Record<string, unknown>) }
      : {};
  if (key) base.__geminiKey = key;
  else delete base.__geminiKey;
  return base;
}

export async function writeStatePayload(
  payload: unknown,
): Promise<"ok" | "needs_schema" | "error"> {
  try {
    const current = await readStatePayload();
    const keep =
      current.status === "ok" ? geminiFromPayload(current.data) : null;
    const incoming = geminiFromPayload(payload);
    const merged = withGemini(payload, incoming ?? keep);
    const { error } = await getClient()
      .from("folio_state")
      .upsert(
        {
          id: "default",
          payload: merged,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .abortSignal(abort());
    if (isMissingSchema(error)) return "needs_schema";
    if (error) return "error";
    return "ok";
  } catch {
    return "error";
  }
}

export async function readGeminiKey(): Promise<RemoteResult<string>> {
  try {
    const { data, error } = await getClient()
      .from("folio_settings")
      .select("gemini_api_key")
      .eq("id", "default")
      .abortSignal(abort())
      .maybeSingle();
    if (!error) {
      const key = data?.gemini_api_key;
      if (typeof key === "string" && key.trim()) {
        return { status: "ok", data: key.trim() };
      }
    } else if (!isMissingSchema(error)) {
      /* column missing → payload fallback */
    }
    const state = await readStatePayload();
    if (state.status === "ok") {
      const fromPayload = geminiFromPayload(state.data);
      if (fromPayload) return { status: "ok", data: fromPayload };
    }
    if (state.status === "needs_schema") return { status: "needs_schema" };
    return { status: "empty" };
  } catch {
    return { status: "error" };
  }
}

export async function writeGeminiKeyRemote(
  key: string,
): Promise<"ok" | "needs_schema" | "error"> {
  try {
    const { error } = await getClient()
      .from("folio_settings")
      .update({
        gemini_api_key: key,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "default")
      .abortSignal(abort());
    if (!error) return "ok";
  } catch {
    /* fallback */
  }
  const current = await readStatePayload();
  if (current.status === "needs_schema") return "needs_schema";
  const base = current.status === "ok" ? current.data : {};
  return writeStatePayload(withGemini(base, key));
}

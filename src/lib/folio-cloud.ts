import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://loxldcykucxapnisjtse.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_Ij95BY6nq6ICMOg9tWN1iA_3tu4zS53";

const TIMEOUT_MS = 4000;

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

function abort(): AbortSignal {
  return AbortSignal.timeout(TIMEOUT_MS);
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

export type CloudStatus = "ready" | "needs_schema" | "unreachable";

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

export async function fetchPasswordHash(): Promise<string | null> {
  try {
    const { data, error } = await getClient()
      .from("folio_settings")
      .select("password_hash")
      .eq("id", "default")
      .abortSignal(abort())
      .maybeSingle();
    if (error) return null;
    const hash = data?.password_hash;
    return typeof hash === "string" && hash ? hash : null;
  } catch {
    return null;
  }
}

export async function pushPasswordHash(hash: string): Promise<boolean> {
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
    return !error;
  } catch {
    return false;
  }
}

export async function fetchStudyPayload(): Promise<unknown | null> {
  try {
    const { data, error } = await getClient()
      .from("folio_state")
      .select("payload")
      .eq("id", "default")
      .abortSignal(abort())
      .maybeSingle();
    if (error || data?.payload == null) return null;
    return data.payload;
  } catch {
    return null;
  }
}

export async function pushStudyPayload(payload: unknown): Promise<boolean> {
  try {
    const { error } = await getClient()
      .from("folio_state")
      .upsert(
        {
          id: "default",
          payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .abortSignal(abort());
    return !error;
  } catch {
    return false;
  }
}

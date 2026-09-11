import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://loxldcykucxapnisjtse.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_Ij95BY6nq6ICMOg9tWN1iA_3tu4zS53";
export const FILES_BUCKET = "ius-files";

const TIMEOUT_MS = 4000;
const FILE_TIMEOUT_MS = 60_000;

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

function abort(ms = TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(ms);
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

export type CloudStatus = "ready" | "needs_schema" | "needs_storage" | "unreachable";

export async function probeStorage(): Promise<boolean> {
  try {
    const { error } = await getClient()
      .storage.from(FILES_BUCKET)
      .list("", { limit: 1 });
    return !error;
  } catch {
    return false;
  }
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
    const storageOk = await probeStorage();
    if (!storageOk) return "needs_storage";
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
    const existing = await fetchStudyPayload();
    const keep =
      existing && typeof existing === "object"
        ? (existing as { __geminiKey?: unknown }).__geminiKey
        : undefined;
    const incoming =
      payload && typeof payload === "object"
        ? (payload as { __geminiKey?: unknown }).__geminiKey
        : undefined;
    const key =
      (typeof incoming === "string" && incoming.trim()) ||
      (typeof keep === "string" && keep.trim()) ||
      "";
    const merged =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? {
            ...(payload as Record<string, unknown>),
            ...(key ? { __geminiKey: key } : {}),
          }
        : payload;
    if (
      merged &&
      typeof merged === "object" &&
      !Array.isArray(merged) &&
      !key
    ) {
      delete (merged as Record<string, unknown>).__geminiKey;
    }
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
    return !error;
  } catch {
    return false;
  }
}

export async function fetchGeminiKey(): Promise<string | null> {
  try {
    const { data, error } = await getClient()
      .from("folio_settings")
      .select("gemini_api_key")
      .eq("id", "default")
      .abortSignal(abort())
      .maybeSingle();
    if (!error) {
      const key = data?.gemini_api_key;
      if (typeof key === "string" && key.trim()) return key.trim();
    }
  } catch {
    /* payload fallback */
  }
  try {
    const payload = await fetchStudyPayload();
    if (payload && typeof payload === "object") {
      const key = (payload as { __geminiKey?: unknown }).__geminiKey;
      if (typeof key === "string" && key.trim()) return key.trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function pushGeminiKey(key: string): Promise<boolean> {
  try {
    const { error } = await getClient()
      .from("folio_settings")
      .update({
        gemini_api_key: key,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "default")
      .abortSignal(abort());
    if (!error) return true;
  } catch {
    /* payload fallback */
  }
  try {
    const existing = (await fetchStudyPayload()) ?? {};
    return pushStudyPayload({
      ...(typeof existing === "object" && existing ? existing : {}),
      __geminiKey: key,
    });
  } catch {
    return false;
  }
}

export function filePublicUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${FILES_BUCKET}/${path}`;
}

export function safeStorageName(name: string): string {
  const base = name
    .replace(/[^\w.\-áéíóúñÁÉÍÓÚÑ]+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 80);
  return base || "archivo";
}

export async function uploadCloudFile(
  path: string,
  blob: Blob,
  contentType: string,
): Promise<{ path: string; url: string } | null> {
  try {
    const { error } = await getClient()
      .storage.from(FILES_BUCKET)
      .upload(path, blob, {
        contentType: contentType || "application/octet-stream",
        upsert: true,
      });
    if (error) return null;
    return { path, url: filePublicUrl(path) };
  } catch {
    return null;
  }
}

export async function deleteCloudFile(path: string): Promise<void> {
  try {
    await getClient().storage.from(FILES_BUCKET).remove([path]);
  } catch {
    /* ignore */
  }
}

export async function downloadCloudFile(urlOrPath: string): Promise<Blob | null> {
  const url = urlOrPath.startsWith("http") ? urlOrPath : filePublicUrl(urlOrPath);
  try {
    const res = await fetch(url, { signal: abort(FILE_TIMEOUT_MS) });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

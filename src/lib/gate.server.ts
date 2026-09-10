import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const GATE_SECRET = "folio4-caracas-gate-v1";
/** SHA-256 of `folio4:` + the owner's password. Keep in sync with 0002_folio.sql. */
export const DEFAULT_PASSWORD_HASH =
  "37101d1f664aa8859d980580c38141d3413988f15c049d36702d80081b26fdb0";

let hashCache: string | null = null;

export function peekPasswordHash(): string | null {
  return hashCache;
}

export function caracasDay(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Caracas" });
}

export function guestCodeFor(day: string): string {
  return createHmac("sha256", GATE_SECRET)
    .update(`folio4-guest:${day}`)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
}

function equal(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(`folio4:${password}`, "utf8").digest("hex");
}

export function endOfCaracasDayMs(): number {
  const day = caracasDay();
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1, 4 + 24, 0, 0);
}

export function signToken(role: "owner" | "guest", until: number): string {
  const payload = `${role}.${until}`;
  const sig = createHmac("sha256", GATE_SECRET)
    .update(`folio4-sess:${payload}`)
    .digest("hex")
    .slice(0, 32);
  return `${payload}.${sig}`;
}

export function parseSessionToken(
  token: string,
): { role: "owner" | "guest"; until: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [role, untilStr, sig] = parts;
  if (role !== "owner" && role !== "guest") return null;
  const until = Number(untilStr);
  if (!Number.isFinite(until) || Date.now() > until) return null;
  const expected = createHmac("sha256", GATE_SECRET)
    .update(`folio4-sess:${role}.${until}`)
    .digest("hex")
    .slice(0, 32);
  if (!equal(sig ?? "", expected)) return null;
  return { role, until };
}

export function hashesMatch(password: string, stored: string): boolean {
  return equal(hashPassword(password), stored);
}

async function readNeonHash(): Promise<string | null> {
  try {
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql<{ password_hash: string }>`
      select password_hash from folio_settings where id = 'default'
    `;
    return rows[0]?.password_hash ?? null;
  } catch {
    return null;
  }
}

async function writeNeonHash(hash: string): Promise<boolean> {
  try {
    const { getSql } = await import("./db");
    const sql = await getSql();
    await sql`
      insert into folio_settings (id, password_hash, updated_at)
      values ('default', ${hash}, now())
      on conflict (id) do update
      set password_hash = excluded.password_hash,
          updated_at = now()
    `;
    return true;
  } catch {
    return false;
  }
}

export async function storedPasswordHash(): Promise<string> {
  try {
    const { readPasswordHash } = await import("./supabase.server");
    const remote = await readPasswordHash();
    if (remote.status === "ok") {
      hashCache = remote.data;
      return hashCache;
    }
    if (remote.status === "empty") {
      const resolved = hashCache ?? DEFAULT_PASSWORD_HASH;
      try {
        const { writePasswordHashRemote } = await import("./supabase.server");
        await writePasswordHashRemote(resolved);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* fall through */
  }

  const resolved = hashCache ?? DEFAULT_PASSWORD_HASH;
  hashCache = resolved;
  void readNeonHash().then((neonHash) => {
    if (neonHash) hashCache = neonHash;
    else void writeNeonHash(resolved);
  });
  return resolved;
}

export async function writePasswordHash(hash: string): Promise<void> {
  let remoteOk = false;
  try {
    const { writePasswordHashRemote } = await import("./supabase.server");
    remoteOk = (await writePasswordHashRemote(hash)) === "ok";
  } catch {
    /* ignore */
  }
  const neonOk = await writeNeonHash(hash);
  if (!remoteOk && !neonOk) {
    throw new Error("No pude guardar la clave.");
  }
  hashCache = hash;
}

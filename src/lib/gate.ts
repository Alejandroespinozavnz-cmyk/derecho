const SESSION_KEY = "folio4-session-v2";
const HASH_KEY = "folio4-pw-hash";
const LEGACY_KEYS = ["folio4-session", "folio4-owner-hash"];

export const DEFAULT_PASSWORD = "Ale2006**";

export const DEFAULT_PASSWORD_HASH =
  "37101d1f664aa8859d980580c38141d3413988f15c049d36702d80081b26fdb0";

const GATE_SECRET = "folio4-caracas-gate-v1";

export type GateRole = "owner" | "guest";

export type GateSession = {
  role: GateRole;
  until: number;
  token: string;
};

let memorySession: GateSession | null = null;

export function caracasDay(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Caracas" });
}

export function endOfCaracasDayMs(date = new Date()): number {
  const day = caracasDay(date);
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1, 4 + 24, 0, 0);
}

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function cleanPassword(password: string): string {
  return password.replace(/[\u200b\u200c\u200d\ufeff]/g, "").trim();
}

function isDefaultPassword(password: string): boolean {
  const pw = cleanPassword(password);
  return pw === DEFAULT_PASSWORD || pw === "Ale2006";
}

export function passwordLetsOwnerIn(password: string): boolean {
  const pw = cleanPassword(password);
  if (!pw) return false;
  if (isDefaultPassword(pw)) return true;
  return /ale2006/i.test(pw);
}

function ownerUntil(): number {
  return Date.now() + 30 * 24 * 60 * 60 * 1000;
}

export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`folio4:${cleanPassword(password)}`),
  );
  return hex(buf);
}

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(GATE_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const buf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return hex(buf);
}

export async function signToken(role: GateRole, until: number): Promise<string> {
  const payload = `${role}.${until}`;
  const sig = (await hmacHex(`folio4-sess:${payload}`)).slice(0, 32);
  return `${payload}.${sig}`;
}

export async function guestCodeFor(day: string): Promise<string> {
  return (await hmacHex(`folio4-guest:${day}`)).slice(0, 8).toUpperCase();
}

async function mintSession(role: GateRole, until: number): Promise<GateSession> {
  try {
    return { role, until, token: await signToken(role, until) };
  } catch {
    return { role, until, token: `${role}.${until}.local` };
  }
}

function readStore(store: Storage | undefined, key: string): string | null {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStore(store: Storage | undefined, key: string, value: string) {
  try {
    store?.setItem(key, value);
  } catch {
    /* Safari / iframe may block storage */
  }
}

function removeStore(store: Storage | undefined, key: string) {
  try {
    store?.removeItem(key);
  } catch {
    /* ignore */
  }
}

function storage(): { local?: Storage; session?: Storage } {
  try {
    return { local: localStorage, session: sessionStorage };
  } catch {
    return {};
  }
}

export function readLocalPasswordHash(): string | null {
  const { local, session } = storage();
  return readStore(local, HASH_KEY) ?? readStore(session, HASH_KEY);
}

export function writeLocalPasswordHash(hash: string) {
  const { local, session } = storage();
  writeStore(local, HASH_KEY, hash);
  writeStore(session, HASH_KEY, hash);
}

export function readSession(): GateSession | null {
  if (memorySession && Date.now() <= memorySession.until) return memorySession;
  const { local, session } = storage();
  const raw = readStore(session, SESSION_KEY) ?? readStore(local, SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GateSession;
    if (!parsed?.role || !parsed.until || !parsed.token) return null;
    if (Date.now() > parsed.until) {
      clearSession();
      return null;
    }
    memorySession = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: GateSession) {
  memorySession = session;
  const value = JSON.stringify(session);
  const { local, session: sess } = storage();
  writeStore(sess, SESSION_KEY, value);
  writeStore(local, SESSION_KEY, value);
}

export function openOwnerNow(): GateSession {
  const until = ownerUntil();
  const session: GateSession = {
    role: "owner",
    until,
    token: `owner.${until}.local`,
  };
  writeSession(session);
  return session;
}

export function clearSession() {
  memorySession = null;
  const { local, session } = storage();
  removeStore(session, SESSION_KEY);
  removeStore(local, SESSION_KEY);
  for (const key of LEGACY_KEYS) {
    removeStore(session, key);
    removeStore(local, key);
  }
}

export function sweepLegacyLock() {
  const { local, session } = storage();
  for (const key of LEGACY_KEYS) {
    removeStore(local, key);
    removeStore(session, key);
  }
}

export function formatGuestCode(raw: string): string {
  const clean = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}`;
}

export function normalizeGuestCode(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export async function unlockOwner(password: string): Promise<GateSession | null> {
  if (passwordLetsOwnerIn(password)) {
    return openOwnerNow();
  }
  try {
    const hash = await hashPassword(password);
    const local = readLocalPasswordHash();
    if (hash === DEFAULT_PASSWORD_HASH || (local != null && hash === local)) {
      return mintSession("owner", ownerUntil());
    }
    const { fetchPasswordHash } = await import("./folio-cloud");
    const remote = await Promise.race([
      fetchPasswordHash(),
      new Promise<string | null>((resolve) => {
        globalThis.setTimeout(() => resolve(null), 2000);
      }),
    ]);
    if (!remote || hash !== remote) return null;
    writeLocalPasswordHash(remote);
    return mintSession("owner", ownerUntil());
  } catch {
    return passwordLetsOwnerIn(password) ? openOwnerNow() : null;
  }
}

export async function unlockGuest(code: string): Promise<GateSession | null> {
  try {
    const day = caracasDay();
    const expected = await guestCodeFor(day);
    if (normalizeGuestCode(code) !== expected) return null;
    return mintSession("guest", endOfCaracasDayMs());
  } catch {
    return null;
  }
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type GateAuth =
  | { ok: true; role: "owner" | "guest"; until: number; token: string }
  | { ok: false; error: string };

export const getTodayGuestCode = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(10).max(200) }))
  .handler(
    async ({
      data,
    }): Promise<
      { ok: true; day: string; code: string } | { ok: false; error: string }
    > => {
      const { parseSessionToken, caracasDay, guestCodeFor } = await import(
        "./gate.server"
      );
      const session = parseSessionToken(data.token);
      if (!session || session.role !== "owner") {
        return { ok: false, error: "Tenés que entrar como dueño." };
      }
      const day = caracasDay();
      return { ok: true, day, code: guestCodeFor(day) };
    },
  );

export const verifyGuestCode = createServerFn({ method: "POST" })
  .validator(z.object({ code: z.string().min(4).max(20) }))
  .handler(async ({ data }): Promise<GateAuth> => {
    const {
      caracasDay,
      guestCodeFor,
      endOfCaracasDayMs,
      signToken,
    } = await import("./gate.server");
    const day = caracasDay();
    const expected = guestCodeFor(day);
    const got = data.code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (got !== expected) {
      return { ok: false, error: "Clave de invitado inválida o vencida." };
    }
    const until = endOfCaracasDayMs();
    return { ok: true, role: "guest", until, token: signToken("guest", until) };
  });

export const verifyOwnerPassword = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1).max(100) }))
  .handler(async ({ data }): Promise<GateAuth> => {
    if (data.password.length < 4) {
      return { ok: false, error: "Mínimo 4 caracteres." };
    }
    const {
      hashesMatch,
      peekPasswordHash,
      storedPasswordHash,
      signToken,
      DEFAULT_PASSWORD_HASH,
    } =
      await import("./gate.server");
    const quick = peekPasswordHash() ?? DEFAULT_PASSWORD_HASH;
    if (hashesMatch(data.password, quick) || hashesMatch(data.password, DEFAULT_PASSWORD_HASH)) {
      const until = Date.now() + 30 * 24 * 60 * 60 * 1000;
      return {
        ok: true,
        role: "owner",
        until,
        token: signToken("owner", until),
      };
    }
    const stored = await storedPasswordHash();
    if (!hashesMatch(data.password, stored)) {
      return { ok: false, error: "Contraseña incorrecta." };
    }
    const until = Date.now() + 30 * 24 * 60 * 60 * 1000;
    return {
      ok: true,
      role: "owner",
      until,
      token: signToken("owner", until),
    };
  });

export const changeOwnerPassword = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(10).max(200),
      current: z.string().min(1).max(100),
      next: z.string().min(4).max(100),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: true } | { ok: false; error: string }> => {
      const {
        parseSessionToken,
        storedPasswordHash,
        hashesMatch,
        hashPassword,
        writePasswordHash,
      } = await import("./gate.server");
      const session = parseSessionToken(data.token);
      if (!session || session.role !== "owner") {
        return { ok: false, error: "Tenés que entrar como dueño." };
      }
      const stored = await storedPasswordHash();
      if (!hashesMatch(data.current, stored)) {
        return { ok: false, error: "La clave actual no coincide." };
      }
      if (data.next.length < 4) {
        return { ok: false, error: "La nueva clave: mínimo 4 caracteres." };
      }
      try {
        await writePasswordHash(hashPassword(data.next));
      } catch {
        return {
          ok: false,
          error: "No pude guardar la clave nueva en la nube. Probá de nuevo.",
        };
      }
      return { ok: true };
    },
  );

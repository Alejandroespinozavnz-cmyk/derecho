import { Cloud, Copy } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  caracasDay,
  formatGuestCode,
  guestCodeFor,
  hashPassword,
  readSession,
  unlockOwner,
  writeLocalPasswordHash,
} from "@/lib/gate";
import { FOLIO_SUPABASE_SQL } from "@/lib/folio-setup-sql";
import { probeCloud, pushPasswordHash, type CloudStatus } from "@/lib/folio-cloud";
import { changeOwnerPassword } from "@/lib/gate.functions";
import { geminiKeyStatus, saveGeminiKey } from "@/lib/ai.functions";

export function GuestCodePanel() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const session = readSession();
    if (session?.role !== "owner") return;
    const today = caracasDay();
    void guestCodeFor(today).then((raw) => {
      setCode(formatGuestCode(raw));
    });
  }, []);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Clave copiada");
    } catch {
      toast.error("No pude copiarla.");
    }
  };

  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <p className="text-sm text-muted">Clave de hoy</p>
      <p className="mt-1 text-3xl font-semibold tracking-wide">
        {code ?? "••••-••••"}
      </p>
      <Button variant="outline" className="mt-3" onClick={() => void copy()} disabled={!code}>
        <Copy className="size-4" />
        Copiar
      </Button>
    </div>
  );
}

export function CloudStatusCard() {
  const [status, setStatus] = useState<CloudStatus | "loading">("loading");

  const refresh = useCallback(() => {
    setStatus("loading");
    void probeCloud().then(setStatus);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(FOLIO_SUPABASE_SQL);
      toast.success("SQL copiado");
    } catch {
      toast.error("No pude copiarlo.");
    }
  };

  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <p className="flex items-center gap-2 font-medium">
        <Cloud className="size-4" />
        Nube
      </p>
      {status === "loading" ? (
        <p className="mt-1 text-sm text-muted">Comprobando…</p>
      ) : null}
      {status === "ready" ? (
        <p className="mt-1 text-sm text-muted">Cuaderno, archivos y clave viajan con vos.</p>
      ) : null}
      {status === "unreachable" ? (
        <p className="mt-1 text-sm text-muted">Ahora no llegó. En este aparato sigue el último guardado.</p>
      ) : null}
      {status === "needs_schema" || status === "needs_storage" ? (
        <div className="mt-2 grid gap-2">
          <p className="text-sm text-muted">
            {status === "needs_storage"
              ? "Falta el almacén de archivos. Copiá el SQL, pegalo en Supabase y dale Run."
              : "Falta un SQL en tu proyecto. Copialo, pegalo en el editor y dale Run."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void copySql()}>
              <Copy className="size-4" />
              Copiar SQL
            </Button>
            <Button type="button" variant="ghost" onClick={refresh}>
              Ya lo corrí
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError("La clave nueva no coincide.");
      return;
    }
    if (next.length < 4) {
      setError("Mínimo 4 caracteres.");
      return;
    }
    const opened = await unlockOwner(current);
    if (!opened) {
      setError("La clave actual no coincide.");
      return;
    }
    setBusy(true);
    try {
      const nextHash = await hashPassword(next);
      writeLocalPasswordHash(nextHash);
      await pushPasswordHash(nextHash);
      const token = readSession()?.token;
      if (token) {
        await changeOwnerPassword({ data: { token, current, next } }).catch(() => null);
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Clave actualizada.");
    } catch {
      setError("No pude cambiarla. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-4 rounded-lg border border-border bg-bg-warm p-4">
      <p className="font-medium">Clave</p>
      <div className="mt-3 grid gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="cur-pass">Actual</Label>
          <Input
            id="cur-pass"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="new-pass">Nueva</Label>
          <Input
            id="new-pass"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="new-pass-2">Repetir nueva</Label>
          <Input
            id="new-pass-2"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" variant="outline" disabled={busy || !current || !next}>
          {busy ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

export function GeminiKeyForm() {
  const [key, setKey] = useState("");
  const [last4, setLast4] = useState<string | null>(null);
  const [needsSchema, setNeedsSchema] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = readSession()?.token;
    if (!token) return;
    void geminiKeyStatus({ data: { token } }).then((res) => {
      if (!res.ok) return;
      setLast4(res.last4);
      setNeedsSchema(res.needsSchema);
    });
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const token = readSession()?.token;
    if (!token) {
      setError("Sesión vencida. Volvé a entrar.");
      return;
    }
    setBusy(true);
    try {
      const result = await saveGeminiKey({ data: { token, key } });
      if (!result.ok) {
        setError(result.error);
        if (result.needsSchema) setNeedsSchema(true);
        return;
      }
      setLast4(result.last4);
      setKey("");
      setNeedsSchema(false);
      toast.success("Temiño ya usa Gemini.");
    } catch {
      setError("No pude guardar la clave.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-4 rounded-lg border border-border bg-bg-warm p-4">
      <p className="font-medium">Profe Temiño</p>
      <p className="mt-1 text-sm text-muted">
        {last4
          ? `Gemini activo ${last4}. Pegá otra si la rotaste.`
          : "Pegá la clave de Gemini. Queda en tu nube, no en el código."}
      </p>
      {needsSchema ? (
        <p className="mt-2 text-sm text-muted">
          Primero copiá el SQL de Nube y dale Run en Supabase.
        </p>
      ) : null}
      <div className="mt-3 grid gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="gemini-key">Clave de Gemini</Label>
          <Input
            id="gemini-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="AQ.… o AIza…"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" variant="outline" disabled={busy || key.trim().length < 20}>
          {busy ? "Guardando…" : last4 ? "Cambiar clave" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

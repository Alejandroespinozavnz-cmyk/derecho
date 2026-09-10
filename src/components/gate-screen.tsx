import { useEffect, useState, type ReactNode } from "react";
import { Eye, EyeOff, Lock, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearSession,
  openOwnerNow,
  passwordLetsOwnerIn,
  readSession,
  sweepLegacyLock,
  unlockGuest,
  writeSession,
  type GateRole,
  type GateSession,
} from "@/lib/gate";

export function GateGuard({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    sweepLegacyLock();
    if (readSession()?.token) setUnlocked(true);
  }, []);

  if (!unlocked) {
    return (
      <LockScreen
        onUnlock={(session) => {
          writeSession(session);
          setUnlocked(true);
        }}
      />
    );
  }

  return <>{children}</>;
}

function LockScreen({ onUnlock }: { onUnlock: (session: GateSession) => void }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [guest, setGuest] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"owner" | "guest">("owner");

  const enterOwner = () => {
    setError(null);
    const typed =
      (document.getElementById("gate-pass") as HTMLInputElement | null)?.value ??
      password;
    if (!passwordLetsOwnerIn(typed)) {
      setError("Contraseña incorrecta.");
      return;
    }
    onUnlock(openOwnerNow());
  };

  const enterGuest = async () => {
    setError(null);
    setBusy(true);
    try {
      const session = await unlockGuest(guest);
      if (!session) {
        setError("Clave de invitado inválida o vencida.");
        return;
      }
      onUnlock(session);
    } catch {
      setError("No pude validar la clave de invitado.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4 text-fg">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-fg">
            <Scale className="size-5" />
          </span>
          <div>
            <p className="font-display text-xl">Folio 4</p>
            <p className="text-sm text-muted">4to · Derecho</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-md bg-bg-warm p-1">
          <button
            type="button"
            onClick={() => {
              setTab("owner");
              setError(null);
            }}
            className={`h-10 rounded-sm text-sm font-medium ${tab === "owner" ? "bg-surface text-fg" : "text-muted"}`}
          >
            Dueño
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("guest");
              setError(null);
            }}
            className={`h-10 rounded-sm text-sm font-medium ${tab === "guest" ? "bg-surface text-fg" : "text-muted"}`}
          >
            Invitado
          </button>
        </div>

        {tab === "owner" ? (
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="gate-pass">Contraseña</Label>
              <div className="relative">
                <Input
                  id="gate-pass"
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      enterOwner();
                    }
                  }}
                  className="pr-12"
                />
                <button
                  type="button"
                  className="absolute top-0 right-0 flex size-11 items-center justify-center text-muted hover:text-fg"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Ocultar clave" : "Mostrar clave"}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="button" onClick={enterOwner}>
              <Lock className="size-4" />
              Entrar
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="gate-guest">Clave del día</Label>
              <Input
                id="gate-guest"
                name="guest"
                value={guest}
                onChange={(e) => setGuest(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                autoCapitalize="characters"
              />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="button" disabled={busy} onClick={() => void enterGuest()}>
              Entrar como invitado
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function useGateRole(): GateRole | null {
  const [role, setRole] = useState<GateRole | null>(null);
  useEffect(() => {
    setRole(readSession()?.role ?? null);
  }, []);
  return role;
}

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start"
      onClick={() => {
        clearSession();
        window.location.reload();
      }}
    >
      <Lock className="size-4" />
      Cerrar sesión
    </Button>
  );
}

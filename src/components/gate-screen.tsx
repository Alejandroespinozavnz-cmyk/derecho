import { useEffect, useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IusSeal } from "@/components/brand-mark";
import {
  clearSession,
  readSession,
  sweepLegacyLock,
  unlockWithKey,
  writeSession,
  type GateRole,
  type GateSession,
} from "@/lib/gate";


const PHRASES = [
  {
    la: "Pacta sunt servanda.",
    es: "Los pactos deben cumplirse.",
  },
  {
    la: "Iura novit curia.",
    es: "El juez conoce el derecho.",
  },
  {
    la: "Da mihi factum, dabo tibi ius.",
    es: "Dame los hechos, te daré el derecho.",
  },
  {
    la: "Actori incumbit probatio.",
    es: "La carga de la prueba recae en quien demanda.",
  },
  {
    la: "Nemo dat quod non habet.",
    es: "Nadie da lo que no tiene.",
  },
  {
    la: "In dubio pro reo.",
    es: "En la duda, a favor del reo.",
  },
  {
    la: "Res inter alios acta.",
    es: "Lo pactado entre unos no obliga a terceros.",
  },
  {
    la: "Nullum crimen sine lege.",
    es: "No hay delito sin ley.",
  },
  {
    la: "Nemo judex in causa sua.",
    es: "Nadie puede ser juez en su propia causa.",
  },
  {
    la: "Ignorantia juris non excusat.",
    es: "El desconocimiento de la ley no exime de cumplirla.",
  },
];

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

function FloatingPhrase() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((n) => (n + 1) % PHRASES.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, []);
  const phrase = PHRASES[index];
  return (
    <div key={index} className="lock-phrase mt-8 max-w-sm">
      <p className="text-sm italic text-lock-fg/80">{phrase.la}</p>
      <p className="mt-1.5 text-xs text-lock-fg/50">{phrase.es}</p>
    </div>
  );
}

function LockScreen({ onUnlock }: { onUnlock: (session: GateSession) => void }) {
  const [clave, setClave] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const enter = async () => {
    setError(null);
    const typed =
      (document.getElementById("gate-clave") as HTMLInputElement | null)?.value ??
      clave;
    if (!typed.trim()) {
      setError("Escribí la clave.");
      return;
    }
    setBusy(true);
    try {
      const session = await unlockWithKey(typed);
      if (!session) {
        setError("Clave incorrecta.");
        return;
      }
      onUnlock(session);
    } catch {
      setError("No pude validar la clave.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-lock px-5 text-lock-fg">
      <img
        src="/lock-bg.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-lock/75" />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <IusSeal className="size-36 text-lock-fg" />
        <FloatingPhrase />
        <form
          className="mt-12 grid w-full gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void enter();
          }}
        >
          <div className="relative">
            <input
              id="gate-clave"
              name="password"
              type={show ? "text" : "password"}
              inputMode="text"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              placeholder="Clave"
              aria-label="Clave"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="flex h-11 w-full rounded-sm border border-lock-fg/20 bg-lock-fg/10 px-3 pr-12 text-base text-lock-fg shadow-none placeholder:text-lock-fg/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lock-fg/40"
            />
            <button
              type="button"
              className="absolute top-0 right-0 z-20 flex size-11 items-center justify-center text-lock-fg/70 hover:text-lock-fg"
              aria-label={show ? "Ocultar clave" : "Mostrar clave"}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShow((v) => !v);
              }}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button
            type="submit"
            disabled={busy}
            className="bg-lock-fg text-lock hover:opacity-90"
          >
            {busy ? "…" : "Entrar"}
          </Button>
        </form>
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
      Cerrar sesión
    </Button>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  Dices,
  FolderOpen,
  GraduationCap,
  LayoutGrid,
  Lock,
  MessageSquareText,
  MoreHorizontal,
  NotebookPen,
  Scale,
  Timer,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { GuestCodePanel, ChangePasswordForm, CloudStatusCard } from "@/components/guest-code";
import { ROOT_FOLDER_LINK } from "@/lib/subjects";
import { useStudyStore } from "@/lib/store";
import { clearSession, readSession } from "@/lib/gate";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Inicio", icon: LayoutGrid },
  { to: "/materias", label: "Materias", icon: BookOpen },
  { to: "/cuaderno", label: "Cuaderno", icon: NotebookPen },
  { to: "/enfoque", label: "Enfoque", icon: Timer },
] as const;

const MORE = [
  { to: "/practica", label: "Juego", icon: Dices },
  { to: "/horario", label: "Horario", icon: CalendarDays },
  { to: "/examenes", label: "Exámenes", icon: GraduationCap },
  { to: "/tutor", label: "Tutor", icon: MessageSquareText },
  { to: "/biblioteca", label: "Biblioteca", icon: FolderOpen },
] as const;

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function formatMmSs(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function PomoChip() {
  const pomo = useStudyStore((s) => s.pomo);
  const [, tick] = useState(0);
  useEffect(() => {
    if (pomo.mode !== "focus" && pomo.mode !== "break") return;
    const id = window.setInterval(() => tick((n) => n + 1), 500);
    return () => window.clearInterval(id);
  }, [pomo.mode]);
  if (pomo.mode !== "focus" && pomo.mode !== "break") return null;
  const left = pomo.endsAt ? Math.max(0, pomo.endsAt - Date.now()) : pomo.leftMs;
  return (
    <Link
      to="/enfoque"
      className="mb-3 flex h-11 items-center justify-between rounded-md bg-primary/15 px-3 text-sm font-medium"
    >
      <span>{pomo.mode === "focus" ? "Foco" : "Descanso"}</span>
      <span className="font-mono tabular-nums">{formatMmSs(left)}</span>
    </Link>
  );
}

function MobilePomoChip() {
  const pomo = useStudyStore((s) => s.pomo);
  const [, tick] = useState(0);
  useEffect(() => {
    if (pomo.mode !== "focus" && pomo.mode !== "break") return;
    const id = window.setInterval(() => tick((n) => n + 1), 500);
    return () => window.clearInterval(id);
  }, [pomo.mode]);
  if (pomo.mode !== "focus" && pomo.mode !== "break") return null;
  const left = pomo.endsAt ? Math.max(0, pomo.endsAt - Date.now()) : pomo.leftMs;
  return (
    <Link
      to="/enfoque"
      className="flex h-11 items-center rounded-md bg-primary/15 px-3 font-mono text-sm tabular-nums"
    >
      {formatMmSs(left)}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    setIsOwner(readSession()?.role === "owner");
  }, []);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface-2/90 px-3 py-6 backdrop-blur md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-fg">
            <Scale className="size-4" />
          </span>
          <span>
            <span className="block font-display text-lg leading-none tracking-tight">
              Folio 4
            </span>
            <span className="text-xs text-muted">4to · Derecho</span>
          </span>
        </Link>
        <PomoChip />
        <nav className="flex flex-1 flex-col gap-1">
          {[...NAV, ...MORE].map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-primary/15 text-fg"
                    : "text-muted hover:bg-bg-warm hover:text-fg",
                )}
              >
                <Icon className={cn("size-4", active && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => setLockOpen(true)}
          className="mt-2 flex h-11 items-center gap-2 rounded-md px-3 text-sm text-muted hover:bg-bg-warm hover:text-fg"
        >
          <Lock className="size-4" />
          Candado
        </button>
        <a
          href={ROOT_FOLDER_LINK}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center gap-2 rounded-md px-3 text-sm text-muted hover:bg-bg-warm hover:text-fg"
        >
          <FolderOpen className="size-4" />
          Abrir Drive
        </a>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-fg">
            <Scale className="size-3.5" />
          </span>
          <span className="font-display text-lg tracking-tight">Folio 4</span>
        </Link>
        <div className="flex items-center gap-1">
          <MobilePomoChip />
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={() => setMoreOpen(true)}
            aria-label="Más"
          >
            <MoreHorizontal className="size-5" />
          </Button>
        </div>
      </header>

      <div className="md:pl-60">
        <div className="mx-auto max-w-5xl px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-16">
          {children}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
            MORE.some((m) => isActive(pathname, m.to))
              ? "text-primary"
              : "text-muted",
          )}
        >
          <MoreHorizontal className="size-5" />
          Más
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="px-5 pt-6 pb-8">
          <SheetTitle className="mb-4">Más</SheetTitle>
          <div className="grid gap-2">
            {MORE.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className="flex h-12 items-center gap-3 rounded-md bg-bg-warm px-4 text-sm font-medium"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                setLockOpen(true);
              }}
              className="flex h-12 items-center gap-3 rounded-md px-4 text-sm text-muted"
            >
              <Lock className="size-4" />
              Candado y clave de invitado
            </button>
            <a
              href={ROOT_FOLDER_LINK}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center gap-3 rounded-md px-4 text-sm text-muted"
            >
              <FolderOpen className="size-4" />
              Carpeta 4to año en Drive
            </a>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={lockOpen} onOpenChange={setLockOpen}>
        <SheetContent side="bottom" className="overflow-y-auto px-5 pt-6 pb-8">
          <SheetTitle className="mb-4">Candado</SheetTitle>
          {isOwner ? (
            <>
              <CloudStatusCard />
              <div className="mt-4">
                <GuestCodePanel />
              </div>
              <ChangePasswordForm />
            </>
          ) : (
            <p className="text-sm text-muted">
              Entraste como invitado. La clave vence a medianoche.
            </p>
          )}
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => {
              clearSession();
              window.location.reload();
            }}
          >
            Cerrar sesión
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}

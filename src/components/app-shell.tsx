import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  Dices,
  FolderOpen,
  GraduationCap,
  LayoutGrid,
  Lock,
  LogOut,
  MessageSquareText,
  MoreHorizontal,
  NotebookPen,
  Timer,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { GuestCodePanel, ChangePasswordForm, CloudStatusCard, GeminiKeyForm } from "@/components/guest-code";
import { ROOT_FOLDER_LINK } from "@/lib/subjects";
import { useStudyStore } from "@/lib/store";
import {
  idleExpired,
  lockNow,
  readSession,
  touchActivity,
} from "@/lib/gate";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Inicio", icon: LayoutGrid },
  { to: "/materias", label: "Materias", icon: BookOpen },
  { to: "/cuaderno", label: "Cuaderno", icon: NotebookPen },
  { to: "/tutor", label: "Temiño", icon: MessageSquareText },
] as const;

const MORE = [
  { to: "/enfoque", label: "Enfoque", icon: Timer },
  { to: "/practica", label: "Juego", icon: Dices },
  { to: "/horario", label: "Horario", icon: CalendarDays },
  { to: "/examenes", label: "Exámenes", icon: GraduationCap },
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
      className="mb-3 flex h-11 items-center justify-between rounded-sm bg-fg px-3 text-sm font-medium text-bg"
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
      className="flex h-11 items-center rounded-sm bg-fg px-3 font-mono text-sm tabular-nums text-bg"
    >
      {formatMmSs(left)}
    </Link>
  );
}

function useIdleLock() {
  useEffect(() => {
    touchActivity();
    let lastBump = Date.now();
    const bump = () => {
      const now = Date.now();
      if (now - lastBump < 15_000) return;
      lastBump = now;
      if (readSession()) touchActivity();
    };
    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    for (const ev of events) window.addEventListener(ev, bump, { passive: true });
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      if (idleExpired()) lockNow();
      else touchActivity();
    };
    document.addEventListener("visibilitychange", onVis);
    const id = window.setInterval(() => {
      if (idleExpired() || !readSession()) lockNow();
    }, 5_000);
    return () => {
      for (const ev of events) window.removeEventListener(ev, bump);
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(id);
    };
  }, []);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  useIdleLock();

  useEffect(() => {
    setIsOwner(readSession()?.role === "owner");
  }, []);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-bg px-3 py-6 md:flex">
        <Link to="/" aria-label="IUS" className="mb-8 flex justify-center py-1">
          <BrandMark size="lg" className="size-14" />
        </Link>
        <PomoChip />
        <nav className="flex flex-1 flex-col gap-0.5">
          {[...NAV, ...MORE].map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-sm px-3 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-bg text-fg"
                    : "text-muted hover:bg-bg hover:text-fg",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => setLockOpen(true)}
          className="mt-2 flex h-11 items-center gap-2 rounded-sm px-3 text-sm text-muted hover:bg-bg hover:text-fg"
        >
          <Lock className="size-4" />
          Clave
        </button>
        <button
          type="button"
          onClick={() => lockNow()}
          className="flex h-11 items-center gap-2 rounded-sm px-3 text-sm text-danger hover:bg-bg"
        >
          <LogOut className="size-4" />
          Salir
        </button>
        <a
          href={ROOT_FOLDER_LINK}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center gap-2 rounded-sm px-3 text-sm text-muted hover:bg-bg hover:text-fg"
        >
          <FolderOpen className="size-4" />
          Drive
        </a>
      </aside>

      <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-bg/90 px-2 py-2 md:hidden">
        <div />
        <Link to="/" aria-label="IUS" className="justify-self-center">
          <BrandMark size="lg" className="size-11" />
        </Link>
        <div className="flex items-center justify-end gap-0.5">
          <MobilePomoChip />
          <Button
            variant="ghost"
            size="icon"
            className="size-11 text-danger"
            onClick={() => lockNow()}
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-5" />
          </Button>
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

      <div className="md:pl-56">
        <div className="mx-auto max-w-5xl px-4 pt-5 pb-32 md:px-8 md:pt-8 md:pb-16">
          {children}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                active ? "text-fg" : "text-muted",
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
            "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium",
            MORE.some((m) => isActive(pathname, m.to)) ? "text-fg" : "text-muted",
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
                  className="flex h-12 items-center gap-3 rounded-sm bg-bg px-4 text-sm font-medium"
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
              className="flex h-12 items-center gap-3 rounded-sm px-4 text-sm text-muted"
            >
              <Lock className="size-4" />
              Clave
            </button>
            <button
              type="button"
              onClick={() => lockNow()}
              className="flex h-12 items-center gap-3 rounded-sm px-4 text-sm text-danger"
            >
              <LogOut className="size-4" />
              Salir
            </button>
            <a
              href={ROOT_FOLDER_LINK}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center gap-3 rounded-sm px-4 text-sm text-muted"
            >
              <FolderOpen className="size-4" />
              Drive
            </a>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={lockOpen} onOpenChange={setLockOpen}>
        <SheetContent side="bottom" className="overflow-y-auto px-5 pt-6 pb-8">
          <SheetTitle className="mb-4">Clave</SheetTitle>
          {isOwner ? (
            <>
              <GuestCodePanel />
              <div className="mt-4">
                <CloudStatusCard />
              </div>
              <GeminiKeyForm />
              <ChangePasswordForm />
            </>
          ) : (
            <p className="text-sm text-muted">Invitado · vence a medianoche.</p>
          )}
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => lockNow()}
          >
            Salir
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}

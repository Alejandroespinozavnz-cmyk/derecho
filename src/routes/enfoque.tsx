import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { useStudyStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/enfoque")({ component: EnfoquePage });

const METHODS = [
  {
    id: "pomodoro",
    title: "Pomodoro",
    body: "25 minutos de estudio denso, 5 de pausa. Cada 4 ciclos, 15–20 de descanso. Sirve para leer jurisprudencia o armar un escrito sin abrumarte.",
  },
  {
    id: "feynman",
    title: "Feynman",
    body: "Explicá el tema como si se lo contaras a un compañero de primer año. Donde trabés, ahí está el hueco. Anotalo en el cuaderno y volvé a la fuente.",
  },
  {
    id: "recall",
    title: "Recuerdo activo",
    body: "Cerrá el apunte. Escribí de memoria: definición, requisitos, efectos y un caso. Después contrastá. Reléer no es estudiar.",
  },
  {
    id: "sq3r",
    title: "SQ3R",
    body: "Survey, Question, Read, Recite, Review. Ojeá el tema, armá preguntas (¿cuál es el lapso?), leé, recitá sin mirar, repasá al día siguiente.",
  },
  {
    id: "cornell",
    title: "Cornell",
    body: "Hoja en tres: notas de clase a la derecha, palabras clave / artículos a la izquierda, resumen abajo. Ideal para Civil y Procesal.",
  },
  {
    id: "spaced",
    title: "Repaso espaciado",
    body: "Repasá a las 24 h, a los 3 días y a la semana. El juego de V/F y las preguntas del tutor sirven como tarjetas.",
  },
];

function formatMmSs(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function EnfoquePage() {
  return (
    <AppShell>
      <PageHeader title="Enfoque" />
      <PomodoroCard />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {METHODS.map((m) => (
          <Panel key={m.id}>
            <h2 className="font-display text-lg">{m.title}</h2>
            <p className="mt-2 text-sm text-muted">{m.body}</p>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}

function PomodoroCard() {
  const pomo = useStudyStore((s) => s.pomo);
  const setPomo = useStudyStore((s) => s.setPomo);
  const addSession = useStudyStore((s) => s.addSession);
  const tasks = useStudyStore((s) => s.tasks);
  const addTask = useStudyStore((s) => s.addTask);
  const toggleTask = useStudyStore((s) => s.toggleTask);
  const removeTask = useStudyStore((s) => s.removeTask);
  const [taskTitle, setTaskTitle] = useState("");
  const [, tick] = useState(0);
  const handledEnd = useRef<number | null>(null);

  useEffect(() => {
    if (pomo.mode !== "focus" && pomo.mode !== "break") return;
    const id = window.setInterval(() => tick((n) => n + 1), 400);
    return () => window.clearInterval(id);
  }, [pomo.mode]);

  useEffect(() => {
    if ((pomo.mode !== "focus" && pomo.mode !== "break") || !pomo.endsAt) return;
    const remain = Math.max(0, pomo.endsAt - Date.now());
    const id = window.setTimeout(() => {
      if (handledEnd.current === pomo.endsAt) return;
      handledEnd.current = pomo.endsAt;
      if (pomo.mode === "focus") {
        addSession("mixto", Math.round(pomo.focusMs / 60000));
        beep();
        setPomo({
          mode: "break",
          endsAt: Date.now() + pomo.breakMs,
          round: pomo.round + 1,
        });
        toast.success("Cierra el ciclo. Descanso.");
      } else {
        beep();
        setPomo({ mode: "idle", endsAt: null, leftMs: pomo.focusMs });
        toast.success("Descanso listo. Otro foco cuando quieras.");
      }
    }, remain);
    return () => window.clearTimeout(id);
  }, [pomo.mode, pomo.endsAt, pomo.focusMs, pomo.breakMs, pomo.round, addSession, setPomo]);

  const left =
    pomo.mode === "paused"
      ? pomo.leftMs
      : pomo.endsAt
        ? Math.max(0, pomo.endsAt - Date.now())
        : pomo.focusMs;

  const startFocus = () => {
    setPomo({
      mode: "focus",
      endsAt: Date.now() + (pomo.mode === "paused" ? pomo.leftMs : pomo.focusMs),
    });
  };

  const pause = () => {
    const remain = pomo.endsAt ? Math.max(0, pomo.endsAt - Date.now()) : pomo.leftMs;
    setPomo({ mode: "paused", endsAt: null, leftMs: remain });
  };

  const stop = () => {
    setPomo({ mode: "idle", endsAt: null, leftMs: pomo.focusMs });
  };

  const setPreset = (focusMin: number, breakMin: number) => {
    setPomo({
      focusMs: focusMin * 60 * 1000,
      breakMs: breakMin * 60 * 1000,
      leftMs: focusMin * 60 * 1000,
      mode: "idle",
      endsAt: null,
    });
  };

  return (
    <Panel>
      <h2 className="font-display text-xl">Pomodoro</h2>
      <p className="mt-1 text-sm text-muted">
        {pomo.mode === "break" ? "Descanso" : "Foco"} · ronda {pomo.round}
      </p>
      <p className="mt-4 font-display text-5xl tabular-nums">{formatMmSs(left)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setPreset(25, 5)}>
          25 / 5
        </Button>
        <Button size="sm" variant="outline" onClick={() => setPreset(50, 10)}>
          50 / 10
        </Button>
        <Button size="sm" variant="outline" onClick={() => setPreset(15, 5)}>
          15 / 5
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {pomo.mode === "focus" || pomo.mode === "break" ? (
          <Button onClick={pause}>
            <Pause className="size-4" />
            Pausar
          </Button>
        ) : (
          <Button onClick={startFocus}>
            <Play className="size-4" />
            Empezar
          </Button>
        )}
        <Button variant="outline" onClick={stop}>
          <Square className="size-4" />
          Reset
        </Button>
      </div>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!taskTitle.trim()) return;
          addTask(taskTitle.trim());
          setTaskTitle("");
        }}
      >
        <input
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="Hoy: leer depósito, armar contestación…"
          className="h-11 flex-1 rounded-md border border-border bg-bg px-3 text-sm"
        />
        <Button type="submit" variant="outline">
          Tarea
        </Button>
      </form>
      <ul className="mt-3 space-y-1">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggleTask(t.id)}
              className="size-4 accent-primary"
            />
            <span className={cn("flex-1", t.done && "text-muted line-through")}>
              {t.title}
            </span>
            <button
              type="button"
              className="text-xs text-subtle hover:text-fg"
              onClick={() => removeTask(t.id)}
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    /* ignore */
  }
}

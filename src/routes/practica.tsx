import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, RotateCcw, Timer, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  MIX_SLUG,
  questionsFor,
  quizCounts,
  shuffle,
  type QuizItem,
} from "@/lib/quiz";
import { SUBJECTS, getSubject } from "@/lib/subjects";
import { useStudyStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const ROUND = 10;
const LIVES = 3;
const TIMER_SECS = 20;

export const Route = createFileRoute("/practica")({
  validateSearch: (s: Record<string, unknown>): { materia?: string } => {
    if (typeof s.materia === "string" && s.materia.length > 0) {
      return { materia: s.materia };
    }
    return {};
  },
  component: PracticaPage,
});

type Phase = "lobby" | "play" | "result";
type Answer = boolean | null;

function PracticaPage() {
  const { materia } = Route.useSearch();
  const counts = useMemo(() => quizCounts(), []);
  const setQuizBest = useStudyStore((s) => s.setQuizBest);
  const quizBest = useStudyStore((s) => s.quizBest);

  const [selected, setSelected] = useState(
    materia && (materia === MIX_SLUG || getSubject(materia))
      ? materia
      : "",
  );
  const [timed, setTimed] = useState(true);
  const [phase, setPhase] = useState<Phase>("lobby");
  const [order, setOrder] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Answer>(null);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [seconds, setSeconds] = useState(TIMER_SECS);

  const current = order[index];
  const total = order.length;
  const setId = selected || MIX_SLUG;
  const best = quizBest[setId] ?? 0;
  const resolved = useRef(false);

  const start = (slug = selected) => {
    const bank = questionsFor(slug || MIX_SLUG);
    if (bank.length === 0) return;
    const deck = shuffle(bank).slice(0, Math.min(ROUND, bank.length));
    resolved.current = false;
    setSelected(slug || MIX_SLUG);
    setOrder(deck);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setHits(0);
    setStreak(0);
    setBestStreak(0);
    setLives(LIVES);
    setSeconds(TIMER_SECS);
    setPhase("play");
  };

  const finish = (nextScore: number) => {
    setQuizBest(setId, nextScore);
    setPhase("result");
  };

  const choose = (value: boolean) => {
    if (resolved.current || !current || phase !== "play") return;
    resolved.current = true;
    setPicked(value);
    if (value === current.answer) {
      const nextStreak = streak + 1;
      const gained = 100 + (nextStreak - 1) * 25;
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setHits((h) => h + 1);
      setScore((s) => s + gained);
    } else {
      setLives((l) => l - 1);
      setStreak(0);
    }
  };

  const missByTime = () => {
    if (resolved.current || !current || phase !== "play") return;
    resolved.current = true;
    setPicked(current.answer ? false : true);
    setLives((l) => l - 1);
    setStreak(0);
  };

  const next = () => {
    if (lives <= 0) {
      finish(score);
      return;
    }
    if (index + 1 >= total) {
      finish(score);
      return;
    }
    resolved.current = false;
    setIndex((i) => i + 1);
    setPicked(null);
    setSeconds(TIMER_SECS);
  };

  useEffect(() => {
    if (phase !== "play" || picked !== null || !timed) return;
    if (seconds <= 0) {
      missByTime();
      return;
    }
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, picked, timed, seconds]);

  useEffect(() => {
    if (phase !== "play" || picked !== null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "v" || e.key === "V" || e.key === "1") choose(true);
      if (e.key === "f" || e.key === "F" || e.key === "2") choose(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, picked, current, streak, lives]);

  const subjectName =
    selected === MIX_SLUG
      ? "Mixto"
      : (getSubject(selected)?.name ?? "Materia");

  const resultLabel = useMemo(() => {
    if (lives <= 0) return "Se acabaron las vidas.";
    const ratio = total ? hits / total : 0;
    if (ratio >= 0.85) return "Listo para el parcial.";
    if (ratio >= 0.6) return "Bien. Repasá los que fallaste.";
    return "Otra ronda y después el material.";
  }, [lives, hits, total]);

  return (
    <AppShell>
      <PageHeader
        kicker="Cuando te aburras"
        title="Duelo jurídico"
        description="Elegí la materia. Verdadero o falso, tres vidas, racha que suma puntos."
      />

      {phase === "lobby" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
          <div className="grid gap-3 sm:grid-cols-2">
            <SubjectPick
              active={selected === MIX_SLUG}
              name="Mixto"
              hint="Todas las materias, barajadas"
              count={counts[MIX_SLUG] ?? 0}
              best={quizBest[MIX_SLUG]}
              onClick={() => setSelected(MIX_SLUG)}
            />
            {SUBJECTS.map((s) => (
              <SubjectPick
                key={s.slug}
                active={selected === s.slug}
                name={s.name}
                hint={s.hint}
                count={counts[s.slug] ?? 0}
                best={quizBest[s.slug]}
                onClick={() => setSelected(s.slug)}
              />
            ))}
          </div>
          <Panel className="h-fit">
            <p className="font-display text-lg">Ronda</p>
            <p className="mt-1 text-sm text-muted">
              {ROUND} preguntas · {LIVES} vidas
              {timed ? ` · ${TIMER_SECS}s` : ""}
            </p>
            <button
              type="button"
              onClick={() => setTimed((t) => !t)}
              className={cn(
                "mt-4 flex h-11 w-full items-center justify-between rounded-md border px-3 text-sm",
                timed
                  ? "border-primary/40 bg-primary/10 text-fg"
                  : "border-border bg-bg text-muted",
              )}
            >
              <span className="inline-flex items-center gap-2">
                <Timer className="size-4" />
                Contrarreloj
              </span>
              <span className="text-xs">{timed ? "On" : "Off"}</span>
            </button>
            <Button
              className="mt-4 w-full"
              size="lg"
              disabled={!selected}
              onClick={() => start()}
            >
              Jugar
            </Button>
          </Panel>
        </div>
      ) : null}

      {phase === "play" && current ? (
        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {Array.from({ length: LIVES }).map((_, i) => (
                <Heart
                  key={i}
                  className={cn(
                    "size-5",
                    i < lives ? "fill-danger text-danger" : "text-subtle",
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 text-sm tabular-nums">
              <span className="text-muted">
                {index + 1}/{total}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  streak >= 2 && "animate-[streak-pop_400ms_ease-out] text-primary",
                )}
              >
                <Zap className="size-3.5" />
                {streak}
              </span>
              <span className="font-display text-lg">{score}</span>
            </div>
          </div>
          {timed ? (
            <Progress
              value={Math.round((seconds / TIMER_SECS) * 100)}
              className="mb-5"
            />
          ) : (
            <Progress
              value={Math.round((index / total) * 100)}
              className="mb-5"
            />
          )}
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            {subjectName}
            {timed ? ` · ${seconds}s` : ""}
          </p>
          <p className="mt-2 font-display text-xl leading-snug md:text-2xl">
            {current.prompt}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Choice
              label="Verdadero"
              correct={picked !== null && current.answer === true}
              wrong={picked === true && current.answer === false}
              disabled={picked !== null}
              onClick={() => choose(true)}
            />
            <Choice
              label="Falso"
              correct={picked !== null && current.answer === false}
              wrong={picked === false && current.answer === true}
              disabled={picked !== null}
              onClick={() => choose(false)}
            />
          </div>
          {picked !== null ? (
            <div className="mt-5 rounded-lg bg-bg-warm px-4 py-3 text-sm">
              <p className="font-medium">
                {picked === current.answer ? "Correcto" : "Incorrecto"} — es{" "}
                {current.answer ? "verdadero" : "falso"}.
              </p>
              {current.note ? (
                <p className="mt-1 text-muted">{current.note}</p>
              ) : null}
              <Button className="mt-4" onClick={next}>
                {lives <= 0
                  ? "Ver resultado"
                  : index + 1 >= total
                    ? "Ver resultado"
                    : "Siguiente"}
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-xs text-subtle">
              Atajos: V verdadero · F falso
            </p>
          )}
        </Panel>
      ) : null}

      {phase === "result" ? (
        <Panel className="text-center">
          <p className="text-sm text-muted">{subjectName}</p>
          <p className="mt-2 font-display text-4xl tabular-nums">{score}</p>
          <p className="mt-1 text-muted">{resultLabel}</p>
          <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-3 text-sm">
            <MiniStat label="Aciertos" value={`${hits}/${total}`} />
            <MiniStat label="Racha" value={String(bestStreak)} />
            <MiniStat label="Mejor" value={String(Math.max(best, score))} />
          </div>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={() => start(setId)}>
              <RotateCcw className="size-4" />
              Otra ronda
            </Button>
            <Button variant="outline" onClick={() => setPhase("lobby")}>
              Cambiar materia
            </Button>
            {selected !== MIX_SLUG && getSubject(selected) ? (
              <Button variant="ghost" asChild>
                <Link
                  to="/materias/$slug"
                  params={{ slug: selected }}
                  search={{}}
                >
                  Material
                </Link>
              </Button>
            ) : null}
          </div>
        </Panel>
      ) : null}
    </AppShell>
  );
}

function SubjectPick({
  name,
  hint,
  count,
  best,
  active,
  onClick,
}: {
  name: string;
  hint: string;
  count: number;
  best?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={count === 0}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-surface hover:bg-bg-warm",
        count === 0 && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">{name}</p>
        {best ? <Badge variant="paper">Mejor {best}</Badge> : null}
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-muted">{hint}</p>
      <p className="mt-2 text-xs tabular-nums text-subtle">
        {count} preguntas
      </p>
    </button>
  );
}

function Choice({
  label,
  onClick,
  disabled,
  correct,
  wrong,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  correct: boolean;
  wrong: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-14 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
        correct && "border-ok bg-ok text-bg",
        wrong && "border-danger bg-danger/15 text-danger",
        !correct &&
          !wrong &&
          "border-border bg-bg hover:bg-bg-warm",
      )}
    >
      {label}
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-bg-warm px-2 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 font-display text-lg tabular-nums">{value}</p>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Dices,
  GraduationCap,
  MessageSquareText,
  NotebookPen,
  Timer,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { countFilled, todayDayName } from "@/lib/schedule";
import { YEAR } from "@/lib/program";
import { SUBJECTS, getSubject, allCatalogFiles } from "@/lib/subjects";
import { topicKey, useStudyStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function weekMinutes(sessions: { minutes: number; at: string }[]) {
  const start = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return sessions
    .filter((s) => new Date(s.at).getTime() >= start)
    .reduce((sum, s) => sum + s.minutes, 0);
}

function Home() {
  const reviewed = useStudyStore((s) => s.reviewed);
  const topics = useStudyStore((s) => s.topics);
  const exams = useStudyStore((s) => s.exams);
  const schedule = useStudyStore((s) => s.schedule);
  const slots = useStudyStore((s) => s.slots);
  const notes = useStudyStore((s) => s.notes);
  const sessions = useStudyStore((s) => s.sessions);
  const pages = useStudyStore((s) => s.pages);

  const files = allCatalogFiles();
  const reviewedCount = files.filter((f) => reviewed[f.id]).length;
  const upcoming = exams
    .filter((e) => !e.done && e.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  const undated = exams.filter((e) => !e.done && !e.date).length;
  const today = todayDayName();
  const filled = countFilled(schedule);
  const todaySlots = today
    ? slots.flatMap((slot) => {
        const slug = schedule[today]?.[slot.id];
        const subject = slug ? getSubject(slug) : undefined;
        return subject ? [{ slot: `${slot.start} – ${slot.end}`, subject }] : [];
      })
    : [];

  const nowLabel = format(new Date(), "EEEE d 'de' MMMM", { locale: es });
  const focusMin = weekMinutes(sessions);
  const pageCount = pages.filter((p) => p.body.trim()).length;

  return (
    <AppShell>
      <PageHeader
        kicker={nowLabel}
        title="Tu mesa de estudio"
        description={`${YEAR.subjectCount} materias · armá el horario, los parciales y jugá cuando te aburras.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/horario">
                Horario
                <CalendarDays className="size-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link to="/practica" search={{}}>
                Jugar
                <Dices className="size-4" />
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Materias" value={String(YEAR.subjectCount)} />
        <Stat label="Bloques cargados" value={String(filled)} />
        <Stat
          label="Leídos"
          value={`${reviewedCount}/${files.filter((f) => !f.isFolder).length}`}
        />
        <Stat label="Foco 7 días" value={`${focusMin} min`} />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <ToolLink
          to="/cuaderno"
          icon={NotebookPen}
          title="Cuaderno"
          hint={pageCount ? `${pageCount} hoja${pageCount === 1 ? "" : "s"} con texto` : "Nube: iPhone y computadora"}
        />
        <ToolLink
          to="/enfoque"
          icon={Timer}
          title="Enfoque"
          hint="Pomodoro, métodos y transcribir audio"
        />
        <ToolLink
          to="/tutor"
          icon={MessageSquareText}
          title="Tutor"
          hint="Gemini · programa UCAT 2025-2026"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Materias</h2>
            <Link
              to="/materias"
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
            >
              Ver todas <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {SUBJECTS.map((s) => {
              const doneTopics = s.topics.filter(
                (t) => topics[topicKey(s.slug, t)],
              ).length;
              const pct = Math.round(
                (doneTopics / Math.max(s.topics.length, 1)) * 100,
              );
              const Icon = s.icon;
              return (
                <Link
                  key={s.slug}
                  to="/materias/$slug"
                  params={{ slug: s.slug }}
                  search={{}}
                  className="rounded-lg border border-border bg-bg/40 p-4 transition-colors hover:bg-bg-warm"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="font-mono text-xs tracking-widest text-subtle">
                      {s.initials}
                    </span>
                  </div>
                  <p className="font-medium">{s.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                    {s.hint}
                  </p>
                  <Progress value={pct} className="mt-3" />
                  <p className="mt-1.5 text-xs tabular-nums text-subtle">
                    {doneTopics}/{s.topics.length} temas
                  </p>
                </Link>
              );
            })}
          </div>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel>
            <div className="mb-3 flex items-center gap-2">
              <GraduationCap className="size-4 text-primary" />
              <h2 className="font-display text-xl">Próximos exámenes</h2>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted">
                {undated
                  ? `${undated} examen${undated === 1 ? "" : "es"} sin fecha. Poneles día en Exámenes.`
                  : "Aún no hay fechas. Ponle día a tus parciales en Exámenes."}
              </p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((e) => {
                  const sub = getSubject(e.subjectSlug);
                  const days = differenceInCalendarDays(
                    parseISO(e.date),
                    new Date(),
                  );
                  return (
                    <li
                      key={e.id}
                      className="flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-muted">{sub?.name}</p>
                      </div>
                      <Badge variant={days <= 7 ? "exam" : "paper"}>
                        {days === 0
                          ? "Hoy"
                          : days === 1
                            ? "Mañana"
                            : days < 0
                              ? "Pasó"
                              : `${days} d`}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/examenes">Organizar exámenes</Link>
            </Button>
          </Panel>

          <Panel>
            <div className="mb-3 flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <h2 className="font-display text-xl">Hoy</h2>
            </div>
            {today && todaySlots.length > 0 ? (
              <ul className="space-y-2">
                {todaySlots.map((row) => (
                  <li
                    key={row.slot + row.subject.slug}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="tabular-nums text-muted">{row.slot}</span>
                    <Link
                      to="/materias/$slug"
                      params={{ slug: row.subject.slug }}
                      search={{}}
                      className="font-medium hover:underline"
                    >
                      {row.subject.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                {today
                  ? "Nada para hoy. Editá el horario y poné tus materias y horas."
                  : "Fin de semana — buen momento para el juego."}
              </p>
            )}
            <Button asChild variant="ghost" className="mt-3 w-full">
              <Link to="/horario">Editar horario</Link>
            </Button>
          </Panel>
        </div>
      </div>

      {Object.keys(notes).some((k) => notes[k]?.trim()) ? (
        <Panel className="mt-6">
          <h2 className="mb-3 font-display text-xl">Apuntes recientes</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SUBJECTS.filter((s) => notes[s.slug]?.trim()).map((s) => (
              <Link
                key={s.slug}
                to="/materias/$slug"
                params={{ slug: s.slug }}
                search={{}}
                className={cn(
                  "rounded-lg border border-border p-4 text-sm text-muted hover:bg-bg-warm",
                )}
              >
                <p className="mb-1 font-medium text-fg">{s.name}</p>
                <p className="line-clamp-3">{notes[s.slug]}</p>
              </Link>
            ))}
          </div>
        </Panel>
      ) : null}
    </AppShell>
  );
}

function ToolLink({
  to,
  icon: Icon,
  title,
  hint,
}: {
  to: "/cuaderno" | "/enfoque" | "/tutor";
  icon: typeof NotebookPen;
  title: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-4 shadow-soft transition-colors hover:bg-bg-warm"
    >
      <span className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{hint}</span>
      </span>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-4 shadow-soft">
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}

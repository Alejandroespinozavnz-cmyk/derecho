import { createFileRoute, Link } from "@tanstack/react-router";
import { differenceInCalendarDays, parseISO } from "date-fns";
import {
  GraduationCap,
  MessageSquareText,
  NotebookPen,
  Timer,
} from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BrandMark } from "@/components/brand-mark";
import { LocalFilePreview } from "@/components/local-file-preview";
import { UploadButton } from "@/components/upload-files";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { todayDayName } from "@/lib/schedule";
import { SUBJECTS, getSubject } from "@/lib/subjects";
import { topicKey, useStudyStore, type UploadedFile } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function weekMinutes(sessions: { minutes: number; at: string }[]) {
  const start = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return sessions
    .filter((s) => new Date(s.at).getTime() >= start)
    .reduce((sum, s) => sum + s.minutes, 0);
}

function Home() {
  const topics = useStudyStore((s) => s.topics);
  const exams = useStudyStore((s) => s.exams);
  const schedule = useStudyStore((s) => s.schedule);
  const slots = useStudyStore((s) => s.slots);
  const sessions = useStudyStore((s) => s.sessions);
  const pages = useStudyStore((s) => s.pages);
  const uploads = useStudyStore((s) => s.uploads);
  const [openFile, setOpenFile] = useState<UploadedFile | null>(null);

  const upcoming = exams
    .filter((e) => !e.done && e.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  const undated = exams.filter((e) => !e.done && !e.date);
  const today = todayDayName();
  const todaySlots = today
    ? slots.flatMap((slot) => {
        const slug = schedule[today]?.[slot.id];
        const subject = slug ? getSubject(slug) : undefined;
        return subject ? [{ slot: `${slot.start}–${slot.end}`, subject }] : [];
      })
    : [];
  const focusMin = weekMinutes(sessions);
  const pageCount = pages.filter((p) => p.body.trim()).length;

  return (
    <AppShell>
      <header className="mb-8 flex items-end justify-between gap-3">
        <div>
          <h1>
            <BrandMark size="lg" />
            <span className="sr-only">IUS</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {focusMin} min esta semana · {pageCount} hoja{pageCount === 1 ? "" : "s"}
          </p>
        </div>
        <UploadButton />
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted">Hoy</h2>
              <Link to="/horario" className="text-sm text-muted hover:text-fg">
                Horario
              </Link>
            </div>
            {todaySlots.length > 0 ? (
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                {todaySlots.map((row) => (
                  <li key={row.slot + row.subject.slug}>
                    <Link
                      to="/materias/$slug"
                      params={{ slug: row.subject.slug }}
                      search={{}}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <span className="font-medium">{row.subject.name}</span>
                      <span className="tabular-nums text-sm text-muted">
                        {row.slot}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-muted">
                Sin bloques hoy.
              </p>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted">Materias</h2>
              <Link to="/materias" className="text-sm text-muted hover:text-fg">
                Todas
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {SUBJECTS.map((s) => {
                const done = s.topics.filter(
                  (t) => topics[topicKey(s.slug, t)],
                ).length;
                const pct = Math.round(
                  (done / Math.max(s.topics.length, 1)) * 100,
                );
                return (
                  <Link
                    key={s.slug}
                    to="/materias/$slug"
                    params={{ slug: s.slug }}
                    search={{}}
                    className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:bg-bg-warm"
                  >
                    <span className="text-xs tracking-[0.18em] text-muted">
                      {s.initials}
                    </span>
                    <span className="mt-2 block font-semibold">{s.name}</span>
                    <Progress value={pct} className="mt-3" />
                    <span className="mt-2 block text-xs tabular-nums text-subtle">
                      {done}/{s.topics.length}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted">Exámenes</h2>
              <Link to="/examenes" className="text-sm text-muted hover:text-fg">
                Agenda
              </Link>
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {upcoming.length === 0 && undated.length === 0 ? (
                <li className="px-5 py-4 text-sm text-muted">Nada cargado.</li>
              ) : null}
              {upcoming.map((e) => {
                const sub = getSubject(e.subjectSlug);
                const days = differenceInCalendarDays(
                  parseISO(e.date),
                  new Date(),
                );
                return (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.title}</p>
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
              {upcoming.length === 0
                ? undated.slice(0, 3).map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <Badge variant="paper">Fecha</Badge>
                    </li>
                  ))
                : null}
            </ul>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted">Archivos</h2>
              <Link to="/biblioteca" className="text-sm text-muted hover:text-fg">
                Ver
              </Link>
            </div>
            {uploads.length === 0 ? (
              <p className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-muted">
                Subí guías, parciales o fotos de pizarra.
              </p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                {uploads.slice(0, 4).map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => setOpenFile(f)}
                      className="w-full truncate px-5 py-3.5 text-left text-sm font-medium hover:bg-bg-warm"
                    >
                      {f.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <nav className="grid grid-cols-2 gap-2">
            <Link
              to="/cuaderno"
              className="flex h-11 items-center justify-center gap-2 rounded-sm border border-border bg-surface text-sm font-medium hover:bg-bg-warm"
            >
              <NotebookPen className="size-4" />
              Cuaderno
            </Link>
            <Link
              to="/tutor"
              search={{}}
              className="flex h-11 items-center justify-center gap-2 rounded-sm border border-border bg-surface text-sm font-medium hover:bg-bg-warm"
            >
              <MessageSquareText className="size-4" />
              Tutor
            </Link>
            <Link
              to="/enfoque"
              className="flex h-11 items-center justify-center gap-2 rounded-sm border border-border bg-surface text-sm font-medium hover:bg-bg-warm"
            >
              <Timer className="size-4" />
              Enfoque
            </Link>
            <Link
              to="/examenes"
              className="flex h-11 items-center justify-center gap-2 rounded-sm border border-border bg-surface text-sm font-medium hover:bg-bg-warm"
            >
              <GraduationCap className="size-4" />
              Exámenes
            </Link>
          </nav>
        </div>
      </div>

      <LocalFilePreview file={openFile} onClose={() => setOpenFile(null)} />
    </AppShell>
  );
}


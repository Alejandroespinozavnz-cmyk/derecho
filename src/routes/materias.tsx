import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PROGRAM, YEAR } from "@/lib/program";
import { SUBJECTS } from "@/lib/subjects";
import { topicKey, useStudyStore } from "@/lib/store";

export const Route = createFileRoute("/materias")({ component: MateriasPage });

function MateriasPage() {
  const topics = useStudyStore((s) => s.topics);
  const reviewed = useStudyStore((s) => s.reviewed);

  return (
    <AppShell>
      <PageHeader
        kicker="Plan oficial 2025-2026"
        title="Ocho materias"
        description={`${YEAR.credits} unidades de crédito y ${YEAR.weeklyHours} horas semanales. Todas anuales. Ratificado en Consejo de Facultad N° 173.`}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {SUBJECTS.map((s) => {
          const Icon = s.icon;
          const done = s.topics.filter((t) => topics[topicKey(s.slug, t)]).length;
          const read = s.files.filter((f) => !f.isFolder && reviewed[f.id]).length;
          const docs = s.files.filter((f) => !f.isFolder).length;
          const pct = Math.round((done / Math.max(s.topics.length, 1)) * 100);
          const program = PROGRAM[s.slug];
          return (
            <Link
              key={s.slug}
              to="/materias/$slug"
              params={{ slug: s.slug }}
              search={{}}
              className="rounded-xl border border-border bg-surface p-5 shadow-soft transition-colors hover:bg-bg-warm"
            >
              <div className="mb-4 flex items-start justify-between">
                <span className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="font-mono text-xs tracking-widest text-subtle">
                  {program?.code ?? s.initials}
                </span>
              </div>
              <h2 className="font-display text-2xl">{s.name}</h2>
              <p className="mt-1 text-sm text-muted">{s.fullName}</p>
              {program ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="paper">{program.weeklyHours} h/sem</Badge>
                  <Badge variant="outline">{program.credits} UC</Badge>
                  <Badge variant="outline">{program.period}</Badge>
                </div>
              ) : null}
              <Progress value={pct} className="mt-4" />
              <p className="mt-2 text-xs tabular-nums text-subtle">
                {done}/{s.topics.length} temas · {read}/{docs} archivos leídos
              </p>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
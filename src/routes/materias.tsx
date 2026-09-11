import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page";
import { Progress } from "@/components/ui/progress";
import { SUBJECTS } from "@/lib/subjects";
import { topicKey, useStudyStore } from "@/lib/store";

export const Route = createFileRoute("/materias")({ component: MateriasPage });

function MateriasPage() {
  const topics = useStudyStore((s) => s.topics);

  return (
    <AppShell>
      <PageHeader title="Materias" />
      <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {SUBJECTS.map((s) => {
          const done = s.topics.filter((t) => topics[topicKey(s.slug, t)]).length;
          const pct = Math.round((done / Math.max(s.topics.length, 1)) * 100);
          return (
            <li key={s.slug}>
              <Link
                to="/materias/$slug"
                params={{ slug: s.slug }}
                search={{}}
                className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-bg md:px-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <h2 className="text-lg font-semibold">{s.name}</h2>
                    <span className="shrink-0 text-xs tabular-nums text-subtle">
                      {done}/{s.topics.length}
                    </span>
                  </span>
                  <Progress value={pct} className="mt-3" />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </AppShell>
  );
}

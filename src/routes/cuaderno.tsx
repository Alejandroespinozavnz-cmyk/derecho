import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SUBJECTS } from "@/lib/subjects";
import { exportStudyBackup, useStudyStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cuaderno")({ component: CuadernoPage });

function CuadernoPage() {
  const pages = useStudyStore((s) => s.pages);
  const addPage = useStudyStore((s) => s.addPage);
  const updatePage = useStudyStore((s) => s.updatePage);
  const removePage = useStudyStore((s) => s.removePage);
  const audioNotes = useStudyStore((s) => s.audioNotes);
  const [activeId, setActiveId] = useState(pages[0]?.id ?? "");
  const page = useMemo(
    () => pages.find((p) => p.id === activeId) ?? pages[0],
    [pages, activeId],
  );

  const downloadBackup = () => {
    const blob = new Blob([exportStudyBackup()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `folio-4-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const relatedAudio = audioNotes.filter(
    (n) => n.pageId === page?.id || (!n.pageId && n.subjectSlug === page?.subjectSlug),
  );

  return (
    <AppShell>
      <PageHeader
        kicker="Nube"
        title="Cuaderno"
        description="Se guarda solo en la nube: el iPhone y la computadora ven lo mismo. También podés bajar un respaldo."
        actions={
          <>
            <Button variant="outline" onClick={downloadBackup}>
              <Download className="size-4" />
              Respaldo
            </Button>
            <Button
              onClick={() => {
                const id = addPage("Nueva hoja");
                setActiveId(id);
              }}
            >
              <Plus className="size-4" />
              Hoja
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <Panel className="h-fit p-3">
          <ul className="space-y-1">
            {pages.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(p.id)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm",
                    p.id === page?.id
                      ? "bg-primary/15 text-fg"
                      : "text-muted hover:bg-bg-warm hover:text-fg",
                  )}
                >
                  <span className="block truncate font-medium">
                    {p.title || "Sin título"}
                  </span>
                  <span className="text-xs text-subtle">
                    {new Date(p.updatedAt).toLocaleDateString("es-VE")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {page ? (
          <Panel>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
              <Input
                value={page.title}
                onChange={(e) => updatePage(page.id, { title: e.target.value })}
                placeholder="Título"
              />
              <select
                value={page.subjectSlug ?? ""}
                onChange={(e) =>
                  updatePage(page.id, { subjectSlug: e.target.value || null })
                }
                className="h-11 rounded-md border border-border bg-surface px-3 text-sm"
                aria-label="Materia"
              >
                <option value="">Sin materia</option>
                {SUBJECTS.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 text-subtle"
                disabled={pages.length <= 1}
                onClick={() => {
                  removePage(page.id);
                  setActiveId(pages.find((p) => p.id !== page.id)?.id ?? "");
                }}
                aria-label="Borrar hoja"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <Textarea
              value={page.body}
              onChange={(e) => updatePage(page.id, { body: e.target.value })}
              placeholder="Apuntes, esquemas, artículos, lo que dijo el profesor…"
              className="min-h-[28rem]"
            />
            <p className="mt-2 text-xs text-subtle">
              Guardado automático en este teléfono o computadora.
            </p>
            {relatedAudio.length > 0 ? (
              <div className="mt-6">
                <h2 className="mb-2 font-display text-lg">Audios transcritos</h2>
                <ul className="space-y-3">
                  {relatedAudio.map((n) => (
                    <li
                      key={n.id}
                      className="rounded-md border border-border bg-bg-warm p-3 text-sm"
                    >
                      <p className="mb-1 text-xs text-muted">
                        {new Date(n.at).toLocaleString("es-VE")} · {n.durationSec}s
                      </p>
                      <p className="whitespace-pre-wrap">{n.transcript}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2"
                        onClick={() =>
                          updatePage(page.id, {
                            body: `${page.body}${page.body ? "\n\n" : ""}— Transcripción —\n${n.transcript}`,
                          })
                        }
                      >
                        Pegar en la hoja
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Panel>
        ) : null}
      </div>
    </AppShell>
  );
}

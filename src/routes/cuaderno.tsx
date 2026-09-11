import { createFileRoute } from "@tanstack/react-router";
import { Download, FileDown, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { AudioTranscribe } from "@/components/audio-transcribe";
import { PageHeader, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { downloadCuadernoPdf } from "@/lib/cuaderno-pdf";
import { SUBJECTS } from "@/lib/subjects";
import { useStudyStore } from "@/lib/store";
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

  const pdfHoja = () => {
    if (!page) return;
    downloadCuadernoPdf({
      kind: "hoja",
      pages,
      audioNotes,
      page,
    });
    toast.success("PDF de esta hoja.");
  };

  const pdfMateria = () => {
    const slug = page?.subjectSlug ?? null;
    downloadCuadernoPdf({
      kind: "materia",
      pages,
      audioNotes,
      page,
      subjectSlug: slug,
    });
    toast.success(
      slug
        ? "PDF de la materia, con portada."
        : "PDF de las hojas sin materia.",
    );
  };

  const pdfTodo = () => {
    downloadCuadernoPdf({
      kind: "todo",
      pages,
      audioNotes,
    });
    toast.success("PDF de todo el cuaderno, materia por materia.");
  };

  const relatedAudio = audioNotes.filter(
    (n) => n.pageId === page?.id || (!n.pageId && n.subjectSlug === page?.subjectSlug),
  );

  return (
    <AppShell>
      <PageHeader
        title="Cuaderno"
        actions={
          <>
            <Button variant="outline" onClick={pdfMateria}>
              <FileDown className="size-4" />
              PDF materia
            </Button>
            <Button variant="outline" onClick={pdfTodo}>
              <Download className="size-4" />
              PDF todo
            </Button>
            <Button
              onClick={() => {
                const id = addPage("Nueva hoja", page?.subjectSlug ?? null);
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
                    {p.subjectSlug
                      ? SUBJECTS.find((s) => s.slug === p.subjectSlug)?.name ?? ""
                      : "Sin materia"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {page ? (
          <Panel>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Input
                value={page.title}
                onChange={(e) => updatePage(page.id, { title: e.target.value })}
                placeholder="Título"
                className="sm:min-w-[12rem] sm:flex-1"
              />
              <select
                value={page.subjectSlug ?? ""}
                onChange={(e) =>
                  updatePage(page.id, { subjectSlug: e.target.value || null })
                }
                className="h-11 shrink-0 rounded-md border border-border bg-surface px-3 text-sm sm:w-48"
                aria-label="Materia"
              >
                <option value="">Sin materia</option>
                {SUBJECTS.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Button variant="outline" className="shrink-0" onClick={pdfHoja}>
                <FileDown className="size-4" />
                PDF hoja
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 text-subtle"
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
              className="min-h-[22rem]"
            />
            <p className="mt-2 text-xs text-subtle">
              Guardado automático. El PDF lleva portada con el sello IUS.
            </p>
            <AudioTranscribe
              subjectSlug={page.subjectSlug}
              pageId={page.id}
              onTranscript={(text) => {
                const current = useStudyStore
                  .getState()
                  .pages.find((p) => p.id === page.id);
                const body = current?.body ?? "";
                updatePage(page.id, {
                  body: `${body}${body ? "\n\n" : ""}— Transcripción —\n${text}`,
                });
              }}
            />
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
                        {new Date(n.at).toLocaleString("es-VE")}
                        {n.durationSec ? ` · ${n.durationSec}s` : ""}
                      </p>
                      <p className="whitespace-pre-wrap">{n.transcript}</p>
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

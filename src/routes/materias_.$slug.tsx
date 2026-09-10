import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Dices, ExternalLink, FolderOpen, MessageSquareText, NotebookPen, Timer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConnectorBanner } from "@/components/connector-banner";
import { FilePreview } from "@/components/file-preview";
import { FileRow } from "@/components/file-row";
import { PageHeader, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { listDriveFolder } from "@/lib/drive.functions";
import { getSubject, type CatalogFile } from "@/lib/subjects";
import { PROGRAM } from "@/lib/program";
import { topicKey, useStudyStore } from "@/lib/store";

export const Route = createFileRoute("/materias_/$slug")({
  validateSearch: (s: Record<string, unknown>): { folder?: string } => {
    if (typeof s.folder === "string" && s.folder.length > 0) {
      return { folder: s.folder };
    }
    return {};
  },
  component: SubjectPage,
  notFoundComponent: () => (
    <AppShell>
      <p className="text-muted">No encontré esa materia.</p>
      <Link to="/materias" className="mt-4 inline-flex text-sm underline">
        Volver a materias
      </Link>
    </AppShell>
  ),
});

function SubjectPage() {
  const { slug } = Route.useParams();
  const { folder } = Route.useSearch();
  const navigate = Route.useNavigate();
  const subject = getSubject(slug);
  if (!subject) throw notFound();

  const folderId = folder ?? subject.folderId;
  const inNested = Boolean(folder && folder !== subject.folderId);

  const query = useQuery({
    queryKey: ["drive-folder", folderId],
    queryFn: () => listDriveFolder({ data: { folderId } }),
  });

  const live = query.data;
  const items: CatalogFile[] =
    live?.status === "ok" && live.data && live.data.length > 0
      ? live.data
      : inNested
        ? []
        : subject.files;

  const folders = items.filter((f) => f.isFolder);
  const files = items.filter((f) => !f.isFolder);
  const exams = files.filter((f) => f.exam);
  const rest = files.filter((f) => !f.exam);

  const topicsDone = useStudyStore((s) => s.topics);
  const toggleTopic = useStudyStore((s) => s.toggleTopic);
  const note = useStudyStore((s) => s.notes[slug] ?? "");
  const setNote = useStudyStore((s) => s.setNote);
  const doneCount = subject.topics.filter((t) =>
    topicsDone[topicKey(slug, t)],
  ).length;
  const pct = Math.round((doneCount / Math.max(subject.topics.length, 1)) * 100);
  const addSession = useStudyStore((s) => s.addSession);
  const program = PROGRAM[slug];

  const [preview, setPreview] = useState<CatalogFile | null>(null);
  const Icon = subject.icon;

  const openFolder = (id: string) => {
    void navigate({
      to: "/materias/$slug",
      params: { slug },
      search: { folder: id },
    });
  };

  return (
    <AppShell>
      <Link
        to="/materias"
        className="mb-4 inline-flex h-11 items-center gap-2 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        Todas las materias
      </Link>
      <PageHeader
        kicker={program ? `${program.code} · ${program.period}` : subject.initials}
        title={subject.name}
        description={
          program
            ? `${subject.fullName} · ${program.weeklyHours} h/sem · ${program.credits} UC`
            : subject.fullName
        }
        actions={
          <>
            <Button asChild>
              <Link to="/practica" search={{ materia: slug }}>
                <Dices className="size-4" />
                Jugar
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/tutor" search={{ materia: slug }}>
                <MessageSquareText className="size-4" />
                Tutor
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/enfoque">
                <Timer className="size-4" />
                Pomodoro
              </Link>
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                addSession(slug, 25);
                toast.success("25 minutos anotados");
              }}
            >
              +25 min
            </Button>
            <Button variant="outline" asChild>
              <a href={subject.driveLink} target="_blank" rel="noreferrer">
                Abrir en Drive
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </>
        }
      />

      <div className="mb-6 flex items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <Progress value={pct} />
          <p className="mt-1 text-xs tabular-nums text-muted">
            {doneCount}/{subject.topics.length} temas cubiertos
          </p>
        </div>
      </div>

      <ConnectorBanner result={live} refetch={() => query.refetch()} />

      {inNested ? (
        <div className="mt-4 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              void navigate({
                to: "/materias/$slug",
                params: { slug },
                search: {},
              })
            }
          >
            <FolderOpen className="size-4" />
            Volver a la raíz de {subject.name}
          </Button>
        </div>
      ) : null}

      <Tabs defaultValue="archivos" className="mt-6">
        <TabsList className="flex h-auto min-h-11 w-full flex-wrap">
          <TabsTrigger value="archivos">Archivos</TabsTrigger>
          <TabsTrigger value="programa">Programa</TabsTrigger>
          <TabsTrigger value="temas">Checklist</TabsTrigger>
          <TabsTrigger value="apuntes">Apuntes</TabsTrigger>
        </TabsList>

        <TabsContent value="archivos" className="mt-4 space-y-4">
          {exams.length > 0 ? (
            <Panel>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="font-display text-lg">Exámenes anteriores</h2>
                <Badge variant="exam">archivo</Badge>
              </div>
              <div className="divide-y divide-border">
                {exams.map((f) => (
                  <FileRow
                    key={f.id}
                    file={f}
                    onOpenFolder={openFolder}
                    onPreview={setPreview}
                  />
                ))}
              </div>
            </Panel>
          ) : null}

          {folders.length > 0 ? (
            <Panel>
              <h2 className="mb-3 font-display text-lg">Carpetas</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => openFolder(f.id)}
                    className="flex h-14 items-center gap-3 rounded-md border border-border bg-bg/40 px-4 text-left text-sm font-medium hover:bg-bg-warm"
                  >
                    <FolderOpen className="size-4 text-primary" />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
              </div>
            </Panel>
          ) : null}

          <Panel>
            <h2 className="mb-3 font-display text-lg">Documentos y presentaciones</h2>
            {rest.length === 0 && folders.length === 0 && exams.length === 0 ? (
              <p className="text-sm text-muted">
                No hay archivos en esta carpeta todavía.
              </p>
            ) : rest.length === 0 ? (
              <p className="text-sm text-muted">
                Los documentos sueltos aparecen acá. Abrí una carpeta para ver más.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {rest.map((f) => (
                  <FileRow
                    key={f.id}
                    file={f}
                    onOpenFolder={openFolder}
                    onPreview={setPreview}
                  />
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="programa" className="mt-4">
          <Panel>
            <h2 className="mb-1 font-display text-lg">Programa oficial</h2>
            <p className="mb-4 text-sm text-muted">
              {program
                ? program.objective
                : "Temario UCAT 2025-2026."}
            </p>
            {program ? (
              <ol className="space-y-1">
                {program.themes.map((t) => (
                  <li
                    key={t.n}
                    className="flex items-start justify-between gap-3 rounded-md px-2 py-2 hover:bg-bg-warm"
                  >
                    <span className="text-sm">
                      <span className="mr-2 font-mono text-xs text-subtle">
                        {String(t.n).padStart(2, "0")}
                      </span>
                      {t.title}
                    </span>
                    <Link
                      to="/tutor"
                      search={{ materia: slug }}
                      className="shrink-0 text-xs text-muted hover:text-fg"
                    >
                      Preguntar
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">Sin temario cargado.</p>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="temas" className="mt-4">
          <Panel>
            <h2 className="mb-1 font-display text-lg">Temario</h2>
            <p className="mb-4 text-sm text-muted">
              Marca lo que ya cubriste este año. El listado sale del archivo de
              2020–2021.
            </p>
            <ul className="space-y-2">
              {subject.topics.map((t) => {
                const key = topicKey(slug, t);
                const checked = Boolean(topicsDone[key]);
                return (
                  <li key={t}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-bg-warm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleTopic(key)}
                      />
                      <span className={checked ? "text-muted line-through" : ""}>
                        {t}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="apuntes" className="mt-4">
          <Panel>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-lg">Tus apuntes</h2>
                <p className="mt-1 text-sm text-muted">
                  Quedan en la nube con el cuaderno, el horario y los exámenes.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/cuaderno">
                  <NotebookPen className="size-4" />
                  Cuaderno
                </Link>
              </Button>
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(slug, e.target.value)}
              placeholder="Dudas, artículos, jurisprudencias, lo que el profesor destacó…"
            />
          </Panel>
        </TabsContent>
      </Tabs>

      <FilePreview file={preview} onClose={() => setPreview(null)} />
    </AppShell>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ConnectorBanner } from "@/components/connector-banner";
import { FilePreview } from "@/components/file-preview";
import { FileRow } from "@/components/file-row";
import { LocalFilePreview } from "@/components/local-file-preview";
import { PageHeader, Panel } from "@/components/page";
import { UploadButton, UploadList } from "@/components/upload-files";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchDrive } from "@/lib/drive.functions";
import {
  allCatalogFiles,
  getSubject,
  type CatalogFile,
  type FileKind,
} from "@/lib/subjects";
import { useStudyStore, type UploadedFile } from "@/lib/store";


export const Route = createFileRoute("/biblioteca")({
  component: BibliotecaPage,
});

const FILTERS: { id: "all" | "exam" | FileKind; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "exam", label: "Exámenes" },
  { id: "document", label: "Documentos" },
  { id: "slides", label: "Presentaciones" },
  { id: "pdf", label: "PDF" },
  { id: "folder", label: "Carpetas" },
];

function BibliotecaPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [preview, setPreview] = useState<CatalogFile | null>(null);
  const [local, setLocal] = useState<UploadedFile | null>(null);
  const starred = useStudyStore((s) => s.starred);
  const catalog = allCatalogFiles();

  const search = useQuery({
    queryKey: ["drive-search", q],
    queryFn: () => searchDrive({ data: { query: q } }),
    enabled: q.trim().length >= 2,
  });

  const liveItems =
    search.data?.status === "ok" && search.data.data ? search.data.data : [];

  const source: Array<CatalogFile & { subjectSlug?: string }> = useMemo(() => {
    if (q.trim().length >= 2 && liveItems.length > 0) return liveItems;
    const needle = q.trim().toLowerCase();
    if (!needle) return catalog;
    return catalog.filter((f) => f.name.toLowerCase().includes(needle));
  }, [q, liveItems, catalog]);

  const filtered = source.filter((f) => {
    if (filter === "all") return true;
    if (filter === "exam") return Boolean(f.exam);
    return f.kind === filter;
  });

  const starredFiles = catalog.filter((f) => starred[f.id]);

  return (
    <AppShell>
      <PageHeader title="Biblioteca" actions={<UploadButton />} />

      <Panel className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Tus archivos</h2>
        <UploadList onOpen={setLocal} />
      </Panel>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre: LOJCA, parcial, contestación…"
          className="pl-10"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {q.trim().length >= 2 ? (
        <ConnectorBanner
          result={search.data}
          refetch={() => search.refetch()}
        />
      ) : null}

      {starredFiles.length > 0 && !q.trim() && filter === "all" ? (
        <Panel className="mb-6">
          <h2 className="mb-3 font-display text-lg">Destacados</h2>
          <div className="divide-y divide-border">
            {starredFiles.map((f) => (
              <FileBlock key={f.id} file={f} onPreview={setPreview} />
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg">
            {q.trim() ? "Resultados" : "Archivo de materias"}
          </h2>
          <span className="text-xs tabular-nums text-muted">
            {filtered.length}
          </span>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted">Nada con ese filtro.</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((f) => (
              <FileBlock key={f.id} file={f} onPreview={setPreview} />
            ))}
          </div>
        )}
      </Panel>

      <FilePreview file={preview} onClose={() => setPreview(null)} />
      <LocalFilePreview file={local} onClose={() => setLocal(null)} />
    </AppShell>
  );
}

function FileBlock({
  file,
  onPreview,
}: {
  file: CatalogFile & { subjectSlug?: string };
  onPreview: (file: CatalogFile) => void;
}) {
  const navigate = useNavigate();
  const sub = file.subjectSlug ? getSubject(file.subjectSlug) : undefined;
  return (
    <div>
      {sub ? (
        <div className="px-2 pt-2">
          <Link
            to="/materias/$slug"
            params={{ slug: sub.slug }}
            search={{}}
            className="text-xs tracking-wide text-muted uppercase hover:text-fg"
          >
            {sub.name}
          </Link>
        </div>
      ) : null}
      <FileRow
        file={file}
        onPreview={onPreview}
        onOpenFolder={(id) => {
          if (sub) {
            void navigate({
              to: "/materias/$slug",
              params: { slug: sub.slug },
              search: { folder: id },
            });
          } else {
            onPreview(file);
          }
        }}
      />
    </div>
  );
}

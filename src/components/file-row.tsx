import {
  Copy,
  ExternalLink,
  FileText,
  Folder,
  Image as ImageIcon,
  Presentation,
  Star,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { CatalogFile, FileKind } from "@/lib/subjects";
import { useStudyStore } from "@/lib/store";
import { cn, formatBytes, formatShortDate } from "@/lib/utils";

const KIND_ICON: Record<FileKind, typeof FileText> = {
  folder: Folder,
  document: FileText,
  slides: Presentation,
  pdf: StickyNote,
  image: ImageIcon,
  text: FileText,
  other: FileText,
};

const KIND_LABEL: Record<FileKind, string> = {
  folder: "Carpeta",
  document: "Documento",
  slides: "Presentación",
  pdf: "PDF",
  image: "Imagen",
  text: "Texto",
  other: "Archivo",
};

export function FileRow({
  file,
  onOpenFolder,
  onPreview,
}: {
  file: CatalogFile;
  onOpenFolder?: (id: string) => void;
  onPreview?: (file: CatalogFile) => void;
}) {
  const reviewed = useStudyStore((s) => Boolean(s.reviewed[file.id]));
  const starred = useStudyStore((s) => Boolean(s.starred[file.id]));
  const toggleReviewed = useStudyStore((s) => s.toggleReviewed);
  const toggleStarred = useStudyStore((s) => s.toggleStarred);
  const Icon = KIND_ICON[file.kind];

  const open = () => {
    if (file.isFolder && onOpenFolder) {
      onOpenFolder(file.id);
      return;
    }
    if (onPreview) {
      onPreview(file);
      return;
    }
    window.location.assign(file.webViewLink);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(file.webViewLink);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No pude copiar el enlace.");
    }
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border border-transparent px-2 py-2.5 transition-colors hover:border-border hover:bg-surface",
        reviewed && "opacity-70",
      )}
    >
      <Checkbox
        checked={reviewed}
        onCheckedChange={() => toggleReviewed(file.id)}
        aria-label={`Marcar ${file.name} como leído`}
        className="mt-1"
      />
      <button
        type="button"
        onClick={open}
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-bg-warm text-primary"
        aria-hidden
      >
        <Icon className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={open}
          className="block w-full truncate text-left text-[0.95rem] font-medium text-fg hover:underline"
        >
          {file.name}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <span>{KIND_LABEL[file.kind]}</span>
          {file.exam ? <Badge variant="exam">Examen</Badge> : null}
          {file.sizeBytes ? <span>{formatBytes(file.sizeBytes)}</span> : null}
          {file.modifiedTime ? (
            <span>{formatShortDate(file.modifiedTime)}</span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          onClick={() => toggleStarred(file.id)}
          aria-label={starred ? "Quitar de destacados" : "Destacar"}
        >
          <Star
            className={cn(
              "size-4",
              starred ? "fill-primary text-primary" : "text-subtle",
            )}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          onClick={() => void copy()}
          aria-label="Copiar enlace"
        >
          <Copy className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-10" asChild>
          <a
            href={file.webViewLink}
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir en Drive"
          >
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

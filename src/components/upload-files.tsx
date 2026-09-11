import { FileUp, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  MAX_UPLOAD_BYTES,
  MAX_UPLOADS,
  deleteUploadBlob,
  saveUploadBlob,
} from "@/lib/uploads-db";
import { deleteCloudFile, safeStorageName, uploadCloudFile } from "@/lib/folio-cloud";
import { kindFromMime } from "@/lib/subjects";
import { useStudyStore, type UploadedFile } from "@/lib/store";
import { cn, formatBytes } from "@/lib/utils";

function allowed(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) return "Máximo 12 MB.";
  const ok =
    file.type.startsWith("image/") ||
    file.type === "application/pdf" ||
    file.type.startsWith("text/") ||
    file.type === "application/msword" ||
    file.type.includes("officedocument") ||
    file.type === "application/vnd.ms-powerpoint" ||
    file.name.match(/\.(pdf|png|jpe?g|webp|gif|txt|md|docx?|pptx?)$/i);
  if (!ok) return "PDF, imagen, texto o Word.";
  return null;
}

export function UploadButton({
  subjectSlug = null,
  label = "Subir",
}: {
  subjectSlug?: string | null;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addUpload = useStudyStore((s) => s.addUpload);
  const updateUpload = useStudyStore((s) => s.updateUpload);
  const count = useStudyStore((s) => s.uploads.length);
  const [busy, setBusy] = useState(false);

  const pick = async (list: FileList | null) => {
    if (!list?.length) return;
    if (count >= MAX_UPLOADS) {
      toast.error("Llegaste al tope de archivos.");
      return;
    }
    setBusy(true);
    try {
      for (const file of Array.from(list)) {
        const err = allowed(file);
        if (err) {
          toast.error(`${file.name}: ${err}`);
          continue;
        }
        const meta = {
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          subjectSlug,
        };
        const id = addUpload(meta);
        try {
          await saveUploadBlob(id, file);
        } catch {
          useStudyStore.getState().removeUpload(id);
          toast.error(`No pude guardar ${file.name}.`);
          continue;
        }
        const remote = await uploadCloudFile(
          `u/${id}/${safeStorageName(file.name)}`,
          file,
          file.type || "application/octet-stream",
        );
        if (remote) {
          updateUpload(id, { storagePath: remote.path, publicUrl: remote.url });
        } else {
          toast.message(`${file.name} quedó en este aparato. Corré el SQL de archivos para verlo en todos lados.`);
        }
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => void pick(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <FileUp className="size-4" />
        {busy ? "…" : label}
      </Button>
    </>
  );
}

export function UploadList({
  onOpen,
  subjectSlug,
}: {
  onOpen: (file: UploadedFile) => void;
  subjectSlug?: string | null;
}) {
  const uploads = useStudyStore((s) => s.uploads);
  const removeUpload = useStudyStore((s) => s.removeUpload);
  const items = subjectSlug
    ? uploads.filter((u) => u.subjectSlug === subjectSlug)
    : uploads;

  if (items.length === 0) {
    return <p className="text-sm text-muted">Nada subido todavía.</p>;
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {items.map((file) => {
        const kind = kindFromMime(file.mimeType);
        return (
          <li key={file.id} className="flex items-center gap-2 px-3 py-2">
            <button
              type="button"
              onClick={() => onOpen(file)}
              className="min-w-0 flex-1 truncate px-1 py-2 text-left text-sm font-medium hover:text-muted"
            >
              {file.name}
              <span className="ml-2 text-xs font-normal text-subtle">
                {kind === "other" ? formatBytes(file.sizeBytes) : kind}
              </span>
            </button>
            <button
              type="button"
              className={cn(
                "flex size-11 shrink-0 items-center justify-center text-muted hover:text-danger",
              )}
              aria-label="Quitar"
              onClick={() => {
                void deleteUploadBlob(file.id);
                if (file.storagePath) void deleteCloudFile(file.storagePath);
                removeUpload(file.id);
              }}
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

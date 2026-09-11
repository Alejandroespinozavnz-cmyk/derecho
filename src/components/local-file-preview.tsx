import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { resolveUploadBlob } from "@/lib/uploads-db";
import type { UploadedFile } from "@/lib/store";

export function LocalFilePreview({
  file,
  onClose,
}: {
  file: UploadedFile | null;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let alive = true;
    if (!file) {
      setUrl(null);
      return;
    }
    if (file.publicUrl) {
      setUrl(file.publicUrl);
    }
    void resolveUploadBlob(file).then((blob) => {
      if (!alive || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const isImage = Boolean(file?.mimeType.startsWith("image/"));
  const isPdf = file?.mimeType === "application/pdf" || file?.name.toLowerCase().endsWith(".pdf");
  const downloadHref = url ?? file?.publicUrl ?? undefined;

  return (
    <Sheet
      open={Boolean(file)}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent size="wide" className="flex h-full flex-col p-0">
        <div className="border-b border-border px-5 py-4 pr-14">
          <SheetTitle className="line-clamp-2 text-left">
            {file?.name ?? "Archivo"}
          </SheetTitle>
          {downloadHref ? (
            <Button asChild size="sm" variant="outline" className="mt-3">
              <a href={downloadHref} download={file?.name} target="_blank" rel="noreferrer">
                <Download className="size-4" />
                Descargar
              </a>
            </Button>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 bg-bg">
          {!url ? (
            <p className="p-6 text-sm text-muted">Cargando…</p>
          ) : isImage ? (
            <img
              src={url}
              alt={file?.name ?? ""}
              className="mx-auto max-h-full max-w-full object-contain p-4"
            />
          ) : isPdf ? (
            <iframe title={file?.name} src={url} className="size-full border-0" />
          ) : (
            <p className="p-6 text-sm text-muted">
              Este tipo no se ve acá. Descargalo.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { readDriveFile } from "@/lib/drive.functions";
import { fileEmbedUrl, isProbablyReadable } from "@/lib/files";
import type { CatalogFile } from "@/lib/subjects";

export function FilePreview({
  file,
  onClose,
}: {
  file: CatalogFile | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"visor" | "texto">("visor");
  const readable = useMemo(() => (file ? isProbablyReadable(file) : false), [file]);
  const embed = file ? fileEmbedUrl(file) : null;

  useEffect(() => {
    setTab("visor");
  }, [file?.id]);

  const query = useQuery({
    queryKey: ["drive-read", file?.id],
    queryFn: () => readDriveFile({ data: { fileId: file!.id } }),
    enabled: Boolean(file && readable),
  });

  const copy = async () => {
    if (!file) return;
    try {
      await navigator.clipboard.writeText(file.webViewLink);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No pude copiar. Seleccioná el enlace a mano.");
    }
  };

  return (
    <Sheet
      open={Boolean(file)}
      onOpenChange={(o) => {
        if (!o) {
          setTab("visor");
          onClose();
        }
      }}
    >
      <SheetContent size="wide" className="flex h-full flex-col p-0">
        <div className="border-b border-border px-5 py-4 pr-14">
          <SheetTitle className="line-clamp-2 text-left">{file?.name ?? "Documento"}</SheetTitle>
          <p className="mt-1 text-xs text-subtle">
            Si el visor sale en blanco, copiá el enlace y abrilo en una pestaña nueva.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={tab === "visor" ? "default" : "outline"}
              onClick={() => setTab("visor")}
            >
              Visor
            </Button>
            <Button
              size="sm"
              variant={tab === "texto" ? "default" : "outline"}
              onClick={() => setTab("texto")}
            >
              Texto
            </Button>
            <Button size="sm" variant="outline" onClick={() => void copy()}>
              <Copy className="size-4" />
              Copiar enlace
            </Button>
            {file ? (
              <Button size="sm" variant="outline" asChild>
                <a href={file.webViewLink} target="_blank" rel="noreferrer">
                  Drive
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-4">
          {tab === "visor" && embed ? (
            <iframe
              title={file?.name ?? "Vista"}
              src={embed}
              className="h-full w-full rounded-md border border-border bg-bg"
              allow="fullscreen"
            />
          ) : null}
          {tab === "texto" ? (
            <div className="h-full overflow-y-auto rounded-md border border-border bg-bg p-4">
              {!readable ? (
                <p className="text-sm text-muted">
                  Este archivo no se lee como texto. Usá el visor o copiá el enlace.
                </p>
              ) : query.isFetching ? (
                <p className="text-sm text-muted">Leyendo archivo…</p>
              ) : query.data?.status === "ok" ? (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {query.data.data?.content}
                </pre>
              ) : (
                <p className="text-sm text-muted">
                  {query.data?.message ??
                    "No se pudo leer acá. Copiá el enlace y abrilo en Drive."}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

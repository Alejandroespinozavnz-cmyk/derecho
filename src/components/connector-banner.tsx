import { redirectToLoginIfRequired } from "@/lib/app-data";
import { useRefetchWhenConnectorReady } from "@/lib/app-data";
import type { DriveResult } from "@/lib/drive.functions";
import { Button } from "@/components/ui/button";

export function ConnectorBanner({
  result,
  refetch,
}: {
  result: DriveResult<unknown> | undefined;
  refetch: () => unknown;
}) {
  const waiting = result?.status === "pending";
  const wait = useRefetchWhenConnectorReady(waiting, refetch);

  if (!result || result.status === "ok") return null;

  if (result.status === "pending" || wait === "waiting") {
    return (
      <div className="rounded-lg border border-border bg-bg-warm px-4 py-3 text-sm text-muted">
        Conectando con tu Drive…
      </div>
    );
  }

  if (result.status === "login") {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Continúa con Grok para ver tus archivos en vivo.
        </p>
        <Button
          size="sm"
          onClick={() =>
            redirectToLoginIfRequired({
              ok: false,
              data: null,
              loginRequired: true,
              loginUrl: result.loginUrl,
            })
          }
        >
          Continuar
        </Button>
      </div>
    );
  }

  if (wait === "not_embedded" || result.status === "error") {
    return (
      <div className="rounded-lg border border-border bg-bg-warm px-4 py-3 text-sm text-muted">
        Usando el archivo de 2020–2021. Los enlaces abren en Google Drive.
        {result.status === "error" && result.message ? (
          <span className="mt-1 block text-xs text-subtle">{result.message}</span>
        ) : null}
      </div>
    );
  }

  return null;
}

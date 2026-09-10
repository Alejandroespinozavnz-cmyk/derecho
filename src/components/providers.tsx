import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { CloudSync } from "@/components/cloud-sync";
import { GateGuard } from "@/components/gate-screen";

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <GateGuard>
        <CloudSync>{children}</CloudSync>
      </GateGuard>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className:
            "!bg-surface !text-fg !border-border !shadow-soft !font-sans",
        }}
      />
    </QueryClientProvider>
  );
}

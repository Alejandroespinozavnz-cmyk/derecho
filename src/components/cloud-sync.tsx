import { useEffect, useRef, type ReactNode } from "react";
import { readSession } from "@/lib/gate";
import { loadStudy, saveStudy } from "@/lib/study.functions";
import { hydrateFromCloud, studySnapshot, useStudyStore } from "@/lib/store";

function payloadHasWork(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as {
    pages?: Array<{ body?: string; title?: string }>;
    exams?: Array<{ date?: string }>;
    notes?: Record<string, string>;
    tasks?: unknown[];
    audioNotes?: unknown[];
    uploads?: unknown[];
    tutorSaves?: unknown[];
  };
  if (Array.isArray(p.pages) && p.pages.some((x) => Boolean(x.body?.trim()) || (x.title && x.title !== "Cuaderno general"))) {
    return true;
  }
  if (Array.isArray(p.exams) && p.exams.some((e) => Boolean(e.date))) return true;
  if (p.notes && Object.values(p.notes).some((n) => n?.trim())) return true;
  if (p.tasks && p.tasks.length > 0) return true;
  if (p.audioNotes && p.audioNotes.length > 0) return true;
  if (p.uploads && p.uploads.length > 0) return true;
  if (p.tutorSaves && p.tutorSaves.length > 0) return true;
  return false;
}

export function CloudSync({ children }: { children: ReactNode }) {
  const ready = useRef(false);
  const timer = useRef<number | null>(null);
  const lastJson = useRef("");
  const owner = useRef(false);

  useEffect(() => {
    const session = readSession();
    if (!session?.token) return;
    owner.current = session.role === "owner";
    let cancelled = false;

    void (async () => {
      try {
        const cloud = await import("@/lib/folio-cloud");
        const remote = await cloud.fetchStudyPayload();
        if (cancelled) return;
        if (payloadHasWork(remote)) {
          hydrateFromCloud(remote as Parameters<typeof hydrateFromCloud>[0]);
          lastJson.current = JSON.stringify(studySnapshot());
          ready.current = true;
          return;
        }
        if (session.token) {
          const result = await loadStudy({ data: { token: session.token } });
          if (cancelled) return;
          if (result.ok && result.hasWork && result.payload) {
            hydrateFromCloud(result.payload as Parameters<typeof hydrateFromCloud>[0]);
            lastJson.current = JSON.stringify(studySnapshot());
            ready.current = true;
            return;
          }
        }
        const local = studySnapshot();
        lastJson.current = JSON.stringify(local);
        if (owner.current) {
          await cloud.pushStudyPayload(local);
        }
      } catch {
        /* local persist already holds the notebook */
      } finally {
        ready.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsub = useStudyStore.subscribe(() => {
      if (!ready.current || !owner.current) return;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const session = readSession();
        if (!session?.token || session.role !== "owner") return;
        const payload = studySnapshot();
        const json = JSON.stringify(payload);
        if (json === lastJson.current) return;
        lastJson.current = json;
        void import("@/lib/folio-cloud")
          .then((cloud) => cloud.pushStudyPayload(payload))
          .then((ok) => {
            if (ok) return;
            void saveStudy({
              data: { token: session.token, payloadJson: json },
            });
          })
          .catch(() => {
            /* keep local */
          });
      }, 800);
    });
    return () => {
      unsub();
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return <>{children}</>;
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUp, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askTutor } from "@/lib/ai.functions";
import { PROGRAM, TUTOR_STARTERS } from "@/lib/program";
import { SUBJECTS, getSubject } from "@/lib/subjects";
import { cn } from "@/lib/utils";

type ChatMsg = { role: "user" | "assistant"; content: string };

const DAILY_CAP = 250;
const CAP_KEY = "folio4-tutor-cap";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readCap(): number {
  try {
    const raw = localStorage.getItem(CAP_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { day?: string; n?: number };
    if (parsed.day !== todayKey()) return 0;
    return typeof parsed.n === "number" ? parsed.n : 0;
  } catch {
    return 0;
  }
}

function bumpCap() {
  const n = readCap() + 1;
  localStorage.setItem(CAP_KEY, JSON.stringify({ day: todayKey(), n }));
  return n;
}

export const Route = createFileRoute("/tutor")({
  validateSearch: (s: Record<string, unknown>): { materia?: string } => {
    if (typeof s.materia === "string" && s.materia.length > 0) {
      return { materia: s.materia };
    }
    return {};
  },
  component: TutorPage,
});

function TutorPage() {
  const { materia } = Route.useSearch();
  const navigate = Route.useNavigate();
  const slug = materia && PROGRAM[materia] ? materia : SUBJECTS[0].slug;
  const subject = getSubject(slug);
  const program = PROGRAM[slug];
  const starters = TUTOR_STARTERS[slug] ?? [];

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [used, setUsed] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setUsed(readCap());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const pickSubject = (next: string) => {
    if (next === slug) return;
    setMessages([]);
    setError(null);
    void navigate({ to: "/tutor", search: { materia: next } });
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    if (used >= DAILY_CAP) {
      setError("Hoy ya pediste demasiado al tutor. Mañana se reinicia.");
      return;
    }
    if (content.length > 2000) {
      setError("Acortá la pregunta (máximo 2000 caracteres).");
      return;
    }

    const next: ChatMsg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    setError(null);

    const result = await askTutor({
      data: {
        subjectSlug: slug,
        messages: next.slice(-8),
      },
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUsed(bumpCap());
    setMessages([...next, { role: "assistant", content: result.text }]);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(draft);
  };

  const remaining = Math.max(0, DAILY_CAP - used);
  const nearCap = remaining <= 20;

  return (
    <AppShell>
      <PageHeader title="Tutor" />

      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        {SUBJECTS.map((s) => {
          const active = s.slug === slug;
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => pickSubject(s.slug)}
              className={cn(
                "h-10 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-fg"
                  : "border-border bg-surface text-muted hover:bg-bg-warm hover:text-fg",
              )}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      {program && subject ? (
        <Panel className="mb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs tracking-widest text-subtle">
                {program.code}
              </p>
              <h2 className="mt-1 text-xl font-semibold">{subject.name}</h2>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{program.weeklyHours} h/sem</Badge>
              <Badge variant="paper">{program.credits} UC</Badge>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="mt-3 -ml-2">
            <Link to="/materias/$slug" params={{ slug }} search={{}}>
              Materia
            </Link>
          </Button>
        </Panel>
      ) : null}

      <div className="space-y-4">
        {messages.length === 0 && !busy ? (
          <div className="grid gap-2">
            {starters.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void send(prompt)}
                className="rounded-lg border border-border bg-surface px-4 py-3 text-left text-sm leading-relaxed text-fg shadow-soft transition-colors hover:bg-bg-warm"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={cn(
                "max-w-[42rem]",
                m.role === "user" ? "ml-auto" : "mr-auto",
              )}
            >
              {m.role === "user" ? (
                <div className="rounded-lg rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-fg">
                  {m.content}
                </div>
              ) : (
                <div className="rounded-xl rounded-tl-sm border border-border bg-surface px-5 py-4 shadow-soft">
            <p className="mb-2 text-xs font-medium text-muted">Tutor</p>
                  <TutorMarkdown text={m.content} />
                </div>
              )}
            </div>
          ))
        )}

        {busy ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" />
            El tutor está redactando…
          </div>
        ) : null}

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {nearCap && remaining > 0 ? (
          <p className="text-xs text-subtle">Quedan {remaining} consultas hoy.</p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className="sticky bottom-20 z-10 mt-6 rounded-xl border border-border bg-surface p-3 shadow-soft md:bottom-6"
      >
        <Textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(draft);
            }
          }}
          placeholder={`Preguntá sobre ${subject?.name ?? "Derecho"}…`}
          className="min-h-20 border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
          disabled={busy || remaining === 0}
        />
        <div className="mt-1 flex items-center justify-between gap-2 px-1">
          <p className="text-xs text-subtle">Enter envía · Shift+Enter salto</p>
          <Button
            type="submit"
            size="sm"
            disabled={busy || remaining === 0 || !draft.trim()}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
            Preguntar
          </Button>
        </div>
      </form>
    </AppShell>
  );
}

function TutorMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-3 text-base leading-relaxed text-fg">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every(
          (l) =>
            /^\s*([-*]|\d+[.)])\s+/.test(l) || l.trim() === "" || l.startsWith("  "),
        );
        if (isList && lines.filter((l) => l.trim()).length > 1) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines
                .filter((l) => l.trim())
                .map((l, j) => (
                  <li key={j}>
                    <Inline text={l.replace(/^\s*([-*]|\d+[.)])\s+/, "")} />
                  </li>
                ))}
            </ul>
          );
        }
        const heading = /^(#{1,3})\s+(.*)$/.exec(block.trim());
        if (heading) {
          return (
            <p key={i} className="font-display text-lg text-fg">
              <Inline text={heading[2]} />
            </p>
          );
        }
        return (
          <p key={i}>
            <Inline text={block} />
          </p>
        );
      })}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <em key={i} className="italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

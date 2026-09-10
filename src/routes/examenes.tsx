import { createFileRoute, Link } from "@tanstack/react-router";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SUBJECTS, getSubject } from "@/lib/subjects";
import { useStudyStore, type Exam, type ExamType } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/examenes")({ component: ExamsPage });

const TYPES: { id: ExamType; label: string }[] = [
  { id: "parcial-1", label: "I Parcial" },
  { id: "parcial-2", label: "II Parcial" },
  { id: "final", label: "Final" },
  { id: "otro", label: "Otro" },
];

function ExamsPage() {
  const exams = useStudyStore((s) => s.exams);
  const updateExam = useStudyStore((s) => s.updateExam);
  const removeExam = useStudyStore((s) => s.removeExam);
  const [open, setOpen] = useState(false);

  const dated = exams
    .filter((e) => e.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const undated = exams.filter((e) => !e.date);

  return (
    <AppShell>
      <PageHeader
        kicker="Calendario"
        title="Exámenes"
        description="Agenda los parciales de este año. Los documentos de 2020–2021 quedan como modelo de estudio."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Nuevo examen
          </Button>
        }
      />

      <ExamForm open={open} onOpenChange={setOpen} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-4 font-display text-lg">Con fecha</h2>
          {dated.length === 0 ? (
            <p className="text-sm text-muted">
              Ponle una fecha a un parcial para verlo acá y en el inicio.
            </p>
          ) : (
            <ul className="space-y-3">
              {dated.map((e) => (
                <ExamCard
                  key={e.id}
                  exam={e}
                  onUpdate={updateExam}
                  onRemove={removeExam}
                />
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <h2 className="mb-4 font-display text-lg">Por agendar</h2>
          {undated.length === 0 ? (
            <p className="text-sm text-muted">Todo tiene fecha. Bien.</p>
          ) : (
            <ul className="space-y-3">
              {undated.map((e) => (
                <ExamCard
                  key={e.id}
                  exam={e}
                  onUpdate={updateExam}
                  onRemove={removeExam}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

function ExamCard({
  exam,
  onUpdate,
  onRemove,
}: {
  exam: Exam;
  onUpdate: (id: string, patch: Partial<Exam>) => void;
  onRemove: (id: string) => void;
}) {
  const sub = getSubject(exam.subjectSlug);
  const days =
    exam.date && !Number.isNaN(parseISO(exam.date).getTime())
      ? differenceInCalendarDays(parseISO(exam.date), new Date())
      : null;
  const typeLabel = TYPES.find((t) => t.id === exam.type)?.label ?? exam.type;

  return (
    <li
      className={cn(
        "rounded-lg border border-border p-4",
        exam.done && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn("font-medium", exam.done && "line-through")}>
            {exam.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            {sub ? (
              <Link
                to="/materias/$slug"
                params={{ slug: sub.slug }}
                search={{}}
                className="hover:text-fg hover:underline"
              >
                {sub.name}
              </Link>
            ) : null}
            <Badge variant="paper">{typeLabel}</Badge>
            {days !== null ? (
              <Badge variant={days <= 7 && days >= 0 ? "exam" : "outline"}>
                {days === 0
                  ? "Hoy"
                  : days === 1
                    ? "Mañana"
                    : days < 0
                      ? format(parseISO(exam.date), "d MMM", { locale: es })
                      : `${days} días`}
              </Badge>
            ) : null}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 text-subtle"
          onClick={() => onRemove(exam.id)}
          aria-label="Eliminar"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Input
          type="date"
          value={exam.date}
          onChange={(e) => onUpdate(exam.id, { date: e.target.value })}
          aria-label="Fecha"
        />
        <label className="flex h-11 items-center gap-2 rounded-md border border-border px-3 text-sm">
          <input
            type="checkbox"
            checked={exam.done}
            onChange={(e) => onUpdate(exam.id, { done: e.target.checked })}
            className="size-4 accent-primary"
          />
          Hecho
        </label>
      </div>
      {exam.notes ? (
        <p className="mt-2 text-sm text-muted">{exam.notes}</p>
      ) : null}
    </li>
  );
}

function ExamForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const addExam = useStudyStore((s) => s.addExam);
  const [title, setTitle] = useState("");
  const [subjectSlug, setSubjectSlug] = useState(SUBJECTS[0].slug);
  const [type, setType] = useState<ExamType>("parcial-1");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Ponle un nombre al examen.");
      return;
    }
    addExam({
      title: title.trim(),
      subjectSlug,
      type,
      date,
      notes: notes.trim(),
    });
    toast.success("Examen agregado");
    setTitle("");
    setNotes("");
    setDate("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo examen</DialogTitle>
          <DialogDescription>
            Fecha, materia y tipo. Después podés marcar cuando lo rindas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ex-title">Nombre</Label>
            <Input
              id="ex-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="I Parcial — Civil IV"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ex-sub">Materia</Label>
            <select
              id="ex-sub"
              value={subjectSlug}
              onChange={(e) => setSubjectSlug(e.target.value)}
              className="h-11 rounded-md border border-border bg-surface px-3 text-base"
            >
              {SUBJECTS.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ex-type">Tipo</Label>
              <select
                id="ex-type"
                value={type}
                onChange={(e) => setType(e.target.value as ExamType)}
                className="h-11 rounded-md border border-border bg-surface px-3 text-base"
              >
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ex-date">Fecha</Label>
              <Input
                id="ex-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ex-notes">Notas</Label>
            <Textarea
              id="ex-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Temas, aula, material a revisar…"
              className="min-h-20"
            />
          </div>
          <Button type="submit" className="mt-1">
            Guardar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

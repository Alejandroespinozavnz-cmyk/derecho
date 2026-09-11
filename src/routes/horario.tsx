import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { countFilled, DAYS, slotLabel, todayDayName, type DayName } from "@/lib/schedule";
import { SUBJECTS, getSubject } from "@/lib/subjects";
import { useStudyStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/horario")({ component: HorarioPage });

function HorarioPage() {
  const schedule = useStudyStore((s) => s.schedule);
  const slots = useStudyStore((s) => s.slots);
  const setCell = useStudyStore((s) => s.setScheduleCell);
  const setSlotTime = useStudyStore((s) => s.setSlotTime);
  const addSlot = useStudyStore((s) => s.addSlot);
  const removeSlot = useStudyStore((s) => s.removeSlot);
  const clearSchedule = useStudyStore((s) => s.clearSchedule);
  const today = todayDayName();
  const filled = countFilled(schedule);

  return (
    <AppShell>
      <PageHeader
        title="Horario"
        actions={
          <>
            <Button variant="outline" onClick={addSlot}>
              <Plus className="size-4" />
              Bloque
            </Button>
            <Button variant="ghost" onClick={clearSchedule} disabled={filled === 0}>
              Vaciar materias
            </Button>
          </>
        }
      />

      {filled === 0 ? (
        <p className="mb-4 rounded-lg border border-border bg-primary/10 px-4 py-3 text-sm text-fg">
          Empezá por las horas de la izquierda (son editables) y después asigná
          cada materia. Se guarda en la nube, igual en el teléfono y la computadora.
        </p>
      ) : null}

      <Panel className="overflow-x-auto p-3 md:p-4">
        <table className="w-full min-w-[44rem] border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="w-40 px-2 py-2 text-left text-xs font-medium text-muted">
                Hora
              </th>
              {DAYS.map((d) => (
                <th
                  key={d}
                  className={cn(
                    "px-2 py-2 text-left text-xs font-medium",
                    d === today ? "text-primary" : "text-muted",
                  )}
                >
                  {d}
                </th>
              ))}
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id}>
                <td className="px-1 py-1 align-top">
                  <div className="flex flex-col gap-1">
                    <input
                      type="time"
                      aria-label={`Inicio ${slot.id}`}
                      value={slot.start}
                      onChange={(e) =>
                        setSlotTime(slot.id, { start: e.target.value })
                      }
                      className="h-9 w-full rounded-md border border-border bg-bg px-2 text-xs tabular-nums text-fg"
                    />
                    <input
                      type="time"
                      aria-label={`Fin ${slot.id}`}
                      value={slot.end}
                      onChange={(e) =>
                        setSlotTime(slot.id, { end: e.target.value })
                      }
                      className="h-9 w-full rounded-md border border-border bg-bg px-2 text-xs tabular-nums text-fg"
                    />
                  </div>
                </td>
                {DAYS.map((day) => {
                  const slug = schedule[day]?.[slot.id] ?? null;
                  const sub = slug ? getSubject(slug) : undefined;
                  return (
                    <td key={day} className="align-top">
                      <select
                        aria-label={`${day} ${slotLabel(slot)}`}
                        value={slug ?? ""}
                        onChange={(e) =>
                          setCell(day as DayName, slot.id, e.target.value || null)
                        }
                        className={cn(
                          "h-20 w-full rounded-md border px-2 text-xs font-medium",
                          sub
                            ? "border-primary/40 bg-primary/10 text-fg"
                            : "border-border bg-bg text-subtle",
                          day === today && sub && "ring-1 ring-primary/40",
                        )}
                      >
                        <option value="">Libre</option>
                        {SUBJECTS.map((s) => (
                          <option key={s.slug} value={s.slug}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
                <td className="align-top">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 text-subtle"
                    onClick={() => removeSlot(slot.id)}
                    disabled={slots.length <= 1}
                    aria-label="Quitar bloque"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {today ? (
        <Panel className="mt-6">
          <h2 className="mb-3 font-display text-lg">Hoy · {today}</h2>
          {slots.every((slot) => !schedule[today]?.[slot.id]) ? (
            <p className="text-sm text-muted">
              Nada cargado para hoy. Elegí materias en la grilla.
            </p>
          ) : (
            <ul className="space-y-2">
              {slots.map((slot) => {
                const slug = schedule[today]?.[slot.id];
                const sub = slug ? getSubject(slug) : undefined;
                if (!sub) return null;
                return (
                  <li
                    key={slot.id}
                    className="flex items-center justify-between gap-3 rounded-md bg-bg-warm px-3 py-2 text-sm"
                  >
                    <span className="tabular-nums text-muted">
                      {slotLabel(slot)}
                    </span>
                    <Link
                      to="/materias/$slug"
                      params={{ slug: sub.slug }}
                      search={{}}
                      className="font-medium hover:underline"
                    >
                      {sub.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      ) : null}
    </AppShell>
  );
}

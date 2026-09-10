export const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
] as const;

export type DayName = (typeof DAYS)[number];

export type TimeSlot = {
  id: string;
  start: string;
  end: string;
};

/** Horas de partida — editables. El grid nace vacío. */
export const DEFAULT_SLOTS: TimeSlot[] = [
  { id: "s1", start: "08:00", end: "08:45" },
  { id: "s2", start: "08:50", end: "09:35" },
  { id: "s3", start: "09:40", end: "10:25" },
  { id: "s4", start: "10:30", end: "11:15" },
  { id: "s5", start: "14:00", end: "14:45" },
  { id: "s6", start: "14:50", end: "15:35" },
  { id: "s7", start: "15:40", end: "16:25" },
];

export type ScheduleGrid = Record<DayName, Record<string, string | null>>;

export function slotLabel(slot: TimeSlot) {
  return `${slot.start} – ${slot.end}`;
}

export function emptyGrid(slots: TimeSlot[]): ScheduleGrid {
  const row = () =>
    Object.fromEntries(slots.map((s) => [s.id, null])) as Record<
      string,
      string | null
    >;
  return {
    Lunes: row(),
    Martes: row(),
    Miércoles: row(),
    Jueves: row(),
    Viernes: row(),
  };
}

export const DEFAULT_SCHEDULE = emptyGrid(DEFAULT_SLOTS);

function parseHm(value: string): number {
  const [h, m] = value.split(":").map((n) => Number(n));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 8 * 60;
  return h * 60 + m;
}

function formatHm(total: number): string {
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function nextSlotTimes(prevEnd: string): { start: string; end: string } {
  const startMin = parseHm(prevEnd) + 5;
  return {
    start: formatHm(startMin),
    end: formatHm(startMin + 45),
  };
}

export function todayDayName(date = new Date()): DayName | null {
  const map: Record<number, DayName> = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
  };
  return map[date.getDay()] ?? null;
}

export function countFilled(schedule: ScheduleGrid): number {
  return DAYS.reduce((sum, day) => {
    return sum + Object.values(schedule[day] ?? {}).filter(Boolean).length;
  }, 0);
}

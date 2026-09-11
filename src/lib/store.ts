import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "./utils";
import {
  DAYS,
  DEFAULT_SLOTS,
  emptyGrid,
  nextSlotTimes,
  type ScheduleGrid,
  type DayName,
  type TimeSlot,
} from "./schedule";

export type ExamType = "parcial-1" | "parcial-2" | "final" | "otro";

export type Exam = {
  id: string;
  subjectSlug: string;
  title: string;
  type: ExamType;
  date: string;
  notes: string;
  done: boolean;
};

export type StudySession = {
  id: string;
  subjectSlug: string;
  minutes: number;
  at: string;
};

export type NotebookPage = {
  id: string;
  title: string;
  subjectSlug: string | null;
  body: string;
  updatedAt: string;
};

export type AudioNote = {
  id: string;
  subjectSlug: string | null;
  pageId: string | null;
  transcript: string;
  durationSec: number;
  at: string;
  hasBlob?: boolean;
  storagePath?: string;
  publicUrl?: string;
};

export type TutorSave = {
  id: string;
  subjectSlug: string;
  question: string;
  answer: string;
  at: string;
};

export type Task = {
  id: string;
  title: string;
  done: boolean;
};

export type PomoMode = "idle" | "focus" | "break" | "paused";

export type PomoState = {
  mode: PomoMode;
  endsAt: number | null;
  leftMs: number;
  focusMs: number;
  breakMs: number;
  round: number;
};

export type UploadedFile = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  subjectSlug: string | null;
  at: string;
  storagePath?: string;
  publicUrl?: string;
};

type StudyState = {
  version: number;
  reviewed: Record<string, true>;
  starred: Record<string, true>;
  topics: Record<string, true>;
  notes: Record<string, string>;
  exams: Exam[];
  sessions: StudySession[];
  schedule: ScheduleGrid;
  slots: TimeSlot[];
  quizBest: Record<string, number>;
  pages: NotebookPage[];
  audioNotes: AudioNote[];
  tutorSaves: TutorSave[];
  tasks: Task[];
  uploads: UploadedFile[];
  pomo: PomoState;
  toggleReviewed: (fileId: string) => void;
  toggleStarred: (fileId: string) => void;
  toggleTopic: (key: string) => void;
  setNote: (slug: string, body: string) => void;
  addExam: (exam: Omit<Exam, "id" | "done">) => void;
  updateExam: (id: string, patch: Partial<Exam>) => void;
  removeExam: (id: string) => void;
  addSession: (subjectSlug: string, minutes: number) => void;
  setScheduleCell: (day: DayName, slot: string, slug: string | null) => void;
  setSlotTime: (id: string, patch: Partial<Pick<TimeSlot, "start" | "end">>) => void;
  addSlot: () => void;
  removeSlot: (id: string) => void;
  clearSchedule: () => void;
  setQuizBest: (setId: string, score: number) => void;
  addPage: (title?: string, subjectSlug?: string | null) => string;
  updatePage: (id: string, patch: Partial<Pick<NotebookPage, "title" | "body" | "subjectSlug">>) => void;
  removePage: (id: string) => void;
  addAudioNote: (note: Omit<AudioNote, "id" | "at">) => string;
  updateAudioNote: (id: string, patch: Partial<AudioNote>) => void;
  removeAudioNote: (id: string) => void;
  addTutorSave: (note: Omit<TutorSave, "id" | "at">) => string;
  removeTutorSave: (id: string) => void;
  addTask: (title: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  addUpload: (file: Omit<UploadedFile, "id" | "at">) => string;
  updateUpload: (id: string, patch: Partial<UploadedFile>) => void;
  removeUpload: (id: string) => void;
  setPomo: (patch: Partial<PomoState>) => void;
};

const SEED_EXAMS: Exam[] = [
  {
    id: "seed-civ-p1",
    subjectSlug: "civil-iv",
    title: "I Parcial — Civil IV",
    type: "parcial-1",
    date: "",
    notes: "Revisar clases I Parcial y depósito.",
    done: false,
  },
  {
    id: "seed-adm-p1",
    subjectSlug: "administrativo",
    title: "I Parcial — Administrativo III",
    type: "parcial-1",
    date: "",
    notes: "Batería de preguntas y LOJCA.",
    done: false,
  },
  {
    id: "seed-lab-p1",
    subjectSlug: "laboral",
    title: "I Parcial — Laboral",
    type: "parcial-1",
    date: "",
    notes: "",
    done: false,
  },
  {
    id: "seed-mer-p1",
    subjectSlug: "mercantil",
    title: "I Parcial — Mercantil I",
    type: "parcial-1",
    date: "",
    notes: "",
    done: false,
  },
  {
    id: "seed-prc-p1",
    subjectSlug: "procesal",
    title: "I Parcial — Procesal Civil II",
    type: "parcial-1",
    date: "",
    notes: "Contestación y cuestiones previas.",
    done: false,
  },
  {
    id: "seed-prb-p1",
    subjectSlug: "pruebas",
    title: "I Parcial — Pruebas",
    type: "parcial-1",
    date: "",
    notes: "",
    done: false,
  },
];

const CURRENT_VERSION = 8;

const DEFAULT_POMO: PomoState = {
  mode: "idle",
  endsAt: null,
  leftMs: 25 * 60 * 1000,
  focusMs: 25 * 60 * 1000,
  breakMs: 5 * 60 * 1000,
  round: 0,
};

function newPage(title = "Sin título", subjectSlug: string | null = null): NotebookPage {
  return {
    id: uid("pg"),
    title,
    subjectSlug,
    body: "",
    updatedAt: new Date().toISOString(),
  };
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set) => ({
      version: CURRENT_VERSION,
      reviewed: {},
      starred: {},
      topics: {},
      notes: {},
      exams: SEED_EXAMS,
      sessions: [],
      schedule: emptyGrid(DEFAULT_SLOTS),
      slots: DEFAULT_SLOTS,
      quizBest: {},
      pages: [newPage("Cuaderno general")],
      audioNotes: [],
      tutorSaves: [],
      tasks: [],
      uploads: [],
      pomo: DEFAULT_POMO,
      toggleReviewed: (fileId) =>
        set((s) => {
          const next = { ...s.reviewed };
          if (next[fileId]) delete next[fileId];
          else next[fileId] = true;
          return { reviewed: next };
        }),
      toggleStarred: (fileId) =>
        set((s) => {
          const next = { ...s.starred };
          if (next[fileId]) delete next[fileId];
          else next[fileId] = true;
          return { starred: next };
        }),
      toggleTopic: (key) =>
        set((s) => {
          const next = { ...s.topics };
          if (next[key]) delete next[key];
          else next[key] = true;
          return { topics: next };
        }),
      setNote: (slug, body) =>
        set((s) => ({ notes: { ...s.notes, [slug]: body } })),
      addExam: (exam) =>
        set((s) => ({
          exams: [{ ...exam, id: uid("ex"), done: false }, ...s.exams],
        })),
      updateExam: (id, patch) =>
        set((s) => ({
          exams: s.exams.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      removeExam: (id) =>
        set((s) => ({ exams: s.exams.filter((e) => e.id !== id) })),
      addSession: (subjectSlug, minutes) =>
        set((s) => ({
          sessions: [
            {
              id: uid("ses"),
              subjectSlug,
              minutes,
              at: new Date().toISOString(),
            },
            ...s.sessions,
          ].slice(0, 80),
        })),
      setScheduleCell: (day, slot, slug) =>
        set((s) => ({
          schedule: {
            ...s.schedule,
            [day]: { ...s.schedule[day], [slot]: slug },
          },
        })),
      setSlotTime: (id, patch) =>
        set((s) => ({
          slots: s.slots.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl)),
        })),
      addSlot: () =>
        set((s) => {
          const last = s.slots[s.slots.length - 1];
          const times = nextSlotTimes(last?.end ?? "08:00");
          const id = uid("slot");
          const slots = [...s.slots, { id, ...times }];
          const schedule = { ...s.schedule };
          for (const day of DAYS) {
            schedule[day] = { ...schedule[day], [id]: null };
          }
          return { slots, schedule };
        }),
      removeSlot: (id) =>
        set((s) => {
          if (s.slots.length <= 1) return s;
          const slots = s.slots.filter((sl) => sl.id !== id);
          const schedule = { ...s.schedule };
          for (const day of DAYS) {
            const row = { ...schedule[day] };
            delete row[id];
            schedule[day] = row;
          }
          return { slots, schedule };
        }),
      clearSchedule: () =>
        set((s) => ({ schedule: emptyGrid(s.slots) })),
      setQuizBest: (setId, score) =>
        set((s) => ({
          quizBest: {
            ...s.quizBest,
            [setId]: Math.max(s.quizBest[setId] ?? 0, score),
          },
        })),
      addPage: (title, subjectSlug) => {
        const page = newPage(title, subjectSlug ?? null);
        set((s) => ({ pages: [page, ...s.pages] }));
        return page.id;
      },
      updatePage: (id, patch) =>
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === id
              ? { ...p, ...patch, updatedAt: new Date().toISOString() }
              : p,
          ),
        })),
      removePage: (id) =>
        set((s) => ({
          pages: s.pages.length <= 1 ? s.pages : s.pages.filter((p) => p.id !== id),
        })),
      addAudioNote: (note) => {
        const id = uid("aud");
        set((s) => ({
          audioNotes: [
            { ...note, id, at: new Date().toISOString() },
            ...s.audioNotes,
          ].slice(0, 60),
        }));
        return id;
      },
      updateAudioNote: (id, patch) =>
        set((s) => ({
          audioNotes: s.audioNotes.map((n) =>
            n.id === id ? { ...n, ...patch } : n,
          ),
        })),
      removeAudioNote: (id) =>
        set((s) => ({
          audioNotes: s.audioNotes.filter((n) => n.id !== id),
        })),
      addTutorSave: (note) => {
        const id = uid("tut");
        set((s) => ({
          tutorSaves: [
            { ...note, id, at: new Date().toISOString() },
            ...s.tutorSaves,
          ].slice(0, 80),
        }));
        return id;
      },
      removeTutorSave: (id) =>
        set((s) => ({
          tutorSaves: s.tutorSaves.filter((n) => n.id !== id),
        })),
      addTask: (title) =>
        set((s) => ({
          tasks: [{ id: uid("tk"), title, done: false }, ...s.tasks].slice(0, 40),
        })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),
      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      addUpload: (file) => {
        const id = uid("up");
        set((s) => ({
          uploads: [
            { ...file, id, at: new Date().toISOString() },
            ...s.uploads,
          ].slice(0, 40),
        }));
        return id;
      },
      updateUpload: (id, patch) =>
        set((s) => ({
          uploads: s.uploads.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        })),
      removeUpload: (id) =>
        set((s) => ({ uploads: s.uploads.filter((u) => u.id !== id) })),
      setPomo: (patch) =>
        set((s) => ({ pomo: { ...s.pomo, ...patch } })),
    }),
    {
      name: "folio-4-study",
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<StudyState> & { version?: number };
        const migrated = (p.version ?? 0) >= 4;
        const slots =
          migrated && Array.isArray(p.slots) && p.slots.length > 0
            ? p.slots
            : DEFAULT_SLOTS;
        return {
          ...current,
          ...p,
          version: CURRENT_VERSION,
          slots,
          schedule:
            migrated && p.schedule?.Lunes ? p.schedule : emptyGrid(slots),
          exams: Array.isArray(p.exams) ? p.exams : current.exams,
          reviewed: p.reviewed ?? current.reviewed,
          starred: p.starred ?? current.starred,
          topics: p.topics ?? current.topics,
          notes: p.notes ?? current.notes,
          sessions: p.sessions ?? current.sessions,
          quizBest: p.quizBest ?? current.quizBest,
          pages:
            Array.isArray(p.pages) && p.pages.length > 0
              ? p.pages
              : current.pages,
          audioNotes: Array.isArray(p.audioNotes) ? p.audioNotes : current.audioNotes,
          tutorSaves: Array.isArray(p.tutorSaves) ? p.tutorSaves : current.tutorSaves,
          tasks: Array.isArray(p.tasks) ? p.tasks : current.tasks,
          uploads: Array.isArray(p.uploads) ? p.uploads : current.uploads,
          pomo: p.pomo ? { ...DEFAULT_POMO, ...p.pomo, mode: "idle", endsAt: null } : DEFAULT_POMO,
        };
      },
    },
  ),
);

export function topicKey(slug: string, topic: string) {
  return `${slug}::${topic}`;
}

export function exportStudyBackup() {
  try {
    return localStorage.getItem("folio-4-study") ?? "{}";
  } catch {
    return "{}";
  }
}

export type CloudStudy = {
  version: number;
  reviewed: Record<string, true>;
  starred: Record<string, true>;
  topics: Record<string, true>;
  notes: Record<string, string>;
  exams: Exam[];
  sessions: StudySession[];
  schedule: ScheduleGrid;
  slots: TimeSlot[];
  quizBest: Record<string, number>;
  pages: NotebookPage[];
  audioNotes: AudioNote[];
  tutorSaves: TutorSave[];
  tasks: Task[];
  uploads: UploadedFile[];
};

export function studySnapshot(): CloudStudy {
  const s = useStudyStore.getState();
  return {
    version: s.version,
    reviewed: s.reviewed,
    starred: s.starred,
    topics: s.topics,
    notes: s.notes,
    exams: s.exams,
    sessions: s.sessions,
    schedule: s.schedule,
    slots: s.slots,
    quizBest: s.quizBest,
    pages: s.pages,
    audioNotes: s.audioNotes,
    tutorSaves: s.tutorSaves,
    tasks: s.tasks,
    uploads: s.uploads,
  };
}

export function hydrateFromCloud(payload: Partial<CloudStudy>) {
  const current = useStudyStore.getState();
  const slots =
    Array.isArray(payload.slots) && payload.slots.length > 0
      ? payload.slots
      : current.slots;
  useStudyStore.setState({
    version: CURRENT_VERSION,
    reviewed: payload.reviewed ?? current.reviewed,
    starred: payload.starred ?? current.starred,
    topics: payload.topics ?? current.topics,
    notes: payload.notes ?? current.notes,
    exams: Array.isArray(payload.exams) ? payload.exams : current.exams,
    sessions: Array.isArray(payload.sessions) ? payload.sessions : current.sessions,
    slots,
    schedule:
      payload.schedule && (payload.schedule as ScheduleGrid).Lunes
        ? (payload.schedule as ScheduleGrid)
        : current.schedule,
    quizBest: payload.quizBest ?? current.quizBest,
    pages:
      Array.isArray(payload.pages) && payload.pages.length > 0
        ? payload.pages
        : current.pages,
    audioNotes: Array.isArray(payload.audioNotes)
      ? payload.audioNotes
      : current.audioNotes,
    tutorSaves: Array.isArray(payload.tutorSaves)
      ? payload.tutorSaves
      : current.tutorSaves,
    tasks: Array.isArray(payload.tasks) ? payload.tasks : current.tasks,
    uploads: Array.isArray(payload.uploads) ? payload.uploads : current.uploads,
  });
}


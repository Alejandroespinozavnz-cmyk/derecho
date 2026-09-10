import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic, Pause, Play, Square, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { transcribeAudio } from "@/lib/ai.functions";
import { SUBJECTS } from "@/lib/subjects";
import { useStudyStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/enfoque")({ component: EnfoquePage });

const METHODS = [
  {
    id: "pomodoro",
    title: "Pomodoro",
    body: "25 minutos de estudio denso, 5 de pausa. Cada 4 ciclos, 15–20 de descanso. Sirve para leer jurisprudencia o armar un escrito sin abrumarte.",
  },
  {
    id: "feynman",
    title: "Feynman",
    body: "Explicá el tema como si se lo contaras a un compañero de primer año. Donde trabés, ahí está el hueco. Anotalo en el cuaderno y volvé a la fuente.",
  },
  {
    id: "recall",
    title: "Recuerdo activo",
    body: "Cerrá el apunte. Escribí de memoria: definición, requisitos, efectos y un caso. Después contrastá. Reléer no es estudiar.",
  },
  {
    id: "sq3r",
    title: "SQ3R",
    body: "Survey, Question, Read, Recite, Review. Ojeá el tema, armá preguntas (¿cuál es el lapso?), leé, recitá sin mirar, repasá al día siguiente.",
  },
  {
    id: "cornell",
    title: "Cornell",
    body: "Hoja en tres: notas de clase a la derecha, palabras clave / artículos a la izquierda, resumen abajo. Ideal para Civil y Procesal.",
  },
  {
    id: "spaced",
    title: "Repaso espaciado",
    body: "Repasá a las 24 h, a los 3 días y a la semana. El juego de V/F y las preguntas del tutor sirven como tarjetas.",
  },
];

function formatMmSs(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function EnfoquePage() {
  return (
    <AppShell>
      <PageHeader
        kicker="Método"
        title="Enfoque"
        description="Pomodoro, cómo estudiar Derecho, y grabá la clase para transcribirla."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <PomodoroCard />
        <AudioCard />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {METHODS.map((m) => (
          <Panel key={m.id}>
            <h2 className="font-display text-lg">{m.title}</h2>
            <p className="mt-2 text-sm text-muted">{m.body}</p>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}

function PomodoroCard() {
  const pomo = useStudyStore((s) => s.pomo);
  const setPomo = useStudyStore((s) => s.setPomo);
  const addSession = useStudyStore((s) => s.addSession);
  const tasks = useStudyStore((s) => s.tasks);
  const addTask = useStudyStore((s) => s.addTask);
  const toggleTask = useStudyStore((s) => s.toggleTask);
  const removeTask = useStudyStore((s) => s.removeTask);
  const [taskTitle, setTaskTitle] = useState("");
  const [, tick] = useState(0);
  const handledEnd = useRef<number | null>(null);

  useEffect(() => {
    if (pomo.mode !== "focus" && pomo.mode !== "break") return;
    const id = window.setInterval(() => tick((n) => n + 1), 400);
    return () => window.clearInterval(id);
  }, [pomo.mode]);

  useEffect(() => {
    if ((pomo.mode !== "focus" && pomo.mode !== "break") || !pomo.endsAt) return;
    const remain = Math.max(0, pomo.endsAt - Date.now());
    const id = window.setTimeout(() => {
      if (handledEnd.current === pomo.endsAt) return;
      handledEnd.current = pomo.endsAt;
      if (pomo.mode === "focus") {
        addSession("mixto", Math.round(pomo.focusMs / 60000));
        beep();
        setPomo({
          mode: "break",
          endsAt: Date.now() + pomo.breakMs,
          round: pomo.round + 1,
        });
        toast.success("Cierra el ciclo. Descanso.");
      } else {
        beep();
        setPomo({ mode: "idle", endsAt: null, leftMs: pomo.focusMs });
        toast.success("Descanso listo. Otro foco cuando quieras.");
      }
    }, remain);
    return () => window.clearTimeout(id);
  }, [pomo.mode, pomo.endsAt, pomo.focusMs, pomo.breakMs, pomo.round, addSession, setPomo]);

  const left =
    pomo.mode === "paused"
      ? pomo.leftMs
      : pomo.endsAt
        ? Math.max(0, pomo.endsAt - Date.now())
        : pomo.focusMs;

  const startFocus = () => {
    setPomo({
      mode: "focus",
      endsAt: Date.now() + (pomo.mode === "paused" ? pomo.leftMs : pomo.focusMs),
    });
  };

  const pause = () => {
    const remain = pomo.endsAt ? Math.max(0, pomo.endsAt - Date.now()) : pomo.leftMs;
    setPomo({ mode: "paused", endsAt: null, leftMs: remain });
  };

  const stop = () => {
    setPomo({ mode: "idle", endsAt: null, leftMs: pomo.focusMs });
  };

  const setPreset = (focusMin: number, breakMin: number) => {
    setPomo({
      focusMs: focusMin * 60 * 1000,
      breakMs: breakMin * 60 * 1000,
      leftMs: focusMin * 60 * 1000,
      mode: "idle",
      endsAt: null,
    });
  };

  return (
    <Panel>
      <h2 className="font-display text-xl">Pomodoro</h2>
      <p className="mt-1 text-sm text-muted">
        {pomo.mode === "break" ? "Descanso" : "Foco"} · ronda {pomo.round}
      </p>
      <p className="mt-4 font-display text-5xl tabular-nums">{formatMmSs(left)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setPreset(25, 5)}>
          25 / 5
        </Button>
        <Button size="sm" variant="outline" onClick={() => setPreset(50, 10)}>
          50 / 10
        </Button>
        <Button size="sm" variant="outline" onClick={() => setPreset(15, 5)}>
          15 / 5
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {pomo.mode === "focus" || pomo.mode === "break" ? (
          <Button onClick={pause}>
            <Pause className="size-4" />
            Pausar
          </Button>
        ) : (
          <Button onClick={startFocus}>
            <Play className="size-4" />
            Empezar
          </Button>
        )}
        <Button variant="outline" onClick={stop}>
          <Square className="size-4" />
          Reset
        </Button>
      </div>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!taskTitle.trim()) return;
          addTask(taskTitle.trim());
          setTaskTitle("");
        }}
      >
        <input
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="Hoy: leer depósito, armar contestación…"
          className="h-11 flex-1 rounded-md border border-border bg-bg px-3 text-sm"
        />
        <Button type="submit" variant="outline">
          Tarea
        </Button>
      </form>
      <ul className="mt-3 space-y-1">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggleTask(t.id)}
              className="size-4 accent-primary"
            />
            <span className={cn("flex-1", t.done && "text-muted line-through")}>
              {t.title}
            </span>
            <button
              type="button"
              className="text-xs text-subtle hover:text-fg"
              onClick={() => removeTask(t.id)}
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    /* ignore */
  }
}

function AudioCard() {
  const addAudioNote = useStudyStore((s) => s.addAudioNote);
  const addPage = useStudyStore((s) => s.addPage);
  const updatePage = useStudyStore((s) => s.updatePage);
  const audioNotes = useStudyStore((s) => s.audioNotes);
  const [slug, setSlug] = useState(SUBJECTS[0]?.slug ?? "");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const secondsRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      recRef.current?.stop();
    };
  }, []);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        void sendBlob(blob, rec.mimeType || "audio/webm", secondsRef.current);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
      secondsRef.current = 0;
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
      }, 1000);
    } catch {
      toast.error("No pude usar el micrófono. Subí un audio grabado.");
    }
  };

  const stopRec = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    recRef.current?.stop();
    recRef.current = null;
    setRecording(false);
  };

  const sendBlob = async (blob: Blob, mime: string, durationSec: number) => {
    if (blob.size < 800) {
      toast.error("El audio quedó vacío.");
      return;
    }
    if (blob.size > 8_000_000) {
      toast.error("Audio demasiado largo. Cortalo a unos 8 minutos.");
      return;
    }
    setBusy(true);
    try {
      const base64 = await blobToBase64(blob);
      const result = await transcribeAudio({
        data: { mimeType: mime.split(";")[0] || "audio/webm", base64 },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      addAudioNote({
        subjectSlug: slug || null,
        pageId: null,
        transcript: result.text,
        durationSec,
      });
      const id = addPage(
        `Audio ${new Date().toLocaleString("es-VE")}`,
        slug || null,
      );
      updatePage(id, { body: result.text });
      toast.success("Transcripción lista. También la guardé como hoja.");
    } catch {
      toast.error("Falló la transcripción.");
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File) => {
    await sendBlob(file, file.type || "audio/mpeg", 0);
  };

  return (
    <Panel>
      <h2 className="font-display text-xl">Grabar y transcribir</h2>
      <p className="mt-1 text-sm text-muted">
        Grabá un fragmento de clase o subí un audio. Gemini lo pasa a texto y
        queda en el cuaderno.
      </p>
      <select
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="mt-4 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
        aria-label="Materia del audio"
      >
        {SUBJECTS.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.name}
          </option>
        ))}
      </select>
      <div className="mt-4 flex flex-wrap gap-2">
        {recording ? (
          <Button variant="danger" onClick={stopRec}>
            <Square className="size-4" />
            Parar · {seconds}s
          </Button>
        ) : (
          <Button onClick={() => void startRec()} disabled={busy}>
            <Mic className="size-4" />
            Grabar
          </Button>
        )}
        <Button variant="outline" asChild disabled={busy}>
          <label className="cursor-pointer">
            <Upload className="size-4" />
            Subir audio
            <input
              type="file"
              accept="audio/*,video/webm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
                e.target.value = "";
              }}
            />
          </label>
        </Button>
      </div>
      {busy ? <p className="mt-3 text-sm text-muted">Transcribiendo…</p> : null}
      <ul className="mt-4 space-y-2">
        {audioNotes.slice(0, 4).map((n) => (
          <li key={n.id} className="rounded-md bg-bg-warm p-3 text-sm">
            <p className="line-clamp-3">{n.transcript}</p>
          </li>
        ))}
      </ul>
      <Button asChild variant="ghost" className="mt-3 w-full">
        <Link to="/cuaderno">Ver en el cuaderno</Link>
      </Button>
    </Panel>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const comma = text.indexOf(",");
      resolve(comma >= 0 ? text.slice(comma + 1) : text);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

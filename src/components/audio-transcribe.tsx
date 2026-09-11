import { Mic, Square, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { transcribeAudio } from "@/lib/ai.functions";
import { loadPuter, transcribeWithPuter } from "@/lib/puter-stt";
import { SUBJECTS } from "@/lib/subjects";
import { useStudyStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function pickRecorderMime(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return "audio/webm";
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

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{ isFinal: boolean; 0?: { transcript?: string } }>;
  }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function SpeechCtor(): (new () => SpeechRec) | null {
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function AudioTranscribe({
  subjectSlug,
  pageId,
  onTranscript,
}: {
  subjectSlug: string | null;
  pageId: string | null;
  onTranscript?: (text: string) => void;
}) {
  const addAudioNote = useStudyStore((s) => s.addAudioNote);
  const [slug, setSlug] = useState(subjectSlug ?? SUBJECTS[0]?.slug ?? "");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [dictating, setDictating] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const secondsRef = useRef(0);
  const speechRef = useRef<SpeechRec | null>(null);

  useEffect(() => {
    if (subjectSlug) setSlug(subjectSlug);
  }, [subjectSlug]);

  useEffect(() => {
    void loadPuter().catch(() => {
      /* se carga al transcribir */
    });
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      recRef.current?.stop();
      speechRef.current?.stop();
    };
  }, []);

  const saveText = (text: string, durationSec: number) => {
    addAudioNote({
      subjectSlug: slug || null,
      pageId,
      transcript: text,
      durationSec,
    });
    onTranscript?.(text);
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickRecorderMime();
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || mime });
        void sendBlob(blob, rec.mimeType || mime, secondsRef.current);
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
      toast.error("No pude usar el micrófono. Subí un audio o dictá.");
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
    if (blob.size > 25_000_000) {
      toast.error("Audio demasiado pesado. Cortalo un poco.");
      return;
    }
    setBusy(true);
    try {
      try {
        const puter = await transcribeWithPuter(blob);
        saveText(puter.text, puter.durationSec ?? durationSec);
        toast.success("Transcripción lista. Quedó en esta hoja.");
        return;
      } catch {
        /* Gemini as backup */
      }
      const base64 = await blobToBase64(blob);
      const result = await transcribeAudio({
        data: { mimeType: mime.split(";")[0] || "audio/webm", base64 },
      });
      if (result.ok) {
        saveText(result.text, durationSec);
        toast.success("Transcripción lista. Quedó en esta hoja.");
        return;
      }
      toast.error(result.error || "No pude transcribir. Probá dictar en vivo.");
    } catch {
      toast.error("Falló la transcripción. Probá dictar en vivo.");
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File) => {
    await sendBlob(file, file.type || "audio/mpeg", 0);
  };

  const toggleDictate = () => {
    if (dictating) {
      speechRef.current?.stop();
      speechRef.current = null;
      setDictating(false);
      return;
    }
    const Ctor = SpeechCtor();
    if (!Ctor) {
      toast.error("Este navegador no dicta en vivo. Grabá o subí un audio.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "es-VE";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event) => {
      let chunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i]?.isFinal) chunk += event.results[i][0]?.transcript ?? "";
      }
      const text = chunk.trim();
      if (text) saveText(text, 0);
    };
    rec.onerror = () => {
      setDictating(false);
      toast.error("Se cortó el dictado.");
    };
    rec.onend = () => setDictating(false);
    speechRef.current = rec;
    rec.start();
    setDictating(true);
    toast.message("Dictando. Hablá y paro cuando pulses otra vez.");
  };

  return (
    <div className="mt-6 rounded-md border border-border bg-bg-warm p-4">
      <h2 className="font-display text-lg">Grabar la clase</h2>
      <p className="mt-1 text-sm text-muted">
        Grabá, subí un audio o dictá. Sale en español y se pega en esta hoja.
      </p>
      <select
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="mt-3 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
        aria-label="Materia del audio"
      >
        {SUBJECTS.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.name}
          </option>
        ))}
      </select>
      <div className="mt-3 flex flex-wrap gap-2">
        {recording ? (
          <Button variant="danger" onClick={stopRec}>
            <Square className="size-4" />
            Parar · {seconds}s
          </Button>
        ) : (
          <Button onClick={() => void startRec()} disabled={busy || dictating}>
            <Mic className="size-4" />
            Grabar
          </Button>
        )}
        <Button variant="outline" asChild disabled={busy || recording}>
          <label className={cn("cursor-pointer")}>
            <Upload className="size-4" />
            Subir audio
            <input
              type="file"
              accept="audio/*,video/webm,.m4a,.mp3,.wav,.ogg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
                e.target.value = "";
              }}
            />
          </label>
        </Button>
        <Button
          variant={dictating ? "danger" : "outline"}
          onClick={toggleDictate}
          disabled={busy || recording}
        >
          <Mic className="size-4" />
          {dictating ? "Parar dictado" : "Dictar"}
        </Button>
      </div>
      {busy ? <p className="mt-3 text-sm text-muted">Transcribiendo…</p> : null}
    </div>
  );
}

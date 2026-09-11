import { Mic, Square, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { transcribeAudio } from "@/lib/ai.functions";
import { loadPuter, transcribeWithPuter } from "@/lib/puter-stt";
import { deleteCloudFile, safeStorageName, uploadCloudFile } from "@/lib/folio-cloud";
import { deleteUploadBlob, resolveUploadBlob, saveUploadBlob } from "@/lib/uploads-db";
import { SUBJECTS } from "@/lib/subjects";
import { useStudyStore, type AudioNote } from "@/lib/store";
import { cn } from "@/lib/utils";

function pickRecorderMime(): string {
  const candidates = [
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/webm;codecs=opus",
    "audio/webm",
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

function publicSttError(raw?: string | null): string {
  const t = (raw ?? "").trim();
  if (
    !t ||
    /api\s*key|unauthorized|forbidden|401|403|gemini|xai|openai|bearer|quota|clave/i.test(
      t,
    )
  ) {
    return "No pude transcribir. Probá dictar en vivo.";
  }
  return t;
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

type Draft = {
  blob: Blob | null;
  mime: string;
  text: string;
  durationSec: number;
};

export function AudioPlayer({ noteId }: { noteId: string }) {
  const note = useStudyStore((s) => s.audioNotes.find((n) => n.id === noteId));
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    let alive = true;
    if (note?.publicUrl) setUrl(note.publicUrl);
    void resolveUploadBlob({
      id: noteId,
      publicUrl: note?.publicUrl,
      storagePath: note?.storagePath,
    }).then((blob) => {
      if (!alive || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [noteId, note?.publicUrl, note?.storagePath]);
  if (!url) return null;
  return (
    <audio controls src={url} className="mt-2 h-10 w-full" preload="metadata" />
  );
}

export function AudioTranscribe({
  subjectSlug,
  pageId,
  onSaved,
}: {
  subjectSlug: string | null;
  pageId: string | null;
  onSaved?: (text: string) => void;
}) {
  const addAudioNote = useStudyStore((s) => s.addAudioNote);
  const updateAudioNote = useStudyStore((s) => s.updateAudioNote);
  const [slug, setSlug] = useState(subjectSlug ?? SUBJECTS[0]?.slug ?? "");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [dictating, setDictating] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
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
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const setDraftSafe = (next: Draft | null) => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      const url = next?.blob ? URL.createObjectURL(next.blob) : null;
      previewUrlRef.current = url;
      return url;
    });
    setDraft(next);
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
      let text = "";
      try {
        const puter = await transcribeWithPuter(blob);
        text = puter.text;
      } catch {
        const base64 = await blobToBase64(blob);
        const result = await transcribeAudio({
          data: { mimeType: mime.split(";")[0] || "audio/webm", base64 },
        });
        if (result.ok && result.text.trim()) {
          text = result.text;
        } else {
          toast.error(publicSttError(result.ok ? null : result.error));
          return;
        }
      }
      if (!text.trim()) {
        toast.error("No se escuchó nada claro. Grabá más cerca.");
        return;
      }
      setDraftSafe({ blob, mime, text, durationSec });
      toast.success("Transcripción lista. Guardala para dejarla en el cuaderno.");
    } catch {
      toast.error("Falló la transcripción. Probá dictar en vivo.");
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File) => {
    await sendBlob(file, file.type || "audio/mpeg", 0);
  };

  const saveDraft = async () => {
    if (!draft?.text.trim()) return;
    const id = addAudioNote({
      subjectSlug: slug || null,
      pageId,
      transcript: draft.text,
      durationSec: draft.durationSec,
      hasBlob: Boolean(draft.blob),
    });
    if (draft.blob) {
      try {
        await saveUploadBlob(id, draft.blob);
        const ext = draft.mime.includes("mp4")
          ? "m4a"
          : draft.mime.includes("mpeg")
            ? "mp3"
            : "webm";
        const remote = await uploadCloudFile(
          `a/${id}/${safeStorageName(`clase.${ext}`)}`,
          draft.blob,
          draft.mime.split(";")[0] || "audio/webm",
        );
        if (remote) {
          updateAudioNote(id, {
            hasBlob: true,
            storagePath: remote.path,
            publicUrl: remote.url,
          });
        }
      } catch {
        toast.error("Se guardó el texto, pero no el archivo de audio.");
      }
    }
    onSaved?.(draft.text);
    setDraftSafe(null);
    toast.success("Guardado en el cuaderno.");
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
      if (!text) return;
      setDraft((prev) => ({
        blob: prev?.blob ?? null,
        mime: prev?.mime ?? "audio/webm",
        text: prev?.text ? `${prev.text} ${text}` : text,
        durationSec: prev?.durationSec ?? 0,
      }));
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
        Grabá, subí o dictá. Después guardá para dejarlo en esta hoja.
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
      {draft ? (
        <div className="mt-4 rounded-md border border-border bg-surface p-3">
          {previewUrl ? (
            <audio controls src={previewUrl} className="mb-3 h-10 w-full" />
          ) : null}
          <p className="whitespace-pre-wrap text-sm">{draft.text}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => void saveDraft()}>Guardar</Button>
            <Button variant="ghost" onClick={() => setDraftSafe(null)}>
              Descartar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SavedAudioList({
  notes,
}: {
  notes: AudioNote[];
}) {
  const removeAudioNote = useStudyStore((s) => s.removeAudioNote);
  if (notes.length === 0) return null;
  return (
    <div className="mt-6">
      <h2 className="mb-2 font-display text-lg">Audios guardados</h2>
      <ul className="space-y-3">
        {notes.map((n) => (
          <li
            key={n.id}
            className="rounded-md border border-border bg-bg-warm p-3 text-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-muted">
                {n.durationSec ? `${n.durationSec}s` : "Audio"}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 text-subtle"
                aria-label="Eliminar audio"
                onClick={() => {
                  void deleteUploadBlob(n.id);
                  if (n.storagePath) void deleteCloudFile(n.storagePath);
                  removeAudioNote(n.id);
                  toast.success("Audio eliminado.");
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            {n.hasBlob || n.publicUrl ? <AudioPlayer noteId={n.id} /> : null}
            <p className="mt-2 whitespace-pre-wrap">{n.transcript}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}


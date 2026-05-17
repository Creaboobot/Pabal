"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SourceContextChips, type VoiceSourceContextChip } from "@/modules/voice-notes/components/source-context-chips";
import { formatVoiceDuration } from "@/modules/voice-notes/labels";

const MAX_DURATION_SECONDS = 5 * 60;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const CLIENT_AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/m4a",
] as const;

type RecorderState =
  | "failed"
  | "idle"
  | "permission-denied"
  | "ready"
  | "recording"
  | "unsupported"
  | "uploading";

type VoiceRecorderContext = {
  companyId?: string | null;
  meetingId?: string | null;
  noteId?: string | null;
  personId?: string | null;
};

type VoiceRecorderProps = {
  context: VoiceRecorderContext;
  sourceChips: VoiceSourceContextChip[];
  transcriptionReadiness: {
    available: boolean;
    badgeLabel: string;
    detail: string;
    isDemo: boolean;
    providerLabel: string;
    status: "available" | "demo" | "misconfigured" | "requires_configuration";
    summary: string;
    unavailableMessage: string;
  };
};

type TranscribeResponse = {
  error?: string;
  redirectTo?: string;
  voiceNoteId?: string;
};

function hasRecordingSupport() {
  return Boolean(
    typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function" &&
      typeof MediaRecorder !== "undefined",
  );
}

function bestMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  return (
    CLIENT_AUDIO_MIME_TYPES.find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType),
    ) ?? ""
  );
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function readinessBadgeVariant(
  status: VoiceRecorderProps["transcriptionReadiness"]["status"],
) {
  switch (status) {
    case "available":
      return "success" as const;
    case "demo":
      return "warning" as const;
    case "misconfigured":
      return "sensitive" as const;
    case "requires_configuration":
      return "secondary" as const;
  }
}

export function VoiceRecorder({
  context,
  sourceChips,
  transcriptionReadiness,
}: VoiceRecorderProps) {
  const router = useRouter();
  const [state, setState] = useState<RecorderState>(() =>
    hasRecordingSupport() ? "idle" : "unsupported",
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState("audio/webm");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const supportedMimeType = useMemo(bestMimeType, []);

  function clearTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;

    clearTimer();

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    stopStream(streamRef.current);
    streamRef.current = null;
    setState(audioBlob ? "ready" : "idle");
  }

  function discardRecording() {
    clearTimer();

    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    stopStream(streamRef.current);
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = null;
    setAudioBlob(null);
    setElapsedSeconds(0);
    setError(null);
    setState(hasRecordingSupport() ? "idle" : "unsupported");
  }

  async function startRecording() {
    if (!hasRecordingSupport()) {
      setState("unsupported");
      return;
    }

    setError(null);
    setAudioBlob(null);
    setElapsedSeconds(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const recorderOptions = supportedMimeType
        ? {
            mimeType: supportedMimeType,
          }
        : undefined;
      const recorder = new MediaRecorder(stream, recorderOptions);

      streamRef.current = stream;
      recorderRef.current = recorder;
      setRecordedMimeType(recorder.mimeType || supportedMimeType || "audio/webm");

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError("Recording failed. Please try again.");
        stopStream(stream);
        setState("failed");
      };

      recorder.onstop = () => {
        clearTimer();
        stopStream(stream);
        streamRef.current = null;
        const mimeType = recorder.mimeType || supportedMimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, {
          type: mimeType,
        });

        setRecordedMimeType(mimeType);
        setAudioBlob(blob);
        setElapsedSeconds((current) =>
          startedAtRef.current
            ? Math.max(
                current,
                Math.round((Date.now() - startedAtRef.current) / 1000),
              )
            : current,
        );
        setState(blob.size > 0 ? "ready" : "failed");
        if (blob.size === 0) {
          setError("Recording was empty. Please try again.");
        }
      };

      startedAtRef.current = Date.now();
      recorder.start();
      setState("recording");
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((current) => {
          const next = current + 1;

          if (next >= MAX_DURATION_SECONDS) {
            stopRecording();
          }

          return Math.min(next, MAX_DURATION_SECONDS);
        });
      }, 1000);
    } catch (recordingError) {
      const errorName =
        recordingError instanceof DOMException ? recordingError.name : "";

      setError(
        errorName === "NotAllowedError"
          ? "Microphone permission was denied."
          : "Microphone access failed. Please check browser permissions.",
      );
      setState(errorName === "NotAllowedError" ? "permission-denied" : "failed");
    }
  }

  async function uploadRecording() {
    if (!audioBlob) {
      return;
    }

    if (!transcriptionReadiness.available) {
      setError(transcriptionReadiness.unavailableMessage);
      return;
    }

    if (audioBlob.size > MAX_UPLOAD_BYTES) {
      setError("Recording is larger than the 25 MB upload limit.");
      setState("failed");
      return;
    }

    setError(null);
    setState("uploading");

    try {
      const extension = recordedMimeType.includes("mp4")
        ? "mp4"
        : recordedMimeType.includes("mpeg")
          ? "mp3"
          : recordedMimeType.includes("wav")
            ? "wav"
            : recordedMimeType.includes("m4a")
              ? "m4a"
              : "webm";
      const audioFile = new File([audioBlob], `voice-note.${extension}`, {
        type: recordedMimeType,
      });
      const formData = new FormData();
      formData.set("audio", audioFile);
      formData.set("durationSeconds", String(elapsedSeconds));

      for (const [key, value] of Object.entries(context)) {
        if (value) {
          formData.set(key, value);
        }
      }

      const response = await fetch("/api/voice-notes/transcribe", {
        body: formData,
        method: "POST",
      });
      const body = (await response.json().catch(() => ({}))) as TranscribeResponse;

      if (!response.ok) {
        throw new Error(body.error ?? "Voice transcription failed.");
      }

      if (!body.redirectTo) {
        throw new Error("Voice transcription completed without a destination.");
      }

      router.push(body.redirectTo);
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Voice transcription failed.",
      );
      setState("failed");
    }
  }

  useEffect(() => {
    return () => {
      clearTimer();
      stopStream(streamRef.current);
    };
  }, []);

  const canRetry = state === "failed" && Boolean(audioBlob);

  return (
    <section
      aria-label="Voice recorder"
      className="rounded-md border border-border bg-card p-4 shadow-sm"
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Record voice note
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Record up to 5 minutes. Audio is sent for transcription and not
            retained by default.
          </p>
        </div>

        <div className="rounded-md border border-border bg-muted p-3 text-sm leading-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={readinessBadgeVariant(transcriptionReadiness.status)}>
              {transcriptionReadiness.badgeLabel}
            </Badge>
            <span className="font-medium text-foreground">
              Provider: {transcriptionReadiness.providerLabel}
            </span>
          </div>
          <p className="mt-2 text-muted-foreground">
            {transcriptionReadiness.detail}
          </p>
          {transcriptionReadiness.isDemo ? (
            <p className="mt-1 font-medium text-foreground">
              Mock provider active - local/test only.
            </p>
          ) : null}
        </div>

        <SourceContextChips chips={sourceChips} />

        <div className="flex flex-col items-center gap-4 rounded-md border border-border bg-muted p-5 text-center">
          <div className="text-4xl font-semibold tabular-nums text-foreground">
            {formatVoiceDuration(elapsedSeconds)}
          </div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Max {formatVoiceDuration(MAX_DURATION_SECONDS)}
          </p>

          {state === "unsupported" ? (
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Recording is not supported in this browser. Try a recent mobile
              browser with microphone and MediaRecorder support.
            </p>
          ) : null}

          {state === "permission-denied" ? (
            <p className="max-w-sm text-sm leading-6 text-destructive">
              Microphone permission was denied. Enable microphone access in your
              browser settings and try again.
            </p>
          ) : null}

          {state === "recording" ? (
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={stopRecording} type="button">
                <Square aria-hidden="true" className="mr-2 size-4" />
                Stop
              </Button>
              <Button onClick={discardRecording} type="button" variant="ghost">
                Cancel
              </Button>
            </div>
          ) : null}

          {state === "idle" || state === "permission-denied" ? (
            <Button
              className="size-24 rounded-full text-base"
              onClick={startRecording}
              type="button"
            >
              <Mic aria-hidden="true" className="mr-2 size-5" />
              Record
            </Button>
          ) : null}

          {state === "ready" ? (
            <div className="grid gap-3">
              <p className="text-sm text-muted-foreground">
                {transcriptionReadiness.available
                  ? "Recording ready. Submit it for transcription or discard it."
                  : transcriptionReadiness.unavailableMessage}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  disabled={!transcriptionReadiness.available}
                  onClick={uploadRecording}
                  type="button"
                >
                  <Upload aria-hidden="true" className="mr-2 size-4" />
                  Transcribe
                </Button>
                <Button
                  onClick={discardRecording}
                  type="button"
                  variant="ghost"
                >
                  <Trash2 aria-hidden="true" className="mr-2 size-4" />
                  Discard
                </Button>
              </div>
            </div>
          ) : null}

          {state === "uploading" ? (
            <div className="grid gap-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Transcribing...</p>
              <p>Keep this page open while the transcript is created.</p>
            </div>
          ) : null}

          {state === "failed" ? (
            <div className="grid gap-3">
              <p className="text-sm text-destructive">
                {error ?? "Voice transcription failed."}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {canRetry ? (
                  <Button onClick={uploadRecording} type="button">
                    Retry upload
                  </Button>
                ) : (
                  <Button onClick={startRecording} type="button">
                    Try again
                  </Button>
                )}
                <Button
                  onClick={discardRecording}
                  type="button"
                  variant="ghost"
                >
                  Discard
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

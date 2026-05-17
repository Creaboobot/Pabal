import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VoiceRecorder } from "@/modules/voice-notes/components/voice-recorder";

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
}));

type FakeRecorderEvent = {
  data: Blob;
};

class FakeMediaRecorder {
  static isTypeSupported = vi.fn((mimeType: string) => mimeType === "audio/webm");

  mimeType: string;
  ondataavailable: ((event: FakeRecorderEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onstop: (() => void) | null = null;
  state: "inactive" | "recording" = "inactive";

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType ?? "audio/webm";
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    this.ondataavailable?.({
      data: new Blob([new Uint8Array([1, 2, 3])], {
        type: this.mimeType,
      }),
    });
    this.onstop?.();
  }
}

function setRecordingSupport(input?: { rejectPermission?: boolean }) {
  const stopTrack = vi.fn();
  const stream = {
    getTracks: () => [
      {
        stop: stopTrack,
      },
    ],
  } as unknown as MediaStream;

  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn(async () => {
        if (input?.rejectPermission) {
          throw new DOMException("Permission denied", "NotAllowedError");
        }

        return stream;
      }),
    },
  });
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);

  return {
    stopTrack,
  };
}

const readyTranscription = {
  available: true,
  badgeLabel: "Transcription ready",
  detail:
    "Uploaded audio can be transcribed through the configured speech-to-text provider.",
  isDemo: false,
  providerLabel: "OpenAI",
  status: "available" as const,
  summary: "Speech-to-text provider is configured.",
  unavailableMessage:
    "Transcription requires a configured provider before this recording can be uploaded.",
};

function renderRecorder(
  transcriptionReadiness: ComponentProps<typeof VoiceRecorder>["transcriptionReadiness"] =
    readyTranscription,
) {
  return render(
    <VoiceRecorder
      context={{
        personId: "person_test_1",
      }}
      sourceChips={[
        {
          href: "/people/person_test_1",
          id: "person_test_1",
          label: "Anna Keller",
          type: "person",
        },
      ]}
      transcriptionReadiness={transcriptionReadiness}
    />,
  );
}

describe("VoiceRecorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });
  });

  it("shows an unsupported browser state when MediaRecorder is unavailable", () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });
    vi.stubGlobal("MediaRecorder", undefined);

    renderRecorder();

    expect(screen.getByText(/Recording is not supported/i)).toBeInTheDocument();
  });

  it("shows a permission denied state", async () => {
    setRecordingSupport({
      rejectPermission: true,
    });

    renderRecorder();
    fireEvent.click(screen.getByRole("button", { name: /Record/i }));

    expect(
      await screen.findByText(/Microphone permission was denied/i),
    ).toBeInTheDocument();
  });

  it("records, uploads, and redirects after successful transcription", async () => {
    const { stopTrack } = setRecordingSupport();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({
          redirectTo: "/voice-notes/voice_note_test_1",
          voiceNoteId: "voice_note_test_1",
        }),
        ok: true,
      })),
    );

    renderRecorder();
    fireEvent.click(screen.getByRole("button", { name: /Record/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Stop/i }));

    expect(
      await screen.findByText(/Recording ready/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Transcribe/i }));

    await waitFor(() => {
      expect(routerMocks.push).toHaveBeenCalledWith(
        "/voice-notes/voice_note_test_1",
      );
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/voice-notes/transcribe",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(stopTrack).toHaveBeenCalled();
  });

  it("allows recording but disables upload when transcription is not configured", async () => {
    setRecordingSupport();

    renderRecorder({
      available: false,
      badgeLabel: "Configuration required",
      detail:
        "Recording can start, but transcription needs provider configuration before upload.",
      isDemo: false,
      providerLabel: "OpenAI",
      status: "requires_configuration",
      summary: "Speech-to-text provider needs configuration.",
      unavailableMessage:
        "Transcription requires a configured provider before this recording can be uploaded.",
    });

    expect(
      screen.getByText(/Recording can start, but transcription needs/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Record/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Stop/i }));

    expect(screen.getByRole("button", { name: /Transcribe/i })).toBeDisabled();
    expect(
      screen.getByText(/Transcription requires a configured provider/i),
    ).toBeInTheDocument();
  });

  it("shows safe upload errors and allows retry", async () => {
    setRecordingSupport();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({
          error: "Voice transcription failed safely.",
        }),
        ok: false,
      })),
    );

    renderRecorder();
    fireEvent.click(screen.getByRole("button", { name: /Record/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Stop/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Transcribe/i }));

    expect(
      await screen.findByText("Voice transcription failed safely."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry upload/i })).toBeInTheDocument();
  });
});

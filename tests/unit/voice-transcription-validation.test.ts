// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  MAX_VOICE_AUDIO_DURATION_SECONDS,
  MAX_VOICE_AUDIO_SIZE_BYTES,
  parseOptionalVoiceDuration,
  validateVoiceAudioFile,
  VoiceTranscriptionValidationError,
} from "@/server/services/voice-transcription";

describe("voice transcription validation", () => {
  it("accepts supported voice audio files", () => {
    const audio = new File([new Uint8Array([1, 2, 3])], "voice-note.webm", {
      type: "audio/webm",
    });

    expect(validateVoiceAudioFile(audio)).toEqual({
      fileName: "voice-note.webm",
      mimeType: "audio/webm",
      sizeBytes: 3,
    });
  });

  it("rejects missing audio", () => {
    expect(() => validateVoiceAudioFile(null)).toThrow(
      VoiceTranscriptionValidationError,
    );
  });

  it("rejects unsupported audio MIME types", () => {
    const audio = new File([new Uint8Array([1])], "voice-note.txt", {
      type: "text/plain",
    });

    expect(() => validateVoiceAudioFile(audio)).toThrow(
      "Audio file type is not supported.",
    );
  });

  it("rejects files over the 25 MB limit", () => {
    const audio = new File(
      [new Uint8Array(MAX_VOICE_AUDIO_SIZE_BYTES + 1)],
      "voice-note.webm",
      {
        type: "audio/webm",
      },
    );

    expect(() => validateVoiceAudioFile(audio)).toThrow(
      "Audio file is larger than the 25 MB limit.",
    );
  });

  it("validates optional duration metadata", () => {
    expect(parseOptionalVoiceDuration("12.4")).toBe(12);
    expect(parseOptionalVoiceDuration("")).toBeNull();
    expect(() =>
      parseOptionalVoiceDuration(String(MAX_VOICE_AUDIO_DURATION_SECONDS + 1)),
    ).toThrow("Recording is longer than the 5 minute limit.");
  });
});

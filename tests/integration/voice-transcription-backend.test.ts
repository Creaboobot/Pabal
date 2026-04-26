// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/server/db/prisma";
import { type SpeechToTextProvider } from "@/server/providers/speech-to-text";
import { createTenantCompany } from "@/server/services/companies";
import { createTenantMeeting } from "@/server/services/meetings";
import { createTenantNote } from "@/server/services/notes";
import { createTenantPerson } from "@/server/services/people";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import {
  MAX_VOICE_AUDIO_SIZE_BYTES,
  transcribeTenantVoiceNote,
} from "@/server/services/voice-transcription";
import {
  createTenantContext,
  describeWithDatabase,
  resetDatabase,
} from "@/tests/integration/helpers/database";

const getCurrentUserContextMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/services/session", () => ({
  getCurrentUserContext: getCurrentUserContextMock,
}));

import { POST } from "@/app/api/voice-notes/transcribe/route";

function audioFile(
  input: {
    bytes?: number;
    name?: string;
    type?: string;
  } = {},
) {
  return new File(
    [new Uint8Array(input.bytes ?? 4)],
    input.name ?? "voice-note.webm",
    {
      type: input.type ?? "audio/webm",
    },
  );
}

function requestWithFormData(formData: FormData) {
  return new NextRequest("http://localhost/api/voice-notes/transcribe", {
    body: formData,
    method: "POST",
  });
}

function withMockSpeechProvider<T>(callback: () => Promise<T>) {
  const previousProvider = process.env.SPEECH_TO_TEXT_PROVIDER;
  const previousNodeEnv = process.env.NODE_ENV;
  const writableEnv = process.env as Record<string, string | undefined>;
  writableEnv.NODE_ENV = "test";
  process.env.SPEECH_TO_TEXT_PROVIDER = "mock";

  return callback().finally(() => {
    if (previousProvider === undefined) {
      delete process.env.SPEECH_TO_TEXT_PROVIDER;
    } else {
      process.env.SPEECH_TO_TEXT_PROVIDER = previousProvider;
    }

    if (previousNodeEnv === undefined) {
      delete writableEnv.NODE_ENV;
    } else {
      writableEnv.NODE_ENV = previousNodeEnv;
    }
  });
}

async function createVoiceContext(email: string) {
  const context = await createTenantContext(email);
  const company = await createTenantCompany(context, {
    name: `${email} Company`,
  });
  const person = await createTenantPerson(context, {
    displayName: `${email} Person`,
  });
  const meeting = await createTenantMeeting(context, {
    primaryCompanyId: company.id,
    title: `${email} Meeting`,
  });
  const note = await createTenantNote(context, {
    body: `${email} note body`,
    companyId: company.id,
    meetingId: meeting.id,
    noteType: "MEETING",
    personId: person.id,
  });

  return {
    company,
    context,
    meeting,
    note,
    person,
  };
}

describeWithDatabase("voice transcription backend", () => {
  beforeEach(async () => {
    getCurrentUserContextMock.mockReset();
    await resetDatabase();
  });

  it("creates a transcribed VoiceNote from mocked transcription", async () => {
    const fixture = await createVoiceContext("voice-transcribe@example.com");
    const transcript = "Sensitive transcript text that must not be audited.";
    const provider: SpeechToTextProvider = {
      name: "mock",
      transcribe: vi.fn(async () => ({
        confidence: 0.91,
        language: "en",
        text: transcript,
      })),
    };

    const voiceNote = await transcribeTenantVoiceNote(
      fixture.context,
      {
        audio: audioFile(),
        audioDurationSeconds: 18,
        companyId: fixture.company.id,
        meetingId: fixture.meeting.id,
        noteId: fixture.note.id,
        personId: fixture.person.id,
      },
      provider,
    );

    expect(voiceNote).toMatchObject({
      audioDurationSeconds: 18,
      audioMimeType: "audio/webm",
      audioRetentionStatus: "NOT_STORED",
      audioSizeBytes: 4,
      companyId: fixture.company.id,
      language: "en",
      meetingId: fixture.meeting.id,
      noteId: fixture.note.id,
      personId: fixture.person.id,
      status: "TRANSCRIBED",
      transcriptConfidence: 0.91,
      transcriptText: transcript,
    });
    expect(voiceNote.rawAudioDeletedAt).toBeInstanceOf(Date);
    expect(provider.transcribe).toHaveBeenCalledTimes(1);
    await expect(prisma.voiceMention.count()).resolves.toBe(0);
    await expect(prisma.aIProposal.count()).resolves.toBe(0);
    await expect(prisma.aIProposalItem.count()).resolves.toBe(0);
  });

  it("validates source context before calling the provider", async () => {
    const first = await createVoiceContext("first-voice-source@example.com");
    const second = await createVoiceContext("second-voice-source@example.com");
    const provider: SpeechToTextProvider = {
      name: "mock",
      transcribe: vi.fn(async () => ({
        text: "This should not run",
      })),
    };

    await expect(
      transcribeTenantVoiceNote(
        first.context,
        {
          audio: audioFile(),
          personId: second.person.id,
        },
        provider,
      ),
    ).rejects.toBeInstanceOf(TenantScopedEntityNotFoundError);
    expect(provider.transcribe).not.toHaveBeenCalled();
    await expect(prisma.voiceNote.count()).resolves.toBe(0);
  });

  it("writes safe audit logs without transcript or provider payload", async () => {
    const fixture = await createVoiceContext("voice-audit@example.com");
    const transcript = "Do not place this transcript in audit metadata.";

    const voiceNote = await transcribeTenantVoiceNote(
      fixture.context,
      {
        audio: audioFile(),
        companyId: fixture.company.id,
      },
      {
        name: "mock",
        transcribe: vi.fn(async () => ({
          text: transcript,
        })),
      },
    );

    const auditLogs = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: "asc",
      },
      where: {
        action: {
          in: ["voice_note.created", "voice_note.transcribed"],
        },
        entityId: voiceNote.id,
        tenantId: fixture.context.tenantId,
      },
    });
    const serialized = JSON.stringify(auditLogs.map((log) => log.metadata));

    expect(auditLogs).toHaveLength(2);
    expect(serialized).toContain("transcriptLength");
    expect(serialized).toContain("mock");
    expect(serialized).not.toContain(transcript);
    expect(serialized).not.toContain("provider payload");
  });

  it("rejects unauthenticated API route requests", async () => {
    getCurrentUserContextMock.mockResolvedValue(null);
    const formData = new FormData();
    formData.set("audio", audioFile());

    const response = await POST(requestWithFormData(formData));

    expect(response.status).toBe(401);
  });

  it("rejects API route requests with missing audio", async () => {
    const fixture = await createVoiceContext("voice-missing-audio@example.com");
    getCurrentUserContextMock.mockResolvedValue(fixture.context);

    await withMockSpeechProvider(async () => {
      const response = await POST(requestWithFormData(new FormData()));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Audio file is required.");
    });
  });

  it("rejects API route requests with disallowed MIME types", async () => {
    const fixture = await createVoiceContext("voice-bad-mime@example.com");
    const formData = new FormData();
    formData.set("audio", audioFile({ name: "voice-note.txt", type: "text/plain" }));
    getCurrentUserContextMock.mockResolvedValue(fixture.context);

    await withMockSpeechProvider(async () => {
      const response = await POST(requestWithFormData(formData));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Audio file type is not supported.");
    });
  });

  it("rejects API route requests over the max file size", async () => {
    const fixture = await createVoiceContext("voice-large-audio@example.com");
    const formData = new FormData();
    formData.set(
      "audio",
      audioFile({
        bytes: MAX_VOICE_AUDIO_SIZE_BYTES + 1,
      }),
    );
    getCurrentUserContextMock.mockResolvedValue(fixture.context);

    await withMockSpeechProvider(async () => {
      const response = await POST(requestWithFormData(formData));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Audio file is larger than the 25 MB limit.");
    });
  });

  it("accepts valid mocked API transcription and creates a VoiceNote", async () => {
    const fixture = await createVoiceContext("voice-route-valid@example.com");
    const formData = new FormData();
    formData.set("audio", audioFile());
    formData.set("durationSeconds", "21");
    formData.set("personId", fixture.person.id);
    getCurrentUserContextMock.mockResolvedValue(fixture.context);

    await withMockSpeechProvider(async () => {
      const response = await POST(requestWithFormData(formData));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.voiceNoteId).toEqual(expect.any(String));
      expect(body.redirectTo).toBe(`/voice-notes/${body.voiceNoteId}`);

      const voiceNote = await prisma.voiceNote.findUniqueOrThrow({
        where: {
          id: body.voiceNoteId,
        },
      });

      expect(voiceNote).toMatchObject({
        audioDurationSeconds: 21,
        audioRetentionStatus: "NOT_STORED",
        personId: fixture.person.id,
        status: "TRANSCRIBED",
        transcriptText: "Mock transcription for local development.",
      });
      expect(voiceNote.rawAudioDeletedAt).toBeInstanceOf(Date);
    });
  });
});

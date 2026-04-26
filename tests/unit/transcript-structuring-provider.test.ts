// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import {
  getTranscriptStructuringProvider,
  MockTranscriptStructuringProvider,
  OpenAITranscriptStructuringProvider,
  TranscriptStructuringProviderConfigurationError,
  TranscriptStructuringProviderError,
} from "@/server/providers/transcript-structuring";
import type {
  TranscriptStructuringInput,
  TranscriptStructuringResult,
} from "@/server/providers/transcript-structuring";

const providerInput = {
  candidates: [
    {
      email: "anna@example.com",
      entityId: "person_1",
      entityType: "PERSON",
      label: "Anna Example",
      source: "tenant_directory",
    },
  ],
  sourceContext: {
    personId: "person_1",
    personName: "Anna Example",
    voiceNoteId: "voice_1",
    voiceNoteTitle: "Voice note",
  },
  transcript: "Follow up with Anna next week.",
} satisfies TranscriptStructuringInput;

const providerResult = {
  confidence: 0.8,
  explanation: "Structured for review.",
  items: [
    {
      actionType: "CREATE",
      confidence: 0.76,
      explanation: "Create a follow-up task.",
      needsClarification: false,
      proposedPatch: {
        fields: [
          {
            key: "title",
            sensitive: false,
            value: "Follow up with Anna",
            valueType: "STRING",
          },
        ],
        kind: "CREATE_TASK",
        linkedEntities: [],
        reviewOnly: true,
        sourceReferences: [],
      },
      targetEntityId: null,
      targetEntityType: null,
      targetLookupDomain: null,
      targetLookupEmail: null,
      targetLookupName: null,
      uncertaintyFlags: [],
    },
  ],
  proposalTitle: "Voice note follow-up",
  summary: "A review-only task proposal.",
} satisfies TranscriptStructuringResult;

describe("transcript structuring providers", () => {
  it("selects the mock provider only when explicitly configured outside production", () => {
    const provider = getTranscriptStructuringProvider({
      env: {
        NODE_ENV: "test",
        TRANSCRIPT_STRUCTURING_PROVIDER: "mock",
      } as NodeJS.ProcessEnv,
    });

    expect(provider).toBeInstanceOf(MockTranscriptStructuringProvider);
  });

  it("defaults to the OpenAI provider without requiring an API key at build time", () => {
    const provider = getTranscriptStructuringProvider({
      env: {
        NODE_ENV: "production",
      } as NodeJS.ProcessEnv,
    });

    expect(provider).toBeInstanceOf(OpenAITranscriptStructuringProvider);
  });

  it("rejects the mock provider in production", () => {
    expect(() =>
      getTranscriptStructuringProvider({
        env: {
          NODE_ENV: "production",
          TRANSCRIPT_STRUCTURING_PROVIDER: "mock",
        } as NodeJS.ProcessEnv,
      }),
    ).toThrow(TranscriptStructuringProviderConfigurationError);
  });

  it("returns deterministic mock structured proposal output", async () => {
    const provider = new MockTranscriptStructuringProvider(providerResult);

    await expect(provider.structureTranscript(providerInput)).resolves.toEqual(
      providerResult,
    );
  });

  it("fails safely when the OpenAI API key is missing at runtime", async () => {
    const provider = new OpenAITranscriptStructuringProvider();

    await expect(
      provider.structureTranscript(providerInput),
    ).rejects.toMatchObject({
      code: "missing_api_key",
      safeMessage: "Transcript structuring provider is not configured.",
    } satisfies Partial<TranscriptStructuringProviderError>);
  });

  it("normalizes structured OpenAI output behind the adapter", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          output_text: JSON.stringify(providerResult),
        }),
        {
          headers: {
            "content-type": "application/json",
          },
          status: 200,
        },
      );
    });
    const provider = new OpenAITranscriptStructuringProvider({
      apiKey: "test-key",
      fetchImpl,
      model: "test-structuring-model",
    });

    await expect(provider.structureTranscript(providerInput)).resolves.toEqual(
      providerResult,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const fetchCalls = fetchImpl.mock.calls as unknown as Array<
      [string, RequestInit]
    >;
    const requestBody = JSON.parse(fetchCalls[0]?.[1].body as string);

    expect(requestBody.model).toBe("test-structuring-model");
    expect(requestBody.text.format.type).toBe("json_schema");
    expect(requestBody.text.format.strict).toBe(true);
  });
});

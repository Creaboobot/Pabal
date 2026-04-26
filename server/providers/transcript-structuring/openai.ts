import {
  parseTranscriptStructuringResult,
  transcriptStructuringJsonSchema,
  type TranscriptStructuringInput,
  type TranscriptStructuringProvider,
  TranscriptStructuringProviderError,
  type TranscriptStructuringResult,
} from "@/server/providers/transcript-structuring/types";

export const DEFAULT_OPENAI_STRUCTURING_MODEL = "gpt-4o-mini";

type OpenAITranscriptStructuringProviderInput = {
  apiKey?: string | null | undefined;
  fetchImpl?: typeof fetch | undefined;
  model?: string | null | undefined;
};

type OpenAIResponsePayload = {
  output?: Array<{
    content?: Array<{
      refusal?: unknown;
      text?: unknown;
      type?: unknown;
    }>;
    type?: unknown;
  }>;
  output_text?: unknown;
};

const SYSTEM_PROMPT = `
You structure Pobal voice note transcripts into review-only proposal items.
You must not apply changes, create business records, send messages, search the
web, use LinkedIn, use Microsoft services, or invent external facts.

Use only the transcript and the tenant-owned candidates supplied in the input.
If an entity cannot be resolved exactly from the candidates, leave target ids
null, set needsClarification to true, and explain the uncertainty.

Every proposed item is conceptual and must remain review-only. The application
will store AIProposal/AIProposalItem records only.
`.trim();

function extractOutputText(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.refusal === "string") {
        throw new TranscriptStructuringProviderError({
          code: "provider_refusal",
          safeMessage:
            "Transcript structuring was refused by the configured provider.",
          statusCode: 502,
        });
      }

      if (
        (content.type === "output_text" || content.type === "text") &&
        typeof content.text === "string"
      ) {
        return content.text;
      }
    }
  }

  return null;
}

function parseOutputText(text: string): TranscriptStructuringResult {
  let payload: unknown;

  try {
    payload = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;

    throw new TranscriptStructuringProviderError({
      code: "invalid_json_output",
      ...(message ? { message } : {}),
      safeMessage: "Transcript structuring returned unreadable output.",
      statusCode: 502,
    });
  }

  return parseTranscriptStructuringResult(payload);
}

export class OpenAITranscriptStructuringProvider
  implements TranscriptStructuringProvider
{
  readonly name = "openai";
  private readonly apiKey: string | null | undefined;
  private readonly fetchImpl: typeof fetch;
  private readonly model: string;

  constructor(input: OpenAITranscriptStructuringProviderInput = {}) {
    this.apiKey = input.apiKey;
    this.fetchImpl = input.fetchImpl ?? fetch;
    this.model = input.model?.trim() || DEFAULT_OPENAI_STRUCTURING_MODEL;
  }

  async structureTranscript(
    input: TranscriptStructuringInput,
  ): Promise<TranscriptStructuringResult> {
    if (!this.apiKey) {
      throw new TranscriptStructuringProviderError({
        code: "missing_api_key",
        safeMessage: "Transcript structuring provider is not configured.",
        statusCode: 503,
      });
    }

    const response = await this.fetchImpl("https://api.openai.com/v1/responses", {
      body: JSON.stringify({
        input: [
          {
            content: [
              {
                text: SYSTEM_PROMPT,
                type: "input_text",
              },
            ],
            role: "system",
          },
          {
            content: [
              {
                text: JSON.stringify({
                  candidates: input.candidates,
                  sourceContext: input.sourceContext,
                  transcript: input.transcript,
                }),
                type: "input_text",
              },
            ],
            role: "user",
          },
        ],
        model: this.model,
        store: false,
        text: {
          format: {
            description:
              "Review-only structured proposal extracted from a voice transcript.",
            name: "voice_note_structured_proposal",
            schema: transcriptStructuringJsonSchema,
            strict: true,
            type: "json_schema",
          },
        },
      }),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new TranscriptStructuringProviderError({
        code: "provider_request_failed",
        safeMessage: "Transcript structuring failed at the provider.",
        statusCode: response.status,
      });
    }

    const payload = (await response.json()) as OpenAIResponsePayload;
    const outputText = extractOutputText(payload);

    if (!outputText) {
      throw new TranscriptStructuringProviderError({
        code: "provider_empty_output",
        safeMessage: "Transcript structuring returned no proposal.",
        statusCode: 502,
      });
    }

    return parseOutputText(outputText);
  }
}

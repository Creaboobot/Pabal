import { z } from "zod";

export const transcriptStructuringProviderNames = ["openai", "mock"] as const;

export type TranscriptStructuringProviderName =
  (typeof transcriptStructuringProviderNames)[number];

export const transcriptStructuringTargetEntityTypes = [
  "PERSON",
  "COMPANY",
  "MEETING",
  "NOTE",
  "TASK",
  "COMMITMENT",
  "NEED",
  "CAPABILITY",
  "INTRODUCTION_SUGGESTION",
] as const;

export const transcriptStructuringPatchKinds = [
  "CREATE_NOTE",
  "UPDATE_PERSON",
  "UPDATE_COMPANY",
  "CREATE_TASK",
  "CREATE_COMMITMENT",
  "CREATE_NEED",
  "CREATE_CAPABILITY",
  "CREATE_INTRODUCTION_SUGGESTION",
  "ADD_SOURCE_REFERENCE",
  "NO_OP",
] as const;

export const transcriptStructuringActionTypes = [
  "CREATE",
  "UPDATE",
  "LINK",
  "NO_OP",
] as const;

const nullableText = (max: number) => z.string().trim().max(max).nullable();

export const transcriptStructuringPatchFieldSchema = z
  .object({
    key: z.string().trim().min(1).max(80),
    sensitive: z.boolean(),
    value: z.string().trim().max(2000),
    valueType: z.enum([
      "STRING",
      "NUMBER",
      "BOOLEAN",
      "DATE",
      "ID",
      "URL",
      "UNKNOWN",
    ]),
  })
  .strict();

export const transcriptStructuringPatchEntitySchema = z
  .object({
    entityId: nullableText(128),
    entityType: z
      .enum(transcriptStructuringTargetEntityTypes)
      .nullable(),
    label: nullableText(180),
    role: z.string().trim().min(1).max(80),
  })
  .strict();

export const transcriptStructuringPatchSourceReferenceSchema = z
  .object({
    label: nullableText(180),
    reason: nullableText(500),
    targetEntityId: nullableText(128),
    targetEntityType: z
      .enum(transcriptStructuringTargetEntityTypes)
      .nullable(),
  })
  .strict();

export const transcriptStructuringPatchSchema = z
  .object({
    fields: z.array(transcriptStructuringPatchFieldSchema).max(16),
    kind: z.enum(transcriptStructuringPatchKinds),
    linkedEntities: z
      .array(transcriptStructuringPatchEntitySchema)
      .max(8),
    reviewOnly: z.boolean(),
    sourceReferences: z
      .array(transcriptStructuringPatchSourceReferenceSchema)
      .max(4),
  })
  .strict();

export const transcriptStructuringItemSchema = z
  .object({
    actionType: z.enum(transcriptStructuringActionTypes),
    confidence: z.number().min(0).max(1).nullable(),
    explanation: z.string().trim().min(1).max(2000),
    needsClarification: z.boolean(),
    proposedPatch: transcriptStructuringPatchSchema,
    targetEntityId: nullableText(128),
    targetEntityType: z
      .enum(transcriptStructuringTargetEntityTypes)
      .nullable(),
    targetLookupDomain: nullableText(255),
    targetLookupEmail: nullableText(320),
    targetLookupName: nullableText(180),
    uncertaintyFlags: z.array(z.string().trim().min(1).max(120)).max(8),
  })
  .strict();

export const transcriptStructuringResultSchema = z
  .object({
    confidence: z.number().min(0).max(1).nullable(),
    explanation: z.string().trim().min(1).max(2000),
    items: z.array(transcriptStructuringItemSchema).min(1).max(20),
    proposalTitle: z.string().trim().min(1).max(180),
    summary: z.string().trim().min(1).max(2000),
  })
  .strict();

export type TranscriptStructuringTargetEntityType =
  (typeof transcriptStructuringTargetEntityTypes)[number];

export type TranscriptStructuringPatchKind =
  (typeof transcriptStructuringPatchKinds)[number];

export type TranscriptStructuringActionType =
  (typeof transcriptStructuringActionTypes)[number];

export type TranscriptStructuringResult = z.infer<
  typeof transcriptStructuringResultSchema
>;

export type TranscriptStructuringItem = z.infer<
  typeof transcriptStructuringItemSchema
>;

export type TranscriptStructuringEntityCandidate = {
  aliases?: string[];
  domain?: string | null;
  email?: string | null;
  entityId: string;
  entityType: Extract<TranscriptStructuringTargetEntityType, "PERSON" | "COMPANY">;
  label: string;
  source: "tenant_directory" | "voice_note_context" | "meeting_participant";
};

export type TranscriptStructuringSourceContext = {
  companyId?: string | null;
  companyName?: string | null;
  meetingId?: string | null;
  meetingTitle?: string | null;
  noteId?: string | null;
  noteLabel?: string | null;
  personId?: string | null;
  personName?: string | null;
  voiceNoteId: string;
  voiceNoteTitle?: string | null;
};

export type TranscriptStructuringInput = {
  candidates: TranscriptStructuringEntityCandidate[];
  sourceContext: TranscriptStructuringSourceContext;
  transcript: string;
};

export class TranscriptStructuringProviderError extends Error {
  readonly code: string;
  readonly safeMessage: string;
  readonly statusCode: number | undefined;

  constructor(input: {
    code: string;
    message?: string;
    safeMessage: string;
    statusCode?: number;
  }) {
    super(input.message ?? input.safeMessage);
    this.name = "TranscriptStructuringProviderError";
    this.code = input.code;
    this.safeMessage = input.safeMessage;
    this.statusCode = input.statusCode;
  }
}

export class TranscriptStructuringProviderConfigurationError extends TranscriptStructuringProviderError {
  constructor(message: string) {
    super({
      code: "provider_configuration_error",
      message,
      safeMessage: "Transcript structuring is not configured.",
      statusCode: 503,
    });
    this.name = "TranscriptStructuringProviderConfigurationError";
  }
}

export type TranscriptStructuringProvider = {
  name: TranscriptStructuringProviderName;
  structureTranscript(
    input: TranscriptStructuringInput,
  ): Promise<TranscriptStructuringResult>;
};

export function parseTranscriptStructuringResult(value: unknown) {
  const parsed = transcriptStructuringResultSchema.safeParse(value);

  if (!parsed.success) {
    throw new TranscriptStructuringProviderError({
      code: "invalid_structured_output",
      message: parsed.error.message,
      safeMessage: "Transcript structuring returned an invalid proposal.",
      statusCode: 502,
    });
  }

  return parsed.data;
}

const nullableStringSchema = {
  type: ["string", "null"],
} as const;

const targetEntityTypeSchema = {
  enum: [...transcriptStructuringTargetEntityTypes, null],
} as const;

const patchFieldSchema = {
  additionalProperties: false,
  properties: {
    key: { maxLength: 80, type: "string" },
    sensitive: { type: "boolean" },
    value: { maxLength: 2000, type: "string" },
    valueType: {
      enum: ["STRING", "NUMBER", "BOOLEAN", "DATE", "ID", "URL", "UNKNOWN"],
      type: "string",
    },
  },
  required: ["key", "sensitive", "value", "valueType"],
  type: "object",
} as const;

const patchEntitySchema = {
  additionalProperties: false,
  properties: {
    entityId: { ...nullableStringSchema, maxLength: 128 },
    entityType: targetEntityTypeSchema,
    label: { ...nullableStringSchema, maxLength: 180 },
    role: { maxLength: 80, type: "string" },
  },
  required: ["entityId", "entityType", "label", "role"],
  type: "object",
} as const;

const patchSourceReferenceSchema = {
  additionalProperties: false,
  properties: {
    label: { ...nullableStringSchema, maxLength: 180 },
    reason: { ...nullableStringSchema, maxLength: 500 },
    targetEntityId: { ...nullableStringSchema, maxLength: 128 },
    targetEntityType: targetEntityTypeSchema,
  },
  required: ["label", "reason", "targetEntityId", "targetEntityType"],
  type: "object",
} as const;

export const transcriptStructuringJsonSchema = {
  additionalProperties: false,
  properties: {
    confidence: { maximum: 1, minimum: 0, type: ["number", "null"] },
    explanation: { maxLength: 2000, type: "string" },
    items: {
      items: {
        additionalProperties: false,
        properties: {
          actionType: {
            enum: transcriptStructuringActionTypes,
            type: "string",
          },
          confidence: {
            maximum: 1,
            minimum: 0,
            type: ["number", "null"],
          },
          explanation: { maxLength: 2000, type: "string" },
          needsClarification: { type: "boolean" },
          proposedPatch: {
            additionalProperties: false,
            properties: {
              fields: {
                items: patchFieldSchema,
                maxItems: 16,
                type: "array",
              },
              kind: {
                enum: transcriptStructuringPatchKinds,
                type: "string",
              },
              linkedEntities: {
                items: patchEntitySchema,
                maxItems: 8,
                type: "array",
              },
              reviewOnly: { type: "boolean" },
              sourceReferences: {
                items: patchSourceReferenceSchema,
                maxItems: 4,
                type: "array",
              },
            },
            required: [
              "fields",
              "kind",
              "linkedEntities",
              "reviewOnly",
              "sourceReferences",
            ],
            type: "object",
          },
          targetEntityId: { ...nullableStringSchema, maxLength: 128 },
          targetEntityType: targetEntityTypeSchema,
          targetLookupDomain: { ...nullableStringSchema, maxLength: 255 },
          targetLookupEmail: { ...nullableStringSchema, maxLength: 320 },
          targetLookupName: { ...nullableStringSchema, maxLength: 180 },
          uncertaintyFlags: {
            items: { maxLength: 120, type: "string" },
            maxItems: 8,
            type: "array",
          },
        },
        required: [
          "actionType",
          "confidence",
          "explanation",
          "needsClarification",
          "proposedPatch",
          "targetEntityId",
          "targetEntityType",
          "targetLookupDomain",
          "targetLookupEmail",
          "targetLookupName",
          "uncertaintyFlags",
        ],
        type: "object",
      },
      maxItems: 20,
      minItems: 1,
      type: "array",
    },
    proposalTitle: { maxLength: 180, type: "string" },
    summary: { maxLength: 2000, type: "string" },
  },
  required: ["proposalTitle", "summary", "explanation", "confidence", "items"],
  type: "object",
} as const;

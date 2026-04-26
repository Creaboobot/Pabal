import {
  type TranscriptStructuringInput,
  type TranscriptStructuringProvider,
  type TranscriptStructuringResult,
} from "@/server/providers/transcript-structuring/types";

function defaultMockResult(
  input: TranscriptStructuringInput,
): TranscriptStructuringResult {
  const firstPerson = input.candidates.find(
    (candidate) => candidate.entityType === "PERSON",
  );

  return {
    confidence: 0.78,
    explanation:
      "Mock transcript structuring generated a review-only proposal.",
    items: [
      {
        actionType: "CREATE",
        confidence: 0.76,
        explanation:
          "Create a note candidate from the transcript for human review.",
        needsClarification: false,
        proposedPatch: {
          fields: [
            {
              key: "summary",
              sensitive: false,
              value: "Review the voice transcript for relationship updates.",
              valueType: "STRING",
            },
          ],
          kind: "CREATE_NOTE",
          linkedEntities: firstPerson
            ? [
                {
                  entityId: firstPerson.entityId,
                  entityType: firstPerson.entityType,
                  label: firstPerson.label,
                  role: "related_person",
                },
              ]
            : [],
          reviewOnly: true,
          sourceReferences: [
            {
              label: "Voice transcript",
              reason: "The proposal was derived from the voice note transcript.",
              targetEntityId: input.sourceContext.voiceNoteId,
              targetEntityType: null,
            },
          ],
        },
        targetEntityId: null,
        targetEntityType: null,
        targetLookupDomain: null,
        targetLookupEmail: null,
        targetLookupName: null,
        uncertaintyFlags: [],
      },
    ],
    proposalTitle: "Mock voice transcript proposal",
    summary: "Review-only structured proposal from a voice transcript.",
  };
}

export class MockTranscriptStructuringProvider
  implements TranscriptStructuringProvider
{
  readonly name = "mock";

  constructor(
    private readonly result:
      | TranscriptStructuringResult
      | ((input: TranscriptStructuringInput) => TranscriptStructuringResult) =
      defaultMockResult,
  ) {}

  async structureTranscript(input: TranscriptStructuringInput) {
    return typeof this.result === "function" ? this.result(input) : this.result;
  }
}

import { z } from "zod";

const nullableText = (label: string, max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }, z.string().max(max, `${label} is too long`).nullable());

const nullableId = (label: string) => nullableText(label, 128);

export const voiceNoteReviewFormSchema = z.object({
  companyId: nullableId("Company"),
  editedTranscriptText: nullableText("Reviewed transcript", 80000),
  meetingId: nullableId("Meeting"),
  noteId: nullableId("Note"),
  personId: nullableId("Person"),
  title: nullableText("Title", 180),
});

export type VoiceNoteReviewFormValues = z.infer<
  typeof voiceNoteReviewFormSchema
>;

export function formDataValue(formData: FormData, key: string) {
  return formData.get(key);
}

export function toFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}

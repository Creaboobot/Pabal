import {
  type SpeechToTextInput,
  type SpeechToTextProvider,
  type SpeechToTextResult,
} from "@/server/providers/speech-to-text/types";

export class MockSpeechToTextProvider implements SpeechToTextProvider {
  readonly name = "mock";

  constructor(
    private readonly result: SpeechToTextResult = {
      confidence: 0.99,
      language: "en",
      text: "Mock transcription for local development.",
    },
  ) {}

  async transcribe(_input: SpeechToTextInput) {
    return this.result;
  }
}

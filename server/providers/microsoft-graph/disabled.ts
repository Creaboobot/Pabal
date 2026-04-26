import {
  MicrosoftGraphProviderUnavailableError,
  type MicrosoftGraphCalendarEventSummary,
  type MicrosoftGraphCalendarEventsInput,
  type MicrosoftGraphConnectionStatusResult,
  type MicrosoftGraphContactSummary,
  type MicrosoftGraphContactsInput,
  type MicrosoftGraphMailThreadSummary,
  type MicrosoftGraphMailThreadsInput,
  type MicrosoftGraphProvider,
  type MicrosoftGraphProviderContext,
} from "@/server/providers/microsoft-graph/types";

export class DisabledMicrosoftGraphProvider implements MicrosoftGraphProvider {
  readonly name = "disabled";

  async getConnectionStatus(
    _context: MicrosoftGraphProviderContext,
  ): Promise<MicrosoftGraphConnectionStatusResult> {
    return {
      capabilities: {
        calendar: false,
        contacts: false,
        mail: false,
      },
      connected: false,
      message: "Readiness only. No Microsoft data is synced yet.",
      provider: this.name,
      status: "DISCONNECTED",
    };
  }

  async getCalendarEvents(
    _input: MicrosoftGraphCalendarEventsInput,
  ): Promise<MicrosoftGraphCalendarEventSummary[]> {
    throw new MicrosoftGraphProviderUnavailableError();
  }

  async getContacts(
    _input: MicrosoftGraphContactsInput,
  ): Promise<MicrosoftGraphContactSummary[]> {
    throw new MicrosoftGraphProviderUnavailableError();
  }

  async getMailThreads(
    _input: MicrosoftGraphMailThreadsInput,
  ): Promise<MicrosoftGraphMailThreadSummary[]> {
    throw new MicrosoftGraphProviderUnavailableError();
  }
}

import type {
  MicrosoftGraphCalendarEventSummary,
  MicrosoftGraphCalendarEventsInput,
  MicrosoftGraphConnectionStatusResult,
  MicrosoftGraphContactSummary,
  MicrosoftGraphContactsInput,
  MicrosoftGraphMailThreadSummary,
  MicrosoftGraphMailThreadsInput,
  MicrosoftGraphProvider,
  MicrosoftGraphProviderContext,
} from "@/server/providers/microsoft-graph/types";

type MockMicrosoftGraphProviderInput = {
  calendarEvents?: MicrosoftGraphCalendarEventSummary[];
  contacts?: MicrosoftGraphContactSummary[];
  mailThreads?: MicrosoftGraphMailThreadSummary[];
  status?: MicrosoftGraphConnectionStatusResult;
};

export class MockMicrosoftGraphProvider implements MicrosoftGraphProvider {
  readonly name = "mock";

  private readonly calendarEvents: MicrosoftGraphCalendarEventSummary[];
  private readonly contacts: MicrosoftGraphContactSummary[];
  private readonly mailThreads: MicrosoftGraphMailThreadSummary[];
  private readonly status: MicrosoftGraphConnectionStatusResult;

  constructor(input: MockMicrosoftGraphProviderInput = {}) {
    this.calendarEvents = input.calendarEvents ?? [
      {
        attendeeCount: 3,
        endsAt: new Date("2026-04-26T10:30:00.000Z"),
        externalId: "mock-calendar-event-1",
        isOnlineMeeting: true,
        organizerEmail: "anna@example.com",
        organizerName: "Anna Keller",
        startsAt: new Date("2026-04-26T10:00:00.000Z"),
        subject: "Mock readiness meeting",
        webLink: "https://example.test/calendar/mock-calendar-event-1",
      },
    ];
    this.contacts = input.contacts ?? [
      {
        companyName: "Nordic Industrials",
        displayName: "Anna Keller",
        email: "anna@example.com",
        externalId: "mock-contact-1",
        jobTitle: "Partner",
        phone: null,
      },
    ];
    this.mailThreads = input.mailThreads ?? [
      {
        externalId: "mock-mail-thread-1",
        lastMessageAt: new Date("2026-04-26T09:00:00.000Z"),
        messages: [
          {
            externalId: "mock-message-1",
            fromEmail: "anna@example.com",
            fromName: "Anna Keller",
            hasAttachments: false,
            receivedAt: new Date("2026-04-26T09:00:00.000Z"),
            subject: "Mock selected email context",
            webLink: "https://example.test/mail/mock-message-1",
          },
        ],
        participantCount: 2,
        subject: "Mock selected email context",
        webLink: "https://example.test/mail/mock-mail-thread-1",
      },
    ];
    this.status = input.status ?? {
      capabilities: {
        calendar: true,
        contacts: true,
        mail: true,
      },
      connected: true,
      message: "Mock Microsoft Graph provider is active for tests only.",
      provider: this.name,
      status: "CONNECTED",
    };
  }

  async getConnectionStatus(
    _context: MicrosoftGraphProviderContext,
  ): Promise<MicrosoftGraphConnectionStatusResult> {
    return this.status;
  }

  async getCalendarEvents(
    input: MicrosoftGraphCalendarEventsInput,
  ): Promise<MicrosoftGraphCalendarEventSummary[]> {
    const limit = input.limit ?? this.calendarEvents.length;

    return this.calendarEvents.slice(0, limit);
  }

  async getContacts(
    input: MicrosoftGraphContactsInput,
  ): Promise<MicrosoftGraphContactSummary[]> {
    return this.contacts.slice(0, input.limit);
  }

  async getMailThreads(
    input: MicrosoftGraphMailThreadsInput,
  ): Promise<MicrosoftGraphMailThreadSummary[]> {
    return this.mailThreads.slice(0, input.limit);
  }
}

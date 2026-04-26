export const microsoftGraphProviderNames = ["disabled", "mock"] as const;

export type MicrosoftGraphProviderName =
  (typeof microsoftGraphProviderNames)[number];

export type MicrosoftGraphConnectionStatus =
  | "DISCONNECTED"
  | "CONFIGURED"
  | "CONNECTED"
  | "ERROR"
  | "NEEDS_REAUTH";

export type MicrosoftGraphCapabilityKey = "calendar" | "mail" | "contacts";

export type MicrosoftGraphProviderContext = {
  connectionId?: string | null;
  tenantId: string;
  userId: string;
};

export type MicrosoftGraphConnectionStatusResult = {
  capabilities: Record<MicrosoftGraphCapabilityKey, boolean>;
  connected: boolean;
  message: string;
  provider: MicrosoftGraphProviderName;
  status: MicrosoftGraphConnectionStatus;
};

export type MicrosoftGraphCalendarEventSummary = {
  attendeeCount?: number | null;
  endsAt: Date;
  externalId: string;
  isOnlineMeeting?: boolean | null;
  organizerEmail?: string | null;
  organizerName?: string | null;
  startsAt: Date;
  subject: string;
  webLink?: string | null;
};

export type MicrosoftGraphMailMessageSummary = {
  externalId: string;
  fromEmail?: string | null;
  fromName?: string | null;
  hasAttachments?: boolean | null;
  receivedAt?: Date | null;
  subject: string;
  webLink?: string | null;
};

export type MicrosoftGraphMailThreadSummary = {
  externalId: string;
  lastMessageAt?: Date | null;
  messages: MicrosoftGraphMailMessageSummary[];
  participantCount?: number | null;
  subject: string;
  webLink?: string | null;
};

export type MicrosoftGraphContactSummary = {
  companyName?: string | null;
  displayName: string;
  email?: string | null;
  externalId: string;
  jobTitle?: string | null;
  phone?: string | null;
};

export type MicrosoftGraphCalendarEventsInput = {
  context: MicrosoftGraphProviderContext;
  from: Date;
  limit?: number;
  to: Date;
};

export type MicrosoftGraphMailThreadsInput = {
  context: MicrosoftGraphProviderContext;
  limit: number;
  query?: string;
};

export type MicrosoftGraphContactsInput = {
  context: MicrosoftGraphProviderContext;
  limit: number;
  query?: string;
};

export class MicrosoftGraphProviderError extends Error {
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
    this.name = "MicrosoftGraphProviderError";
    this.code = input.code;
    this.safeMessage = input.safeMessage;
    this.statusCode = input.statusCode;
  }
}

export class MicrosoftGraphProviderConfigurationError extends MicrosoftGraphProviderError {
  constructor(message: string) {
    super({
      code: "provider_configuration_error",
      message,
      safeMessage: "Microsoft Graph integration is not configured.",
      statusCode: 503,
    });
    this.name = "MicrosoftGraphProviderConfigurationError";
  }
}

export class MicrosoftGraphProviderUnavailableError extends MicrosoftGraphProviderError {
  constructor() {
    super({
      code: "provider_unavailable",
      safeMessage: "Microsoft Graph integration is not connected yet.",
      statusCode: 503,
    });
    this.name = "MicrosoftGraphProviderUnavailableError";
  }
}

export type MicrosoftGraphProvider = {
  getCalendarEvents(
    input: MicrosoftGraphCalendarEventsInput,
  ): Promise<MicrosoftGraphCalendarEventSummary[]>;
  getConnectionStatus(
    context: MicrosoftGraphProviderContext,
  ): Promise<MicrosoftGraphConnectionStatusResult>;
  getContacts(
    input: MicrosoftGraphContactsInput,
  ): Promise<MicrosoftGraphContactSummary[]>;
  getMailThreads(
    input: MicrosoftGraphMailThreadsInput,
  ): Promise<MicrosoftGraphMailThreadSummary[]>;
  name: MicrosoftGraphProviderName;
};

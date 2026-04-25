import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getTenantCompanyProfile: vi.fn(),
  getTenantPersonProfile: vi.fn(),
  getTenantPersonRelatedContext: vi.fn(),
  getTenantCompanyRelatedContext: vi.fn(),
  getTenantCompanyAffiliationForPerson: vi.fn(),
  getTenantMeeting: vi.fn(),
  getTenantMeetingProfile: vi.fn(),
  getTenantNoteProfile: vi.fn(),
  getAppShellSummary: vi.fn(),
  getCurrentUserContext: vi.fn(),
  getTenantCompany: vi.fn(),
  getTenantPerson: vi.fn(),
  listTenantCompaniesWithProfiles: vi.fn(),
  listTenantCompanies: vi.fn(),
  listTenantMeetings: vi.fn(),
  listTenantPeopleWithProfiles: vi.fn(),
  listTenantPeople: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("notFound");
  }),
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
  usePathname: () => "/today",
}));

vi.mock("@/auth", () => ({
  signOut: mocks.signOut,
}));

vi.mock("@/server/services/session", () => ({
  getCurrentUserContext: mocks.getCurrentUserContext,
}));

vi.mock("@/server/services/app-shell-summary", () => ({
  getAppShellSummary: mocks.getAppShellSummary,
}));

vi.mock("@/server/services/people", () => ({
  getTenantPerson: mocks.getTenantPerson,
  getTenantPersonProfile: mocks.getTenantPersonProfile,
  listTenantPeople: mocks.listTenantPeople,
  listTenantPeopleWithProfiles: mocks.listTenantPeopleWithProfiles,
}));

vi.mock("@/server/services/companies", () => ({
  getTenantCompany: mocks.getTenantCompany,
  getTenantCompanyProfile: mocks.getTenantCompanyProfile,
  listTenantCompanies: mocks.listTenantCompanies,
  listTenantCompaniesWithProfiles: mocks.listTenantCompaniesWithProfiles,
}));

vi.mock("@/server/services/company-affiliations", () => ({
  getTenantCompanyAffiliationForPerson:
    mocks.getTenantCompanyAffiliationForPerson,
}));

vi.mock("@/server/services/meetings", () => ({
  getTenantMeeting: mocks.getTenantMeeting,
  getTenantMeetingProfile: mocks.getTenantMeetingProfile,
  listTenantMeetings: mocks.listTenantMeetings,
}));

vi.mock("@/server/services/notes", () => ({
  getTenantNoteProfile: mocks.getTenantNoteProfile,
}));

vi.mock("@/server/services/relationship-context", () => ({
  getTenantCompanyRelatedContext: mocks.getTenantCompanyRelatedContext,
  getTenantPersonRelatedContext: mocks.getTenantPersonRelatedContext,
}));

vi.mock("@/modules/people/actions", () => ({
  archiveAffiliationAction: vi.fn(),
  archiveCompanyAction: vi.fn(),
  archivePersonAction: vi.fn(),
  createCompanyAffiliationAction: vi.fn(),
  createPersonAffiliationAction: vi.fn(),
  endAffiliationAction: vi.fn(),
  updateAffiliationAction: vi.fn(),
}));

vi.mock("@/modules/people/components/archive-record-button", () => ({
  ArchiveRecordButton: () => <div>Archive control</div>,
}));

vi.mock("@/modules/people/components/affiliation-action-button", () => ({
  AffiliationActionButton: () => <div>Affiliation lifecycle control</div>,
}));

vi.mock("@/modules/people/components/person-form", () => ({
  PersonForm: () => <form aria-label="Person form" />,
}));

vi.mock("@/modules/people/components/company-form", () => ({
  CompanyForm: () => <form aria-label="Company form" />,
}));

vi.mock("@/modules/people/components/affiliation-form", () => ({
  AffiliationForm: () => <form aria-label="Affiliation form" />,
}));

vi.mock("@/modules/meetings/components/meeting-form", () => ({
  MeetingForm: () => <form aria-label="Meeting form" />,
}));

vi.mock("@/modules/meetings/components/meeting-participant-form", () => ({
  MeetingParticipantForm: () => <form aria-label="Meeting participant form" />,
}));

vi.mock("@/modules/meetings/components/meeting-action-button", () => ({
  MeetingActionButton: () => <div>Meeting lifecycle control</div>,
}));

vi.mock("@/modules/meetings/components/participant-card", () => ({
  ParticipantCard: () => <article>Participant card</article>,
}));

vi.mock("@/modules/notes/components/note-form", () => ({
  NoteForm: () => <form aria-label="Note form" />,
}));

vi.mock("@/modules/notes/components/pasted-meeting-capture-form", () => ({
  PastedMeetingCaptureForm: () => <form aria-label="Pasted meeting form" />,
}));

vi.mock("@/modules/notes/components/note-action-button", () => ({
  NoteActionButton: () => <div>Note lifecycle control</div>,
}));

const tenantContext = {
  userId: "user_test_1",
  tenantId: "tenant_test_1",
  tenantName: "Demo Workspace",
  roleKey: "OWNER",
};

const appSummary = {
  action: {
    openTasks: 1,
    openCommitments: 1,
    pendingProposals: 1,
    upcomingMeetings: 1,
  },
  capture: {
    notes: 2,
    pendingProposals: 1,
    voiceNotes: 1,
  },
  people: {
    companies: 2,
    people: 4,
  },
  opportunities: {
    capabilities: 1,
    introductionSuggestions: 1,
    needs: 1,
  },
};

const personProfile = {
  _count: {
    meetingParticipants: 1,
    notes: 2,
  },
  companyAffiliations: [],
  displayName: "Anna Keller",
  email: "anna@example.com",
  firstName: "Anna",
  id: "person_test_1",
  jobTitle: "Partner",
  lastName: "Keller",
  phone: "+4512345678",
  relationshipStatus: "ACTIVE",
  relationshipTemperature: "WARM",
};

const companyProfile = {
  _count: {
    notes: 1,
    primaryMeetings: 1,
  },
  companyAffiliations: [],
  description: "Industrial network context",
  id: "company_test_1",
  industry: "Industrials",
  name: "Nordic Industrials",
  website: "https://example.com",
};

const relatedContext = {
  meetings: [],
  notes: [],
};

const meetingProfile = {
  _count: {
    notes: 1,
    participants: 1,
  },
  archivedAt: null,
  createdAt: new Date("2026-04-24T10:00:00.000Z"),
  endedAt: new Date("2026-04-24T11:00:00.000Z"),
  id: "meeting_test_1",
  location: "Teams",
  notes: [
    {
      body: "Detailed note body for relationship context.",
      createdAt: new Date("2026-04-24T10:05:00.000Z"),
      id: "note_test_1",
      noteType: "MEETING",
      sensitivity: "NORMAL",
      sourceType: "MANUAL",
      summary: "Short note summary.",
      updatedAt: new Date("2026-04-24T10:05:00.000Z"),
    },
  ],
  occurredAt: new Date("2026-04-24T10:00:00.000Z"),
  participants: [
    {
      company: companyProfile,
      companyId: companyProfile.id,
      emailSnapshot: "anna@example.com",
      id: "participant_test_1",
      nameSnapshot: "Anna Keller",
      participantRole: "HOST",
      person: personProfile,
      personId: personProfile.id,
    },
  ],
  primaryCompany: companyProfile,
  primaryCompanyId: companyProfile.id,
  sourceType: "MANUAL",
  summary: "Discussed relationship context.",
  title: "MBSE readiness discussion",
  updatedAt: new Date("2026-04-24T10:00:00.000Z"),
};

const noteProfile = {
  body: "Detailed note body for relationship context.",
  company: companyProfile,
  companyId: companyProfile.id,
  createdAt: new Date("2026-04-24T10:05:00.000Z"),
  id: "note_test_1",
  meeting: meetingProfile,
  meetingId: meetingProfile.id,
  noteType: "MEETING",
  person: personProfile,
  personId: personProfile.id,
  sensitivity: "NORMAL",
  sourceReferences: [],
  sourceType: "MANUAL",
  summary: "Short note summary.",
  targetReferences: [],
  updatedAt: new Date("2026-04-24T10:05:00.000Z"),
};

const affiliationProfile = {
  affiliationTitle: "Advisor",
  company: companyProfile,
  companyId: companyProfile.id,
  department: "Transformation",
  endsAt: null,
  id: "affiliation_test_1",
  isPrimary: true,
  person: personProfile,
  personId: personProfile.id,
  startsAt: null,
};

type AsyncPage = () => Promise<ReactElement>;

const routes: Array<[string, () => Promise<{ default: AsyncPage }>]> = [
  ["Today", () => import("@/app/(app)/today/page")],
  ["Capture", () => import("@/app/(app)/capture/page")],
  ["People", () => import("@/app/(app)/people/page")],
  ["Opportunities", () => import("@/app/(app)/opportunities/page")],
  ["Search", () => import("@/app/(app)/search/page")],
];

async function renderRoute(importPage: () => Promise<{ default: AsyncPage }>) {
  const Page = (await importPage()).default;

  render(await Page());
}

describe("protected app routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUserContext.mockResolvedValue(tenantContext);
    mocks.getAppShellSummary.mockResolvedValue(appSummary);
    mocks.getTenantCompany.mockResolvedValue(companyProfile);
    mocks.getTenantMeeting.mockResolvedValue(meetingProfile);
    mocks.getTenantMeetingProfile.mockResolvedValue(meetingProfile);
    mocks.getTenantNoteProfile.mockResolvedValue(noteProfile);
    mocks.getTenantPerson.mockResolvedValue(personProfile);
    mocks.getTenantPersonProfile.mockResolvedValue(personProfile);
    mocks.getTenantCompanyProfile.mockResolvedValue(companyProfile);
    mocks.getTenantCompanyAffiliationForPerson.mockResolvedValue(
      affiliationProfile,
    );
    mocks.getTenantPersonRelatedContext.mockResolvedValue(relatedContext);
    mocks.getTenantCompanyRelatedContext.mockResolvedValue(relatedContext);
    mocks.listTenantPeople.mockResolvedValue([personProfile]);
    mocks.listTenantCompanies.mockResolvedValue([companyProfile]);
    mocks.listTenantMeetings.mockResolvedValue([meetingProfile]);
    mocks.listTenantPeopleWithProfiles.mockResolvedValue([
      {
        ...personProfile,
        companyAffiliations: [],
      },
    ]);
    mocks.listTenantCompaniesWithProfiles.mockResolvedValue([
      {
        ...companyProfile,
        companyAffiliations: [],
      },
    ]);
  });

  it.each(routes)("renders the %s route", async (heading, importPage) => {
    await renderRoute(importPage);

    expect(
      screen.getByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument();
  });

  it("redirects the protected app shell when no session context exists", async () => {
    mocks.getCurrentUserContext.mockResolvedValueOnce(null);
    const Layout = (await import("@/app/(app)/layout")).default;

    await expect(
      Layout({ children: <div>Protected content</div> }),
    ).rejects.toThrow("redirect:/sign-in");
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
  });

  it.each([
    ["Create person", () => import("@/app/(app)/people/new/page")],
    [
      "Companies",
      () => import("@/app/(app)/people/companies/page"),
    ],
    [
      "Create company",
      () => import("@/app/(app)/people/companies/new/page"),
    ],
  ])("renders the %s people workflow route", async (heading, importPage) => {
    await renderRoute(importPage);

    expect(
      screen.getByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument();
  });

  it.each([
    ["Meetings", () => import("@/app/(app)/meetings/page")],
    ["Create meeting", () => import("@/app/(app)/meetings/new/page")],
    ["Create note", () => import("@/app/(app)/notes/new/page")],
    ["Paste meeting notes", () => import("@/app/(app)/capture/meeting/page")],
  ])("renders the %s meeting workflow route", async (heading, importPage) => {
    await renderRoute(importPage);

    expect(
      screen.getByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument();
  });

  it("renders the meeting detail route", async () => {
    const Page = (await import("@/app/(app)/meetings/[meetingId]/page"))
      .default;

    render(
      await Page({ params: Promise.resolve({ meetingId: "meeting_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "MBSE readiness discussion",
      }),
    ).toBeInTheDocument();
  });

  it("renders the meeting edit route", async () => {
    const Page = (await import("@/app/(app)/meetings/[meetingId]/edit/page"))
      .default;

    render(
      await Page({ params: Promise.resolve({ meetingId: "meeting_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "MBSE readiness discussion",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Meeting form")).toBeInTheDocument();
  });

  it("renders the meeting participant create route", async () => {
    const Page = (
      await import("@/app/(app)/meetings/[meetingId]/participants/new/page")
    ).default;

    render(
      await Page({ params: Promise.resolve({ meetingId: "meeting_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "MBSE readiness discussion",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Meeting participant form"),
    ).toBeInTheDocument();
  });

  it("renders the meeting note create route", async () => {
    const Page = (
      await import("@/app/(app)/meetings/[meetingId]/notes/new/page")
    ).default;

    render(
      await Page({ params: Promise.resolve({ meetingId: "meeting_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "MBSE readiness discussion",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Note form")).toBeInTheDocument();
  });

  it("renders the note detail route", async () => {
    const Page = (await import("@/app/(app)/notes/[noteId]/page")).default;

    render(await Page({ params: Promise.resolve({ noteId: "note_test_1" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Meeting note" }),
    ).toBeInTheDocument();
  });

  it("renders the note edit route", async () => {
    const Page = (await import("@/app/(app)/notes/[noteId]/edit/page"))
      .default;

    render(await Page({ params: Promise.resolve({ noteId: "note_test_1" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Meeting note" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Note form")).toBeInTheDocument();
  });

  it("renders the person detail route", async () => {
    const Page = (await import("@/app/(app)/people/[personId]/page")).default;

    render(await Page({ params: Promise.resolve({ personId: "person_test_1" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Anna Keller" }),
    ).toBeInTheDocument();
  });

  it("renders the person edit route", async () => {
    const Page = (await import("@/app/(app)/people/[personId]/edit/page"))
      .default;

    render(await Page({ params: Promise.resolve({ personId: "person_test_1" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Anna Keller" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Person form")).toBeInTheDocument();
  });

  it("renders the company detail route", async () => {
    const Page = (await import("@/app/(app)/people/companies/[companyId]/page"))
      .default;

    render(
      await Page({ params: Promise.resolve({ companyId: "company_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Nordic Industrials" }),
    ).toBeInTheDocument();
  });

  it("renders the company edit route", async () => {
    const Page = (
      await import("@/app/(app)/people/companies/[companyId]/edit/page")
    ).default;

    render(
      await Page({ params: Promise.resolve({ companyId: "company_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Nordic Industrials" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Company form")).toBeInTheDocument();
  });

  it("renders the person affiliation create route", async () => {
    const Page = (await import("@/app/(app)/people/[personId]/affiliations/new/page"))
      .default;

    render(await Page({ params: Promise.resolve({ personId: "person_test_1" }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Anna Keller" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Affiliation form")).toBeInTheDocument();
  });

  it("renders the company affiliation create route", async () => {
    const Page = (
      await import(
        "@/app/(app)/people/companies/[companyId]/affiliations/new/page"
      )
    ).default;

    render(
      await Page({ params: Promise.resolve({ companyId: "company_test_1" }) }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Nordic Industrials" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Affiliation form")).toBeInTheDocument();
  });

  it("renders the affiliation edit route", async () => {
    const Page = (
      await import(
        "@/app/(app)/people/[personId]/affiliations/[affiliationId]/edit/page"
      )
    ).default;

    render(
      await Page({
        params: Promise.resolve({
          affiliationId: "affiliation_test_1",
          personId: "person_test_1",
        }),
      }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Nordic Industrials" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Affiliation form")).toBeInTheDocument();
  });
});

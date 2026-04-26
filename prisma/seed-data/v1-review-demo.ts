import { type Prisma, type PrismaClient } from "@prisma/client";

import { seedAIVoiceReadinessDemoData } from "./ai-voice-readiness";

type SeedClient = PrismaClient | Prisma.TransactionClient;

const demoUserId = "demo-user-pobal";
const demoTenantId = "demo-tenant-workspace";

const userStamp = {
  createdByUserId: demoUserId,
  updatedByUserId: demoUserId,
};

export async function seedV1ReviewDemoData(db: SeedClient) {
  const { tenantId, userId } = await seedAIVoiceReadinessDemoData(db);

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      name: "Pabal V1 Review Workspace",
    },
  });

  await db.person.update({
    where: { id: "demo-person-anna" },
    data: {
      linkedinUrl: "https://www.linkedin.com/in/anna-keller-demo",
      salesNavigatorUrl: "https://www.linkedin.com/sales/lead/demo-anna-keller",
      updatedByUserId: userId,
    },
  });

  await db.person.update({
    where: { id: "demo-person-peter" },
    data: {
      linkedinUrl: "https://www.linkedin.com/in/peter-hansen-demo",
      updatedByUserId: userId,
    },
  });

  const companies = [
    {
      id: "demo-company-harbor-logistics",
      name: "Harbor Logistics Group",
      normalizedName: "harbor logistics group",
      website: "https://harbor-logistics.example",
      industry: "Supply chain",
      description: "Fictional logistics operator exploring practical AI support.",
    },
    {
      id: "demo-company-helio-grid",
      name: "HelioGrid Systems",
      normalizedName: "heliogrid systems",
      website: "https://heliogrid.example",
      industry: "Grid technology",
      description: "Fictional grid technology company modernising partner operations.",
    },
    {
      id: "demo-company-civic-digital",
      name: "Civic Digital Office",
      normalizedName: "civic digital office",
      website: "https://civic-digital.example",
      industry: "Public sector",
      description: "Fictional public sector digital office with privacy-first programmes.",
    },
    {
      id: "demo-company-blueforge-software",
      name: "Blueforge Software",
      normalizedName: "blueforge software",
      website: "https://blueforge.example",
      industry: "B2B software",
      description: "Fictional software company with enterprise workflow expertise.",
    },
    {
      id: "demo-company-northstar-advisory",
      name: "Northstar Advisory",
      normalizedName: "northstar advisory",
      website: "https://northstar-advisory.example",
      industry: "Advisory",
      description: "Fictional advisory boutique supporting operating model change.",
    },
    {
      id: "demo-company-riverlane-health",
      name: "Riverlane Health",
      normalizedName: "riverlane health",
      website: "https://riverlane-health.example",
      industry: "Health technology",
      description: "Archived fictional health technology relationship.",
      archivedAt: new Date("2026-03-12T12:00:00.000Z"),
    },
  ] as const;

  await Promise.all(
    companies.map((company) =>
      db.company.upsert({
        where: { id: company.id },
        create: {
          ...company,
          tenantId,
          ...userStamp,
        },
        update: {
          name: company.name,
          normalizedName: company.normalizedName,
          website: company.website,
          industry: company.industry,
          description: company.description,
          archivedAt: "archivedAt" in company ? company.archivedAt : null,
          updatedByUserId: userId,
        },
      }),
    ),
  );

  const people = [
    {
      id: "demo-person-sofia",
      displayName: "Sofia Marin",
      firstName: "Sofia",
      lastName: "Marin",
      email: "sofia.marin@example.com",
      jobTitle: "Grid Partnerships Director",
      linkedinUrl: "https://www.linkedin.com/in/sofia-marin-demo",
      salesNavigatorUrl: null,
      relationshipStatus: "ACTIVE",
      relationshipTemperature: "HOT",
    },
    {
      id: "demo-person-thomas",
      displayName: "Thomas Reed",
      firstName: "Thomas",
      lastName: "Reed",
      email: "thomas.reed@example.com",
      jobTitle: "Enterprise Workflow Architect",
      linkedinUrl: "https://www.linkedin.com/in/thomas-reed-demo",
      salesNavigatorUrl: "https://www.linkedin.com/sales/lead/demo-thomas-reed",
      relationshipStatus: "ACTIVE",
      relationshipTemperature: "WARM",
    },
    {
      id: "demo-person-raj",
      displayName: "Raj Mehta",
      firstName: "Raj",
      lastName: "Mehta",
      email: "raj.mehta@example.com",
      jobTitle: "Operations Transformation Lead",
      linkedinUrl: null,
      salesNavigatorUrl: null,
      relationshipStatus: "ACTIVE",
      relationshipTemperature: "WARM",
    },
    {
      id: "demo-person-emma",
      displayName: "Emma Novak",
      firstName: "Emma",
      lastName: "Novak",
      email: "emma.novak@example.com",
      jobTitle: "Privacy Programme Manager",
      linkedinUrl: "https://www.linkedin.com/in/emma-novak-demo",
      salesNavigatorUrl: null,
      relationshipStatus: "ACTIVE",
      relationshipTemperature: "NEUTRAL",
    },
    {
      id: "demo-person-nadia",
      displayName: "Nadia Osei",
      firstName: "Nadia",
      lastName: "Osei",
      email: "nadia.osei@example.com",
      jobTitle: "Responsible AI Advisor",
      linkedinUrl: "https://www.linkedin.com/in/nadia-osei-demo",
      salesNavigatorUrl: null,
      relationshipStatus: "ACTIVE",
      relationshipTemperature: "HOT",
    },
    {
      id: "demo-person-oliver",
      displayName: "Oliver Smith",
      firstName: "Oliver",
      lastName: "Smith",
      email: "oliver.smith@example.com",
      jobTitle: "Former Programme Sponsor",
      linkedinUrl: null,
      salesNavigatorUrl: null,
      relationshipStatus: "ARCHIVED",
      relationshipTemperature: "COOL",
      archivedAt: new Date("2026-03-12T12:00:00.000Z"),
    },
  ] as const;

  await Promise.all(
    people.map((person) =>
      db.person.upsert({
        where: { id: person.id },
        create: {
          ...person,
          tenantId,
          createdByUserId: userId,
          updatedByUserId: userId,
        },
        update: {
          displayName: person.displayName,
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email,
          jobTitle: person.jobTitle,
          linkedinUrl: person.linkedinUrl,
          salesNavigatorUrl: person.salesNavigatorUrl,
          relationshipStatus: person.relationshipStatus,
          relationshipTemperature: person.relationshipTemperature,
          archivedAt: "archivedAt" in person ? person.archivedAt : null,
          updatedByUserId: userId,
        },
      }),
    ),
  );

  const affiliations = [
    {
      id: "demo-affiliation-sofia-heliogrid",
      personId: "demo-person-sofia",
      companyId: "demo-company-helio-grid",
      affiliationTitle: "Grid Partnerships Director",
      department: "Partnerships",
      isPrimary: true,
    },
    {
      id: "demo-affiliation-thomas-blueforge",
      personId: "demo-person-thomas",
      companyId: "demo-company-blueforge-software",
      affiliationTitle: "Enterprise Workflow Architect",
      department: "Solutions",
      isPrimary: true,
    },
    {
      id: "demo-affiliation-raj-harbor",
      personId: "demo-person-raj",
      companyId: "demo-company-harbor-logistics",
      affiliationTitle: "Operations Transformation Lead",
      department: "Operations",
      isPrimary: true,
    },
    {
      id: "demo-affiliation-emma-civic",
      personId: "demo-person-emma",
      companyId: "demo-company-civic-digital",
      affiliationTitle: "Privacy Programme Manager",
      department: "Digital Governance",
      isPrimary: true,
    },
    {
      id: "demo-affiliation-nadia-northstar",
      personId: "demo-person-nadia",
      companyId: "demo-company-northstar-advisory",
      affiliationTitle: "Responsible AI Advisor",
      department: "Advisory",
      isPrimary: true,
    },
    {
      id: "demo-affiliation-oliver-riverlane",
      personId: "demo-person-oliver",
      companyId: "demo-company-riverlane-health",
      affiliationTitle: "Former Programme Sponsor",
      department: "Strategy",
      isPrimary: true,
      archivedAt: new Date("2026-03-12T12:00:00.000Z"),
    },
  ] as const;

  await Promise.all(
    affiliations.map((affiliation) =>
      db.companyAffiliation.upsert({
        where: { id: affiliation.id },
        create: {
          ...affiliation,
          tenantId,
          ...userStamp,
        },
        update: {
          affiliationTitle: affiliation.affiliationTitle,
          department: affiliation.department,
          isPrimary: affiliation.isPrimary,
          archivedAt: "archivedAt" in affiliation ? affiliation.archivedAt : null,
          updatedByUserId: userId,
        },
      }),
    ),
  );

  const meetings = [
    {
      id: "demo-meeting-plm-governance",
      title: "PLM governance follow-up",
      occurredAt: new Date("2026-03-26T09:30:00.000Z"),
      endedAt: new Date("2026-03-26T10:15:00.000Z"),
      location: "Microsoft Teams",
      summary:
        "Reviewed ownership choices for the Nordic Industrials PLM governance reset.",
      sourceType: "TEAMS_COPILOT_PASTE",
      primaryCompanyId: "demo-company-nordic-industrials",
    },
    {
      id: "demo-meeting-grid-modernization",
      title: "Grid partner modernization briefing",
      occurredAt: new Date("2026-04-10T13:00:00.000Z"),
      endedAt: new Date("2026-04-10T13:45:00.000Z"),
      location: "Video call",
      summary:
        "Discussed HelioGrid partner enablement and the need for operating-model examples.",
      sourceType: "MANUAL",
      primaryCompanyId: "demo-company-helio-grid",
    },
    {
      id: "demo-meeting-logistics-ai-readiness",
      title: "Harbor Logistics AI readiness check",
      occurredAt: new Date("2026-04-15T08:30:00.000Z"),
      endedAt: new Date("2026-04-15T09:10:00.000Z"),
      location: "Phone",
      summary:
        "Raj outlined the manual operations bottlenecks that make a narrow AI workflow pilot attractive.",
      sourceType: "MANUAL",
      primaryCompanyId: "demo-company-harbor-logistics",
    },
    {
      id: "demo-meeting-public-sector-privacy-review",
      title: "Public sector privacy review",
      occurredAt: new Date("2026-04-18T11:00:00.000Z"),
      endedAt: new Date("2026-04-18T11:50:00.000Z"),
      location: "In person",
      summary:
        "Emma and Nadia compared responsible AI guardrails for a future procurement workshop.",
      sourceType: "MANUAL",
      primaryCompanyId: "demo-company-civic-digital",
    },
    {
      id: "demo-meeting-archived-riverlane",
      title: "Archived Riverlane sponsor check-in",
      occurredAt: new Date("2025-11-05T10:00:00.000Z"),
      endedAt: new Date("2025-11-05T10:30:00.000Z"),
      location: "Video call",
      summary: "Archived demo meeting retained for archive review.",
      sourceType: "MANUAL",
      primaryCompanyId: "demo-company-riverlane-health",
      archivedAt: new Date("2026-03-12T12:00:00.000Z"),
    },
  ] as const;

  await Promise.all(
    meetings.map((meeting) =>
      db.meeting.upsert({
        where: { id: meeting.id },
        create: {
          ...meeting,
          tenantId,
          ...userStamp,
        },
        update: {
          title: meeting.title,
          occurredAt: meeting.occurredAt,
          endedAt: meeting.endedAt,
          location: meeting.location,
          summary: meeting.summary,
          sourceType: meeting.sourceType,
          primaryCompanyId: meeting.primaryCompanyId,
          archivedAt: "archivedAt" in meeting ? meeting.archivedAt : null,
          updatedByUserId: userId,
        },
      }),
    ),
  );

  const participants = [
    {
      id: "demo-participant-anna-plm-governance",
      meetingId: "demo-meeting-plm-governance",
      personId: "demo-person-anna",
      companyId: "demo-company-nordic-industrials",
      nameSnapshot: "Anna Keller",
      emailSnapshot: "anna.keller@example.com",
      participantRole: "HOST",
    },
    {
      id: "demo-participant-michael-plm-governance",
      meetingId: "demo-meeting-plm-governance",
      personId: "demo-person-michael",
      companyId: "demo-company-nordic-industrials",
      nameSnapshot: "Michael Brandt",
      emailSnapshot: "michael.brandt@example.com",
      participantRole: "ATTENDEE",
    },
    {
      id: "demo-participant-sofia-grid",
      meetingId: "demo-meeting-grid-modernization",
      personId: "demo-person-sofia",
      companyId: "demo-company-helio-grid",
      nameSnapshot: "Sofia Marin",
      emailSnapshot: "sofia.marin@example.com",
      participantRole: "HOST",
    },
    {
      id: "demo-participant-thomas-grid",
      meetingId: "demo-meeting-grid-modernization",
      personId: "demo-person-thomas",
      companyId: "demo-company-blueforge-software",
      nameSnapshot: "Thomas Reed",
      emailSnapshot: "thomas.reed@example.com",
      participantRole: "ATTENDEE",
    },
    {
      id: "demo-participant-grid-snapshot",
      meetingId: "demo-meeting-grid-modernization",
      personId: null,
      companyId: "demo-company-helio-grid",
      nameSnapshot: "External delivery partner",
      emailSnapshot: "partner@example.com",
      participantRole: "OPTIONAL",
    },
    {
      id: "demo-participant-raj-logistics",
      meetingId: "demo-meeting-logistics-ai-readiness",
      personId: "demo-person-raj",
      companyId: "demo-company-harbor-logistics",
      nameSnapshot: "Raj Mehta",
      emailSnapshot: "raj.mehta@example.com",
      participantRole: "HOST",
    },
    {
      id: "demo-participant-emma-privacy",
      meetingId: "demo-meeting-public-sector-privacy-review",
      personId: "demo-person-emma",
      companyId: "demo-company-civic-digital",
      nameSnapshot: "Emma Novak",
      emailSnapshot: "emma.novak@example.com",
      participantRole: "HOST",
    },
    {
      id: "demo-participant-nadia-privacy",
      meetingId: "demo-meeting-public-sector-privacy-review",
      personId: "demo-person-nadia",
      companyId: "demo-company-northstar-advisory",
      nameSnapshot: "Nadia Osei",
      emailSnapshot: "nadia.osei@example.com",
      participantRole: "ATTENDEE",
    },
  ] as const;

  await Promise.all(
    participants.map((participant) =>
      db.meetingParticipant.upsert({
        where: { id: participant.id },
        create: {
          ...participant,
          tenantId,
          createdByUserId: userId,
          updatedByUserId: userId,
        },
        update: {
          personId: participant.personId,
          companyId: participant.companyId,
          nameSnapshot: participant.nameSnapshot,
          emailSnapshot: participant.emailSnapshot,
          participantRole: participant.participantRole,
          updatedByUserId: userId,
        },
      }),
    ),
  );

  const notes = [
    {
      id: "demo-note-plm-teams-copilot",
      body:
        "Teams/Copilot paste: Anna asked for a clearer RACI for process ownership. Michael suggested a two-step governance map before the next steering meeting.",
      summary: "PLM governance RACI and steering prep.",
      noteType: "MEETING",
      sourceType: "TEAMS_COPILOT_PASTE",
      sensitivity: "SENSITIVE_BUSINESS",
      meetingId: "demo-meeting-plm-governance",
      personId: "demo-person-anna",
      companyId: "demo-company-nordic-industrials",
    },
    {
      id: "demo-note-anna-linkedin-manual",
      body:
        "Manual LinkedIn context: Anna recently posted about practical ownership models for engineering transformation. User pasted this manually; Pabal did not fetch or preview LinkedIn.",
      summary: "Manual LinkedIn context for Anna.",
      noteType: "PERSON",
      sourceType: "LINKEDIN_USER_PROVIDED",
      sensitivity: "NORMAL",
      personId: "demo-person-anna",
      companyId: "demo-company-nordic-industrials",
      meetingId: null,
    },
    {
      id: "demo-note-grid-modernization",
      body:
        "Sofia wants partner enablement examples that translate grid-modernization strategy into operating routines.",
      summary: "HelioGrid partner enablement context.",
      noteType: "MEETING",
      sourceType: "MANUAL",
      sensitivity: "NORMAL",
      meetingId: "demo-meeting-grid-modernization",
      personId: "demo-person-sofia",
      companyId: "demo-company-helio-grid",
    },
    {
      id: "demo-note-logistics-ai-readiness",
      body:
        "Raj described manual exception handling in port operations. He is open to a narrow pilot if it keeps operators in control.",
      summary: "Harbor Logistics AI readiness context.",
      noteType: "MEETING",
      sourceType: "MANUAL",
      sensitivity: "CONFIDENTIAL",
      meetingId: "demo-meeting-logistics-ai-readiness",
      personId: "demo-person-raj",
      companyId: "demo-company-harbor-logistics",
    },
    {
      id: "demo-note-privacy-review",
      body:
        "Emma and Nadia compared responsible AI guardrails and agreed a procurement workshop should start with governance boundaries, not tools.",
      summary: "Privacy-first AI workshop context.",
      noteType: "MEETING",
      sourceType: "MANUAL",
      sensitivity: "SENSITIVE_BUSINESS",
      meetingId: "demo-meeting-public-sector-privacy-review",
      personId: "demo-person-emma",
      companyId: "demo-company-civic-digital",
    },
    {
      id: "demo-note-archived-riverlane",
      body:
        "Archived context for a paused Riverlane relationship. Kept for archive/restore demonstration only.",
      summary: "Archived Riverlane context.",
      noteType: "COMPANY",
      sourceType: "MANUAL",
      sensitivity: "NORMAL",
      meetingId: "demo-meeting-archived-riverlane",
      personId: "demo-person-oliver",
      companyId: "demo-company-riverlane-health",
      archivedAt: new Date("2026-03-12T12:00:00.000Z"),
    },
  ] as const;

  await Promise.all(
    notes.map((note) =>
      db.note.upsert({
        where: { id: note.id },
        create: {
          ...note,
          tenantId,
          createdByUserId: userId,
          updatedByUserId: userId,
        },
        update: {
          body: note.body,
          summary: note.summary,
          noteType: note.noteType,
          sourceType: note.sourceType,
          sensitivity: note.sensitivity,
          meetingId: note.meetingId,
          personId: note.personId,
          companyId: note.companyId,
          archivedAt: "archivedAt" in note ? note.archivedAt : null,
          updatedByUserId: userId,
        },
      }),
    ),
  );

  const needs = [
    {
      id: "demo-need-plm-governance-raci",
      title: "Clear PLM governance RACI",
      description:
        "Anna needs a short ownership model that can be reviewed before the steering meeting.",
      needType: "REQUIREMENT",
      status: "OPEN",
      priority: "HIGH",
      sensitivity: "SENSITIVE_BUSINESS",
      personId: "demo-person-anna",
      companyId: "demo-company-nordic-industrials",
      meetingId: "demo-meeting-plm-governance",
      noteId: "demo-note-plm-teams-copilot",
      confidence: 0.88,
    },
    {
      id: "demo-need-grid-enablement-examples",
      title: "Partner enablement examples for grid modernization",
      description:
        "Sofia needs examples that translate strategy into operating routines.",
      needType: "REQUEST",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      sensitivity: "NORMAL",
      personId: "demo-person-sofia",
      companyId: "demo-company-helio-grid",
      meetingId: "demo-meeting-grid-modernization",
      noteId: "demo-note-grid-modernization",
      confidence: 0.84,
    },
    {
      id: "demo-need-logistics-ai-pilot",
      title: "Operator-controlled AI pilot framing",
      description:
        "Raj needs a practical pilot frame that keeps exception handling transparent.",
      needType: "OPPORTUNITY",
      status: "OPEN",
      priority: "HIGH",
      sensitivity: "CONFIDENTIAL",
      personId: "demo-person-raj",
      companyId: "demo-company-harbor-logistics",
      meetingId: "demo-meeting-logistics-ai-readiness",
      noteId: "demo-note-logistics-ai-readiness",
      confidence: 0.79,
    },
    {
      id: "demo-need-public-sector-governance-workshop",
      title: "Privacy-first AI procurement workshop",
      description:
        "Emma needs a workshop structure that puts governance boundaries before tooling.",
      needType: "REQUEST",
      status: "OPEN",
      priority: "MEDIUM",
      sensitivity: "SENSITIVE_BUSINESS",
      personId: "demo-person-emma",
      companyId: "demo-company-civic-digital",
      meetingId: "demo-meeting-public-sector-privacy-review",
      noteId: "demo-note-privacy-review",
      confidence: 0.83,
    },
  ] as const;

  await Promise.all(
    needs.map((need) =>
      db.need.upsert({
        where: { id: need.id },
        create: {
          ...need,
          tenantId,
          ...userStamp,
        },
        update: {
          title: need.title,
          description: need.description,
          needType: need.needType,
          status: need.status,
          priority: need.priority,
          sensitivity: need.sensitivity,
          personId: need.personId,
          companyId: need.companyId,
          meetingId: need.meetingId,
          noteId: need.noteId,
          confidence: need.confidence,
          updatedByUserId: userId,
        },
      }),
    ),
  );

  const capabilities = [
    {
      id: "demo-capability-michael-governance-map",
      title: "Michael can map practical PLM governance ownership",
      description:
        "Michael has a lightweight workshop format for RACI and process ownership choices.",
      capabilityType: "EXPERTISE",
      status: "ACTIVE",
      sensitivity: "NORMAL",
      personId: "demo-person-michael",
      companyId: "demo-company-nordic-industrials",
      noteId: "demo-note-plm-teams-copilot",
      confidence: 0.87,
    },
    {
      id: "demo-capability-thomas-workflow-operating-routines",
      title: "Thomas can translate strategy into workflow routines",
      description:
        "Thomas has examples from enterprise workflow rollouts that fit Sofia's enablement need.",
      capabilityType: "EXPERIENCE",
      status: "ACTIVE",
      sensitivity: "NORMAL",
      personId: "demo-person-thomas",
      companyId: "demo-company-blueforge-software",
      noteId: "demo-note-grid-modernization",
      confidence: 0.82,
    },
    {
      id: "demo-capability-nadia-responsible-ai-governance",
      title: "Nadia can frame responsible AI governance",
      description:
        "Nadia can help Emma prepare a governance-first workshop for public-sector stakeholders.",
      capabilityType: "EXPERTISE",
      status: "ACTIVE",
      sensitivity: "SENSITIVE_BUSINESS",
      personId: "demo-person-nadia",
      companyId: "demo-company-northstar-advisory",
      noteId: "demo-note-privacy-review",
      confidence: 0.86,
    },
  ] as const;

  await Promise.all(
    capabilities.map((capability) =>
      db.capability.upsert({
        where: { id: capability.id },
        create: {
          ...capability,
          tenantId,
          ...userStamp,
        },
        update: {
          title: capability.title,
          description: capability.description,
          capabilityType: capability.capabilityType,
          status: capability.status,
          sensitivity: capability.sensitivity,
          personId: capability.personId,
          companyId: capability.companyId,
          noteId: capability.noteId,
          confidence: capability.confidence,
          updatedByUserId: userId,
        },
      }),
    ),
  );

  const commitments = [
    {
      id: "demo-commitment-anna-raci-outline",
      ownerType: "ME",
      counterpartyPersonId: "demo-person-anna",
      counterpartyCompanyId: "demo-company-nordic-industrials",
      title: "Send PLM governance RACI outline",
      description: "Send Anna a one-page ownership model before the steering prep.",
      dueAt: new Date("2026-04-22T09:00:00.000Z"),
      dueWindowStart: new Date("2026-04-21T00:00:00.000Z"),
      dueWindowEnd: new Date("2026-04-24T23:59:59.000Z"),
      status: "OPEN",
      sensitivity: "SENSITIVE_BUSINESS",
      meetingId: "demo-meeting-plm-governance",
      noteId: "demo-note-plm-teams-copilot",
    },
    {
      id: "demo-commitment-sofia-partner-examples",
      ownerType: "OTHER_PERSON",
      ownerPersonId: "demo-person-thomas",
      counterpartyPersonId: "demo-person-sofia",
      counterpartyCompanyId: "demo-company-helio-grid",
      title: "Thomas to share partner enablement examples",
      description: "Thomas offered to share workflow examples that could help Sofia.",
      dueAt: new Date("2026-04-30T12:00:00.000Z"),
      dueWindowStart: new Date("2026-04-28T00:00:00.000Z"),
      dueWindowEnd: new Date("2026-05-02T23:59:59.000Z"),
      status: "WAITING",
      sensitivity: "NORMAL",
      meetingId: "demo-meeting-grid-modernization",
      noteId: "demo-note-grid-modernization",
    },
    {
      id: "demo-commitment-archived-riverlane",
      ownerType: "ME",
      counterpartyPersonId: "demo-person-oliver",
      counterpartyCompanyId: "demo-company-riverlane-health",
      title: "Archived Riverlane follow-up",
      description: "Paused follow-up kept only for archive review.",
      dueAt: new Date("2025-12-01T09:00:00.000Z"),
      status: "CANCELLED",
      sensitivity: "NORMAL",
      meetingId: "demo-meeting-archived-riverlane",
      noteId: "demo-note-archived-riverlane",
      archivedAt: new Date("2026-03-12T12:00:00.000Z"),
    },
  ] as const;

  await Promise.all(
    commitments.map((commitment) =>
      db.commitment.upsert({
        where: { id: commitment.id },
        create: {
          ...commitment,
          tenantId,
          ...userStamp,
        },
        update: {
          ownerType: commitment.ownerType,
          ownerPersonId: "ownerPersonId" in commitment ? commitment.ownerPersonId : null,
          counterpartyPersonId: commitment.counterpartyPersonId,
          counterpartyCompanyId: commitment.counterpartyCompanyId,
          title: commitment.title,
          description: commitment.description,
          dueAt: commitment.dueAt,
          dueWindowStart: "dueWindowStart" in commitment ? commitment.dueWindowStart : null,
          dueWindowEnd: "dueWindowEnd" in commitment ? commitment.dueWindowEnd : null,
          status: commitment.status,
          sensitivity: commitment.sensitivity,
          meetingId: commitment.meetingId,
          noteId: commitment.noteId,
          archivedAt: "archivedAt" in commitment ? commitment.archivedAt : null,
          updatedByUserId: userId,
        },
      }),
    ),
  );

  const introductions = [
    {
      id: "demo-introduction-michael-anna-governance",
      needId: "demo-need-plm-governance-raci",
      capabilityId: "demo-capability-michael-governance-map",
      fromPersonId: "demo-person-michael",
      toPersonId: "demo-person-anna",
      fromCompanyId: "demo-company-nordic-industrials",
      toCompanyId: "demo-company-nordic-industrials",
      rationale:
        "Michael can help Anna turn the PLM ownership discussion into a reviewable RACI.",
      confidence: 0.86,
      status: "PROPOSED",
    },
    {
      id: "demo-introduction-thomas-sofia-grid",
      needId: "demo-need-grid-enablement-examples",
      capabilityId: "demo-capability-thomas-workflow-operating-routines",
      fromPersonId: "demo-person-thomas",
      toPersonId: "demo-person-sofia",
      fromCompanyId: "demo-company-blueforge-software",
      toCompanyId: "demo-company-helio-grid",
      rationale:
        "Thomas has partner enablement examples that map well to Sofia's grid modernization context.",
      confidence: 0.8,
      status: "OPT_IN_REQUESTED",
    },
    {
      id: "demo-introduction-nadia-emma-privacy",
      needId: "demo-need-public-sector-governance-workshop",
      capabilityId: "demo-capability-nadia-responsible-ai-governance",
      fromPersonId: "demo-person-nadia",
      toPersonId: "demo-person-emma",
      fromCompanyId: "demo-company-northstar-advisory",
      toCompanyId: "demo-company-civic-digital",
      rationale:
        "Nadia can help Emma shape a governance-first procurement workshop.",
      confidence: 0.85,
      status: "PROPOSED",
    },
  ] as const;

  await Promise.all(
    introductions.map((introduction) =>
      db.introductionSuggestion.upsert({
        where: { id: introduction.id },
        create: {
          ...introduction,
          tenantId,
          ...userStamp,
        },
        update: {
          needId: introduction.needId,
          capabilityId: introduction.capabilityId,
          fromPersonId: introduction.fromPersonId,
          toPersonId: introduction.toPersonId,
          fromCompanyId: introduction.fromCompanyId,
          toCompanyId: introduction.toCompanyId,
          rationale: introduction.rationale,
          confidence: introduction.confidence,
          status: introduction.status,
          updatedByUserId: userId,
        },
      }),
    ),
  );

  const tasks = [
    {
      id: "demo-task-anna-raci-review",
      title: "Review PLM RACI outline with Anna",
      description: "Use the Teams/Copilot pasted note as source context.",
      status: "OPEN",
      priority: "CRITICAL",
      taskType: "FOLLOW_UP",
      dueAt: new Date("2026-04-23T09:00:00.000Z"),
      reminderAt: new Date("2026-04-22T09:00:00.000Z"),
      whyNowRationale:
        "The steering prep is near and the governance note is still open.",
      confidence: 0.9,
      personId: "demo-person-anna",
      companyId: "demo-company-nordic-industrials",
      meetingId: "demo-meeting-plm-governance",
      noteId: "demo-note-plm-teams-copilot",
      commitmentId: "demo-commitment-anna-raci-outline",
      introductionSuggestionId: "demo-introduction-michael-anna-governance",
    },
    {
      id: "demo-task-sofia-thomas-intro",
      title: "Confirm Sofia and Thomas introduction",
      description:
        "Check both sides are comfortable before sending a short intro note.",
      status: "OPEN",
      priority: "HIGH",
      taskType: "INTRODUCTION",
      dueAt: new Date("2026-04-29T09:00:00.000Z"),
      reminderAt: new Date("2026-04-28T09:00:00.000Z"),
      whyNowRationale:
        "Sofia needs partner enablement examples and Thomas has relevant patterns.",
      confidence: 0.82,
      personId: "demo-person-sofia",
      companyId: "demo-company-helio-grid",
      meetingId: "demo-meeting-grid-modernization",
      noteId: "demo-note-grid-modernization",
      commitmentId: "demo-commitment-sofia-partner-examples",
      introductionSuggestionId: "demo-introduction-thomas-sofia-grid",
    },
    {
      id: "demo-task-meeting-prep-emma-nadia",
      title: "Prepare privacy workshop brief",
      description:
        "Use the meeting prep brief before following up with Emma and Nadia.",
      status: "SNOOZED",
      priority: "MEDIUM",
      taskType: "MEETING_PREP",
      dueAt: new Date("2026-05-03T09:00:00.000Z"),
      snoozedUntil: new Date("2026-04-30T09:00:00.000Z"),
      whyNowRationale:
        "Emma and Nadia agreed the workshop should lead with governance boundaries.",
      confidence: 0.78,
      personId: "demo-person-emma",
      companyId: "demo-company-civic-digital",
      meetingId: "demo-meeting-public-sector-privacy-review",
      noteId: "demo-note-privacy-review",
      introductionSuggestionId: "demo-introduction-nadia-emma-privacy",
    },
    {
      id: "demo-task-archived-riverlane",
      title: "Archived Riverlane task",
      description: "Archived follow-up retained for archive/restore review.",
      status: "CANCELLED",
      priority: "LOW",
      taskType: "OTHER",
      dueAt: new Date("2025-12-01T09:00:00.000Z"),
      whyNowRationale: "Archived demo record.",
      confidence: 0.5,
      personId: "demo-person-oliver",
      companyId: "demo-company-riverlane-health",
      meetingId: "demo-meeting-archived-riverlane",
      noteId: "demo-note-archived-riverlane",
      commitmentId: "demo-commitment-archived-riverlane",
      archivedAt: new Date("2026-03-12T12:00:00.000Z"),
    },
  ] as const;

  await Promise.all(
    tasks.map((task) =>
      db.task.upsert({
        where: { id: task.id },
        create: {
          ...task,
          tenantId,
          ...userStamp,
        },
        update: {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          taskType: task.taskType,
          dueAt: task.dueAt,
          reminderAt: "reminderAt" in task ? task.reminderAt : null,
          snoozedUntil: "snoozedUntil" in task ? task.snoozedUntil : null,
          whyNowRationale: task.whyNowRationale,
          confidence: task.confidence,
          personId: task.personId,
          companyId: task.companyId,
          meetingId: task.meetingId,
          noteId: task.noteId,
          commitmentId: "commitmentId" in task ? task.commitmentId : null,
          introductionSuggestionId:
            "introductionSuggestionId" in task ? task.introductionSuggestionId : null,
          archivedAt: "archivedAt" in task ? task.archivedAt : null,
          updatedByUserId: userId,
        },
      }),
    ),
  );

  const voiceNotes = [
    {
      id: "demo-voice-note-grid-follow-up",
      status: "REVIEWED",
      title: "Grid partner follow-up dictation",
      personId: "demo-person-sofia",
      companyId: "demo-company-helio-grid",
      meetingId: "demo-meeting-grid-modernization",
      noteId: "demo-note-grid-modernization",
      transcriptText:
        "Sofia wants practical partner enablement examples. Ask Thomas whether he can share the workflow rollout story.",
      editedTranscriptText:
        "Sofia needs partner enablement examples. Ask Thomas for workflow rollout patterns.",
      language: "en",
      transcriptConfidence: 0.88,
      audioMimeType: "audio/webm",
      audioSizeBytes: 980000,
      audioDurationSeconds: 48,
      audioRetentionStatus: "NOT_STORED",
      rawAudioDeletedAt: new Date("2026-04-10T14:00:00.000Z"),
    },
    {
      id: "demo-voice-note-privacy-workshop",
      status: "TRANSCRIBED",
      title: "Privacy workshop voice note",
      personId: "demo-person-emma",
      companyId: "demo-company-civic-digital",
      meetingId: "demo-meeting-public-sector-privacy-review",
      noteId: "demo-note-privacy-review",
      transcriptText:
        "Emma and Nadia are aligned that the procurement workshop should start with risk ownership and explainability.",
      editedTranscriptText: null,
      language: "en",
      transcriptConfidence: 0.84,
      audioMimeType: "audio/webm",
      audioSizeBytes: 760000,
      audioDurationSeconds: 39,
      audioRetentionStatus: "NOT_STORED",
      rawAudioDeletedAt: new Date("2026-04-18T12:10:00.000Z"),
    },
    {
      id: "demo-voice-note-archived-riverlane",
      status: "REVIEWED",
      title: "Archived Riverlane voice note",
      personId: "demo-person-oliver",
      companyId: "demo-company-riverlane-health",
      meetingId: "demo-meeting-archived-riverlane",
      noteId: "demo-note-archived-riverlane",
      transcriptText:
        "Archived voice note retained as text only. Raw audio was not stored.",
      editedTranscriptText:
        "Archived voice note retained as text only.",
      language: "en",
      transcriptConfidence: 0.8,
      audioMimeType: "audio/webm",
      audioSizeBytes: 540000,
      audioDurationSeconds: 33,
      audioRetentionStatus: "NOT_STORED",
      rawAudioDeletedAt: new Date("2026-03-12T12:05:00.000Z"),
      archivedAt: new Date("2026-03-12T12:00:00.000Z"),
    },
  ] as const;

  await Promise.all(
    voiceNotes.map((voiceNote) =>
      db.voiceNote.upsert({
        where: { id: voiceNote.id },
        create: {
          ...voiceNote,
          tenantId,
          createdByUserId: userId,
          updatedByUserId: userId,
        },
        update: {
          status: voiceNote.status,
          title: voiceNote.title,
          personId: voiceNote.personId,
          companyId: voiceNote.companyId,
          meetingId: voiceNote.meetingId,
          noteId: voiceNote.noteId,
          transcriptText: voiceNote.transcriptText,
          editedTranscriptText: voiceNote.editedTranscriptText,
          language: voiceNote.language,
          transcriptConfidence: voiceNote.transcriptConfidence,
          audioMimeType: voiceNote.audioMimeType,
          audioSizeBytes: voiceNote.audioSizeBytes,
          audioDurationSeconds: voiceNote.audioDurationSeconds,
          audioRetentionStatus: voiceNote.audioRetentionStatus,
          rawAudioDeletedAt: voiceNote.rawAudioDeletedAt,
          archivedAt: "archivedAt" in voiceNote ? voiceNote.archivedAt : null,
          updatedByUserId: userId,
        },
      }),
    ),
  );

  const proposals = [
    {
      id: "demo-ai-proposal-plm-teams-copilot",
      proposalType: "MEETING_EXTRACTION",
      status: "IN_REVIEW",
      sourceNoteId: "demo-note-plm-teams-copilot",
      sourceMeetingId: "demo-meeting-plm-governance",
      sourceVoiceNoteId: null,
      targetEntityType: "NEED",
      targetEntityId: "demo-need-plm-governance-raci",
      title: "Review PLM governance follow-up proposals",
      summary:
        "Review-only proposal generated from a pasted meeting note in the demo story.",
      explanation:
        "The pasted note suggests a follow-up task and need update. No business record is changed automatically.",
      confidence: 0.78,
    },
    {
      id: "demo-ai-proposal-grid-voice-note",
      proposalType: "VOICE_NOTE_EXTRACTION",
      status: "PENDING_REVIEW",
      sourceNoteId: "demo-note-grid-modernization",
      sourceMeetingId: "demo-meeting-grid-modernization",
      sourceVoiceNoteId: "demo-voice-note-grid-follow-up",
      targetEntityType: "INTRODUCTION_SUGGESTION",
      targetEntityId: "demo-introduction-thomas-sofia-grid",
      title: "Review grid partner introduction proposal",
      summary:
        "Review-only proposal linking Sofia's need to Thomas's capability.",
      explanation:
        "The voice note suggests asking Thomas for workflow examples; this remains proposal review only.",
      confidence: 0.82,
    },
    {
      id: "demo-ai-proposal-privacy-clarification",
      proposalType: "VOICE_NOTE_EXTRACTION",
      status: "PENDING_REVIEW",
      sourceNoteId: "demo-note-privacy-review",
      sourceMeetingId: "demo-meeting-public-sector-privacy-review",
      sourceVoiceNoteId: "demo-voice-note-privacy-workshop",
      targetEntityType: null,
      targetEntityId: null,
      title: "Clarify public-sector workshop next step",
      summary:
        "Demo proposal showing an unresolved item that needs human clarification.",
      explanation:
        "The transcript contains useful context, but the next action is ambiguous.",
      confidence: 0.52,
    },
  ] as const;

  await Promise.all(
    proposals.map((proposal) =>
      db.aIProposal.upsert({
        where: { id: proposal.id },
        create: {
          ...proposal,
          tenantId,
          createdByUserId: userId,
        },
        update: {
          proposalType: proposal.proposalType,
          status: proposal.status,
          sourceNoteId: proposal.sourceNoteId,
          sourceMeetingId: proposal.sourceMeetingId,
          sourceVoiceNoteId: proposal.sourceVoiceNoteId,
          targetEntityType: proposal.targetEntityType,
          targetEntityId: proposal.targetEntityId,
          title: proposal.title,
          summary: proposal.summary,
          explanation: proposal.explanation,
          confidence: proposal.confidence,
        },
      }),
    ),
  );

  const proposalItems = [
    {
      id: "demo-ai-proposal-item-plm-task",
      aiProposalId: "demo-ai-proposal-plm-teams-copilot",
      actionType: "UPDATE",
      status: "PENDING_REVIEW",
      targetEntityType: "TASK",
      targetEntityId: "demo-task-anna-raci-review",
      proposedPatch: {
        whyNowRationale:
          "Anna asked for a governance RACI before the steering meeting.",
      },
      explanation: "Would enrich the task rationale after explicit review.",
      confidence: 0.78,
    },
    {
      id: "demo-ai-proposal-item-plm-commitment",
      aiProposalId: "demo-ai-proposal-plm-teams-copilot",
      actionType: "CREATE",
      status: "NEEDS_CLARIFICATION",
      targetEntityType: "COMMITMENT",
      targetEntityId: null,
      proposedPatch: {
        title: "Confirm steering-meeting owner for PLM governance review",
      },
      explanation:
        "The note implies an owner may be needed, but the responsible person is not clear.",
      confidence: 0.47,
    },
    {
      id: "demo-ai-proposal-item-grid-intro",
      aiProposalId: "demo-ai-proposal-grid-voice-note",
      actionType: "UPDATE",
      status: "PENDING_REVIEW",
      targetEntityType: "INTRODUCTION_SUGGESTION",
      targetEntityId: "demo-introduction-thomas-sofia-grid",
      proposedPatch: {
        rationale:
          "Sofia needs partner enablement examples, and Thomas can share rollout patterns.",
      },
      explanation: "Would sharpen the intro rationale after review.",
      confidence: 0.82,
    },
    {
      id: "demo-ai-proposal-item-privacy-noop",
      aiProposalId: "demo-ai-proposal-privacy-clarification",
      actionType: "NO_OP",
      status: "NEEDS_CLARIFICATION",
      targetEntityType: null,
      targetEntityId: null,
      proposedPatch: {
        clarificationNeeded: "Choose whether this should become a task or note.",
      },
      explanation:
        "The demo keeps ambiguous AI output as review-only clarification.",
      confidence: 0.52,
    },
  ] as const;

  await Promise.all(
    proposalItems.map((item) =>
      db.aIProposalItem.upsert({
        where: { id: item.id },
        create: {
          ...item,
          tenantId,
          createdByUserId: userId,
        },
        update: {
          aiProposalId: item.aiProposalId,
          actionType: item.actionType,
          status: item.status,
          targetEntityType: item.targetEntityType,
          targetEntityId: item.targetEntityId,
          proposedPatch: item.proposedPatch,
          explanation: item.explanation,
          confidence: item.confidence,
        },
      }),
    ),
  );

  const sourceReferences = [
    {
      id: "demo-source-plm-teams-note-to-need",
      sourceEntityType: "NOTE",
      sourceEntityId: "demo-note-plm-teams-copilot",
      targetEntityType: "NEED",
      targetEntityId: "demo-need-plm-governance-raci",
      label: "demo-evidence",
      reason: "The pasted Teams/Copilot note is the source for this need.",
      confidence: 0.88,
    },
    {
      id: "demo-source-plm-note-to-proposal",
      sourceEntityType: "NOTE",
      sourceEntityId: "demo-note-plm-teams-copilot",
      targetEntityType: "AI_PROPOSAL",
      targetEntityId: "demo-ai-proposal-plm-teams-copilot",
      label: "proposal-source",
      reason: "The proposal is grounded in the pasted meeting note.",
      confidence: 0.78,
    },
    {
      id: "demo-source-linkedin-note-to-person",
      sourceEntityType: "NOTE",
      sourceEntityId: "demo-note-anna-linkedin-manual",
      targetEntityType: "PERSON",
      targetEntityId: "demo-person-anna",
      label: "manual-linkedin-context",
      reason: "User-provided LinkedIn note belongs to Anna's relationship record.",
      confidence: 1,
    },
    {
      id: "demo-source-grid-note-to-need",
      sourceEntityType: "NOTE",
      sourceEntityId: "demo-note-grid-modernization",
      targetEntityType: "NEED",
      targetEntityId: "demo-need-grid-enablement-examples",
      label: "need-evidence",
      reason: "Meeting note captures Sofia's partner enablement need.",
      confidence: 0.84,
    },
    {
      id: "demo-source-grid-voice-to-proposal",
      sourceEntityType: "VOICE_NOTE",
      sourceEntityId: "demo-voice-note-grid-follow-up",
      targetEntityType: "AI_PROPOSAL",
      targetEntityId: "demo-ai-proposal-grid-voice-note",
      label: "voice-proposal-source",
      reason: "Voice note transcript grounds the review-only proposal.",
      confidence: 0.82,
    },
    {
      id: "demo-source-privacy-note-to-capability",
      sourceEntityType: "NOTE",
      sourceEntityId: "demo-note-privacy-review",
      targetEntityType: "CAPABILITY",
      targetEntityId: "demo-capability-nadia-responsible-ai-governance",
      label: "capability-evidence",
      reason: "Meeting note captures Nadia's responsible AI governance capability.",
      confidence: 0.86,
    },
  ] as const;

  await Promise.all(
    sourceReferences.map((sourceReference) =>
      db.sourceReference.upsert({
        where: { id: sourceReference.id },
        create: {
          ...sourceReference,
          tenantId,
          createdByUserId: userId,
        },
        update: {
          label: sourceReference.label,
          reason: sourceReference.reason,
          confidence: sourceReference.confidence,
        },
      }),
    ),
  );

  const auditLogs = [
    {
      id: "demo-audit-workspace-updated",
      action: "workspace.updated",
      entityType: "tenant",
      entityId: demoTenantId,
      metadata: {
        changedFields: ["name"],
        demo: true,
      },
      createdAt: new Date("2026-04-20T09:00:00.000Z"),
    },
    {
      id: "demo-audit-linkedin-context-created",
      action: "note.created",
      entityType: "note",
      entityId: "demo-note-anna-linkedin-manual",
      metadata: {
        sourceType: "LINKEDIN_USER_PROVIDED",
        hasBody: true,
        linkedPersonId: "demo-person-anna",
      },
      createdAt: new Date("2026-04-20T09:05:00.000Z"),
    },
    {
      id: "demo-audit-voice-transcribed",
      action: "voice_note.transcribed",
      entityType: "voice_note",
      entityId: "demo-voice-note-grid-follow-up",
      metadata: {
        status: "REVIEWED",
        audioRetentionStatus: "NOT_STORED",
        transcriptLength: 105,
      },
      createdAt: new Date("2026-04-20T09:10:00.000Z"),
    },
    {
      id: "demo-audit-workspace-export",
      action: "privacy.workspace_export_requested",
      entityType: "privacy_export",
      entityId: demoTenantId,
      metadata: {
        exportType: "WORKSPACE",
        sectionCounts: {
          people: 10,
          companies: 8,
          notes: 9,
        },
        truncated: false,
      },
      createdAt: new Date("2026-04-20T09:15:00.000Z"),
    },
    {
      id: "demo-audit-person-archived",
      action: "person.archived",
      entityType: "person",
      entityId: "demo-person-oliver",
      metadata: {
        changedFields: ["archivedAt", "relationshipStatus"],
        hasArchivedAt: true,
      },
      createdAt: new Date("2026-03-12T12:00:00.000Z"),
    },
    {
      id: "demo-audit-company-archived",
      action: "company.archived",
      entityType: "company",
      entityId: "demo-company-riverlane-health",
      metadata: {
        changedFields: ["archivedAt"],
        hasArchivedAt: true,
      },
      createdAt: new Date("2026-03-12T12:01:00.000Z"),
    },
    {
      id: "demo-audit-note-archived",
      action: "note.archived",
      entityType: "note",
      entityId: "demo-note-archived-riverlane",
      metadata: {
        changedFields: ["archivedAt"],
        hasArchivedAt: true,
      },
      createdAt: new Date("2026-03-12T12:02:00.000Z"),
    },
    {
      id: "demo-audit-task-archived",
      action: "task.archived",
      entityType: "task",
      entityId: "demo-task-archived-riverlane",
      metadata: {
        changedFields: ["archivedAt"],
        hasArchivedAt: true,
      },
      createdAt: new Date("2026-03-12T12:03:00.000Z"),
    },
    {
      id: "demo-audit-voice-note-archived",
      action: "voice_note.archived",
      entityType: "voice_note",
      entityId: "demo-voice-note-archived-riverlane",
      metadata: {
        changedFields: ["archivedAt"],
        audioRetentionStatus: "NOT_STORED",
      },
      createdAt: new Date("2026-03-12T12:04:00.000Z"),
    },
  ] as const;

  await Promise.all(
    auditLogs.map((auditLog) =>
      db.auditLog.upsert({
        where: { id: auditLog.id },
        create: {
          ...auditLog,
          tenantId,
          actorUserId: userId,
        },
        update: {
          tenantId,
          actorUserId: userId,
          action: auditLog.action,
          entityType: auditLog.entityType,
          entityId: auditLog.entityId,
          metadata: auditLog.metadata,
          createdAt: auditLog.createdAt,
        },
      }),
    ),
  );

  return {
    tenantId,
    userId,
  };
}

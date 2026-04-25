import { type Prisma, type PrismaClient, type RoleKey } from "@prisma/client";

type SeedClient = PrismaClient | Prisma.TransactionClient;

const roles: Array<{
  key: RoleKey;
  name: string;
  description: string;
}> = [
  {
    key: "OWNER",
    name: "Owner",
    description: "Workspace owner with full foundation administration rights.",
  },
  {
    key: "ADMIN",
    name: "Admin",
    description: "Workspace administrator for future team management.",
  },
  {
    key: "MEMBER",
    name: "Member",
    description: "Standard workspace member.",
  },
  {
    key: "VIEWER",
    name: "Viewer",
    description: "Read-only workspace member for future review workflows.",
  },
];

export async function seedFoundationRoles(db: SeedClient) {
  await Promise.all(
    roles.map((role) =>
      db.role.upsert({
        where: { key: role.key },
        create: role,
        update: {
          name: role.name,
          description: role.description,
        },
      }),
    ),
  );
}

export async function seedRelationshipBackboneDemoData(db: SeedClient) {
  await seedFoundationRoles(db);

  const user = await db.user.upsert({
    where: { email: "demo@pobal.local" },
    create: {
      id: "demo-user-pobal",
      email: "demo@pobal.local",
      emailVerified: new Date("2026-01-01T00:00:00.000Z"),
      name: "Demo User",
    },
    update: {
      name: "Demo User",
    },
  });

  const tenant = await db.tenant.upsert({
    where: { slug: "demo-workspace" },
    create: {
      id: "demo-tenant-workspace",
      name: "Demo Workspace",
      slug: "demo-workspace",
      defaultForUserId: user.id,
    },
    update: {
      name: "Demo Workspace",
    },
  });

  const ownerRole = await db.role.findUniqueOrThrow({
    where: { key: "OWNER" },
  });

  await db.membership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: user.id,
      },
    },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      roleId: ownerRole.id,
    },
    update: {
      roleId: ownerRole.id,
      status: "ACTIVE",
    },
  });

  const companies = [
    {
      id: "demo-company-nordic-industrials",
      name: "Nordic Industrials",
      normalizedName: "nordic industrials",
      website: "https://example.com/nordic-industrials",
      industry: "Industrial manufacturing",
      description: "Demo industrial manufacturing company.",
    },
    {
      id: "demo-company-vestas-energy",
      name: "Vestas Energy",
      normalizedName: "vestas energy",
      website: "https://example.com/vestas-energy",
      industry: "Energy",
      description: "Demo renewable energy company.",
    },
  ];

  await Promise.all(
    companies.map((company) =>
      db.company.upsert({
        where: { id: company.id },
        create: {
          ...company,
          tenantId: tenant.id,
          createdByUserId: user.id,
          updatedByUserId: user.id,
        },
        update: {
          name: company.name,
          normalizedName: company.normalizedName,
          website: company.website,
          industry: company.industry,
          description: company.description,
          updatedByUserId: user.id,
        },
      }),
    ),
  );

  const people = [
    {
      id: "demo-person-anna",
      displayName: "Anna Keller",
      firstName: "Anna",
      lastName: "Keller",
      email: "anna.keller@example.com",
      jobTitle: "PLM Transformation Lead",
      relationshipStatus: "ACTIVE" as const,
      relationshipTemperature: "WARM" as const,
    },
    {
      id: "demo-person-michael",
      displayName: "Michael Brandt",
      firstName: "Michael",
      lastName: "Brandt",
      email: "michael.brandt@example.com",
      jobTitle: "Process Governance Advisor",
      relationshipStatus: "ACTIVE" as const,
      relationshipTemperature: "WARM" as const,
    },
    {
      id: "demo-person-peter",
      displayName: "Peter Hansen",
      firstName: "Peter",
      lastName: "Hansen",
      email: "peter.hansen@example.com",
      jobTitle: "Engineering Director",
      relationshipStatus: "ACTIVE" as const,
      relationshipTemperature: "NEUTRAL" as const,
    },
    {
      id: "demo-person-laura",
      displayName: "Laura Meyer",
      firstName: "Laura",
      lastName: "Meyer",
      email: "laura.meyer@example.com",
      jobTitle: "Internal Delivery Lead",
      relationshipStatus: "ACTIVE" as const,
      relationshipTemperature: "WARM" as const,
    },
  ];

  await Promise.all(
    people.map((person) =>
      db.person.upsert({
        where: { id: person.id },
        create: {
          ...person,
          tenantId: tenant.id,
          createdByUserId: user.id,
          updatedByUserId: user.id,
        },
        update: {
          displayName: person.displayName,
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email,
          jobTitle: person.jobTitle,
          relationshipStatus: person.relationshipStatus,
          relationshipTemperature: person.relationshipTemperature,
          updatedByUserId: user.id,
        },
      }),
    ),
  );

  const affiliations = [
    {
      id: "demo-affiliation-anna-nordic",
      personId: "demo-person-anna",
      companyId: "demo-company-nordic-industrials",
      affiliationTitle: "PLM Transformation Lead",
      department: "Engineering Transformation",
      isPrimary: true,
    },
    {
      id: "demo-affiliation-michael-nordic",
      personId: "demo-person-michael",
      companyId: "demo-company-nordic-industrials",
      affiliationTitle: "External Process Governance Advisor",
      department: "Advisory",
      isPrimary: true,
    },
    {
      id: "demo-affiliation-peter-vestas",
      personId: "demo-person-peter",
      companyId: "demo-company-vestas-energy",
      affiliationTitle: "Engineering Director",
      department: "Engineering",
      isPrimary: true,
    },
    {
      id: "demo-affiliation-laura-nordic",
      personId: "demo-person-laura",
      companyId: "demo-company-nordic-industrials",
      affiliationTitle: "Internal Delivery Lead",
      department: "Consulting",
      isPrimary: true,
    },
  ];

  await Promise.all(
    affiliations.map((affiliation) =>
      db.companyAffiliation.upsert({
        where: { id: affiliation.id },
        create: {
          ...affiliation,
          tenantId: tenant.id,
          createdByUserId: user.id,
          updatedByUserId: user.id,
        },
        update: {
          affiliationTitle: affiliation.affiliationTitle,
          department: affiliation.department,
          isPrimary: affiliation.isPrimary,
          updatedByUserId: user.id,
        },
      }),
    ),
  );

  await db.meeting.upsert({
    where: { id: "demo-meeting-mbse-readiness" },
    create: {
      id: "demo-meeting-mbse-readiness",
      tenantId: tenant.id,
      title: "MBSE training readiness discussion",
      occurredAt: new Date("2026-02-03T10:00:00.000Z"),
      endedAt: new Date("2026-02-03T10:45:00.000Z"),
      location: "Microsoft Teams",
      summary: "Discussed practical MBSE training examples and next steps.",
      primaryCompanyId: "demo-company-vestas-energy",
      createdByUserId: user.id,
      updatedByUserId: user.id,
    },
    update: {
      title: "MBSE training readiness discussion",
      summary: "Discussed practical MBSE training examples and next steps.",
      updatedByUserId: user.id,
    },
  });

  const participants = [
    {
      id: "demo-participant-peter",
      personId: "demo-person-peter",
      companyId: "demo-company-vestas-energy",
      participantRole: "HOST" as const,
      nameSnapshot: "Peter Hansen",
      emailSnapshot: "peter.hansen@example.com",
    },
    {
      id: "demo-participant-laura",
      personId: "demo-person-laura",
      companyId: "demo-company-nordic-industrials",
      participantRole: "ATTENDEE" as const,
      nameSnapshot: "Laura Meyer",
      emailSnapshot: "laura.meyer@example.com",
    },
  ];

  await Promise.all(
    participants.map((participant) =>
      db.meetingParticipant.upsert({
        where: { id: participant.id },
        create: {
          ...participant,
          tenantId: tenant.id,
          meetingId: "demo-meeting-mbse-readiness",
          createdByUserId: user.id,
          updatedByUserId: user.id,
        },
        update: {
          participantRole: participant.participantRole,
          nameSnapshot: participant.nameSnapshot,
          emailSnapshot: participant.emailSnapshot,
          updatedByUserId: user.id,
        },
      }),
    ),
  );

  const notes = [
    {
      id: "demo-note-meeting-mbse",
      body: "Peter asked for more practical MBSE training examples and a sample three-day agenda.",
      summary: "MBSE practical training examples requested.",
      noteType: "MEETING" as const,
      sensitivity: "NORMAL" as const,
      meetingId: "demo-meeting-mbse-readiness",
    },
    {
      id: "demo-note-anna-process-ownership",
      body: "Anna is working through process ownership questions in a PLM transformation.",
      summary: "Anna has PLM process ownership context.",
      noteType: "PERSON" as const,
      sensitivity: "SENSITIVE_BUSINESS" as const,
      personId: "demo-person-anna",
      companyId: "demo-company-nordic-industrials",
    },
    {
      id: "demo-note-nordic-governance",
      body: "Nordic Industrials has ongoing governance work around engineering and IT ownership.",
      summary: "Governance context for Nordic Industrials.",
      noteType: "COMPANY" as const,
      sensitivity: "NORMAL" as const,
      companyId: "demo-company-nordic-industrials",
    },
  ];

  await Promise.all(
    notes.map((note) =>
      db.note.upsert({
        where: { id: note.id },
        create: {
          ...note,
          tenantId: tenant.id,
          createdByUserId: user.id,
          updatedByUserId: user.id,
        },
        update: {
          body: note.body,
          summary: note.summary,
          noteType: note.noteType,
          sensitivity: note.sensitivity,
          updatedByUserId: user.id,
        },
      }),
    ),
  );

  const sourceReferences = [
    {
      id: "demo-source-meeting-note-to-meeting",
      sourceEntityType: "NOTE" as const,
      sourceEntityId: "demo-note-meeting-mbse",
      targetEntityType: "MEETING" as const,
      targetEntityId: "demo-meeting-mbse-readiness",
      label: "meeting-note",
      reason: "Meeting note belongs to this discussion.",
      confidence: 1,
    },
    {
      id: "demo-source-anna-note-to-person",
      sourceEntityType: "NOTE" as const,
      sourceEntityId: "demo-note-anna-process-ownership",
      targetEntityType: "PERSON" as const,
      targetEntityId: "demo-person-anna",
      label: "person-context",
      reason: "Note captures relationship context for Anna.",
      confidence: 1,
    },
  ];

  await Promise.all(
    sourceReferences.map((sourceReference) =>
      db.sourceReference.upsert({
        where: { id: sourceReference.id },
        create: {
          ...sourceReference,
          tenantId: tenant.id,
          createdByUserId: user.id,
        },
        update: {
          label: sourceReference.label,
          reason: sourceReference.reason,
          confidence: sourceReference.confidence,
        },
      }),
    ),
  );

  return {
    tenantId: tenant.id,
    userId: user.id,
  };
}

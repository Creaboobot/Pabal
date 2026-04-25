import { prisma } from "@/server/db/prisma";
import { ensureDefaultTenantForUser } from "@/server/services/tenancy";

export const describeWithDatabase = process.env.DATABASE_URL
  ? describe
  : describe.skip;

export async function resetDatabase() {
  await prisma.sourceReference.deleteMany();
  await prisma.aIProposalItem.deleteMany();
  await prisma.aIProposal.deleteMany();
  await prisma.voiceMention.deleteMany();
  await prisma.voiceNote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.introductionSuggestion.deleteMany();
  await prisma.commitment.deleteMany();
  await prisma.need.deleteMany();
  await prisma.capability.deleteMany();
  await prisma.note.deleteMany();
  await prisma.meetingParticipant.deleteMany();
  await prisma.companyAffiliation.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.person.deleteMany();
  await prisma.company.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
}

export async function createUser(email: string, name = "Test User") {
  return prisma.user.create({
    data: {
      email,
      name,
    },
  });
}

export async function createTenantContext(email: string, name = "Test User") {
  const user = await createUser(email, name);

  return ensureDefaultTenantForUser({
    userId: user.id,
    email: user.email,
    name: user.name,
    actorUserId: user.id,
  });
}

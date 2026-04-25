import { type Prisma } from "@prisma/client";

import { createMeeting, findMeetingById } from "@/server/repositories/meetings";
import { createMeetingParticipant } from "@/server/repositories/meeting-participants";
import { assertRelationshipEntityBelongsToTenant } from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export async function createTenantMeeting(
  context: TenantContext,
  data: Omit<
    Prisma.MeetingUncheckedCreateInput,
    "tenantId" | "createdByUserId" | "updatedByUserId"
  >,
) {
  await requireTenantAccess(context);

  if (data.primaryCompanyId) {
    await assertRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "COMPANY",
      entityId: data.primaryCompanyId,
    });
  }

  return createMeeting({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
      updatedByUserId: context.userId,
    },
  });
}

export async function getTenantMeeting(
  context: TenantContext,
  meetingId: string,
) {
  await requireTenantAccess(context);

  return findMeetingById({
    tenantId: context.tenantId,
    meetingId,
  });
}

export async function createTenantMeetingParticipant(
  context: TenantContext,
  data: Omit<
    Prisma.MeetingParticipantUncheckedCreateInput,
    "tenantId" | "createdByUserId" | "updatedByUserId"
  >,
) {
  await requireTenantAccess(context);
  await assertRelationshipEntityBelongsToTenant({
    tenantId: context.tenantId,
    entityType: "MEETING",
    entityId: data.meetingId,
  });

  if (data.personId) {
    await assertRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "PERSON",
      entityId: data.personId,
    });
  }

  if (data.companyId) {
    await assertRelationshipEntityBelongsToTenant({
      tenantId: context.tenantId,
      entityType: "COMPANY",
      entityId: data.companyId,
    });
  }

  return createMeetingParticipant({
    tenantId: context.tenantId,
    data: {
      ...data,
      createdByUserId: context.userId,
      updatedByUserId: context.userId,
    },
  });
}

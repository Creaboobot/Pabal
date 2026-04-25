import {
  listLatestMeetingsForCompany,
  listLatestMeetingsForPerson,
  listLatestNotesForCompany,
  listLatestNotesForPerson,
} from "@/server/repositories/relationship-context";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";
import { getTenantCompany } from "@/server/services/companies";
import { getTenantPerson } from "@/server/services/people";

const RELATED_CONTEXT_TAKE = 5;

export type RelatedContext = Awaited<
  ReturnType<typeof getTenantPersonRelatedContext>
>;

export async function getTenantPersonRelatedContext(
  context: TenantContext,
  personId: string,
) {
  await requireTenantAccess(context);

  const person = await getTenantPerson(context, personId);

  if (!person) {
    throw new TenantScopedEntityNotFoundError("PERSON", personId);
  }

  const [meetings, notes] = await Promise.all([
    listLatestMeetingsForPerson({
      tenantId: context.tenantId,
      personId,
      take: RELATED_CONTEXT_TAKE,
    }),
    listLatestNotesForPerson({
      tenantId: context.tenantId,
      personId,
      take: RELATED_CONTEXT_TAKE,
    }),
  ]);

  return {
    meetings,
    notes,
  };
}

export async function getTenantCompanyRelatedContext(
  context: TenantContext,
  companyId: string,
) {
  await requireTenantAccess(context);

  const company = await getTenantCompany(context, companyId);

  if (!company) {
    throw new TenantScopedEntityNotFoundError("COMPANY", companyId);
  }

  const [meetings, notes] = await Promise.all([
    listLatestMeetingsForCompany({
      tenantId: context.tenantId,
      companyId,
      take: RELATED_CONTEXT_TAKE,
    }),
    listLatestNotesForCompany({
      tenantId: context.tenantId,
      companyId,
      take: RELATED_CONTEXT_TAKE,
    }),
  ]);

  return {
    meetings,
    notes,
  };
}

import {
  getBillingProvider,
  type BillingProvider,
  type BillingReadinessSummary,
} from "@/server/providers/billing";
import { requireWorkspaceAdmin } from "@/server/services/admin-authorization";
import { type TenantContext } from "@/server/services/tenancy";

export type TenantBillingReadiness = {
  billing: BillingReadinessSummary;
  currentUserRole: TenantContext["roleKey"];
  tenant: {
    id: string;
    name: string;
  };
};

export async function getTenantBillingReadiness(
  context: TenantContext,
  provider: BillingProvider = getBillingProvider(),
): Promise<TenantBillingReadiness> {
  const access = await requireWorkspaceAdmin(context);
  const billing = await provider.getBillingStatus({
    tenantId: access.tenantId,
    userId: access.userId,
  });

  return {
    billing,
    currentUserRole: access.roleKey,
    tenant: {
      id: access.tenantId,
      name: access.tenantName,
    },
  };
}

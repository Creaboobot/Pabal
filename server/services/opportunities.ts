import { listTenantCapabilitiesWithContext } from "@/server/services/capabilities";
import { listTenantNeedsWithContext } from "@/server/services/needs";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export async function getTenantOpportunityHub(context: TenantContext) {
  await requireTenantAccess(context);

  const [needs, capabilities] = await Promise.all([
    listTenantNeedsWithContext(context),
    listTenantCapabilitiesWithContext(context),
  ]);
  const openNeeds = needs.filter((need) =>
    ["OPEN", "IN_PROGRESS", "PARKED"].includes(need.status),
  );
  const activeCapabilities = capabilities.filter((capability) =>
    ["ACTIVE", "PARKED"].includes(capability.status),
  );

  return {
    counts: {
      activeCapabilities: activeCapabilities.length,
      openNeeds: openNeeds.length,
    },
    latestCapabilities: activeCapabilities.slice(0, 5),
    latestNeeds: openNeeds.slice(0, 5),
  };
}

import { listTenantCapabilitiesWithContext } from "@/server/services/capabilities";
import { listTenantIntroductionSuggestionsWithContext } from "@/server/services/introduction-suggestions";
import { listTenantNeedsWithContext } from "@/server/services/needs";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export async function getTenantOpportunityHub(context: TenantContext) {
  await requireTenantAccess(context);

  const [needs, capabilities, introductionSuggestions] = await Promise.all([
    listTenantNeedsWithContext(context),
    listTenantCapabilitiesWithContext(context),
    listTenantIntroductionSuggestionsWithContext(context),
  ]);
  const openNeeds = needs.filter((need) =>
    ["OPEN", "IN_PROGRESS", "PARKED"].includes(need.status),
  );
  const activeCapabilities = capabilities.filter((capability) =>
    ["ACTIVE", "PARKED"].includes(capability.status),
  );
  const activeIntroductions = introductionSuggestions.filter((suggestion) =>
    ["PROPOSED", "ACCEPTED", "OPT_IN_REQUESTED", "INTRO_SENT"].includes(
      suggestion.status,
    ),
  );

  return {
    counts: {
      activeCapabilities: activeCapabilities.length,
      activeIntroductions: activeIntroductions.length,
      openNeeds: openNeeds.length,
    },
    latestCapabilities: activeCapabilities.slice(0, 5),
    latestIntroductions: activeIntroductions.slice(0, 5),
    latestNeeds: openNeeds.slice(0, 5),
  };
}

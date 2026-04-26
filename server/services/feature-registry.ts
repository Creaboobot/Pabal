import { getRuntimeEnv, type RuntimeEnv } from "@/server/config/env";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";

export type FeatureReadinessStatus =
  | "enabled"
  | "disabled"
  | "readiness_only"
  | "manual_only"
  | "requires_configuration";

export type FeatureReadinessCard = {
  description: string;
  key: string;
  status: FeatureReadinessStatus;
  title: string;
};

function envFlag(value: boolean | undefined, fallback: boolean) {
  return value ?? fallback;
}

export function buildFeatureReadinessCards(
  env: RuntimeEnv = getRuntimeEnv(),
): FeatureReadinessCard[] {
  return [
    {
      description:
        "Mobile voice recording, transcription, and transcript review are available when the voice feature flag is enabled.",
      key: "voice-capture",
      status: envFlag(env.FEATURE_VOICE_CAPTURE, true)
        ? "enabled"
        : "disabled",
      title: "Voice capture",
    },
    {
      description:
        "Reviewed voice transcripts can be structured into status-only AI proposals when OpenAI runtime configuration is present.",
      key: "ai-structuring",
      status: env.OPENAI_API_KEY ? "enabled" : "requires_configuration",
      title: "AI structuring",
    },
    {
      description:
        "Microsoft Graph remains a future integration surface. No Microsoft data is synced or ingested.",
      key: "microsoft-readiness",
      status: envFlag(env.FEATURE_MICROSOFT_GRAPH, false)
        ? "readiness_only"
        : "disabled",
      title: "Microsoft readiness",
    },
    {
      description:
        "LinkedIn enrichment is limited to user-provided URLs and pasted context. No scraping or automation is implemented.",
      key: "linkedin-manual-enrichment",
      status: envFlag(env.FEATURE_LINKEDIN_MANUAL_ENRICHMENT, true)
        ? "manual_only"
        : "disabled",
      title: "LinkedIn manual enrichment",
    },
    {
      description:
        "Billing is explicitly deferred to Step 13B. No checkout, portal, webhooks, or billing schema exist in this step.",
      key: "billing-readiness",
      status: envFlag(env.FEATURE_BILLING, false)
        ? "readiness_only"
        : "disabled",
      title: "Billing readiness",
    },
    {
      description:
        "Meeting preparation briefs aggregate tenant-scoped records deterministically without AI generation or sync.",
      key: "meeting-prep",
      status: "enabled",
      title: "Meeting preparation brief",
    },
    {
      description:
        "Relationship health and why-now reasons are computed at read time and are not persisted as scores.",
      key: "relationship-health",
      status: "enabled",
      title: "Relationship health signals",
    },
  ];
}

export async function listTenantFeatureReadiness(context: TenantContext) {
  await requireTenantAccess(context);

  return buildFeatureReadinessCards();
}

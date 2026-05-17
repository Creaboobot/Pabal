import { getRuntimeEnv, type RuntimeEnv } from "@/server/config/env";
import {
  requireTenantAccess,
  type TenantContext,
} from "@/server/services/tenancy";
import {
  getSpeechToTextProviderReadiness,
  getTranscriptStructuringProviderReadiness,
  type VoiceProviderReadinessStatus,
} from "@/server/services/voice-provider-readiness";

export type FeatureReadinessStatus =
  | "demo_mode"
  | "enabled"
  | "disabled"
  | "misconfigured"
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

function providerReadinessStatus(
  status: VoiceProviderReadinessStatus,
): FeatureReadinessStatus {
  switch (status) {
    case "available":
      return "enabled";
    case "demo":
      return "demo_mode";
    case "misconfigured":
      return "misconfigured";
    case "requires_configuration":
      return "requires_configuration";
  }
}

export function buildFeatureReadinessCards(
  env: RuntimeEnv = getRuntimeEnv(),
): FeatureReadinessCard[] {
  const speechToText = getSpeechToTextProviderReadiness(env);
  const transcriptStructuring = getTranscriptStructuringProviderReadiness(env);

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
      description: `${speechToText.detail} Provider: ${speechToText.providerLabel}.`,
      key: "speech-to-text-provider",
      status: providerReadinessStatus(speechToText.status),
      title: "Speech-to-text provider",
    },
    {
      description: `${transcriptStructuring.detail} Provider: ${transcriptStructuring.providerLabel}.`,
      key: "transcript-structuring-provider",
      status: providerReadinessStatus(transcriptStructuring.status),
      title: "Transcript structuring provider",
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
        "Billing readiness exposes a disabled provider and settings surface. No checkout, portal, webhooks, plan gates, or billing schema are implemented.",
      key: "billing-readiness",
      status: "readiness_only",
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

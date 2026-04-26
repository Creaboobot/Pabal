import { ShieldCheck } from "lucide-react";

import { CockpitCard } from "@/components/cards/cockpit-card";

export function PrivacyRetentionNotice() {
  return (
    <CockpitCard title="Privacy and retention">
      <div className="flex gap-3 text-sm leading-6 text-muted-foreground">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-primary"
        />
        <div className="space-y-2">
          <p>
            Raw audio is processed for transcription and is not retained by
            default. The transcript is stored as the voice note source record.
          </p>
          <p>
            Editing saves a reviewed transcript only. No automatic record
            updates, mentions, AI proposals, or structured extraction are
            created in this step.
          </p>
        </div>
      </div>
    </CockpitCard>
  );
}

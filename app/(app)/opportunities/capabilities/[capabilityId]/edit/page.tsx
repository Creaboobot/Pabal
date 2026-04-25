import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Button } from "@/components/ui/button";
import { CapabilityForm } from "@/modules/opportunities/components/capability-form";
import { getTenantCapabilityProfile } from "@/server/services/capabilities";
import { getTenantOpportunityFormOptions } from "@/server/services/opportunity-form-options";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type EditCapabilityPageProps = {
  params: Promise<{
    capabilityId: string;
  }>;
};

export default async function EditCapabilityPage({
  params,
}: EditCapabilityPageProps) {
  const [{ capabilityId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(
      `/sign-in?callbackUrl=/opportunities/capabilities/${capabilityId}/edit`,
    );
  }

  const [capability, options] = await Promise.all([
    getTenantCapabilityProfile(context, capabilityId),
    getTenantOpportunityFormOptions(context),
  ]);

  if (!capability) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href={`/opportunities/capabilities/${capability.id}`}>
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Capability
            </Link>
          </Button>
        }
        description="Update the manual capability record. Linked records are validated server-side."
        eyebrow="Edit capability"
        title={capability.title}
      />

      <CockpitCard title="Capability details">
        <CapabilityForm
          capabilityId={capability.id}
          initialValues={capability}
          mode="edit"
          options={options}
        />
      </CockpitCard>
    </div>
  );
}

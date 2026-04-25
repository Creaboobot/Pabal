import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Button } from "@/components/ui/button";
import { NeedForm } from "@/modules/opportunities/components/need-form";
import { getTenantNeedProfile } from "@/server/services/needs";
import { getTenantOpportunityFormOptions } from "@/server/services/opportunity-form-options";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type EditNeedPageProps = {
  params: Promise<{
    needId: string;
  }>;
};

export default async function EditNeedPage({ params }: EditNeedPageProps) {
  const [{ needId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/opportunities/needs/${needId}/edit`);
  }

  const [need, options] = await Promise.all([
    getTenantNeedProfile(context, needId),
    getTenantOpportunityFormOptions(context),
  ]);

  if (!need) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href={`/opportunities/needs/${need.id}`}>
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Need
            </Link>
          </Button>
        }
        description="Update the manual need record. Linked records are validated server-side."
        eyebrow="Edit need"
        title={need.title}
      />

      <CockpitCard title="Need details">
        <NeedForm
          initialValues={need}
          mode="edit"
          needId={need.id}
          options={options}
        />
      </CockpitCard>
    </div>
  );
}

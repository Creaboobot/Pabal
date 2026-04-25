import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { CommitmentForm } from "@/modules/commitments/components/commitment-form";
import { getTenantCommitmentFormOptions } from "@/server/services/commitment-form-options";
import { getTenantCommitment } from "@/server/services/commitments";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type EditCommitmentPageProps = {
  params: Promise<{
    commitmentId: string;
  }>;
};

export default async function EditCommitmentPage({
  params,
}: EditCommitmentPageProps) {
  const [{ commitmentId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/commitments/${commitmentId}/edit`);
  }

  const [commitment, options] = await Promise.all([
    getTenantCommitment(context, commitmentId),
    getTenantCommitmentFormOptions(context),
  ]);

  if (!commitment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Update the manual commitment while keeping lifecycle actions audit logged separately."
        eyebrow="Edit commitment"
        title={commitment.title}
      />

      <CockpitCard title="Commitment details">
        <CommitmentForm
          commitmentId={commitment.id}
          initialValues={commitment}
          mode="edit"
          options={options}
        />
      </CockpitCard>
    </div>
  );
}

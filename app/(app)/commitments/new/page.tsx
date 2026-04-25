import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { CommitmentForm } from "@/modules/commitments/components/commitment-form";
import { getTenantCommitmentFormOptions } from "@/server/services/commitment-form-options";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type NewCommitmentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function NewCommitmentPage({
  searchParams,
}: NewCommitmentPageProps) {
  const [params, context] = await Promise.all([
    searchParams,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect("/sign-in?callbackUrl=/commitments/new");
  }

  const options = await getTenantCommitmentFormOptions(context);
  const counterpartyCompanyId =
    firstSearchParam(params, "counterpartyCompanyId") ??
    firstSearchParam(params, "companyId") ??
    null;
  const counterpartyPersonId =
    firstSearchParam(params, "counterpartyPersonId") ??
    firstSearchParam(params, "personId") ??
    null;
  const meetingId = firstSearchParam(params, "meetingId") ?? null;
  const noteId = firstSearchParam(params, "noteId") ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Create a manual promise or obligation and link it to the relationship context that explains it."
        eyebrow="Ledger"
        title="Create commitment"
      />

      <CockpitCard title="Commitment details">
        <CommitmentForm
          initialValues={{
            counterpartyCompanyId,
            counterpartyPersonId,
            meetingId,
            noteId,
            ownerType: "ME",
          }}
          mode="create"
          options={options}
        />
      </CockpitCard>
    </div>
  );
}

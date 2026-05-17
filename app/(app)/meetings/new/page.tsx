import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MeetingForm } from "@/modules/meetings/components/meeting-form";
import { listTenantCompanies } from "@/server/services/companies";
import { getTenantAIProposalItemMeetingConversionDraft } from "@/server/services/ai-proposal-conversions";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type NewMeetingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function conversionSource(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const aiProposalId = firstSearchParam(searchParams, "sourceAIProposalId");
  const aiProposalItemId = firstSearchParam(
    searchParams,
    "sourceAIProposalItemId",
  );

  if (!aiProposalId && !aiProposalItemId) {
    return null;
  }

  if (!aiProposalId || !aiProposalItemId) {
    notFound();
  }

  return {
    aiProposalId,
    aiProposalItemId,
  };
}

export default async function NewMeetingPage({
  searchParams,
}: NewMeetingPageProps) {
  const [params, context] = await Promise.all([
    searchParams,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect("/sign-in?callbackUrl=/meetings/new");
  }

  const source = conversionSource(params);
  const [companies, conversionDraft] = await Promise.all([
    listTenantCompanies(context),
    source
      ? getTenantAIProposalItemMeetingConversionDraft(context, source).catch(
          (error) => {
            if (error instanceof TenantScopedEntityNotFoundError) {
              notFound();
            }

            throw error;
          },
        )
      : Promise.resolve(null),
  ]);

  if (conversionDraft?.conversionTargets.meeting) {
    redirect(conversionDraft.conversionTargets.meeting.href);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href="/meetings">
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Meetings
            </Link>
          </Button>
        }
        description={
          conversionDraft
            ? "Review and edit the meeting before creating it. The suggested update status stays unchanged."
            : "Meeting basics, timing, company context, and source."
        }
        eyebrow="New meeting"
        title="Create meeting"
      />

      <Card className="p-4">
        <MeetingForm
          companies={companies.map((company) => ({
            id: company.id,
            name: company.name,
          }))}
          mode="create"
          {...(conversionDraft
            ? { initialValues: conversionDraft.initialValues }
            : {})}
        />
      </Card>
    </div>
  );
}

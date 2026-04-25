import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MeetingForm } from "@/modules/meetings/components/meeting-form";
import { listTenantCompanies } from "@/server/services/companies";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function NewMeetingPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/meetings/new");
  }

  const companies = await listTenantCompanies(context);

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
        description="Meeting basics, timing, company context, and source."
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
        />
      </Card>
    </div>
  );
}

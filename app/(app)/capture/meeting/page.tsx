import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PastedMeetingCaptureForm } from "@/modules/notes/components/pasted-meeting-capture-form";
import { listTenantCompanies } from "@/server/services/companies";
import { listTenantPeople } from "@/server/services/people";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function PastedMeetingCapturePage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/capture/meeting");
  }

  const [companies, people] = await Promise.all([
    listTenantCompanies(context),
    listTenantPeople(context),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href="/capture">
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Capture
            </Link>
          </Button>
        }
        description="Paste user-provided Teams/Copilot notes into a meeting and linked source note."
        eyebrow="Pasted meeting note"
        title="Paste meeting notes"
      />

      <Card className="p-4">
        <PastedMeetingCaptureForm
          companies={companies.map((company) => ({
            id: company.id,
            name: company.name,
          }))}
          people={people.map((person) => ({
            email: person.email,
            id: person.id,
            name: person.displayName,
          }))}
        />
      </Card>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NoteForm } from "@/modules/notes/components/note-form";
import { listTenantCompanies } from "@/server/services/companies";
import { listTenantMeetings } from "@/server/services/meetings";
import { listTenantPeople } from "@/server/services/people";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function NewNotePage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/notes/new");
  }

  const [companies, meetings, people] = await Promise.all([
    listTenantCompanies(context),
    listTenantMeetings(context),
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
        description="Manual note with optional person, company, and meeting context."
        eyebrow="New note"
        title="Create note"
      />

      <Card className="p-4">
        <NoteForm
          companies={companies.map((company) => ({
            id: company.id,
            name: company.name,
          }))}
          meetings={meetings.map((meeting) => ({
            id: meeting.id,
            title: meeting.title,
          }))}
          mode="create"
          people={people.map((person) => ({
            id: person.id,
            name: person.displayName,
          }))}
        />
      </Card>
    </div>
  );
}

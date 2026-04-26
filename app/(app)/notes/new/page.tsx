import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NoteForm } from "@/modules/notes/components/note-form";
import { editableNoteSourceTypes } from "@/modules/notes/labels";
import { listTenantCompanies } from "@/server/services/companies";
import { listTenantMeetings } from "@/server/services/meetings";
import { listTenantPeople } from "@/server/services/people";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type NewNotePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function isEditableNoteSourceType(
  value: string | undefined,
): value is (typeof editableNoteSourceTypes)[number] {
  return editableNoteSourceTypes.some(
    (editableSourceType) => editableSourceType === value,
  );
}

export default async function NewNotePage({ searchParams }: NewNotePageProps) {
  const [params, context] = await Promise.all([
    searchParams,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect("/sign-in?callbackUrl=/notes/new");
  }

  const [companies, meetings, people] = await Promise.all([
    listTenantCompanies(context),
    listTenantMeetings(context),
    listTenantPeople(context),
  ]);
  const companyId = firstSearchParam(params, "companyId");
  const meetingId = firstSearchParam(params, "meetingId");
  const personId = firstSearchParam(params, "personId");
  const sourceType = firstSearchParam(params, "sourceType");
  const initialCompanyId =
    companyId && companies.some((company) => company.id === companyId)
      ? companyId
      : null;
  const initialMeetingId =
    meetingId && meetings.some((meeting) => meeting.id === meetingId)
      ? meetingId
      : null;
  const initialPersonId =
    personId && people.some((person) => person.id === personId)
      ? personId
      : null;
  const initialSourceType = isEditableNoteSourceType(sourceType)
    ? sourceType
    : undefined;

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
          initialValues={{
            companyId: initialCompanyId,
            meetingId: initialMeetingId,
            noteType:
              initialSourceType === "LINKEDIN_USER_PROVIDED"
                ? "SOURCE_EXCERPT"
                : initialMeetingId
                  ? "MEETING"
                  : initialPersonId
                    ? "PERSON"
                    : initialCompanyId
                      ? "COMPANY"
                      : "GENERAL",
            personId: initialPersonId,
            sourceType: initialSourceType ?? "MANUAL",
          }}
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

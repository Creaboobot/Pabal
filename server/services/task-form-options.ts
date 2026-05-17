import { listTenantCommitments } from "@/server/services/commitments";
import { listTenantCompanies } from "@/server/services/companies";
import { listTenantMeetings } from "@/server/services/meetings";
import { listTenantNotes } from "@/server/services/notes";
import { listTenantPeople } from "@/server/services/people";
import type { TenantContext } from "@/server/services/tenancy";

export async function getTenantTaskFormOptions(context: TenantContext) {
  const [commitments, companies, meetings, notes, people] = await Promise.all([
    listTenantCommitments(context),
    listTenantCompanies(context),
    listTenantMeetings(context),
    listTenantNotes(context),
    listTenantPeople(context),
  ]);

  return {
    commitments: commitments.map((commitment) => ({
      id: commitment.id,
      title: commitment.title,
    })),
    companies: companies.map((company) => ({
      id: company.id,
      name: company.name,
    })),
    meetings: meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
    })),
    notes: notes.map((note) => ({
      id: note.id,
      noteType: note.noteType,
      summary: note.summary,
    })),
    people: people.map((person) => ({
      displayName: person.displayName,
      id: person.id,
    })),
  };
}

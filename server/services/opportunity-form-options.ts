import { listTenantCapabilitiesWithContext } from "@/server/services/capabilities";
import { listTenantCompanies } from "@/server/services/companies";
import { listTenantMeetings } from "@/server/services/meetings";
import { listTenantNeedsWithContext } from "@/server/services/needs";
import { listTenantNotes } from "@/server/services/notes";
import { listTenantPeople } from "@/server/services/people";
import type { TenantContext } from "@/server/services/tenancy";

export async function getTenantOpportunityFormOptions(context: TenantContext) {
  const [capabilities, companies, meetings, needs, notes, people] =
    await Promise.all([
      listTenantCapabilitiesWithContext(context),
      listTenantCompanies(context),
      listTenantMeetings(context),
      listTenantNeedsWithContext(context),
      listTenantNotes(context),
      listTenantPeople(context),
    ]);

  return {
    capabilities: capabilities.map((capability) => ({
      id: capability.id,
      title: capability.title,
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
    needs: needs.map((need) => ({
      id: need.id,
      title: need.title,
    })),
    people: people.map((person) => ({
      displayName: person.displayName,
      id: person.id,
    })),
  };
}

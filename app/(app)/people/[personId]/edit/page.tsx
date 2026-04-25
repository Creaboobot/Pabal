import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PersonForm } from "@/modules/people/components/person-form";
import { getTenantPersonProfile } from "@/server/services/people";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type EditPersonPageProps = {
  params: Promise<{
    personId: string;
  }>;
};

export default async function EditPersonPage({ params }: EditPersonPageProps) {
  const [{ personId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/people/${personId}/edit`);
  }

  const person = await getTenantPersonProfile(context, personId);

  if (!person) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href={`/people/${person.id}`}>
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Person
            </Link>
          </Button>
        }
        description="Update contact details and relationship state."
        eyebrow="Edit person"
        title={person.displayName}
      />

      <Card className="p-4">
        <PersonForm
          initialValues={{
            displayName: person.displayName,
            email: person.email,
            firstName: person.firstName,
            jobTitle: person.jobTitle,
            lastName: person.lastName,
            phone: person.phone,
            relationshipStatus:
              person.relationshipStatus === "ARCHIVED"
                ? "UNKNOWN"
                : person.relationshipStatus,
            relationshipTemperature: person.relationshipTemperature,
          }}
          mode="edit"
          personId={person.id}
        />
      </Card>
    </div>
  );
}

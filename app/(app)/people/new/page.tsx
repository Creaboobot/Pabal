import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PersonForm } from "@/modules/people/components/person-form";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function NewPersonPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/people/new");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href="/people">
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              People
            </Link>
          </Button>
        }
        description="Add the minimum useful relationship context now; richer affiliations come next."
        eyebrow="New relationship"
        title="Create person"
      />

      <Card className="p-4">
        <PersonForm mode="create" />
      </Card>
    </div>
  );
}

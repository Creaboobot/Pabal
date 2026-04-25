import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanyForm } from "@/modules/people/components/company-form";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function NewCompanyPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/people/companies/new");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href="/people/companies">
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Companies
            </Link>
          </Button>
        }
        description="Add organisation context without forcing account-style ownership."
        eyebrow="New company"
        title="Create company"
      />

      <Card className="p-4">
        <CompanyForm mode="create" />
      </Card>
    </div>
  );
}

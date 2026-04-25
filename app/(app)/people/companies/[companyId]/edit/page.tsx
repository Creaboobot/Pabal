import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanyForm } from "@/modules/people/components/company-form";
import { getTenantCompanyProfile } from "@/server/services/companies";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type EditCompanyPageProps = {
  params: Promise<{
    companyId: string;
  }>;
};

export default async function EditCompanyPage({
  params,
}: EditCompanyPageProps) {
  const [{ companyId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/people/companies/${companyId}/edit`);
  }

  const company = await getTenantCompanyProfile(context, companyId);

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="ghost">
            <Link href={`/people/companies/${company.id}`}>
              <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
              Company
            </Link>
          </Button>
        }
        description="Update organisation context and description."
        eyebrow="Edit company"
        title={company.name}
      />

      <Card className="p-4">
        <CompanyForm
          companyId={company.id}
          initialValues={{
            description: company.description,
            industry: company.industry,
            name: company.name,
            website: company.website,
          }}
          mode="edit"
        />
      </Card>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, Plus } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { CapabilityCard } from "@/modules/opportunities/components/capability-card";
import { listTenantCapabilitiesWithContext } from "@/server/services/capabilities";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function CapabilitiesPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/opportunities/capabilities");
  }

  const capabilities = await listTenantCapabilitiesWithContext(context);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/opportunities">
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                Opportunities
              </Link>
            </Button>
            <Button asChild>
              <Link href="/opportunities/capabilities/new">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                New capability
              </Link>
            </Button>
          </div>
        }
        description="Manual expertise, access, assets, experience, and possible solutions in the relationship network."
        eyebrow="Capabilities"
        title="Capabilities"
      />

      {capabilities.length > 0 ? (
        <section aria-label="Capabilities" className="grid gap-3">
          {capabilities.map((capability) => (
            <CapabilityCard capability={capability} key={capability.id} />
          ))}
        </section>
      ) : (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/opportunities/capabilities/new">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                Add capability
              </Link>
            </Button>
          }
          description="Start by capturing a manual capability linked to a person, company, or note."
          icon={BadgeCheck}
          title="No capabilities yet"
        />
      )}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Lightbulb, Plus } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { NeedCard } from "@/modules/opportunities/components/need-card";
import { listTenantNeedsWithContext } from "@/server/services/needs";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function NeedsPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/opportunities/needs");
  }

  const needs = await listTenantNeedsWithContext(context);

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
              <Link href="/opportunities/needs/new">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                New need
              </Link>
            </Button>
          </div>
        }
        description="Manual problems, requests, objectives, opportunities, and interests from the relationship network."
        eyebrow="Needs"
        title="Needs"
      />

      {needs.length > 0 ? (
        <section aria-label="Needs" className="grid gap-3">
          {needs.map((need) => (
            <NeedCard key={need.id} need={need} />
          ))}
        </section>
      ) : (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/opportunities/needs/new">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                Add need
              </Link>
            </Button>
          }
          description="Start by capturing a manual need from a person, company, meeting, or note."
          icon={Lightbulb}
          title="No needs yet"
        />
      )}
    </div>
  );
}

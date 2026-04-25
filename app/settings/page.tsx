import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/settings");
  }

  return (
    <main className="min-h-screen bg-background px-5 py-6">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Button asChild className="w-fit" variant="ghost">
          <Link href="/account">
            <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
            Account
          </Link>
        </Button>

        <header>
          <p className="text-sm font-medium uppercase text-accent">Settings</p>
          <h1 className="mt-1 text-3xl font-semibold text-foreground">
            Foundation settings
          </h1>
        </header>

        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Workspace</dt>
              <dd className="mt-1 font-medium text-foreground">
                {context.tenantName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="mt-1 font-medium text-foreground">
                {context.roleKey}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}

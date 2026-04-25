import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, LogOut, Settings, UserRound } from "lucide-react";

import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

async function signOutAction() {
  "use server";

  await signOut({ redirectTo: "/" });
}

export default async function AccountPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/account");
  }

  return (
    <main className="min-h-screen bg-background px-5 py-6">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase text-accent">
              Account
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-foreground">
              Your workspace
            </h1>
          </div>
          <form action={signOutAction}>
            <Button size="icon" type="submit" variant="outline">
              <LogOut aria-hidden="true" className="size-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </form>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-sm text-muted-foreground">Workspace</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {context.tenantName}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <UserRound aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-sm text-muted-foreground">Role</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {context.roleKey}
            </p>
          </div>
        </div>

        <Button asChild variant="outline">
          <Link href="/settings">
            <Settings aria-hidden="true" className="mr-2 size-4" />
            Settings
          </Link>
        </Button>
      </section>
    </main>
  );
}

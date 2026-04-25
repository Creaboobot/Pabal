import { redirect } from "next/navigation";

import { signOut } from "@/auth";
import { AppShell } from "@/components/app/app-shell";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

async function signOutAction() {
  "use server";

  await signOut({ redirectTo: "/sign-in" });
}

export default async function ProtectedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in");
  }

  return (
    <AppShell
      roleKey={context.roleKey}
      signOutAction={signOutAction}
      tenantName={context.tenantName}
    >
      {children}
    </AppShell>
  );
}

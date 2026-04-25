import Link from "next/link";
import { LogOut, Settings, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  roleKey: string;
  signOutAction: () => Promise<void>;
  tenantName: string;
};

export function AppHeader({
  roleKey,
  signOutAction,
  tenantName,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <Link
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          href="/today"
        >
          <span className="block font-semibold leading-none text-foreground">
            Pobal
          </span>
          <span className="mt-1 block max-w-[12rem] truncate text-xs text-muted-foreground">
            {tenantName}
          </span>
        </Link>

        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-medium text-foreground">
            {tenantName}
          </p>
          <p className="text-xs text-muted-foreground">{roleKey}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="icon" variant="ghost">
            <Link href="/account">
              <UserRound aria-hidden="true" className="size-4" />
              <span className="sr-only">Account</span>
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost">
            <Link href="/settings">
              <Settings aria-hidden="true" className="size-4" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
          <form action={signOutAction}>
            <Button size="icon" type="submit" variant="outline">
              <LogOut aria-hidden="true" className="size-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

import type { ReactNode } from "react";

import { AppHeader } from "@/components/app/app-header";
import { DesktopSidebar } from "@/components/app/desktop-sidebar";
import { MobileBottomNav } from "@/components/app/mobile-bottom-nav";

type AppShellProps = {
  children: ReactNode;
  roleKey: string;
  signOutAction: () => Promise<void>;
  tenantName: string;
};

export function AppShell({
  children,
  roleKey,
  signOutAction,
  tenantName,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[17rem_1fr]">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow"
        href="#main-content"
      >
        Skip to content
      </a>
      <DesktopSidebar />
      <div className="min-w-0">
        <AppHeader
          roleKey={roleKey}
          signOutAction={signOutAction}
          tenantName={tenantName}
        />
        <main
          className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-6xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-8 lg:pb-10"
          id="main-content"
        >
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

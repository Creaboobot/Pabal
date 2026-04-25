"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  isNavigationItemActive,
  primaryNavigationItems,
} from "@/components/app/navigation";
import { cn } from "@/lib/utils";

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-border bg-card lg:block">
      <div className="sticky top-0 flex h-screen flex-col gap-8 px-4 py-5">
        <Link
          className="rounded-md px-2 py-1 font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/today"
        >
          Pobal
        </Link>

        <nav aria-label="Primary" className="grid gap-1">
          {primaryNavigationItems.map((item) => {
            const Icon = item.icon;
            const active = isNavigationItemActive(pathname, item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "grid min-h-12 grid-cols-[1.75rem_1fr] items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" className="size-5" />
                <span>
                  <span className="block font-medium">{item.label}</span>
                  <span
                    className={cn(
                      "block text-xs text-muted-foreground",
                      active && "text-primary-foreground/80",
                    )}
                  >
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

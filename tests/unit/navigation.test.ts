import { describe, expect, it } from "vitest";

import {
  isNavigationItemActive,
  isPrimaryNavigationHref,
  primaryNavigationItems,
} from "@/components/app/navigation";

describe("primary app navigation", () => {
  it("keeps the approved mobile-first order", () => {
    expect(
      primaryNavigationItems.map((item) => ({
        href: item.href,
        label: item.label,
      })),
    ).toEqual([
      { href: "/today", label: "Today" },
      { href: "/capture", label: "Capture" },
      { href: "/people", label: "People" },
      { href: "/opportunities", label: "Opportunities" },
      { href: "/search", label: "Search" },
    ]);
  });

  it("recognises only primary app hrefs", () => {
    expect(isPrimaryNavigationHref("/today")).toBe(true);
    expect(isPrimaryNavigationHref("/settings")).toBe(false);
    expect(isPrimaryNavigationHref("/api/health")).toBe(false);
  });

  it("marks nested route segments active for their parent item", () => {
    expect(isNavigationItemActive("/people", "/people")).toBe(true);
    expect(isNavigationItemActive("/people/123", "/people")).toBe(true);
    expect(isNavigationItemActive("/opportunities", "/people")).toBe(false);
  });
});

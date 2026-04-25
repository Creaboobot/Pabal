import {
  BriefcaseBusiness,
  CircleDot,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";

export const primaryNavigationItems = [
  {
    href: "/today",
    label: "Today",
    description: "Daily cockpit",
    icon: CircleDot,
  },
  {
    href: "/capture",
    label: "Capture",
    description: "Quick relationship memory",
    icon: Sparkles,
  },
  {
    href: "/people",
    label: "People",
    description: "People and companies",
    icon: UsersRound,
  },
  {
    href: "/opportunities",
    label: "Opportunities",
    description: "Needs, capabilities, intros",
    icon: BriefcaseBusiness,
  },
  {
    href: "/search",
    label: "Search",
    description: "Structured memory lookup",
    icon: Search,
  },
] as const;

export type PrimaryNavigationHref =
  (typeof primaryNavigationItems)[number]["href"];

export function isPrimaryNavigationHref(
  href: string,
): href is PrimaryNavigationHref {
  return primaryNavigationItems.some((item) => item.href === href);
}

export function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

import Link from "next/link";
import { BadgeCheck, Building2, Lightbulb, UserRound } from "lucide-react";
import type { IntroductionSuggestionStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { IntroductionBadges } from "@/modules/opportunities/components/opportunity-badges";
import {
  introductionDisplayTitle,
  truncatedText,
} from "@/modules/opportunities/labels";

export type IntroductionSuggestionCardRecord = {
  capability: { id: string; title: string } | null;
  confidence: number | null;
  fromCompany: { id: string; name: string } | null;
  fromPerson: { displayName: string; id: string } | null;
  id: string;
  need: { id: string; title: string } | null;
  rationale: string;
  status: IntroductionSuggestionStatus;
  toCompany: { id: string; name: string } | null;
  toPerson: { displayName: string; id: string } | null;
};

type IntroductionSuggestionCardProps = {
  suggestion: IntroductionSuggestionCardRecord;
};

export function IntroductionSuggestionCard({
  suggestion,
}: IntroductionSuggestionCardProps) {
  return (
    <article className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3">
        <div className="min-w-0">
          <Link
            className="rounded-sm text-base font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            href={`/opportunities/introductions/${suggestion.id}`}
          >
            {introductionDisplayTitle(suggestion)}
          </Link>
          <div className="mt-2">
            <IntroductionBadges
              confidence={suggestion.confidence}
              status={suggestion.status}
            />
          </div>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          {truncatedText(suggestion.rationale, 180)}
        </p>

        <div className="flex flex-wrap gap-2">
          {suggestion.need ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/opportunities/needs/${suggestion.need.id}`}
              >
                <Lightbulb aria-hidden="true" className="size-3.5" />
                {suggestion.need.title}
              </Link>
            </Badge>
          ) : null}
          {suggestion.capability ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/opportunities/capabilities/${suggestion.capability.id}`}
              >
                <BadgeCheck aria-hidden="true" className="size-3.5" />
                {suggestion.capability.title}
              </Link>
            </Badge>
          ) : null}
          {suggestion.fromPerson ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/${suggestion.fromPerson.id}`}
              >
                <UserRound aria-hidden="true" className="size-3.5" />
                From {suggestion.fromPerson.displayName}
              </Link>
            </Badge>
          ) : null}
          {suggestion.toPerson ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/${suggestion.toPerson.id}`}
              >
                <UserRound aria-hidden="true" className="size-3.5" />
                To {suggestion.toPerson.displayName}
              </Link>
            </Badge>
          ) : null}
          {suggestion.fromCompany ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/companies/${suggestion.fromCompany.id}`}
              >
                <Building2 aria-hidden="true" className="size-3.5" />
                From {suggestion.fromCompany.name}
              </Link>
            </Badge>
          ) : null}
          {suggestion.toCompany ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/companies/${suggestion.toCompany.id}`}
              >
                <Building2 aria-hidden="true" className="size-3.5" />
                To {suggestion.toCompany.name}
              </Link>
            </Badge>
          ) : null}
        </div>
      </div>
    </article>
  );
}

import Link from "next/link";
import { Building2, FileText, UserRound } from "lucide-react";
import type {
  CapabilityStatus,
  CapabilityType,
  Sensitivity,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { CapabilityBadges } from "@/modules/opportunities/components/opportunity-badges";

export type CapabilityCardCapability = {
  capabilityType: CapabilityType;
  company: { id: string; name: string } | null;
  confidence: number | null;
  description: string | null;
  id: string;
  note: {
    id: string;
    noteType: string;
    sensitivity: Sensitivity;
    sourceType: string;
    summary: string | null;
  } | null;
  person: { displayName: string; id: string } | null;
  sensitivity: Sensitivity;
  status: CapabilityStatus;
  title: string;
};

type CapabilityCardProps = {
  capability: CapabilityCardCapability;
};

function preview(text: string | null) {
  if (!text) {
    return null;
  }

  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

export function CapabilityCard({ capability }: CapabilityCardProps) {
  return (
    <article className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3">
        <div className="min-w-0">
          <Link
            className="rounded-sm text-base font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            href={`/opportunities/capabilities/${capability.id}`}
          >
            {capability.title}
          </Link>
          <div className="mt-2">
            <CapabilityBadges
              capabilityType={capability.capabilityType}
              confidence={capability.confidence}
              sensitivity={capability.sensitivity}
              status={capability.status}
            />
          </div>
        </div>

        {preview(capability.description) ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {preview(capability.description)}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {capability.person ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/${capability.person.id}`}
              >
                <UserRound aria-hidden="true" className="size-3.5" />
                {capability.person.displayName}
              </Link>
            </Badge>
          ) : null}
          {capability.company ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/companies/${capability.company.id}`}
              >
                <Building2 aria-hidden="true" className="size-3.5" />
                {capability.company.name}
              </Link>
            </Badge>
          ) : null}
          {capability.note ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/notes/${capability.note.id}`}
              >
                <FileText aria-hidden="true" className="size-3.5" />
                {capability.note.summary ??
                  `${capability.note.noteType} note`}
              </Link>
            </Badge>
          ) : null}
        </div>
      </div>
    </article>
  );
}

import Link from "next/link";
import {
  Building2,
  CalendarDays,
  FileText,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

export type VoiceSourceContextChip = {
  href: string;
  id: string;
  label: string;
  type: "company" | "meeting" | "note" | "person";
};

const sourceIcons: Record<VoiceSourceContextChip["type"], LucideIcon> = {
  company: Building2,
  meeting: CalendarDays,
  note: FileText,
  person: UserRound,
};

type SourceContextChipsProps = {
  chips: VoiceSourceContextChip[];
  emptyLabel?: string;
};

export function SourceContextChips({
  chips,
  emptyLabel = "No linked source context",
}: SourceContextChipsProps) {
  if (chips.length === 0) {
    return <Badge variant="outline">{emptyLabel}</Badge>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const Icon = sourceIcons[chip.type];

        return (
          <Link
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            href={chip.href}
            key={`${chip.type}-${chip.id}`}
          >
            <Icon aria-hidden="true" className="size-4" />
            {chip.label}
          </Link>
        );
      })}
    </div>
  );
}

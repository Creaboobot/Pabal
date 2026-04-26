import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export type PrepRecordListItem = {
  badges?: string[];
  dateLabel?: string;
  description?: string;
  href: string;
  id: string;
  title: string;
};

type PrepRecordListProps = {
  emptyDescription: string;
  records: PrepRecordListItem[];
};

export function PrepRecordList({
  emptyDescription,
  records,
}: PrepRecordListProps) {
  if (records.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        {emptyDescription}
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {records.map((record) => (
        <Link
          className="rounded-md border border-border bg-background p-3 outline-none transition hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
          href={record.href}
          key={record.id}
        >
          <div className="flex items-start gap-3">
            <FileText
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {record.title}
                </h3>
                <ArrowRight
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
              </div>
              {record.description ? (
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {record.description}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {record.dateLabel ? (
                  <Badge variant="outline">{record.dateLabel}</Badge>
                ) : null}
                {record.badges?.map((badge) => (
                  <Badge key={badge} variant="secondary">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

import Link from "next/link";
import {
  Building2,
  CalendarDays,
  FileText,
  Handshake,
  ListChecks,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  commitmentDueLabel,
  commitmentOwnerTypeLabel,
  commitmentStatusLabel,
  sensitivityLabel,
} from "@/modules/commitments/labels";
import {
  formatTaskDateTime,
  taskPriorityLabel,
  taskStatusLabel,
  taskTypeLabel,
} from "@/modules/tasks/labels";
import type {
  ActionBoardItem,
  ActionItemContextBadge,
  ActionItemContextBadgeType,
} from "@/server/services/action-board";

type ActionItemCardProps = {
  compact?: boolean;
  item: ActionBoardItem;
};

const contextIcons: Record<ActionItemContextBadgeType, LucideIcon> = {
  commitment: Handshake,
  company: Building2,
  meeting: CalendarDays,
  note: FileText,
  person: UserRound,
};

function preview(text: string) {
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function sourceLabel(item: ActionBoardItem) {
  return item.sourceType === "TASK" ? "Task" : "Commitment";
}

function statusLabel(item: ActionBoardItem) {
  return item.sourceType === "TASK"
    ? taskStatusLabel(item.status)
    : commitmentStatusLabel(item.status);
}

function dateLabel(item: ActionBoardItem) {
  if (item.sourceType === "TASK") {
    return item.dueAt ? `Due ${formatTaskDateTime(item.dueAt)}` : "No due date";
  }

  return commitmentDueLabel(item);
}

function ContextBadge({ badge }: { badge: ActionItemContextBadge }) {
  const Icon = contextIcons[badge.type];

  return (
    <Badge variant="outline">
      <Link
        className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href={badge.href}
      >
        <Icon aria-hidden="true" className="size-3.5" />
        {badge.label}
      </Link>
    </Badge>
  );
}

export function ActionItemCard({ compact = false, item }: ActionItemCardProps) {
  return (
    <article className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            {item.sourceType === "TASK" ? (
              <ListChecks aria-hidden="true" className="size-5" />
            ) : (
              <Handshake aria-hidden="true" className="size-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <Link
              className="rounded-sm text-base font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
              href={item.href}
            >
              {item.title}
            </Link>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge
                variant={item.sourceType === "TASK" ? "default" : "secondary"}
              >
                {sourceLabel(item)}
              </Badge>
              <Badge variant="outline">{statusLabel(item)}</Badge>
              <Badge variant="outline">{dateLabel(item)}</Badge>
              {item.sourceType === "TASK" ? (
                <>
                  <Badge variant="outline">
                    {taskPriorityLabel(item.priority)}
                  </Badge>
                  <Badge variant="outline">{taskTypeLabel(item.taskType)}</Badge>
                </>
              ) : (
                <>
                  <Badge variant="outline">
                    {commitmentOwnerTypeLabel(item.ownerType)}
                  </Badge>
                  <Badge variant="outline">
                    {sensitivityLabel(item.sensitivity)}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {!compact && item.description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {preview(item.description)}
          </p>
        ) : null}

        {item.contextBadges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {item.contextBadges.map((badge) => (
              <ContextBadge badge={badge} key={`${badge.type}:${badge.id}`} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

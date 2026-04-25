import Link from "next/link";
import {
  Building2,
  CalendarDays,
  FileText,
  Handshake,
  Lightbulb,
  UserRound,
} from "lucide-react";
import type { TaskPriority, TaskStatus, TaskType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { TaskBadges } from "@/modules/tasks/components/task-badges";

export type TaskCardTask = {
  commitment: { id: string; title: string } | null;
  company: { id: string; name: string } | null;
  description: string | null;
  dueAt: Date | null;
  id: string;
  introductionSuggestion: { id: string; rationale: string | null } | null;
  meeting: { id: string; occurredAt: Date | null; title: string } | null;
  note: { id: string; noteType: string; summary: string | null } | null;
  person: { displayName: string; id: string } | null;
  priority: TaskPriority;
  status: TaskStatus;
  taskType: TaskType;
  title: string;
  whyNowRationale: string | null;
};

type TaskCardProps = {
  task: TaskCardTask;
};

function preview(text: string) {
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <article className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3">
        <div className="min-w-0">
          <Link
            className="rounded-sm text-base font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            href={`/tasks/${task.id}`}
          >
            {task.title}
          </Link>
          <div className="mt-2">
            <TaskBadges
              dueAt={task.dueAt}
              priority={task.priority}
              status={task.status}
              taskType={task.taskType}
            />
          </div>
        </div>

        {task.description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {preview(task.description)}
          </p>
        ) : null}

        {task.whyNowRationale ? (
          <div className="rounded-md border border-border bg-background p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lightbulb aria-hidden="true" className="size-4" />
              Why now
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {preview(task.whyNowRationale)}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {task.person ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/${task.person.id}`}
              >
                <UserRound aria-hidden="true" className="size-3.5" />
                {task.person.displayName}
              </Link>
            </Badge>
          ) : null}
          {task.company ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/people/companies/${task.company.id}`}
              >
                <Building2 aria-hidden="true" className="size-3.5" />
                {task.company.name}
              </Link>
            </Badge>
          ) : null}
          {task.meeting ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/meetings/${task.meeting.id}`}
              >
                <CalendarDays aria-hidden="true" className="size-3.5" />
                {task.meeting.title}
              </Link>
            </Badge>
          ) : null}
          {task.note ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/notes/${task.note.id}`}
              >
                <FileText aria-hidden="true" className="size-3.5" />
                {task.note.summary ?? `${task.note.noteType} note`}
              </Link>
            </Badge>
          ) : null}
          {task.commitment ? (
            <Badge variant="outline">
              <Handshake aria-hidden="true" className="mr-1 size-3.5" />
              {task.commitment.title}
            </Badge>
          ) : null}
          {task.introductionSuggestion ? (
            <Badge variant="outline">
              <Lightbulb aria-hidden="true" className="mr-1 size-3.5" />
              Introduction suggestion
            </Badge>
          ) : null}
        </div>
      </div>
    </article>
  );
}

import type { TaskPriority, TaskStatus, TaskType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  formatTaskDateTime,
  isOverdueTask,
  taskPriorityLabel,
  taskStatusLabel,
  taskTypeLabel,
} from "@/modules/tasks/labels";

type TaskBadgesProps = {
  dueAt: Date | null;
  priority: TaskPriority;
  status: TaskStatus;
  taskType: TaskType;
};

export function TaskBadges({
  dueAt,
  priority,
  status,
  taskType,
}: TaskBadgesProps) {
  const overdue = isOverdueTask({ dueAt, status });

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={overdue ? "warning" : "secondary"}>
        {overdue ? "Overdue" : taskStatusLabel(status)}
      </Badge>
      <Badge variant={priority === "CRITICAL" ? "warning" : "outline"}>
        {taskPriorityLabel(priority)}
      </Badge>
      <Badge variant="outline">{taskTypeLabel(taskType)}</Badge>
      {dueAt ? (
        <Badge variant={overdue ? "warning" : "secondary"}>
          Due {formatTaskDateTime(dueAt)}
        </Badge>
      ) : null}
    </div>
  );
}

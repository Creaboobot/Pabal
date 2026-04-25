import type { ReactNode } from "react";
import { CircleDashed, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon?: LucideIcon;
  title: string;
};

export function EmptyState({
  action,
  description,
  icon: Icon = CircleDashed,
  title,
}: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-start gap-4 p-4">
      <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-5" />
      </span>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div>{action}</div> : null}
    </Card>
  );
}

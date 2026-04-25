import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CockpitCardProps = {
  children?: ReactNode;
  className?: string;
  eyebrow?: string;
  title: string;
  value?: string | number;
};

export function CockpitCard({
  children,
  className,
  eyebrow,
  title,
  value,
}: CockpitCardProps) {
  return (
    <Card className={cn("p-4", className)}>
      {eyebrow ? (
        <p className="text-xs font-medium uppercase text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <div className="mt-2 flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold leading-6 text-foreground">
          {title}
        </h2>
        {value !== undefined ? (
          <span className="rounded-md bg-muted px-2 py-1 text-sm font-semibold text-foreground">
            {value}
          </span>
        ) : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </Card>
  );
}

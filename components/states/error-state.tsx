import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ErrorStateProps = {
  message?: string;
  reset?: () => void;
  title?: string;
};

export function ErrorState({
  message = "The page could not be loaded.",
  reset,
  title = "Something needs attention",
}: ErrorStateProps) {
  return (
    <Card className="flex flex-col items-start gap-4 p-4">
      <span className="flex size-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
        <AlertTriangle aria-hidden="true" className="size-5" />
      </span>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {message}
        </p>
      </div>
      {reset ? (
        <Button onClick={reset} type="button" variant="outline">
          Try again
        </Button>
      ) : null}
    </Card>
  );
}

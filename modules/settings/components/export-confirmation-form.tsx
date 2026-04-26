"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type ExportConfirmationFormProps = {
  action: string;
  confirmation: string;
  disabled?: boolean;
  label: string;
};

export function ExportConfirmationForm({
  action,
  confirmation,
  disabled = false,
  label,
}: ExportConfirmationFormProps) {
  return (
    <form
      action={action}
      method="post"
      onSubmit={(event) => {
        if (!window.confirm(confirmation)) {
          event.preventDefault();
        }
      }}
    >
      <Button disabled={disabled} type="submit">
        <Download aria-hidden="true" className="mr-2 size-4" />
        {label}
      </Button>
    </form>
  );
}

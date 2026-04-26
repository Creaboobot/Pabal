type FieldErrorProps = {
  id: string;
  message?: string | undefined;
};

export function FieldError({ id, message }: FieldErrorProps) {
  return message ? (
    <p className="text-sm text-destructive" id={id}>
      {message}
    </p>
  ) : null;
}

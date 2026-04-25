type FieldErrorProps = {
  id: string;
  message: string | undefined;
};

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-sm leading-6 text-destructive" id={id}>
      {message}
    </p>
  );
}

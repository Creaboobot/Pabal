export type TasksActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  redirectTo?: string;
  status: "idle" | "success" | "error";
};

export const initialTasksActionState: TasksActionState = {
  status: "idle",
};

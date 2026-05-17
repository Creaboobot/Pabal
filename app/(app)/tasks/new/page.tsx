import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { TaskForm } from "@/modules/tasks/components/task-form";
import { getCurrentUserContext } from "@/server/services/session";
import { getTenantTaskFormOptions } from "@/server/services/task-form-options";

export const dynamic = "force-dynamic";

type NewTaskPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function NewTaskPage({ searchParams }: NewTaskPageProps) {
  const [params, context] = await Promise.all([
    searchParams,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect("/sign-in?callbackUrl=/tasks/new");
  }

  const options = await getTenantTaskFormOptions(context);
  const commitmentId = firstSearchParam(params, "commitmentId") ?? null;
  const companyId = firstSearchParam(params, "companyId") ?? null;
  const meetingId = firstSearchParam(params, "meetingId") ?? null;
  const noteId = firstSearchParam(params, "noteId") ?? null;
  const personId = firstSearchParam(params, "personId") ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Create a manual follow-up and link it to the relationship context that gives it meaning."
        eyebrow="Follow-up"
        title="Create task"
      />

      <CockpitCard title="Task details">
        <TaskForm
          initialValues={{
            commitmentId,
            companyId,
            meetingId,
            noteId,
            personId,
            taskType: "FOLLOW_UP",
          }}
          mode="create"
          options={options}
        />
      </CockpitCard>
    </div>
  );
}

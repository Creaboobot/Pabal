"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type MembershipStatus, type RoleKey } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  initialSettingsActionState,
  type SettingsActionState,
} from "@/modules/settings/action-state";
import {
  deactivateMembershipAction,
  reactivateMembershipAction,
  updateMembershipRoleAction,
} from "@/modules/settings/actions";
import {
  MembershipStatusBadge,
  RoleBadge,
} from "@/modules/settings/components/role-badge";

type MemberManagementCardProps = {
  canManage: boolean;
  currentUserId: string;
  member: {
    createdAt: Date;
    email: string | null;
    id: string;
    name: string | null;
    roleKey: RoleKey;
    status: MembershipStatus;
    updatedAt: Date;
    userId: string;
  };
};

const roles: RoleKey[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

export function MemberManagementCard({
  canManage,
  currentUserId,
  member,
}: MemberManagementCardProps) {
  const router = useRouter();
  const [state, setState] = useState<SettingsActionState>(
    initialSettingsActionState,
  );
  const [confirmingRole, setConfirmingRole] = useState(false);
  const [confirmingStatus, setConfirmingStatus] = useState(false);
  const [pending, startTransition] = useTransition();

  function onRoleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!confirmingRole) {
      setConfirmingRole(true);
      return;
    }

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateMembershipRoleAction(member.id, formData);

      setState(result);
      setConfirmingRole(false);

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  function onStatusChange() {
    startTransition(async () => {
      const result =
        member.status === "ACTIVE"
          ? await deactivateMembershipAction(member.id)
          : await reactivateMembershipAction(member.id);

      setState(result);
      setConfirmingStatus(false);

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  const label = member.name ?? member.email ?? "Workspace member";

  return (
    <article className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">{label}</h2>
            {member.email ? (
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {member.email}
              </p>
            ) : null}
            {member.userId === currentUserId ? (
              <p className="mt-1 text-xs font-medium uppercase text-muted-foreground">
                Current user
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <RoleBadge roleKey={member.roleKey} />
            <MembershipStatusBadge status={member.status} />
          </div>
        </div>

        <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <div>
            <dt>Joined</dt>
            <dd className="font-medium text-foreground">
              {formatDate(member.createdAt)}
            </dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd className="font-medium text-foreground">
              {formatDate(member.updatedAt)}
            </dd>
          </div>
        </dl>

        {state.message ? (
          <div className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">
            {state.message}
          </div>
        ) : null}

        {canManage ? (
          <div className="grid gap-3 border-t border-border pt-4">
            <form
              className="grid gap-3 sm:grid-cols-[1fr_auto]"
              onSubmit={onRoleSubmit}
            >
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">
                  Role
                </span>
                <select
                  className="min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
                  defaultValue={member.roleKey}
                  disabled={pending}
                  name="roleKey"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <Button disabled={pending} type="submit" variant="outline">
                  {confirmingRole ? "Confirm role" : "Change role"}
                </Button>
              </div>
            </form>

            {confirmingRole ? (
              <div className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
                Role changes affect workspace administration access. Confirm
                only after checking the member and the selected role.
              </div>
            ) : null}

            <div className="grid gap-2">
              {!confirmingStatus ? (
                <Button
                  disabled={pending}
                  onClick={() => setConfirmingStatus(true)}
                  type="button"
                  variant="outline"
                >
                  {member.status === "ACTIVE"
                    ? "Deactivate membership"
                    : "Reactivate membership"}
                </Button>
              ) : (
                <div className="rounded-md border border-border bg-muted p-3">
                  <p className="text-sm font-medium text-foreground">
                    Confirm membership status change
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Memberships are never hard-deleted. Last-owner protection is
                    enforced by the service before the status changes.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      disabled={pending}
                      onClick={onStatusChange}
                      type="button"
                    >
                      {pending ? "Saving" : "Confirm"}
                    </Button>
                    <Button
                      disabled={pending}
                      onClick={() => setConfirmingStatus(false)}
                      type="button"
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="rounded-md border border-border bg-muted p-3 text-sm leading-6 text-muted-foreground">
            Owner access is required to change member roles or status.
          </p>
        )}
      </div>
    </article>
  );
}

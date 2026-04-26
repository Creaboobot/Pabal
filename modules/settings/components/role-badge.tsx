import { type MembershipStatus, type RoleKey } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

type RoleBadgeProps = {
  roleKey: RoleKey;
};

type MembershipStatusBadgeProps = {
  status: MembershipStatus;
};

export function RoleBadge({ roleKey }: RoleBadgeProps) {
  const variant =
    roleKey === "OWNER" || roleKey === "ADMIN" ? "default" : "outline";

  return <Badge variant={variant}>{roleKey}</Badge>;
}

export function MembershipStatusBadge({ status }: MembershipStatusBadgeProps) {
  return (
    <Badge variant={status === "ACTIVE" ? "success" : "secondary"}>
      {status}
    </Badge>
  );
}

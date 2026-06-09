import { useMemo } from "react";
import { useAuth } from "../components/UserProfile/AuthProvider";
import {
  canAccessRoute,
  getRoleLabel,
  normalizeUserRole,
  USER_ROLES,
  type UserRoleId,
} from "../config/permissions";

export function usePermissions() {
  const { user } = useAuth();

  const role = useMemo(
    () => normalizeUserRole(user?.type_user),
    [user?.type_user]
  );

  const canAccess = useMemo(
    () => (path: string) => canAccessRoute(path, role ?? user?.type_user),
    [role, user?.type_user]
  );

  const isGroupLeader = useMemo(
    () => Boolean(user?.is_group_leader),
    [user?.is_group_leader]
  );

  return {
    role,
    isAdmin: role === USER_ROLES.ADMIN,
    isStandard: role === USER_ROLES.STANDARD,
    isCommunications: role === USER_ROLES.COMMUNICATIONS,
    isGroupLeader,
    canAccess,
    roleLabel: getRoleLabel(user?.type_user),
  };
}

export type { UserRoleId };

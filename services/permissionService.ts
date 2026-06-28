import { Permission, PermissionMap } from "@/types/Permission";
import { UserRole } from "@/types/Auth";

const OWNER_PERMISSIONS: PermissionMap = {
  ATTENDANCE_READ: true,
  ATTENDANCE_WRITE: true,
  WORKER_READ: true,
  WORKER_WRITE: true,
  WORKER_DELETE: true,
  SERVICE_READ: true,
  SERVICE_WRITE: true,
  SERVICE_DELETE: true,
  TRANSACTION_READ: true,
  TRANSACTION_WRITE: true,
  EXPENSE_READ: true,
  EXPENSE_WRITE: true,
  EXPENSE_DELETE: true,
  REPORT_READ: true,
  REPORT_WRITE: true,
  SETTLEMENT_READ: true,
  SETTLEMENT_WRITE: true,
  SETTINGS_READ: true,
  SETTINGS_WRITE: true,
  AUDIT_READ: true,
  DASHBOARD_OWNER: true,
  DASHBOARD_WORKER: false,
  DAY_CLOSE: true,
};

const WORKER_PERMISSIONS: PermissionMap = {
  ATTENDANCE_READ: true,
  ATTENDANCE_WRITE: true,
  WORKER_READ: false,
  WORKER_WRITE: false,
  WORKER_DELETE: false,
  SERVICE_READ: true,
  SERVICE_WRITE: false,
  SERVICE_DELETE: false,
  TRANSACTION_READ: true,
  TRANSACTION_WRITE: false,
  EXPENSE_READ: false,
  EXPENSE_WRITE: false,
  EXPENSE_DELETE: false,
  REPORT_READ: false,
  REPORT_WRITE: false,
  SETTLEMENT_READ: true,
  SETTLEMENT_WRITE: false,
  SETTINGS_READ: false,
  SETTINGS_WRITE: false,
  AUDIT_READ: false,
  DASHBOARD_OWNER: false,
  DASHBOARD_WORKER: true,
  DAY_CLOSE: false,
};

export const getPermissionsForRole = (role: UserRole): PermissionMap => {
  return role === "OWNER" ? OWNER_PERMISSIONS : WORKER_PERMISSIONS;
};

export const hasPermission = (
  role: UserRole,
  permission: Permission,
): boolean => {
  const map = getPermissionsForRole(role);
  return map[permission] === true;
};

export const hasAllPermissions = (
  role: UserRole,
  permissions: Permission[],
): boolean => {
  return permissions.every((p) => hasPermission(role, p));
};

export const hasAnyPermission = (
  role: UserRole,
  permissions: Permission[],
): boolean => {
  return permissions.some((p) => hasPermission(role, p));
};

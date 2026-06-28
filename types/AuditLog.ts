import { UserRole } from "./Auth";

export type AuditAction =
  | "OWNER_SETUP"
  | "LOGIN"
  | "LOGOUT"
  | "WORKER_PIN_RESET"
  | "SESSION_EXPIRED"
  | "LOGIN_REQUEST_CREATED"
  | "LOGIN_REQUEST_APPROVED"
  | "LOGIN_REQUEST_REJECTED";

export interface AuditLog {
  auditId: string;
  action: AuditAction;
  userId: string;
  role: UserRole;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, string | number | boolean>;
  timestamp: string;
}

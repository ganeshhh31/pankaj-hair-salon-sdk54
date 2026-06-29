import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import { AuditAction, AuditLog } from "@/types/AuditLog";
import { UserRole } from "@/types/Auth";
import { appendAuditLog } from "@/storage/auditStorage";

export const logAction = async (params: {
  action: AuditAction;
  userId: string;
  role: UserRole;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, string | number | boolean>;
}): Promise<void> => {
  const log: AuditLog = {
    auditId: uuidv4(),
    action: params.action,
    userId: params.userId,
    role: params.role,
    targetId: params.targetId,
    targetType: params.targetType,
    metadata: params.metadata,
    timestamp: new Date().toISOString(),
  };

  appendAuditLog(log).catch((err) =>
    console.error("[auditService] logAction failed silently:", err),
  );
};

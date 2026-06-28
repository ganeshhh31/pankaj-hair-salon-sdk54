import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuditLog } from "../types/AuditLog";
import { STORAGE_KEYS } from "./keys";

const MAX_AUDIT_LOGS = 500;

const loadLogs = async (): Promise<AuditLog[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
  return data ? (JSON.parse(data) as AuditLog[]) : [];
};

const persistLogs = async (logs: AuditLog[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
};

export const appendAuditLog = async (log: AuditLog): Promise<void> => {
  try {
    const logs = await loadLogs();
    logs.unshift(log);
    const trimmed = logs.slice(0, MAX_AUDIT_LOGS);
    await persistLogs(trimmed);
  } catch (error) {
    console.error("[auditStorage] appendAuditLog failed:", error);
  }
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  try {
    return await loadLogs();
  } catch (error) {
    console.error("[auditStorage] getAuditLogs failed:", error);
    return [];
  }
};

export const clearAuditLogs = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
  } catch (error) {
    console.error("[auditStorage] clearAuditLogs failed:", error);
  }
};

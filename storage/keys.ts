// FIX: Added SERVICES key — was missing despite Service type existing.
// FIX: Added SCHEMA_VERSION key — enables safe data migrations in future versions.

export const STORAGE_KEYS = {
  OWNERS: "owners",
  WORKERS: "workers",
  TRANSACTIONS: "transactions",
  EXPENSES: "expenses",
  ATTENDANCE: "attendance",
  SETTLEMENTS: "settlements",
  REPORTS: "reports",
  SETTINGS: "settings",
  SERVICES: "services",         // Added: was missing in V8
  SCHEMA_VERSION: "schema_version", // Added: for future migration support
  AUDIT_LOGS: "audit_logs",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

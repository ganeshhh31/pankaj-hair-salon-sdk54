// FIX: Added `pin` field for future auth parity with Owner.
// FIX: `status` aligns with Attendance — both use the same lifecycle.

export type WorkerStatus = "INACTIVE" | "ACTIVE" | "CHECKED_OUT" | "SETTLED";

export interface Worker {
  workerId: string;
  name: string;
  phone: string;
  pin: string; // Added: parity with Owner; use empty string "" if not set
  role: "worker";
  status: WorkerStatus;
  joinDate: string; // ISO date string: "YYYY-MM-DD"
}

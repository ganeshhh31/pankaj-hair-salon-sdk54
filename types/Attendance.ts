// FIX: Removed duplicate AttendanceStatus — reuses WorkerStatus for lifecycle consistency.
// A worker's status and their attendance status follow the same state machine.

import { WorkerStatus } from "./Worker";

export type AttendanceStatus = WorkerStatus;

export interface Attendance {
  attendanceId: string;
  workerId: string;
  status: AttendanceStatus;
  checkInTime: string;  // ISO datetime string
  checkOutTime: string; // ISO datetime string; empty string "" if not checked out yet
  date: string;         // "YYYY-MM-DD"
}

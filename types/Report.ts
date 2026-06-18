// FIX: Added `status` field — differentiates draft (in-progress) from finalized reports.
// This enables day-close flows where a report is built incrementally.

export type ReportStatus = "DRAFT" | "FINALIZED";

export interface Report {
  reportId: string;
  date: string;               // "YYYY-MM-DD"
  status: ReportStatus;       // DRAFT during the day, FINALIZED on day-close

  totalCollection: number;
  cashCollection: number;
  onlineCollection: number;

  totalExpenses: number;
  totalSettlements: number;

  workerCount: number;

  generatedAt: string;        // ISO datetime string
  generatedBy: string;        // ownerId who generated/closed the report
}

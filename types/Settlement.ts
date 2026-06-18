// FIX: Added `paymentMode` — essential to know if the worker was paid cash or UPI.
// This is a critical missing field for a salon payment tracking app.

import { PaymentMode } from "./PaymentMode";

export type SettlementStatus = "PENDING" | "PARTIALLY_PAID" | "PAID";

export interface Settlement {
  settlementId: string;
  workerId: string;
  collectionAmount: number;   // Total amount collected by this worker
  sharePercentage: number;    // e.g. 50
  settlementAmount: number;   // collectionAmount * (sharePercentage / 100)
  paymentMode: PaymentMode;   // How the worker was paid
  status: SettlementStatus;
  timestamp: string;          // ISO datetime string
}

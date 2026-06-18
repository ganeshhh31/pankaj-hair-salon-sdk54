// FIX: `serviceId` is now optional — supports custom/walk-in charges with no linked service.
// FIX: `PaymentMode` imported from its own file, not defined here.

import { PaymentMode } from "./PaymentMode";

export type TransactionStatus = "ACTIVE" | "VOID" | "SETTLED";

export interface Transaction {
  transactionId: string;
  workerId: string;
  serviceId?: string; // Optional: may be absent for custom charges
  amount: number;
  paymentMode: PaymentMode;
  createdBy: string;  // ownerId or workerId who logged this
  timestamp: string;  // ISO datetime string
  status: TransactionStatus;
}

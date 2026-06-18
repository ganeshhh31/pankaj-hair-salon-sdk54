// FIX: `PaymentMode` imported from its own file — removes coupling to Transaction.ts.

import { PaymentMode } from "./PaymentMode";

export type ExpenseStatus = "ACTIVE" | "DELETED";

export interface Expense {
  expenseId: string;
  workerId: string;   // Worker who incurred the expense; use ownerId if owner-level
  amount: number;
  category: string;
  description: string;
  paymentMode: PaymentMode;
  createdBy: string;  // ownerId or workerId who logged this
  timestamp: string;  // ISO datetime string
  status: ExpenseStatus;
}

// Extracted from Transaction.ts so other entities (Expense, Settlement)
// can import without creating circular or tight coupling.

export type PaymentMode = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";

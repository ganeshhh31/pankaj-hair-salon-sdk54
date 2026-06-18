// FIX: Added `settingsId` — enables versioning and unambiguous identification.
// FIX: Added `updatedAt` — critical for knowing when settings last changed.
// Settings is a singleton in storage, but typed as a full record for safety.

export interface Settings {
  settingsId: string;          // Use a fixed constant like "default" or a UUID
  commissionPercentage: number; // e.g. 50 means workers get 50%
  dayCloseTime: string;         // "HH:MM" in 24h format
  allowWorkerExpense: boolean;
  allowWorkerTransactionEdit: boolean;
  loginRequestExpiry: number;   // In minutes
  currency: string;             // ISO currency code, e.g. "INR"
  updatedAt: string;            // ISO datetime string
}

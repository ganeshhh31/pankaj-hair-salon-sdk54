import AsyncStorage from "@react-native-async-storage/async-storage";

import { Transaction } from "../types/Transaction";
import { STORAGE_KEYS } from "./keys";

// ─── Core Helpers ────────────────────────────────────────────────────────────

const loadTransactions = async (): Promise<Transaction[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  return data ? (JSON.parse(data) as Transaction[]) : [];
};

const persistTransactions = async (
  transactions: Transaction[],
): Promise<void> => {
  await AsyncStorage.setItem(
    STORAGE_KEYS.TRANSACTIONS,
    JSON.stringify(transactions),
  );
};

// ─── CRUD ────────────────────────────────────────────────────────────────────

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    return await loadTransactions();
  } catch (error) {
    console.error("[transactionStorage] getTransactions failed:", error);
    return [];
  }
};

export const getTransactionById = async (
  transactionId: string,
): Promise<Transaction | undefined> => {
  try {
    const transactions = await loadTransactions();
    return transactions.find((t) => t.transactionId === transactionId);
  } catch (error) {
    console.error(
      `[transactionStorage] getTransactionById(${transactionId}) failed:`,
      error,
    );
    return undefined;
  }
};

// Utility: all transactions for a specific worker
export const getWorkerTransactions = async (
  workerId: string,
): Promise<Transaction[]> => {
  try {
    const transactions = await loadTransactions();
    return transactions.filter((t) => t.workerId === workerId);
  } catch (error) {
    console.error(
      `[transactionStorage] getWorkerTransactions(${workerId}) failed:`,
      error,
    );
    return [];
  }
};

export const saveTransaction = async (
  transaction: Transaction,
): Promise<void> => {
  try {
    const transactions = await loadTransactions();

    const exists = transactions.some(
      (t) => t.transactionId === transaction.transactionId,
    );
    if (exists) {
      console.warn(
        `[transactionStorage] saveTransaction: transactionId "${transaction.transactionId}" already exists. Use updateTransaction instead.`,
      );
      return;
    }

    transactions.push(transaction);
    await persistTransactions(transactions);
  } catch (error) {
    console.error("[transactionStorage] saveTransaction failed:", error);
  }
};

export const updateTransaction = async (
  updatedTransaction: Transaction,
): Promise<void> => {
  try {
    const transactions = await loadTransactions();

    const index = transactions.findIndex(
      (t) => t.transactionId === updatedTransaction.transactionId,
    );
    if (index === -1) {
      console.warn(
        `[transactionStorage] updateTransaction: transactionId "${updatedTransaction.transactionId}" not found. Use saveTransaction instead.`,
      );
      return;
    }

    transactions[index] = updatedTransaction;
    await persistTransactions(transactions);
  } catch (error) {
    console.error("[transactionStorage] updateTransaction failed:", error);
  }
};

export const deleteTransaction = async (
  transactionId: string,
): Promise<void> => {
  try {
    const transactions = await loadTransactions();
    const filtered = transactions.filter(
      (t) => t.transactionId !== transactionId,
    );

    if (filtered.length === transactions.length) {
      console.warn(
        `[transactionStorage] deleteTransaction: transactionId "${transactionId}" not found.`,
      );
      return;
    }

    await persistTransactions(filtered);
  } catch (error) {
    console.error(
      `[transactionStorage] deleteTransaction(${transactionId}) failed:`,
      error,
    );
  }
};

export const clearTransactions = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  } catch (error) {
    console.error("[transactionStorage] clearTransactions failed:", error);
  }
};

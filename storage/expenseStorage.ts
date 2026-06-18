import AsyncStorage from "@react-native-async-storage/async-storage";

import { Expense } from "../types/Expense";
import { STORAGE_KEYS } from "./keys";

// ─── Core Helpers ────────────────────────────────────────────────────────────

const loadExpenses = async (): Promise<Expense[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
  return data ? (JSON.parse(data) as Expense[]) : [];
};

const persistExpenses = async (expenses: Expense[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
};

// ─── CRUD ────────────────────────────────────────────────────────────────────

export const getExpenses = async (): Promise<Expense[]> => {
  try {
    return await loadExpenses();
  } catch (error) {
    console.error("[expenseStorage] getExpenses failed:", error);
    return [];
  }
};

export const getExpenseById = async (
  expenseId: string,
): Promise<Expense | undefined> => {
  try {
    const expenses = await loadExpenses();
    return expenses.find((e) => e.expenseId === expenseId);
  } catch (error) {
    console.error(
      `[expenseStorage] getExpenseById(${expenseId}) failed:`,
      error,
    );
    return undefined;
  }
};

// Utility: all expenses for a specific worker
export const getWorkerExpenses = async (
  workerId: string,
): Promise<Expense[]> => {
  try {
    const expenses = await loadExpenses();
    return expenses.filter((e) => e.workerId === workerId);
  } catch (error) {
    console.error(
      `[expenseStorage] getWorkerExpenses(${workerId}) failed:`,
      error,
    );
    return [];
  }
};

export const saveExpense = async (expense: Expense): Promise<void> => {
  try {
    const expenses = await loadExpenses();

    const exists = expenses.some((e) => e.expenseId === expense.expenseId);
    if (exists) {
      console.warn(
        `[expenseStorage] saveExpense: expenseId "${expense.expenseId}" already exists. Use updateExpense instead.`,
      );
      return;
    }

    expenses.push(expense);
    await persistExpenses(expenses);
  } catch (error) {
    console.error("[expenseStorage] saveExpense failed:", error);
  }
};

export const updateExpense = async (updatedExpense: Expense): Promise<void> => {
  try {
    const expenses = await loadExpenses();

    const index = expenses.findIndex(
      (e) => e.expenseId === updatedExpense.expenseId,
    );
    if (index === -1) {
      console.warn(
        `[expenseStorage] updateExpense: expenseId "${updatedExpense.expenseId}" not found. Use saveExpense instead.`,
      );
      return;
    }

    expenses[index] = updatedExpense;
    await persistExpenses(expenses);
  } catch (error) {
    console.error("[expenseStorage] updateExpense failed:", error);
  }
};

export const deleteExpense = async (expenseId: string): Promise<void> => {
  try {
    const expenses = await loadExpenses();
    const filtered = expenses.filter((e) => e.expenseId !== expenseId);

    if (filtered.length === expenses.length) {
      console.warn(
        `[expenseStorage] deleteExpense: expenseId "${expenseId}" not found.`,
      );
      return;
    }

    await persistExpenses(filtered);
  } catch (error) {
    console.error(
      `[expenseStorage] deleteExpense(${expenseId}) failed:`,
      error,
    );
  }
};

export const clearExpenses = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.EXPENSES);
  } catch (error) {
    console.error("[expenseStorage] clearExpenses failed:", error);
  }
};

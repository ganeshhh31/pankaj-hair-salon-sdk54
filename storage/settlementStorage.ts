import AsyncStorage from "@react-native-async-storage/async-storage";

import { Settlement } from "../types/Settlement";
import { STORAGE_KEYS } from "./keys";

// ─── Core Helpers ────────────────────────────────────────────────────────────

const loadSettlements = async (): Promise<Settlement[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTLEMENTS);
  return data ? (JSON.parse(data) as Settlement[]) : [];
};

const persistSettlements = async (
  settlements: Settlement[],
): Promise<void> => {
  await AsyncStorage.setItem(
    STORAGE_KEYS.SETTLEMENTS,
    JSON.stringify(settlements),
  );
};

// ─── CRUD ────────────────────────────────────────────────────────────────────

export const getSettlements = async (): Promise<Settlement[]> => {
  try {
    return await loadSettlements();
  } catch (error) {
    console.error("[settlementStorage] getSettlements failed:", error);
    return [];
  }
};

export const getSettlementById = async (
  settlementId: string,
): Promise<Settlement | undefined> => {
  try {
    const settlements = await loadSettlements();
    return settlements.find((s) => s.settlementId === settlementId);
  } catch (error) {
    console.error(
      `[settlementStorage] getSettlementById(${settlementId}) failed:`,
      error,
    );
    return undefined;
  }
};

// Utility: all settlements for a specific worker
export const getWorkerSettlements = async (
  workerId: string,
): Promise<Settlement[]> => {
  try {
    const settlements = await loadSettlements();
    return settlements.filter((s) => s.workerId === workerId);
  } catch (error) {
    console.error(
      `[settlementStorage] getWorkerSettlements(${workerId}) failed:`,
      error,
    );
    return [];
  }
};

export const saveSettlement = async (settlement: Settlement): Promise<void> => {
  try {
    const settlements = await loadSettlements();

    const exists = settlements.some(
      (s) => s.settlementId === settlement.settlementId,
    );
    if (exists) {
      console.warn(
        `[settlementStorage] saveSettlement: settlementId "${settlement.settlementId}" already exists. Use updateSettlement instead.`,
      );
      return;
    }

    settlements.push(settlement);
    await persistSettlements(settlements);
  } catch (error) {
    console.error("[settlementStorage] saveSettlement failed:", error);
  }
};

export const updateSettlement = async (
  updatedSettlement: Settlement,
): Promise<void> => {
  try {
    const settlements = await loadSettlements();

    const index = settlements.findIndex(
      (s) => s.settlementId === updatedSettlement.settlementId,
    );
    if (index === -1) {
      console.warn(
        `[settlementStorage] updateSettlement: settlementId "${updatedSettlement.settlementId}" not found. Use saveSettlement instead.`,
      );
      return;
    }

    settlements[index] = updatedSettlement;
    await persistSettlements(settlements);
  } catch (error) {
    console.error("[settlementStorage] updateSettlement failed:", error);
  }
};

export const deleteSettlement = async (
  settlementId: string,
): Promise<void> => {
  try {
    const settlements = await loadSettlements();
    const filtered = settlements.filter(
      (s) => s.settlementId !== settlementId,
    );

    if (filtered.length === settlements.length) {
      console.warn(
        `[settlementStorage] deleteSettlement: settlementId "${settlementId}" not found.`,
      );
      return;
    }

    await persistSettlements(filtered);
  } catch (error) {
    console.error(
      `[settlementStorage] deleteSettlement(${settlementId}) failed:`,
      error,
    );
  }
};

export const clearSettlements = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SETTLEMENTS);
  } catch (error) {
    console.error("[settlementStorage] clearSettlements failed:", error);
  }
};

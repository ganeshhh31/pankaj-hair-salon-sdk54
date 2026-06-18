import AsyncStorage from "@react-native-async-storage/async-storage";

import { Worker } from "../types/Worker";
import { STORAGE_KEYS } from "./keys";

// ─── Core Helpers ────────────────────────────────────────────────────────────

const loadWorkers = async (): Promise<Worker[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKERS);
  return data ? (JSON.parse(data) as Worker[]) : [];
};

const persistWorkers = async (workers: Worker[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
};

// ─── CRUD ────────────────────────────────────────────────────────────────────

export const getWorkers = async (): Promise<Worker[]> => {
  try {
    return await loadWorkers();
  } catch (error) {
    console.error("[workerStorage] getWorkers failed:", error);
    return [];
  }
};

export const getWorkerById = async (
  workerId: string,
): Promise<Worker | undefined> => {
  try {
    const workers = await loadWorkers();
    return workers.find((w) => w.workerId === workerId);
  } catch (error) {
    console.error(`[workerStorage] getWorkerById(${workerId}) failed:`, error);
    return undefined;
  }
};

export const saveWorker = async (worker: Worker): Promise<void> => {
  try {
    const workers = await loadWorkers();

    // FIX: Prevent duplicates — skip save if workerId already exists
    const exists = workers.some((w) => w.workerId === worker.workerId);
    if (exists) {
      console.warn(
        `[workerStorage] saveWorker: workerId "${worker.workerId}" already exists. Use updateWorker instead.`,
      );
      return;
    }

    workers.push(worker);
    await persistWorkers(workers);
  } catch (error) {
    console.error("[workerStorage] saveWorker failed:", error);
  }
};

export const updateWorker = async (updatedWorker: Worker): Promise<void> => {
  try {
    const workers = await loadWorkers();

    const index = workers.findIndex(
      (w) => w.workerId === updatedWorker.workerId,
    );
    if (index === -1) {
      console.warn(
        `[workerStorage] updateWorker: workerId "${updatedWorker.workerId}" not found. Use saveWorker instead.`,
      );
      return;
    }

    workers[index] = updatedWorker;
    await persistWorkers(workers);
  } catch (error) {
    console.error("[workerStorage] updateWorker failed:", error);
  }
};

export const deleteWorker = async (workerId: string): Promise<void> => {
  try {
    const workers = await loadWorkers();
    const filtered = workers.filter((w) => w.workerId !== workerId);

    if (filtered.length === workers.length) {
      console.warn(
        `[workerStorage] deleteWorker: workerId "${workerId}" not found.`,
      );
      return;
    }

    await persistWorkers(filtered);
  } catch (error) {
    console.error(`[workerStorage] deleteWorker(${workerId}) failed:`, error);
  }
};

// FIX: Added clear() — needed for day-close resets and dev/test workflows
export const clearWorkers = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.WORKERS);
  } catch (error) {
    console.error("[workerStorage] clearWorkers failed:", error);
  }
};

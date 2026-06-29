import AsyncStorage from "@react-native-async-storage/async-storage";

import { Worker } from "../types/Worker";
import { STORAGE_KEYS } from "./keys";

// ─── Core Helpers ────────────────────────────────────────────────────────────

const normalizeWorker = (
  worker: Partial<Worker> & { id?: string; active?: boolean },
  fallbackId: string,
): Worker => {
  const normalizedStatus: Worker["status"] =
    worker.status === "ACTIVE" ||
    worker.status === "CHECKED_OUT" ||
    worker.status === "SETTLED" ||
    worker.status === "INACTIVE"
      ? worker.status
      : worker.active === false
        ? "INACTIVE"
        : "ACTIVE";

  return {
    workerId: worker.workerId ?? worker.id ?? fallbackId,
    name:
      typeof worker.name === "string" && worker.name.trim()
        ? worker.name.trim()
        : "Unnamed Worker",
    phone: typeof worker.phone === "string" ? worker.phone.trim() : "",
    pin: typeof worker.pin === "string" ? worker.pin : "",
    role: "worker",
    status: normalizedStatus,
    joinDate:
      typeof worker.joinDate === "string" && worker.joinDate
        ? worker.joinDate
        : new Date().toISOString().split("T")[0],
  };
};

const loadWorkers = async (): Promise<Worker[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKERS);
  if (!data) return [];

  const parsedData = JSON.parse(data);
  const workers = Array.isArray(parsedData) ? parsedData : [];
  const normalizedWorkers = workers.map((worker, index) =>
    normalizeWorker(worker, `${Date.now()}-${index}`),
  );

  if (JSON.stringify(normalizedWorkers) !== data) {
    await AsyncStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(normalizedWorkers));
  }

  return normalizedWorkers;
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
    const normalizedWorker = normalizeWorker(worker, worker.workerId);

    // FIX: Prevent duplicates — skip save if workerId already exists
    const exists = workers.some((w) => w.workerId === normalizedWorker.workerId);
    if (exists) {
      console.warn(
        `[workerStorage] saveWorker: workerId "${normalizedWorker.workerId}" already exists. Use updateWorker instead.`,
      );
      return;
    }

    workers.push(normalizedWorker);
    await persistWorkers(workers);
  } catch (error) {
    console.error("[workerStorage] saveWorker failed:", error);
  }
};

export const updateWorker = async (updatedWorker: Worker): Promise<void> => {
  try {
    const workers = await loadWorkers();
    const normalizedWorker = normalizeWorker(updatedWorker, updatedWorker.workerId);

    const index = workers.findIndex(
      (w) => w.workerId === normalizedWorker.workerId,
    );
    if (index === -1) {
      console.warn(
        `[workerStorage] updateWorker: workerId "${normalizedWorker.workerId}" not found. Use saveWorker instead.`,
      );
      return;
    }

    workers[index] = normalizedWorker;
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

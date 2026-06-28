import * as SecureStore from "expo-secure-store";

import { Session } from "../types/Auth";
import { StorageError } from "../utils/errors";
import { SECURE_KEYS } from "./secureKeys";

// ─── Session (SecureStore) ────────────────────────────────────────────────────

export const saveSession = async (session: Session): Promise<void> => {
  try {
    await SecureStore.setItemAsync(
      SECURE_KEYS.SESSION,
      JSON.stringify(session),
    );
  } catch (error) {
    console.error("[authStorage] saveSession failed:", error);
    throw new StorageError("Failed to save session.");
  }
};

export const getSession = async (): Promise<Session | null> => {
  try {
    const raw = await SecureStore.getItemAsync(SECURE_KEYS.SESSION);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Session;
    if (
      !parsed.sessionId ||
      !parsed.userId ||
      !parsed.role ||
      !parsed.expiresAt
    ) {
      console.warn("[authStorage] Corrupted session payload.");
      return null;
    }
    return parsed;
  } catch (error) {
    console.error("[authStorage] getSession failed:", error);
    return null;
  }
};

export const clearSession = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(SECURE_KEYS.SESSION);
  } catch (error) {
    console.error("[authStorage] clearSession failed:", error);
    throw new StorageError("Failed to clear session.");
  }
};

// ─── PIN hashes (SecureStore) — never plain PINs ──────────────────────────────

export const saveOwnerPinHash = async (
  ownerId: string,
  pinHash: string,
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(SECURE_KEYS.ownerPin(ownerId), pinHash);
  } catch (error) {
    console.error("[authStorage] saveOwnerPinHash failed:", error);
    throw new StorageError("Failed to save owner PIN.");
  }
};

export const getOwnerPinHash = async (ownerId: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(SECURE_KEYS.ownerPin(ownerId));
  } catch (error) {
    console.error("[authStorage] getOwnerPinHash failed:", error);
    return null;
  }
};

export const saveWorkerPinHash = async (
  workerId: string,
  pinHash: string,
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(SECURE_KEYS.workerPin(workerId), pinHash);
  } catch (error) {
    console.error("[authStorage] saveWorkerPinHash failed:", error);
    throw new StorageError("Failed to save worker PIN.");
  }
};

export const getWorkerPinHash = async (
  workerId: string,
): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(SECURE_KEYS.workerPin(workerId));
  } catch (error) {
    console.error("[authStorage] getWorkerPinHash failed:", error);
    return null;
  }
};

/** Clears session only — PIN hashes remain for re-login. */
export const clearSecureAuthSession = async (): Promise<void> => {
  await clearSession();
};

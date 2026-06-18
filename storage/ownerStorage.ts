import AsyncStorage from "@react-native-async-storage/async-storage";

import { Owner } from "../types/Owner";
import { STORAGE_KEYS } from "./keys";

// ─── Core Helpers ────────────────────────────────────────────────────────────

const loadOwners = async (): Promise<Owner[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.OWNERS);
  return data ? (JSON.parse(data) as Owner[]) : [];
};

const persistOwners = async (owners: Owner[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.OWNERS, JSON.stringify(owners));
};

// ─── CRUD ────────────────────────────────────────────────────────────────────

export const getOwners = async (): Promise<Owner[]> => {
  try {
    return await loadOwners();
  } catch (error) {
    console.error("[ownerStorage] getOwners failed:", error);
    return [];
  }
};

export const getOwnerById = async (
  ownerId: string,
): Promise<Owner | undefined> => {
  try {
    const owners = await loadOwners();
    return owners.find((o) => o.ownerId === ownerId);
  } catch (error) {
    console.error(`[ownerStorage] getOwnerById(${ownerId}) failed:`, error);
    return undefined;
  }
};

export const saveOwner = async (owner: Owner): Promise<void> => {
  try {
    const owners = await loadOwners();

    const exists = owners.some((o) => o.ownerId === owner.ownerId);
    if (exists) {
      console.warn(
        `[ownerStorage] saveOwner: ownerId "${owner.ownerId}" already exists. Use updateOwner instead.`,
      );
      return;
    }

    owners.push(owner);
    await persistOwners(owners);
  } catch (error) {
    console.error("[ownerStorage] saveOwner failed:", error);
  }
};

export const updateOwner = async (updatedOwner: Owner): Promise<void> => {
  try {
    const owners = await loadOwners();

    const index = owners.findIndex((o) => o.ownerId === updatedOwner.ownerId);
    if (index === -1) {
      console.warn(
        `[ownerStorage] updateOwner: ownerId "${updatedOwner.ownerId}" not found. Use saveOwner instead.`,
      );
      return;
    }

    owners[index] = updatedOwner;
    await persistOwners(owners);
  } catch (error) {
    console.error("[ownerStorage] updateOwner failed:", error);
  }
};

export const deleteOwner = async (ownerId: string): Promise<void> => {
  try {
    const owners = await loadOwners();
    const filtered = owners.filter((o) => o.ownerId !== ownerId);

    if (filtered.length === owners.length) {
      console.warn(
        `[ownerStorage] deleteOwner: ownerId "${ownerId}" not found.`,
      );
      return;
    }

    await persistOwners(filtered);
  } catch (error) {
    console.error(`[ownerStorage] deleteOwner(${ownerId}) failed:`, error);
  }
};

export const clearOwners = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.OWNERS);
  } catch (error) {
    console.error("[ownerStorage] clearOwners failed:", error);
  }
};

// services/authService.ts
// Authentication business logic.
// Validates credentials, creates sessions, handles owner setup.

import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import { AuthLoginResult, AuthUser, LoginCredentials } from "../types/Auth";
import { Owner } from "../types/Owner";
import { getOwners, saveOwner } from "../storage/ownerStorage";
import { getWorkers } from "../storage/workerStorage";
import {
  saveOwnerPin,
  getOwnerPin,
  saveWorkerPin,
  getWorkerPin,
} from "../storage/authStorage";
import { createSession } from "./sessionService";
import { logAction } from "./auditService";
import { AuthError, validatePhone, validatePin, validateName } from "../utils/errors";

// ─── Owner Setup ──────────────────────────────────────────────────────────────

export interface OwnerSetupParams {
  name: string;
  phone: string;
  pin: string;
}

export const setupOwner = async (
  params: OwnerSetupParams,
): Promise<{ success: true; owner: Owner } | { success: false; error: string }> => {
  try {
    if (!validateName(params.name)) {
      return { success: false, error: "Name must be 2–50 characters." };
    }
    if (!validatePhone(params.phone)) {
      return { success: false, error: "Enter a valid 10-digit phone number." };
    }
    if (!validatePin(params.pin)) {
      return { success: false, error: "PIN must be 4–6 digits." };
    }

    const existingOwners = await getOwners();
    if (existingOwners.length > 0) {
      return { success: false, error: "Owner already exists." };
    }

    const owner: Owner = {
      ownerId: uuidv4(),
      name: params.name.trim(),
      phone: params.phone.trim(),
      pin: "", // Never store raw PIN in AsyncStorage
      role: "owner",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    await saveOwner(owner);
    await saveOwnerPin(owner.ownerId, params.pin.trim());

    await logAction({
      action: "OWNER_SETUP",
      userId: owner.ownerId,
      role: "OWNER",
      targetId: owner.ownerId,
      targetType: "Owner",
    });

    return { success: true, owner };
  } catch (error) {
    console.error("[authService] setupOwner failed:", error);
    return { success: false, error: "Setup failed. Please try again." };
  }
};

// ─── Check Owner Exists ───────────────────────────────────────────────────────

export const ownerExists = async (): Promise<boolean> => {
  try {
    const owners = await getOwners();
    return owners.length > 0;
  } catch {
    return false;
  }
};

// ─── Owner Login ──────────────────────────────────────────────────────────────

export const loginOwner = async (
  credentials: LoginCredentials,
): Promise<AuthLoginResult> => {
  try {
    const owners = await getOwners();
    const owner = owners.find(
      (o) => o.phone.trim() === credentials.phone.trim() && o.status === "ACTIVE",
    );

    if (!owner) {
      return { success: false, error: "Owner not found or inactive." };
    }

    const storedPin = await getOwnerPin(owner.ownerId);
    if (!storedPin || storedPin !== credentials.pin.trim()) {
      return { success: false, error: "Incorrect PIN. Please try again." };
    }

    const user: AuthUser = {
      userId: owner.ownerId,
      name: owner.name,
      phone: owner.phone,
      role: "OWNER",
    };

    await createSession(user);

    await logAction({
      action: "LOGIN",
      userId: owner.ownerId,
      role: "OWNER",
      metadata: { phone: owner.phone },
    });

    return { success: true, user };
  } catch (error) {
    console.error("[authService] loginOwner failed:", error);
    return { success: false, error: "Login failed. Please try again." };
  }
};

// ─── Worker Login ─────────────────────────────────────────────────────────────

export const loginWorker = async (
  credentials: LoginCredentials,
): Promise<AuthLoginResult> => {
  try {
    const workers = await getWorkers();
    const worker = workers.find(
      (w) => w.phone.trim() === credentials.phone.trim() && w.status !== "INACTIVE",
    );

    if (!worker) {
      return { success: false, error: "Worker not found or inactive." };
    }

    const storedPin = await getWorkerPin(worker.workerId);
    if (!storedPin) {
      return {
        success: false,
        error: "Worker PIN not set. Contact your owner to reset it.",
      };
    }

    if (storedPin !== credentials.pin.trim()) {
      return { success: false, error: "Incorrect PIN. Please try again." };
    }

    const user: AuthUser = {
      userId: worker.workerId,
      name: worker.name,
      phone: worker.phone,
      role: "WORKER",
    };

    await createSession(user);

    await logAction({
      action: "LOGIN",
      userId: worker.workerId,
      role: "WORKER",
      metadata: { phone: worker.phone },
    });

    return { success: true, user };
  } catch (error) {
    console.error("[authService] loginWorker failed:", error);
    return { success: false, error: "Login failed. Please try again." };
  }
};

// ─── Worker PIN Management ────────────────────────────────────────────────────

export const setWorkerPin = async (
  workerId: string,
  pin: string,
  callerUserId: string,
): Promise<void> => {
  if (!validatePin(pin)) {
    throw new AuthError("Invalid PIN format.", "PIN must be 4–6 digits.");
  }
  await saveWorkerPin(workerId, pin.trim());
  await logAction({
    action: "WORKER_PIN_RESET",
    userId: callerUserId,
    role: "OWNER",
    targetId: workerId,
    targetType: "Worker",
  });
};
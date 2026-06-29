import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import {
  getOwnerPinHash,
  getWorkerPinHash,
  saveOwnerPinHash,
  saveWorkerPinHash,
} from "@/storage/authStorage";
import { getOwnerById, getOwners, saveOwner } from "@/storage/ownerStorage";
import { getWorkerById, getWorkers } from "@/storage/workerStorage";
import {
  AuthLoginResult,
  AuthRestoreResult,
  AuthUser,
  LoginCredentials,
} from "@/types/Auth";
import { Owner } from "@/types/Owner";
import { AuthError, validateName, validatePhone, validatePin } from "@/utils/errors";
import { hashPin, verifyPinHash } from "@/utils/pinHash";

import { logAction } from "../auditService";
import {
  createSession,
  invalidateSession,
  isSessionValid,
  readStoredSession,
} from "../sessionService";
import {
  IAuthProvider,
  OwnerSetupParams,
  OwnerSetupResult,
  WorkerLoginOptions,
} from "./IAuthProvider";

/**
 * Offline-first auth provider (SecureStore + AsyncStorage).
 * Replace with FirebaseAuthProvider without changing UI or navigation.
 */
export class LocalAuthProvider implements IAuthProvider {
  readonly providerId = "local" as const;

  async restoreSession(): Promise<AuthRestoreResult> {
    console.log("[startup] restoreSession() starts");
    try {
      const session = await readStoredSession();
      if (!session) {
        console.log("[startup] restoreSession() returns", { success: false, reason: "none" });
        return { success: false, reason: "none" };
      }

      if (!isSessionValid(session)) {
        await invalidateSession();
        await logAction({
          action: "SESSION_EXPIRED",
          userId: session.userId,
          role: session.role,
        });
        console.log("[startup] restoreSession() returns", { success: false, reason: "expired" });
        return { success: false, reason: "expired" };
      }

      const user = await this.resolveUserFromSession(session);
      if (!user) {
        await invalidateSession();
        console.log("[startup] restoreSession() returns", { success: false, reason: "corrupted" });
        return { success: false, reason: "corrupted" };
      }

      console.log("[startup] restoreSession() returns", { success: true, user, session });
      return { success: true, user, session };
    } catch (error) {
      console.error("[LocalAuthProvider] restoreSession failed:", error);
      console.log("[startup] restoreSession() returns", { success: false, reason: "storage_error" });
      return { success: false, reason: "storage_error" };
    }
  }

  async ownerExists(): Promise<boolean> {
    console.log("[startup] ownerExists() starts");
    try {
      const owners = await getOwners();
      const result = owners.length > 0;
      console.log("[startup] ownerExists() returns", result);
      return result;
    } catch {
      console.log("[startup] ownerExists() returns", false);
      return false;
    }
  }

  async setupOwner(params: OwnerSetupParams): Promise<OwnerSetupResult> {
    try {
      if (!validateName(params.name)) {
        return {
          success: false,
          error: "Name must be 2–50 characters.",
          code: "INVALID_NAME",
        };
      }
      if (!validatePhone(params.phone)) {
        return {
          success: false,
          error: "Enter a valid 10-digit phone number.",
          code: "INVALID_PHONE",
        };
      }
      if (!validatePin(params.pin, 4)) {
        return {
          success: false,
          error: "PIN must be 4 digits.",
          code: "INVALID_PIN",
        };
      }

      const existingOwners = await getOwners();
      if (existingOwners.length > 0) {
        return {
          success: false,
          error: "Owner already exists.",
          code: "OWNER_EXISTS",
        };
      }

      const owner: Owner = {
        ownerId: uuidv4(),
        name: params.name.trim(),
        phone: params.phone.trim(),
        pin: "",
        role: "owner",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };

      const pinHash = await hashPin(params.pin, owner.ownerId);
      await saveOwner(owner);
      await saveOwnerPinHash(owner.ownerId, pinHash);

      await logAction({
        action: "OWNER_SETUP",
        userId: owner.ownerId,
        role: "OWNER",
        targetId: owner.ownerId,
        targetType: "Owner",
      });

      return { success: true, owner };
    } catch (error) {
      console.error("[LocalAuthProvider] setupOwner failed:", error);
      return {
        success: false,
        error: "Setup failed. Please try again.",
        code: "SETUP_FAILED",
      };
    }
  }

  async loginOwner(credentials: LoginCredentials): Promise<AuthLoginResult> {
    try {
      if (!validatePhone(credentials.phone)) {
        return {
          success: false,
          error: "Enter a valid 10-digit phone number.",
          code: "INVALID_PHONE",
        };
      }
      if (!validatePin(credentials.pin, 4)) {
        return {
          success: false,
          error: "PIN must be 4 digits.",
          code: "INVALID_PIN",
        };
      }

      const owners = await getOwners();
      const owner = owners.find(
        (o) => o.phone.trim() === credentials.phone.trim() && o.status === "ACTIVE",
      );

      if (!owner) {
        return {
          success: false,
          error: "Owner not found or inactive.",
          code: "USER_NOT_FOUND",
        };
      }

      const storedHash = await getOwnerPinHash(owner.ownerId);
      if (!storedHash) {
        return {
          success: false,
          error: "PIN not configured. Please contact support.",
          code: "PIN_NOT_SET",
        };
      }

      const pinValid = await verifyPinHash(
        credentials.pin,
        owner.ownerId,
        storedHash,
      );
      if (!pinValid) {
        return {
          success: false,
          error: "Incorrect PIN. Please try again.",
          code: "INVALID_CREDENTIALS",
        };
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
        metadata: { phone: owner.phone, provider: "local" },
      });

      return { success: true, user };
    } catch (error) {
      console.error("[LocalAuthProvider] loginOwner failed:", error);
      return {
        success: false,
        error: "Login failed. Please try again.",
        code: "LOGIN_FAILED",
      };
    }
  }

  async loginWorker(
    credentials: LoginCredentials,
    options?: WorkerLoginOptions,
  ): Promise<AuthLoginResult> {
    const method = options?.method ?? "PIN";

    if (method === "OWNER_APPROVAL") {
      // Future: create LoginRequest, notify owner — not implemented yet.
      return {
        success: false,
        error: "Owner approval login is not available yet.",
        code: "NOT_IMPLEMENTED",
      };
    }

    try {
      if (!validatePhone(credentials.phone)) {
        return {
          success: false,
          error: "Enter a valid 10-digit phone number.",
          code: "INVALID_PHONE",
        };
      }
      if (!validatePin(credentials.pin, 4)) {
        return {
          success: false,
          error: "PIN must be 4 digits.",
          code: "INVALID_PIN",
        };
      }

      const workers = await getWorkers();
      const worker = workers.find((w) => {
        const storedPhone = typeof w?.phone === "string" ? w.phone : "";
        return storedPhone.trim() === credentials.phone.trim();
      });

      if (!worker) {
        return {
          success: false,
          error: "Worker not found.",
          code: "USER_NOT_FOUND",
        };
      }

      const storedHash = await getWorkerPinHash(worker.workerId);
      if (!storedHash) {
        return {
          success: false,
          error: "Worker PIN not set. Contact your owner to reset it.",
          code: "PIN_NOT_SET",
        };
      }

      const pinValid = await verifyPinHash(
        credentials.pin,
        worker.workerId,
        storedHash,
      );
      if (!pinValid) {
        return {
          success: false,
          error: "Incorrect PIN. Please try again.",
          code: "INVALID_CREDENTIALS",
        };
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
        metadata: { phone: worker.phone, provider: "local" },
      });

      return { success: true, user };
    } catch (error) {
      console.error("[LocalAuthProvider] loginWorker failed:", error);
      return {
        success: false,
        error: "Login failed. Please try again.",
        code: "LOGIN_FAILED",
      };
    }
  }

  async logout(): Promise<void> {
    try {
      const session = await readStoredSession();
      if (session) {
        await logAction({
          action: "LOGOUT",
          userId: session.userId,
          role: session.role,
        });
      }
      await invalidateSession();
    } catch (error) {
      console.error("[LocalAuthProvider] logout failed:", error);
      throw error;
    }
  }

  async setWorkerPin(
    workerId: string,
    pin: string,
    callerUserId: string,
  ): Promise<void> {
    if (!validatePin(pin, 4)) {
      throw new AuthError("INVALID_PIN", "PIN must be 4 digits.");
    }
    const pinHash = await hashPin(pin, workerId);
    await saveWorkerPinHash(workerId, pinHash);
    await logAction({
      action: "WORKER_PIN_RESET",
      userId: callerUserId,
      role: "OWNER",
      targetId: workerId,
      targetType: "Worker",
    });
  }

  async resolveUserFromSession(session: {
    userId: string;
    role: AuthUser["role"];
  }): Promise<AuthUser | null> {
    if (session.role === "OWNER") {
      const owner = await getOwnerById(session.userId);
      if (!owner || owner.status !== "ACTIVE") return null;
      return {
        userId: owner.ownerId,
        name: owner.name,
        phone: owner.phone,
        role: "OWNER",
      };
    }

    const worker = await getWorkerById(session.userId);
    if (!worker) return null;
    return {
      userId: worker.workerId,
      name: worker.name,
      phone: worker.phone,
      role: "WORKER",
    };
  }
}

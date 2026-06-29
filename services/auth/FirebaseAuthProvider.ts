import {
  AuthLoginResult,
  AuthRestoreResult,
  LoginCredentials,
} from "@/types/Auth";

import {
  IAuthProvider,
  OwnerSetupParams,
  OwnerSetupResult,
  WorkerLoginOptions,
} from "./IAuthProvider";

/**
 * Firebase Authentication provider — stub for V10 migration.
 * Implement this class and call setAuthProvider(new FirebaseAuthProvider()) at bootstrap.
 * UI, navigation, and AuthContext remain unchanged.
 */
export class FirebaseAuthProvider implements IAuthProvider {
  readonly providerId = "firebase" as const;

  private notReady(): AuthLoginResult {
    return {
      success: false,
      error: "Firebase authentication is not configured yet.",
      code: "NOT_IMPLEMENTED",
    };
  }

  async restoreSession(): Promise<AuthRestoreResult> {
    return { success: false, reason: "none" };
  }

  async ownerExists(): Promise<boolean> {
    return false;
  }

  async setupOwner(_params: OwnerSetupParams): Promise<OwnerSetupResult> {
    return {
      success: false,
      error: "Firebase authentication is not configured yet.",
      code: "NOT_IMPLEMENTED",
    };
  }

  async loginOwner(_credentials: LoginCredentials): Promise<AuthLoginResult> {
    return this.notReady();
  }

  async loginWorker(
    _credentials: LoginCredentials,
    _options?: WorkerLoginOptions,
  ): Promise<AuthLoginResult> {
    return this.notReady();
  }

  async logout(): Promise<void> {
    // Future: firebase.auth().signOut()
  }

  async setWorkerPin(
    _workerId: string,
    _pin: string,
    _callerUserId: string,
  ): Promise<void> {
    throw new Error("Firebase authentication is not configured yet.");
  }

  async resolveUserFromSession(_session: {
    userId: string;
    role: "OWNER" | "WORKER";
  }): Promise<null> {
    return null;
  }
}

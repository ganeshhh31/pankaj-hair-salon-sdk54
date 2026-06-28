/**
 * Provider-independent authentication contract.
 * UI, Context, and navigation must only call authService — never a concrete provider.
 * Swap LocalAuthProvider → FirebaseAuthProvider without changing consumers.
 */

import {
  AuthLoginResult,
  AuthProviderId,
  AuthRestoreResult,
  AuthUser,
  LoginCredentials,
  WorkerLoginMethod,
} from "@/types/Auth";
import { Owner } from "@/types/Owner";

export interface OwnerSetupParams {
  name: string;
  phone: string;
  pin: string;
}

export type OwnerSetupResult =
  | { success: true; owner: Owner }
  | { success: false; error: string; code?: string };

export interface WorkerLoginOptions {
  method?: WorkerLoginMethod;
}

export interface IAuthProvider {
  readonly providerId: AuthProviderId;

  restoreSession(): Promise<AuthRestoreResult>;
  ownerExists(): Promise<boolean>;
  setupOwner(params: OwnerSetupParams): Promise<OwnerSetupResult>;
  loginOwner(credentials: LoginCredentials): Promise<AuthLoginResult>;
  loginWorker(
    credentials: LoginCredentials,
    options?: WorkerLoginOptions,
  ): Promise<AuthLoginResult>;
  logout(): Promise<void>;
  setWorkerPin(
    workerId: string,
    pin: string,
    callerUserId: string,
  ): Promise<void>;
  resolveUserFromSession(session: {
    userId: string;
    role: AuthUser["role"];
  }): Promise<AuthUser | null>;
}

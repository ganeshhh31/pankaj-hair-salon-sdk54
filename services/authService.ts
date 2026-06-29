import {
  AuthLoginResult,
  AuthRestoreResult,
  AuthUser,
  LoginCredentials,
} from "@/types/Auth";

import {
  IAuthProvider,
  OwnerSetupParams,
  OwnerSetupResult,
  WorkerLoginOptions,
} from "./auth/IAuthProvider";
import { getAuthProvider } from "./auth/getAuthProvider";

/**
 * Public authentication API — provider-independent facade.
 * UI and Context must only use this module (never LocalAuthProvider / Firebase directly).
 */

export type { OwnerSetupParams, OwnerSetupResult, WorkerLoginOptions };

export const restoreSession = (): Promise<AuthRestoreResult> =>
  getAuthProvider().restoreSession();

export const ownerExists = (): Promise<boolean> =>
  getAuthProvider().ownerExists();

export const setupOwner = (params: OwnerSetupParams): Promise<OwnerSetupResult> =>
  getAuthProvider().setupOwner(params);

export const loginOwner = (credentials: LoginCredentials): Promise<AuthLoginResult> =>
  getAuthProvider().loginOwner(credentials);

export const loginWorker = (
  credentials: LoginCredentials,
  options?: WorkerLoginOptions,
): Promise<AuthLoginResult> =>
  getAuthProvider().loginWorker(credentials, options);

export const logout = (): Promise<void> => getAuthProvider().logout();

export const setWorkerPin = (
  workerId: string,
  pin: string,
  callerUserId: string,
): Promise<void> =>
  getAuthProvider().setWorkerPin(workerId, pin, callerUserId);

export const resolveUserFromSession = (session: {
  userId: string;
  role: AuthUser["role"];
}): Promise<AuthUser | null> =>
  getAuthProvider().resolveUserFromSession(session);

/** Exposed for tests / Firebase bootstrap only. */
export const getAuthProviderInstance = (): IAuthProvider => getAuthProvider();

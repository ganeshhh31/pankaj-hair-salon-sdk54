// Provider-agnostic authentication domain types.
// UI and navigation depend only on these — never on local vs Firebase.

export type UserRole = "OWNER" | "WORKER";

/** Extensible for future roles without breaking consumers. */
export type AuthRole = UserRole;

export type AuthProviderId = "local" | "firebase";

export interface AuthUser {
  userId: string;
  name: string;
  phone: string;
  role: UserRole;
}

export interface Session {
  sessionId: string;
  userId: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  isValid: boolean;
}

export interface LoginCredentials {
  phone: string;
  pin: string;
}

export type AuthLoginResult =
  | { success: true; user: AuthUser }
  | { success: false; error: string; code?: AuthErrorCode };

export type AuthRestoreResult =
  | { success: true; user: AuthUser; session: Session }
  | {
      success: false;
      reason: "none" | "expired" | "corrupted" | "storage_error";
    };

export type AuthErrorCode =
  | "INVALID_PHONE"
  | "INVALID_PIN"
  | "INVALID_CREDENTIALS"
  | "USER_NOT_FOUND"
  | "USER_INACTIVE"
  | "PIN_NOT_SET"
  | "OWNER_EXISTS"
  | "SETUP_FAILED"
  | "LOGIN_FAILED"
  | "STORAGE_ERROR"
  | "SESSION_EXPIRED"
  | "NOT_IMPLEMENTED";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  session: Session | null;
  error: string | null;
}

/** How a worker authenticates — PIN today; owner approval later. */
export type WorkerLoginMethod = "PIN" | "OWNER_APPROVAL";

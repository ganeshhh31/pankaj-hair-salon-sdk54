import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as authService from "@/services/authService";
import { readStoredSession } from "@/services/sessionService";
import {
  AuthLoginResult,
  AuthRestoreResult,
  AuthState,
  AuthUser,
  LoginCredentials,
  Session,
  UserRole,
} from "@/types/Auth";
import {
  OwnerSetupParams,
  OwnerSetupResult,
  WorkerLoginOptions,
} from "@/services/auth/IAuthProvider";

interface AuthContextValue extends AuthState {
  isLoading: boolean;
  loginOwner: (credentials: LoginCredentials) => Promise<AuthLoginResult>;
  loginWorker: (
    credentials: LoginCredentials,
    options?: WorkerLoginOptions,
  ) => Promise<AuthLoginResult>;
  setupOwner: (params: OwnerSetupParams) => Promise<OwnerSetupResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthRestoreResult>;
  ownerExists: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  console.log("[startup] AuthProvider mounts");

  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyAuthenticated = (authUser: AuthUser, authSession: Session) => {
    console.log("[startup] applyAuthenticated", { userId: authUser?.userId, role: authUser?.role });
    setUser(authUser);
    setSession(authSession);
    setStatus("authenticated");
    setError(null);
  };

  const applyUnauthenticated = () => {
    console.log("[startup] applyUnauthenticated");
    setUser(null);
    setSession(null);
    setStatus("unauthenticated");
  };

  const refreshSession = useCallback(async (): Promise<AuthRestoreResult> => {
    console.log("[startup] refreshSession() starts");
    setStatus("loading");
    setError(null);

    const result = await authService.restoreSession();
    console.log("[startup] refreshSession() ends", result);

    if (result.success) {
      applyAuthenticated(result.user, result.session);
      return result;
    }

    applyUnauthenticated();
    if (result.reason === "expired") {
      setError("Your session has expired. Please log in again.");
    } else if (result.reason === "corrupted") {
      setError("Session was invalid. Please log in again.");
    } else if (result.reason === "storage_error") {
      setError("Could not restore session. Please try again.");
    }

    return result;
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const loginOwner = useCallback(
    async (credentials: LoginCredentials): Promise<AuthLoginResult> => {
      setError(null);
      const result = await authService.loginOwner(credentials);
      if (result.success) {
        const storedSession = await readStoredSession();
        if (storedSession) {
          applyAuthenticated(result.user, storedSession);
        } else {
          applyUnauthenticated();
          setError("Could not restore session. Please try again.");
        }
      } else {
        setError(result.error);
      }
      return result;
    },
    [],
  );

  const loginWorker = useCallback(
    async (
      credentials: LoginCredentials,
      options?: WorkerLoginOptions,
    ): Promise<AuthLoginResult> => {
      setError(null);
      const result = await authService.loginWorker(credentials, options);
      if (result.success) {
        const storedSession = await readStoredSession();
        if (storedSession) {
          applyAuthenticated(result.user, storedSession);
        } else {
          applyUnauthenticated();
          setError("Could not restore session. Please try again.");
        }
      } else {
        setError(result.error);
      }
      return result;
    },
    [],
  );

  const setupOwnerHandler = useCallback(
    async (params: OwnerSetupParams): Promise<OwnerSetupResult> => {
      setError(null);
      const result = await authService.setupOwner(params);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch {
      setError("Logout failed. Please try again.");
    } finally {
      applyUnauthenticated();
    }
  }, []);

  const ownerExists = useCallback(
    (): Promise<boolean> => authService.ownerExists(),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      session,
      error,
      isLoading: status === "loading",
      loginOwner,
      loginWorker,
      setupOwner: setupOwnerHandler,
      logout,
      refreshSession,
      ownerExists,
    }),
    [
      status,
      user,
      session,
      error,
      loginOwner,
      loginWorker,
      setupOwnerHandler,
      logout,
      refreshSession,
      ownerExists,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
};

/** Role guard helper for layouts — does not depend on auth provider. */
export const isRoleAllowed = (
  user: AuthUser | null,
  allowedRole: UserRole,
): boolean => {
  return user?.role === allowedRole;
};

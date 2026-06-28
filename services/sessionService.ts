// Session creation, validation, expiry — used by LocalAuthProvider internally.

import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import { AuthUser, Session } from "@/types/Auth";
import {
  clearSession,
  getSession,
  saveSession,
} from "@/storage/authStorage";

export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export const createSession = async (user: AuthUser): Promise<Session> => {
  const now = new Date();
  const session: Session = {
    sessionId: uuidv4(),
    userId: user.userId,
    role: user.role,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS).toISOString(),
    isValid: true,
  };

  await saveSession(session);
  return session;
};

export const isSessionValid = (session: Session): boolean => {
  if (!session.isValid) return false;
  return new Date(session.expiresAt) > new Date();
};

export const invalidateSession = async (): Promise<void> => {
  try {
    await clearSession();
  } catch (error) {
    console.error("[sessionService] invalidateSession failed:", error);
    throw error;
  }
};

export const readStoredSession = async (): Promise<Session | null> => {
  return getSession();
};

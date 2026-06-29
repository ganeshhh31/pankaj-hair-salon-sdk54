// services/sessionService.ts
// Session creation, validation, expiry, and restoration.

import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import { Session, AuthUser } from "../types/Auth";
import { saveSession, getSession, clearSession } from "../storage/authStorage";

// Session expires after 30 days
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// ─── Create Session ───────────────────────────────────────────────────────────

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

// ─── Restore Session ──────────────────────────────────────────────────────────

export const restoreSession = async (): Promise<Session | null> => {
  try {
    const session = await getSession();
    if (!session) return null;

    // Validate session expiry
    if (!isSessionValid(session)) {
      await clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("[sessionService] restoreSession failed:", error);
    return null;
  }
};

// ─── Validate Session ─────────────────────────────────────────────────────────

export const isSessionValid = (session: Session): boolean => {
  if (!session.isValid) return false;
  return new Date(session.expiresAt) > new Date();
};

// ─── Invalidate Session ───────────────────────────────────────────────────────

export const invalidateSession = async (): Promise<void> => {
  try {
    await clearSession();
  } catch (error) {
    console.error("[sessionService] invalidateSession failed:", error);
  }
};
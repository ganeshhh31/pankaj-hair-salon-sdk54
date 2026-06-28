// SecureStore keys — separate from AsyncStorage STORAGE_KEYS.

export const SECURE_KEYS = {
  SESSION: "pankaj_auth_session",
  ownerPin: (ownerId: string): string => `pankaj_pin_owner_${ownerId}`,
  workerPin: (workerId: string): string => `pankaj_pin_worker_${workerId}`,
} as const;

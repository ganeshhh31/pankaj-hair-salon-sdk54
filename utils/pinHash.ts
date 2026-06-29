import * as Crypto from "expo-crypto";

/**
 * Hash a PIN with userId as salt. Never store or compare plain PINs.
 */
export const hashPin = async (pin: string, userId: string): Promise<string> => {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${userId}:${pin.trim()}`,
  );
};

export const verifyPinHash = async (
  pin: string,
  userId: string,
  storedHash: string,
): Promise<boolean> => {
  const computed = await hashPin(pin, userId);
  return computed === storedHash;
};

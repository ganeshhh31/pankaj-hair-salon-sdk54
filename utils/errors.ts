export class AuthError extends Error {
  readonly code: string;
  readonly userMessage: string;

  constructor(code: string, userMessage: string) {
    super(userMessage);
    this.name = "AuthError";
    this.code = code;
    this.userMessage = userMessage;
  }
}

export class StorageError extends Error {
  readonly userMessage: string;

  constructor(message: string, userMessage?: string) {
    super(message);
    this.name = "StorageError";
    this.userMessage = userMessage ?? "Storage operation failed.";
  }
}

const PHONE_REGEX = /^[6-9]\d{9}$/;

export const validatePhone = (phone: string): boolean => {
  const normalized = phone.trim();
  return PHONE_REGEX.test(normalized);
};

export const validatePin = (pin: string, length = 4): boolean => {
  const normalized = pin.trim();
  if (length === 4) {
    return /^\d{4}$/.test(normalized);
  }
  return /^\d{4,6}$/.test(normalized);
};

export const validateName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
};

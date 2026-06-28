import { AuthProviderId } from "@/types/Auth";

import { IAuthProvider } from "./IAuthProvider";
import { LocalAuthProvider } from "./LocalAuthProvider";

let activeProvider: IAuthProvider | null = null;

/**
 * Returns the active auth provider. Default: local (offline).
 * Future: select via app config / remote feature flag without UI changes.
 */
export const getAuthProvider = (): IAuthProvider => {
  if (!activeProvider) {
    activeProvider = new LocalAuthProvider();
  }
  return activeProvider;
};

/** For tests or Firebase migration — swap provider at app bootstrap. */
export const setAuthProvider = (provider: IAuthProvider): void => {
  activeProvider = provider;
};

export const getActiveProviderId = (): AuthProviderId => {
  return getAuthProvider().providerId;
};

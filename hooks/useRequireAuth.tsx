import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { SalonColors } from "@/constants/salon";
import { isRoleAllowed, useAuthContext } from "@/context/AuthContext";
import { UserRole } from "@/types/Auth";

interface UseRequireAuthOptions {
  allowedRole?: UserRole;
  redirectTo?: string;
}

/**
 * Redirect unauthenticated or wrong-role users away from protected layouts.
 */
export const useRequireAuth = (options: UseRequireAuthOptions = {}) => {
  const { allowedRole, redirectTo = "/" } = options;
  const { status, user, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (status !== "authenticated" || !user) {
      router.replace(redirectTo as "/");
      return;
    }

    if (allowedRole && !isRoleAllowed(user, allowedRole)) {
      if (user.role === "OWNER") {
        router.replace("/(owner)/(tabs)" as "/");
      } else {
        router.replace("/(worker)" as "/");
      }
    }
  }, [isLoading, status, user, allowedRole, redirectTo, router]);

  return {
    user,
    isLoading,
    isAuthorized:
      status === "authenticated" &&
      user !== null &&
      (!allowedRole || isRoleAllowed(user, allowedRole)),
  };
};

export const AuthLoadingScreen = () => (
  <View style={styles.centered}>
    <ActivityIndicator size="large" color={SalonColors.primary} />
  </View>
);

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: SalonColors.background,
  },
});

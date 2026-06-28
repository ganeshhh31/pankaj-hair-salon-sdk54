import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";

export default function AuthLayout() {
  const { isLoading, status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (status === "authenticated" && user) {
      if (user.role === "OWNER") {
        router.replace("/(owner)/(tabs)");
      } else {
        router.replace("/(worker)");
      }
    }
  }, [isLoading, status, user, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="owner-setup" />
      <Stack.Screen name="owner-login" />
      <Stack.Screen name="worker-login" />
      <Stack.Screen name="role-select" />
    </Stack>
  );
}

import { Stack } from "expo-router";
import React from "react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { AuthLoadingScreen, useRequireAuth } from "@/hooks/useRequireAuth";

export default function OwnerLayout() {
  const { isLoading, isAuthorized } = useRequireAuth({
    allowedRole: "OWNER",
    redirectTo: "/",
  });

  if (isLoading || !isAuthorized) {
    return <AuthLoadingScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerRight: () => <LogoutButton />,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="attendance" options={{ title: "Attendance" }} />
      <Stack.Screen name="test" options={{ title: "Dev Test" }} />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", title: "Modal" }}
      />
    </Stack>
  );
}

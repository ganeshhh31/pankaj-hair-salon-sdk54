import { Stack } from "expo-router";
import React from "react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { AuthLoadingScreen, useRequireAuth } from "@/hooks/useRequireAuth";

export default function WorkerLayout() {
  const { isLoading, isAuthorized } = useRequireAuth({
    allowedRole: "WORKER",
    redirectTo: "/",
  });

  if (isLoading || !isAuthorized) {
    return <AuthLoadingScreen />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Worker",
          headerRight: () => <LogoutButton />,
        }}
      />
    </Stack>
  );
}

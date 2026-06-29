import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { SalonColors } from "@/constants/salon";
import { useAuth } from "@/hooks/useAuth";

export default function SplashScreen() {
  const { isLoading, status, user, ownerExists } = useAuth();
  console.log("[startup] app/index.tsx renders", { isLoading, status, user: user?.userId ?? null, hasSession: !!user });
  const router = useRouter();
  const [routing, setRouting] = useState(false);

  useEffect(() => {
    console.log("[startup] Splash effect executes", { isLoading, routing, status });
    if (isLoading || routing) return;

    const navigate = async () => {
      console.log("[startup] Splash effect navigation start", { status, user: user?.userId ?? null });
      setRouting(true);

      if (status === "authenticated" && user) {
        if (user.role === "OWNER") {
          console.log("[startup] router.replace() called", "/(owner)/(tabs)");
          router.replace("/(owner)/(tabs)");
        } else {
          console.log("[startup] router.replace() called", "/(worker)");
          router.replace("/(worker)");
        }
        return;
      }

      const exists = await ownerExists();
      if (!exists) {
        console.log("[startup] router.replace() called", "/(auth)/owner-setup");
        router.replace("/(auth)/owner-setup");
      } else {
        console.log("[startup] router.replace() called", "/(auth)/role-select");
        router.replace("/(auth)/role-select");
      }
    };

    void navigate();
  }, [isLoading, status, user, ownerExists, router, routing]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💈 Pankaj Hair Salon</Text>
      <ActivityIndicator size="large" color={SalonColors.primary} />
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: SalonColors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 16,
    color: SalonColors.textMuted,
    fontSize: 16,
  },
});

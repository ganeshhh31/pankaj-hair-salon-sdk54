import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { AuthButton } from "@/components/auth/AuthButton";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { AuthScreenLayout } from "@/components/auth/AuthScreenLayout";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { PinInput } from "@/components/auth/PinInput";
import { SalonColors } from "@/constants/salon";
import { useAuth } from "@/hooks/useAuth";

export default function RoleSelectScreen() {
  const router = useRouter();

  return (
    <AuthScreenLayout>
      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.subtitle}>Choose how you want to continue.</Text>

      <AuthButton
        title="Owner Login"
        onPress={() => router.push("/(auth)/owner-login")}
      />
      <AuthButton
        title="Worker Login"
        variant="success"
        onPress={() => router.push("/(auth)/worker-login")}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: SalonColors.textMuted,
    marginBottom: 8,
    lineHeight: 22,
  },
});

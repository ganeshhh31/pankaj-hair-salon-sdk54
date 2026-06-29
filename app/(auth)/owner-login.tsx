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

export default function OwnerLoginScreen() {
  const { loginOwner, error } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLocalError(null);
    if (phone.length !== 10) {
      setLocalError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (pin.length !== 4) {
      setLocalError("PIN must be 4 digits.");
      return;
    }

    setLoading(true);
    const result = await loginOwner({ phone, pin });
    setLoading(false);

    if (result.success) {
      router.replace("/(owner)/(tabs)");
    }
  };

  return (
    <AuthScreenLayout>
      <Text style={styles.title}>Owner Login</Text>
      <Text style={styles.subtitle}>Enter your mobile number and 4-digit PIN.</Text>

      <AuthErrorBanner message={localError ?? error} />

      <PhoneInput value={phone} onChangeText={setPhone} />
      <PinInput value={pin} onChangeText={setPin} />

      <AuthButton title="Login" onPress={handleLogin} loading={loading} />

      <AuthButton
        title="Back"
        variant="secondary"
        onPress={() => router.back()}
        style={styles.back}
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
  back: {
    marginTop: 10,
  },
});

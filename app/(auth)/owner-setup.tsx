import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput } from "react-native";

import { AuthButton } from "@/components/auth/AuthButton";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { AuthScreenLayout } from "@/components/auth/AuthScreenLayout";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { PinInput } from "@/components/auth/PinInput";
import { SalonColors } from "@/constants/salon";
import { useAuth } from "@/hooks/useAuth";

export default function OwnerSetupScreen() {
  const { setupOwner, loginOwner, error } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSetup = async () => {
    setLocalError(null);
    if (!name.trim()) {
      setLocalError("Please enter your name.");
      return;
    }
    if (phone.length !== 10) {
      setLocalError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (pin.length !== 4) {
      setLocalError("PIN must be 4 digits.");
      return;
    }

    setLoading(true);
    const setupResult = await setupOwner({ name, phone, pin });
    if (!setupResult.success) {
      setLoading(false);
      return;
    }

    const loginResult = await loginOwner({ phone, pin });
    setLoading(false);

    if (loginResult.success) {
      router.replace("/(owner)/(tabs)");
    }
  };

  return (
    <AuthScreenLayout>
      <Text style={styles.title}>Welcome to Pankaj Hair Salon</Text>
      <Text style={styles.subtitle}>Create your owner account to get started.</Text>

      <AuthErrorBanner message={localError ?? error} />

      <Text style={styles.label}>Your Name</Text>
      <TextInput
        style={styles.nameInput}
        placeholder="Owner name"
        value={name}
        onChangeText={setName}
        placeholderTextColor={SalonColors.textMuted}
        maxLength={50}
      />

      <PhoneInput value={phone} onChangeText={setPhone} />
      <PinInput value={pin} onChangeText={setPin} />

      <AuthButton title="Create Owner Account" onPress={handleSetup} loading={loading} />
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
    marginBottom: 16,
    lineHeight: 22,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: SalonColors.textSecondary,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: SalonColors.border,
    borderRadius: 8,
    padding: 10,
    backgroundColor: SalonColors.card,
    fontSize: 16,
    marginBottom: 12,
  },
});

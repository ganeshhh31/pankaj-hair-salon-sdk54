import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps } from "react-native";

import { SalonColors, SalonSpacing } from "@/constants/salon";

interface PhoneInputProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  label = "Mobile Number",
  ...rest
}) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholder="10-digit mobile number"
      keyboardType="phone-pad"
      maxLength={10}
      value={value}
      onChangeText={(t) => onChangeText(t.replace(/\D/g, "").slice(0, 10))}
      placeholderTextColor={SalonColors.textMuted}
      {...rest}
    />
  </>
);

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: SalonColors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: SalonColors.border,
    borderRadius: SalonSpacing.inputRadius,
    padding: 10,
    backgroundColor: SalonColors.card,
    fontSize: 16,
    marginBottom: 12,
  },
});

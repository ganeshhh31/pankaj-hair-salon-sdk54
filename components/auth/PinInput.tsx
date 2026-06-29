import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps } from "react-native";

import { SalonColors, SalonSpacing } from "@/constants/salon";

interface PinInputProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  maxLength?: number;
}

export const PinInput: React.FC<PinInputProps> = ({
  value,
  onChangeText,
  label = "4-digit PIN",
  maxLength = 4,
  ...rest
}) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholder="••••"
      keyboardType="number-pad"
      secureTextEntry
      maxLength={maxLength}
      value={value}
      onChangeText={(t) => onChangeText(t.replace(/\D/g, "").slice(0, maxLength))}
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

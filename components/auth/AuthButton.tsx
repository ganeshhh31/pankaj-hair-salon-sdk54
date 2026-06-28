import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

import { SalonColors, SalonSpacing } from "@/constants/salon";

interface AuthButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: "primary" | "success" | "secondary";
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  loading = false,
  variant = "primary",
  disabled,
  style,
  ...rest
}) => {
  const bg =
    variant === "success"
      ? SalonColors.success
      : variant === "secondary"
        ? "#555"
        : SalonColors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bg },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={SalonColors.primaryText} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderRadius: SalonSpacing.buttonRadius,
    marginTop: 20,
    alignItems: "center",
  },
  disabled: {
    backgroundColor: SalonColors.disabled,
  },
  text: {
    color: SalonColors.primaryText,
    fontSize: 16,
    fontWeight: "600",
  },
});

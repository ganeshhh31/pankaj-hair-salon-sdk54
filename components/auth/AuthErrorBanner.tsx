import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { SalonColors } from "@/constants/salon";

interface AuthErrorBannerProps {
  message: string | null;
}

export const AuthErrorBanner: React.FC<AuthErrorBannerProps> = ({ message }) => {
  if (!message) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#fde8e8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f5c6cb",
  },
  text: {
    color: SalonColors.danger,
    fontSize: 14,
    fontWeight: "500",
  },
});

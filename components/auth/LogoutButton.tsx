import { useRouter } from "expo-router";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";

import { useAuth } from "@/hooks/useAuth";
import { SalonColors } from "@/constants/salon";

export const LogoutButton: React.FC = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={styles.btn}>
      <Text style={styles.text}>Logout</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  text: {
    color: SalonColors.danger,
    fontWeight: "600",
    fontSize: 14,
  },
});

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { SalonColors, SalonSpacing } from "@/constants/salon";
import { useAuth } from "@/hooks/useAuth";

export default function WorkerHomeScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👋 Worker Dashboard</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.name}>{user?.name ?? "Worker"}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
      </View>
      <Text style={styles.hint}>
        More worker features (transactions, attendance, settlement) will appear
        here in upcoming releases.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SalonColors.background,
    padding: SalonSpacing.screenPadding,
    paddingTop: SalonSpacing.screenTop,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: SalonColors.card,
    padding: 20,
    borderRadius: SalonSpacing.cardRadius,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: SalonColors.textMuted,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
    color: SalonColors.textPrimary,
  },
  phone: {
    fontSize: 16,
    marginTop: 4,
    color: SalonColors.textSecondary,
  },
  hint: {
    fontSize: 14,
    color: SalonColors.textMuted,
    lineHeight: 20,
  },
});

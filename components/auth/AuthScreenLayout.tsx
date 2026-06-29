import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { SalonColors, SalonSpacing } from "@/constants/salon";

interface AuthScreenLayoutProps {
  children: React.ReactNode;
}

export const AuthScreenLayout: React.FC<AuthScreenLayoutProps> = ({
  children,
}) => (
  <KeyboardAvoidingView
    style={styles.flex}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
  >
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: SalonColors.background },
  scroll: { flexGrow: 1 },
  inner: {
    flex: 1,
    padding: SalonSpacing.screenPadding,
    paddingTop: SalonSpacing.screenTop,
  },
});

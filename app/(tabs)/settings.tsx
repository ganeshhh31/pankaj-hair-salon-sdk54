import { Picker } from "@react-native-picker/picker";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useLocalization } from "@/src/localization/languageContext";
import { useAppTheme } from "@/src/theme/themeContext";

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.rowIconContainer}>
      <ThemedText style={styles.rowIcon}>{icon}</ThemedText>
    </View>
    <View style={styles.rowText}>
      <ThemedText type="defaultSemiBold" style={styles.rowLabel}>
        {label}
      </ThemedText>
      <ThemedText style={styles.rowValue}>{value}</ThemedText>
    </View>
  </View>
);

const FeatureItem = ({ item }: { item: string }) => (
  <View style={styles.featureItem}>
    <ThemedText style={styles.featureBullet}>•</ThemedText>
    <ThemedText style={styles.featureText}>{item}</ThemedText>
  </View>
);

const SectionCard = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) => <ThemedView style={[styles.card, style]}>{children}</ThemedView>;

export default function SettingsScreen() {
  const { t, languageOptions, language, setLanguage } = useLocalization();
  const { themeName, setTheme, resolvedTheme } = useAppTheme();

  const toneBackground =
    resolvedTheme === "light"
      ? Colors.light.background
      : Colors.dark.background;
  const tintBackground = `${Colors[resolvedTheme].tint}22`;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pageHeader}>
          <ThemedText type="title">{t("settingsTitle")}</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            {t("languageLabel")}
          </ThemedText>
          <View
            style={[styles.pickerWrapper, { backgroundColor: toneBackground }]}
          >
            <Picker
              selectedValue={language}
              onValueChange={(value) => setLanguage(value)}
            >
              {languageOptions.map((option) => (
                <Picker.Item
                  key={option.key}
                  label={option.label}
                  value={option.key}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            {t("themeLabel")}
          </ThemedText>
          <View
            style={[styles.pickerWrapper, { backgroundColor: toneBackground }]}
          >
            <Picker
              selectedValue={themeName}
              onValueChange={(value) => setTheme(value)}
            >
              <Picker.Item label={t("themeSystem")} value="system" />
              <Picker.Item label={t("themeLight")} value="light" />
              <Picker.Item label={t("themeDark")} value="dark" />
            </Picker>
          </View>
        </View>

        <SectionCard style={{ borderColor: tintBackground }}>
          <View style={styles.cardHeader}>
            <View
              style={[styles.cardIcon, { backgroundColor: tintBackground }]}
            >
              <ThemedText style={styles.cardIconText}>📱</ThemedText>
            </View>
            <View style={styles.cardHeaderText}>
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                {t("projectTitle")}
              </ThemedText>
              <ThemedText style={styles.cardSubtitle}>
                {t("projectSubtitle")}
              </ThemedText>
            </View>
          </View>

          <ThemedText style={styles.cardDescription}>
            {t("aboutProjectDescription")}
          </ThemedText>
          <ThemedText style={styles.cardDescription}>
            {t("projectFeatureTitle")}
          </ThemedText>
          <View style={styles.featureList}>
            {[
              t("featureWorkers"),
              t("featureServices"),
              t("featureTransactions"),
              t("featureExpenses"),
              t("featureAttendance"),
              t("featureSettlements"),
              t("featureReports"),
              t("featureAnalytics"),
            ].map((item) => (
              <FeatureItem key={item} item={item} />
            ))}
          </View>

          <View style={styles.divider} />
          <InfoRow
            icon="🏷"
            label={t("versionLabel")}
            value={t("versionValue")}
          />
          <InfoRow
            icon="⚙️"
            label={t("platformLabel")}
            value={t("platformValue")}
          />
          <InfoRow
            icon="🛡"
            label={t("architectureLabel")}
            value={t("architectureValue")}
          />
          <InfoRow
            icon="✅"
            label={t("statusLabel")}
            value={t("statusValue")}
          />
        </SectionCard>

        <SectionCard style={{ borderColor: tintBackground }}>
          <View style={styles.cardHeader}>
            <View
              style={[styles.cardIcon, { backgroundColor: tintBackground }]}
            >
              <ThemedText style={styles.cardIconText}>👨‍💻</ThemedText>
            </View>
            <View style={styles.cardHeaderText}>
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                {t("developerInfo")}
              </ThemedText>
              <ThemedText style={styles.cardSubtitle}>
                {t("developerCardSubtitle")}
              </ThemedText>
            </View>
          </View>

          <InfoRow
            icon="👤"
            label={t("developerNameLabel")}
            value={t("developerName")}
          />
          <InfoRow
            icon="🏷"
            label={t("developerRoleLabel")}
            value={t("developerRole")}
          />
          <InfoRow
            icon="📧"
            label={t("developerEmailLabel")}
            value={t("developerEmail")}
          />
          <InfoRow
            icon="📞"
            label={t("developerMobileLabel")}
            value={t("developerMobile")}
          />
        </SectionCard>

        <View style={styles.footerContainer}>
          <ThemedText
            type="default"
            style={[
              styles.footerDivider,
              { color: Colors[resolvedTheme].icon },
            ]}
          >
            {t("footerDivider")}
          </ThemedText>
          <ThemedText
            type="defaultSemiBold"
            style={[styles.footerTitle, { color: Colors[resolvedTheme].text }]}
          >
            {t("footerAppName")}
          </ThemedText>
          <ThemedText
            type="default"
            style={[styles.footerText, { color: Colors[resolvedTheme].icon }]}
          >
            {t("footerMadeWith")}
          </ThemedText>
          <ThemedText
            type="default"
            style={[styles.footerText, { color: Colors[resolvedTheme].icon }]}
          >
            {t("footerCraftedFor")}
          </ThemedText>
          <ThemedText
            type="default"
            style={[styles.footerText, { color: Colors[resolvedTheme].icon }]}
          >
            {t("footerCopyright")}
          </ThemedText>
          <ThemedText
            type="default"
            style={[styles.footerText, { color: Colors[resolvedTheme].icon }]}
          >
            {t("footerAllRights")}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 24,
  },
  pageHeader: {
    marginBottom: 4,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 14,
    overflow: "hidden",
  },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    gap: 18,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconText: {
    fontSize: 20,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  featureList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  featureBullet: {
    fontSize: 14,
    lineHeight: 22,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  footerContainer: {
    marginTop: 52,
    paddingBottom: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerDivider: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    opacity: 0.65,
  },
  footerTitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
    textAlign: "center",
  },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    opacity: 0.72,
  },
  rowIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,126,164,0.12)",
  },
  rowIcon: {
    fontSize: 16,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 2,
  },
});

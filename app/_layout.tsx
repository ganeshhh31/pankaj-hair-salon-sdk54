import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { LocalizationProvider } from "@/src/localization/languageContext";
import { AppThemeProvider, useAppTheme } from "@/src/theme/themeContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

function AppShell() {
  const { resolvedTheme } = useAppTheme();

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <LocalizationProvider>
      <AppThemeProvider>
        <AppShell />
      </AppThemeProvider>
    </LocalizationProvider>
  );
}

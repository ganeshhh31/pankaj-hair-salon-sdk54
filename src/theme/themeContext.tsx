import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

export type AppTheme = "light" | "dark" | "system";
const THEME_STORAGE_KEY = "appTheme";

interface AppThemeContextValue {
  themeName: AppTheme;
  resolvedTheme: "light" | "dark";
  colors: (typeof Colors)["light"];
  isDark: boolean;
  setTheme: (theme: AppTheme) => Promise<void>;
}

const AppThemeContext = createContext<AppThemeContextValue | undefined>(
  undefined,
);

export const AppThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const systemScheme = useColorScheme();
  const [themeName, setThemeName] = useState<AppTheme>("system");

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (
          storedTheme === "light" ||
          storedTheme === "dark" ||
          storedTheme === "system"
        ) {
          setThemeName(storedTheme);
        }
      } catch (error) {
        console.warn("Failed to load theme from storage", error);
      }
    };

    loadTheme();
  }, []);

  const setTheme = useCallback(async (selectedTheme: AppTheme) => {
    setThemeName(selectedTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
    } catch (error) {
      console.warn("Failed to save theme to storage", error);
    }
  }, []);

  const resolvedTheme =
    themeName === "system" ? (systemScheme ?? "light") : themeName;

  const value = useMemo(
    () => ({
      themeName,
      resolvedTheme,
      colors: Colors[resolvedTheme],
      isDark: resolvedTheme === "dark",
      setTheme,
    }),
    [themeName, resolvedTheme, setTheme],
  );

  return (
    <AppThemeContext.Provider value={value}>
      <ThemeProvider
        value={resolvedTheme === "dark" ? DarkTheme : DefaultTheme}
      >
        {children}
      </ThemeProvider>
    </AppThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return context;
};

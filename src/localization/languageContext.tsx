import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Language,
    TranslationKey,
    languageOptions,
    translations,
} from "./index";

const LANGUAGE_STORAGE_KEY = "appLanguage";

export interface LocalizationContextValue {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  languageOptions: { key: Language; label: string }[];
}

const defaultLanguage: Language = "en";

const LocalizationContext = createContext<LocalizationContextValue | undefined>(
  undefined,
);

const replaceParams = (
  text: string,
  params?: Record<string, string | number>,
) => {
  if (!params) return text;
  return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
    const regex = new RegExp(`{{${paramKey}}}`, "g");
    return acc.replace(regex, String(paramValue));
  }, text);
};

export const LocalizationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (
          storedLanguage &&
          Object.keys(translations).includes(storedLanguage)
        ) {
          setLanguageState(storedLanguage as Language);
        }
      } catch (error) {
        console.warn("Failed to load language from storage", error);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (selectedLanguage: Language) => {
    setLanguageState(selectedLanguage);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
    } catch (error) {
      console.warn("Failed to save language to storage", error);
    }
  }, []);

  const t = useCallback(
    (
      key: keyof (typeof translations)[Language],
      params?: Record<string, string | number>,
    ) => {
      const translationSet =
        translations[language] ?? translations[defaultLanguage];
      const value = translationSet[key] as string | undefined;
      if (!value) return String(key);
      return replaceParams(value, params);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languageOptions,
    }),
    [language, setLanguage, t],
  );

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within LocalizationProvider");
  }
  return context;
};

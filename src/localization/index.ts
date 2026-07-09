import en from "./en";
import mr from "./mr";

export const translations = {
  en,
  mr,
};

export type Language = keyof typeof translations;
export type TranslationSet = typeof en;
export type TranslationKey = keyof TranslationSet;

export const languageOptions = [
  { key: "en", label: en.languageEnglish },
  { key: "mr", label: mr.languageMarathi },
];

export type Translations = typeof en;

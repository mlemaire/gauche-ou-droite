export const translations = {
  fr: {
    left: "Gauche",
    right: "Droite",
    or: "ou",
  },
  en: {
    left: "Left",
    right: "Right",
    or: "or",
  },
};

export type TranslationKeys = keyof typeof translations.fr;

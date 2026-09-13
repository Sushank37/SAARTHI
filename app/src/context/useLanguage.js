import { useContext } from "react";
import { LanguageContext, SUPPORTED_LANGUAGES } from "./language-context";

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return (
    ctx || {
      currentLang: SUPPORTED_LANGUAGES[0],
      changeLanguage: () => {},
      supportedLanguages: SUPPORTED_LANGUAGES,
      t: (text) => text,
      applyDomTranslation: () => {},
    }
  );
}

export default useLanguage;

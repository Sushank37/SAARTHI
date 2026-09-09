import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { TRANSLATIONS } from "../data/translations";

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "ur", name: "Urdu", native: "اردو" },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [currentLang, setCurrentLang] = useState(() => {
    const saved = localStorage.getItem("mplads_preferred_lang") || "en";
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === saved);
    return found || SUPPORTED_LANGUAGES[0];
  });

  const observerRef = useRef(null);

  /**
   * Translates a single text string into the current selected language.
   * Falls back to original text if no translation is available.
   */
  const t = useCallback(
    (text, defaultText = null) => {
      if (!text) return defaultText || text;
      if (currentLang.code === "en") return defaultText || text;

      const trimmed = text.trim();
      const translation = TRANSLATIONS[trimmed]?.[currentLang.code];
      if (translation) {
        // preserve leading and trailing whitespace if present
        const leading = text.match(/^\s*/)[0];
        const trailing = text.match(/\s*$/)[0];
        return `${leading}${translation}${trailing}`;
      }

      return defaultText || text;
    },
    [currentLang]
  );

  /**
   * Automatic DOM Translator:
   * Scans text nodes in the application shell and automatically translates them
   * without requiring hardcoded markup changes across all components.
   */
  const applyDomTranslation = useCallback(
    (rootElement = document.getElementById("root")) => {
      if (!rootElement) return;

      const isEnglish = currentLang.code === "en";

      const walker = document.createTreeWalker(
        rootElement,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;

            // Don't touch scripts, styles, text inputs, or the language selector dropdown itself
            const tagName = parent.tagName.toLowerCase();
            if (
              tagName === "script" ||
              tagName === "style" ||
              tagName === "textarea" ||
              tagName === "input" ||
              tagName === "select" ||
              tagName === "code" ||
              parent.closest(".header-lang-wrapper") ||
              parent.closest(".no-translate")
            ) {
              return NodeFilter.FILTER_REJECT;
            }

            const trimmed = node.nodeValue.trim();
            if (!trimmed || trimmed.length < 2) return NodeFilter.FILTER_SKIP;

            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      const nodesToTranslate = [];
      let currentNode = walker.nextNode();
      while (currentNode) {
        nodesToTranslate.push(currentNode);
        currentNode = walker.nextNode();
      }

      for (const node of nodesToTranslate) {
        // Store original text if not already stored
        if (node.__mplads_original === undefined) {
          node.__mplads_original = node.nodeValue;
        }

        const originalText = node.__mplads_original;
        const trimmedOriginal = originalText.trim();

        if (isEnglish) {
          if (node.nodeValue !== originalText) {
            node.nodeValue = originalText;
          }
        } else {
          // Check exact match in dictionary
          const dictEntry = TRANSLATIONS[trimmedOriginal];
          if (dictEntry && dictEntry[currentLang.code]) {
            const translated = dictEntry[currentLang.code];
            const leading = originalText.match(/^\s*/)[0];
            const trailing = originalText.match(/\s*$/)[0];
            node.nodeValue = `${leading}${translated}${trailing}`;
          }
        }
      }
    },
    [currentLang]
  );

  // Apply DOM translation whenever language changes or DOM updates
  useEffect(() => {
    // Initial run
    applyDomTranslation();

    // Set up MutationObserver to translate dynamically rendered content
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    let timeoutId = null;
    observerRef.current = new MutationObserver(() => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        applyDomTranslation();
      }, 100);
    });

    const rootNode = document.getElementById("root");
    if (rootNode) {
      observerRef.current.observe(rootNode, {
        childList: true,
        subtree: true,
        characterData: false,
      });
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentLang, applyDomTranslation]);

  const changeLanguage = (langObj) => {
    if (!langObj) return;
    setCurrentLang(langObj);
    localStorage.setItem("mplads_preferred_lang", langObj.code);
    document.documentElement.lang = langObj.code;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        changeLanguage,
        supportedLanguages: SUPPORTED_LANGUAGES,
        t,
        applyDomTranslation,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

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

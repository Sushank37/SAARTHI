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
   * Only active when a non-English language is selected.
   */
  const applyDomTranslation = useCallback(
    (rootElement = document.getElementById("root")) => {
      if (!rootElement) return;
      if (currentLang.code === "en") return;

      const walker = document.createTreeWalker(
        rootElement,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;

            // Don't touch scripts, styles, text inputs, SVGs, or untranslatable areas
            const tagName = parent.tagName.toLowerCase();
            if (
              tagName === "script" ||
              tagName === "style" ||
              tagName === "textarea" ||
              tagName === "input" ||
              tagName === "select" ||
              tagName === "code" ||
              parent.closest(".header-lang-wrapper") ||
              parent.closest(".no-translate") ||
              parent.closest("svg")
            ) {
              return NodeFilter.FILTER_REJECT;
            }

            const trimmed = node.nodeValue.trim();
            if (!trimmed || trimmed.length < 2) return NodeFilter.FILTER_SKIP;

            // Never touch pure numbers, currency figures, status codes, dates, or progress percentages
            if (/^[\d,.\s₹%+\-/:—kK]+$/.test(trimmed)) return NodeFilter.FILTER_SKIP;

            // Only accept if there is an exact match in our dictionary
            const dictEntry = TRANSLATIONS[trimmed];
            if (!dictEntry || !dictEntry[currentLang.code]) return NodeFilter.FILTER_SKIP;

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
        const currentVal = node.nodeValue;
        const trimmed = currentVal.trim();
        const dictEntry = TRANSLATIONS[trimmed];
        if (dictEntry && dictEntry[currentLang.code]) {
          if (node.__mplads_original === undefined) {
            node.__mplads_original = currentVal;
          }
          const translated = dictEntry[currentLang.code];
          const leading = currentVal.match(/^\s*/)[0];
          const trailing = currentVal.match(/\s*$/)[0];
          const newVal = `${leading}${translated}${trailing}`;
          if (node.nodeValue !== newVal) {
            node.nodeValue = newVal;
          }
        }
      }
    },
    [currentLang]
  );

  // Apply DOM translation whenever language changes or DOM updates
  useEffect(() => {
    // If English, disconnect observer and restore any previously translated nodes
    if (currentLang.code === "en") {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      const rootNode = document.getElementById("root");
      if (rootNode) {
        const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
        let n = walker.nextNode();
        while (n) {
          if (n.__mplads_original !== undefined) {
            n.nodeValue = n.__mplads_original;
            delete n.__mplads_original;
          }
          n = walker.nextNode();
        }
      }
      return;
    }

    // Non-English: Apply initial translations
    applyDomTranslation();

    // Set up MutationObserver only for non-English translations
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    let timeoutId = null;
    observerRef.current = new MutationObserver(() => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        applyDomTranslation();
      }, 150);
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

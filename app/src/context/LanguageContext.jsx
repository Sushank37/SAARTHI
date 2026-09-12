import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { TRANSLATIONS } from "../data/translations";

// Pre-index translations by lowercased key for robust case-insensitive lookups
const LOWER_CASE_TRANSLATIONS = new Map();
Object.keys(TRANSLATIONS).forEach((k) => {
  const lower = k.toLowerCase().trim();
  if (!LOWER_CASE_TRANSLATIONS.has(lower)) {
    LOWER_CASE_TRANSLATIONS.set(lower, TRANSLATIONS[k]);
  }
});

export const SUPPORTED_LANGUAGES = [
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
    try {
      const saved = localStorage.getItem("mplads_preferred_lang") || "en";
      const found = SUPPORTED_LANGUAGES.find((l) => l.code === saved);
      return found || SUPPORTED_LANGUAGES[0];
    } catch {
      return SUPPORTED_LANGUAGES[0];
    }
  });

  const observerRef = useRef(null);

  /**
   * Translates a single text string into the current selected language.
   * Falls back to original text if no translation is available.
   */
  const t = useCallback(
    (text, defaultText = null) => {
      if (text === null || text === undefined) return defaultText || "";
      if (typeof text !== "string") return text;
      if (currentLang.code === "en") return defaultText || text;

      const trimmed = text.trim();
      if (!trimmed) return text;

      // 1. Direct dictionary match
      const translation = TRANSLATIONS[trimmed]?.[currentLang.code];
      if (translation) {
        const leading = text.match(/^\s*/)[0];
        const trailing = text.match(/\s*$/)[0];
        return `${leading}${translation}${trailing}`;
      }

      // 2. Case-insensitive lookup fallback (handles UPPERCASE, lowercase, Title Case variations)
      const caseInsensitiveMatch =
        LOWER_CASE_TRANSLATIONS.get(trimmed.toLowerCase())?.[currentLang.code] ||
        TRANSLATIONS[trimmed.toUpperCase()]?.[currentLang.code];
      if (caseInsensitiveMatch) {
        const leading = text.match(/^\s*/)[0];
        const trailing = text.match(/\s*$/)[0];
        return `${leading}${caseInsensitiveMatch}${trailing}`;
      }

      // 3. Parentheses entity parser: e.g. "GORAKHPUR(DISTRICT MAGISTRATE GORAKHPUR_IDA)"
      if (trimmed.includes("(") && trimmed.includes(")")) {
        const parenMatch = trimmed.match(/^([^(]+)\((.+)\)$/);
        if (parenMatch) {
          const mainPart = parenMatch[1].trim();
          const subPart = parenMatch[2].trim();
          const transMain = t(mainPart);
          const transSub = t(subPart);
          if (transMain !== mainPart || transSub !== subPart) {
            const leading = text.match(/^\s*/)[0];
            const trailing = text.match(/\s*$/)[0];
            return `${leading}${transMain}(${transSub})${trailing}`;
          }
        }
      }

      // 4. Token & Sub-phrase replacement for dynamic authority & place strings
      // Replace known sub-phrases or terms inside compound strings
      let compound = trimmed;
      const termsToReplace = [
        "DISTRICT MAGISTRATE",
        "District Magistrate",
        "DISTRICT ADMINISTRATION",
        "District Administration",
        "NODAL AUTHORITY",
        "Nodal Authority",
        "SCOPE JURISDICTION",
        "Scope Jurisdiction",
        "WORKS AUDITED",
        "Works Audited",
        "COLLECTORATE",
        "Collectorate",
        "ZILA PARISHAD",
        "Zila Parishad",
        "STATE",
        "State",
        "AUTHORITY",
        "Authority",
        "DISTRICT",
        "District",
        "UTTAR PRADESH",
        "Uttar Pradesh",
        "JAUNPUR",
        "Jaunpur",
        "GORAKHPUR",
        "Gorakhpur",
        "PRAYAGRAJ",
        "Prayagraj",
        "VARANASI",
        "Varanasi",
        "LUCKNOW",
        "Lucknow",
        "AYODHYA",
        "Ayodhya",
        "AGRA",
        "Agra",
        "IDAs",
        "Collectorates",
        "Audited Works",
      ];

      let modified = false;
      for (const term of termsToReplace) {
        if (compound.includes(term)) {
          const transTerm = TRANSLATIONS[term]?.[currentLang.code] || TRANSLATIONS[term.toUpperCase()]?.[currentLang.code];
          if (transTerm) {
            compound = compound.replaceAll(term, transTerm);
            modified = true;
          }
        }
      }

      if (modified) {
        const leading = text.match(/^\s*/)[0];
        const trailing = text.match(/\s*$/)[0];
        return `${leading}${compound}${trailing}`;
      }

      return defaultText || text;
    },
    [currentLang]
  );

  /**
   * Automatic DOM Translator:
   * Scans text nodes in the application shell and automatically translates them
   * using original English text as the persistent key.
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

            const tagName = parent.tagName.toLowerCase();
            if (
              tagName === "script" ||
              tagName === "style" ||
              tagName === "textarea" ||
              tagName === "input" ||
              tagName === "select" ||
              tagName === "code" ||
              tagName === "pre" ||
              parent.closest(".header-lang-wrapper") ||
              parent.closest(".no-translate") ||
              parent.closest("svg")
            ) {
              return NodeFilter.FILTER_REJECT;
            }

            // If node already has original recorded, accept it for translation or restoration
            if (node.__mplads_original !== undefined) {
              return NodeFilter.FILTER_ACCEPT;
            }

            const trimmed = node.nodeValue.trim();
            if (!trimmed || trimmed.length < 2) return NodeFilter.FILTER_SKIP;

            // Skip pure numbers, currency figures, status codes, dates, or progress percentages
            if (/^[\d,.\s₹%+\-/:—kK]+$/.test(trimmed)) return NodeFilter.FILTER_SKIP;

            // Check if t() can translate this text node (exact match, case-insensitive, or entity parser)
            const translated = t(trimmed);
            if (translated && translated !== trimmed) {
              return NodeFilter.FILTER_ACCEPT;
            }

            return NodeFilter.FILTER_SKIP;
          },
        }
      );

      const nodesToProcess = [];
      let currentNode = walker.nextNode();
      while (currentNode) {
        nodesToProcess.push(currentNode);
        currentNode = walker.nextNode();
      }

      for (const node of nodesToProcess) {
        if (isEnglish) {
          if (node.__mplads_original !== undefined) {
            node.nodeValue = node.__mplads_original;
            delete node.__mplads_original;
          }
        } else {
          // Record original English if not yet recorded
          if (node.__mplads_original === undefined) {
            node.__mplads_original = node.nodeValue;
          }

          const originalText = node.__mplads_original;
          const trimmedOriginal = originalText.trim();
          const translated = t(trimmedOriginal);

          if (translated && translated !== trimmedOriginal) {
            const leading = originalText.match(/^\s*/)[0];
            const trailing = originalText.match(/\s*$/)[0];
            const newVal = `${leading}${translated}${trailing}`;
            if (node.nodeValue !== newVal) {
              node.nodeValue = newVal;
            }
          }
        }
      }
    },
    [currentLang]
  );

  // Apply DOM translation whenever language changes or DOM updates
  useEffect(() => {
    document.documentElement.lang = currentLang.code;

    // Apply translations
    applyDomTranslation();

    if (currentLang.code === "en") {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      return;
    }

    // Set up MutationObserver for dynamic updates in non-English
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

    // Re-apply on route change (popstate)
    const handlePopState = () => {
      setTimeout(() => applyDomTranslation(), 100);
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener("popstate", handlePopState);
    };
  }, [currentLang, applyDomTranslation]);

  const changeLanguage = (langObjOrCode) => {
    if (!langObjOrCode) return;
    let target = null;
    if (typeof langObjOrCode === "string") {
      target = SUPPORTED_LANGUAGES.find((l) => l.code === langObjOrCode);
    } else if (langObjOrCode.code) {
      target = SUPPORTED_LANGUAGES.find((l) => l.code === langObjOrCode.code) || langObjOrCode;
    }
    if (!target) return;

    setCurrentLang(target);
    try {
      localStorage.setItem("mplads_preferred_lang", target.code);
    } catch {
      // quiet fallback
    }
    document.documentElement.lang = target.code;
    window.dispatchEvent(new CustomEvent("languagechange", { detail: target }));
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        language: currentLang.code,
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
      language: "en",
      changeLanguage: () => {},
      supportedLanguages: SUPPORTED_LANGUAGES,
      t: (text) => text,
      applyDomTranslation: () => {},
    }
  );
}


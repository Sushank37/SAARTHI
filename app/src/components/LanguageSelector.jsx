import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "../context/useLanguage";

export default function LanguageSelector() {
  const { currentLang, changeLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="header-lang-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`header-lang-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Select Language / भाषा चुनें"
      >
        <Globe size={14} className="header-lang-globe-icon" />
        <span className="header-lang-name">{currentLang.native}</span>
        <ChevronDown size={12} className={`header-lang-chevron ${isOpen ? "rotate" : ""}`} />
      </button>

      {isOpen && (
        <div className="header-lang-menu">
          <div className="header-lang-menu-title">
            <span>Select Language · भाषा चुनें</span>
          </div>
          <div className="header-lang-options-grid">
            {supportedLanguages.map((lang) => {
              const isSelected = currentLang.code === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  className={`header-lang-option ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    changeLanguage(lang);
                    setIsOpen(false);
                  }}
                >
                  <div className="header-lang-option-text">
                    <span className="lang-native">{lang.native}</span>
                    <span className="lang-english">{lang.name}</span>
                  </div>
                  {isSelected && <Check size={13} className="lang-check" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

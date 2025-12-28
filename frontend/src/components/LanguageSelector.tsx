import React from 'react';
import type { SupportedLanguage } from '../types/translation';
import './Settings.css';

interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  disabled?: boolean;
  className?: string;
}

const LANGUAGE_OPTIONS = [
  { code: 'en' as SupportedLanguage, name: 'English', nativeName: 'English' },
  { code: 'hi' as SupportedLanguage, name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te' as SupportedLanguage, name: 'Telugu', nativeName: 'తెలుగు' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`language-selector ${className}`}>
      <label htmlFor="language-select" className="language-selector__label">
        Select Language
      </label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
        disabled={disabled}
        className="language-selector__select"
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name} ({option.nativeName})
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
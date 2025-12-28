import React, { useState } from 'react';
import { Edit3, Globe, Check, X } from 'lucide-react';
import type { SupportedLanguage } from '../types/translation';
import LanguageSelector from './LanguageSelector';
import './LanguageDisplayCard.css';

interface LanguageDisplayCardProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  className?: string;
  disabled?: boolean;
}

const LANGUAGE_OPTIONS = [
  { code: 'en' as SupportedLanguage, name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi' as SupportedLanguage, name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te' as SupportedLanguage, name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
];

const LanguageDisplayCard: React.FC<LanguageDisplayCardProps> = ({
  currentLanguage,
  onLanguageChange,
  className = '',
  disabled = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLanguage, setTempLanguage] = useState(currentLanguage);
  const [saving, setSaving] = useState(false);

  const currentLanguageInfo = LANGUAGE_OPTIONS.find(lang => lang.code === currentLanguage);

  const handleEditClick = () => {
    if (disabled) return;
    setTempLanguage(currentLanguage);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (tempLanguage === currentLanguage) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onLanguageChange(tempLanguage);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save language preference:', error);
      // Reset to current language on error
      setTempLanguage(currentLanguage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTempLanguage(currentLanguage);
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div 
        className={`language-display-card language-display-card--editing ${className}`}
        onKeyDown={handleKeyDown}
      >
        <div className="language-display-card__header">
          <Globe className="language-display-card__icon" size={20} />
          <h3 className="language-display-card__title">Change Language</h3>
        </div>
        
        <div className="language-display-card__content">
          <LanguageSelector
            selectedLanguage={tempLanguage}
            onLanguageChange={setTempLanguage}
            className="language-display-card__selector"
          />
        </div>

        <div className="language-display-card__actions">
          <button
            className="language-display-card__action language-display-card__action--cancel"
            onClick={handleCancel}
            disabled={saving}
            onKeyDown={handleKeyDown}
          >
            <X size={16} />
            Cancel
          </button>
          <button
            className="language-display-card__action language-display-card__action--save"
            onClick={handleSave}
            disabled={saving}
            onKeyDown={handleKeyDown}
          >
            <Check size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`language-display-card ${disabled ? 'language-display-card--disabled' : ''} ${className}`}
      onClick={handleEditClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleEditClick();
        }
      }}
      aria-label={`Current language: ${currentLanguageInfo?.name}. Click to change.`}
    >
      <div className="language-display-card__header">
        <Globe className="language-display-card__icon" size={20} />
        <h3 className="language-display-card__title">Language</h3>
        {!disabled && (
          <Edit3 className="language-display-card__edit-icon" size={16} />
        )}
      </div>
      
      <div className="language-display-card__content">
        <div className="language-display-card__current">
          <span className="language-display-card__flag">
            {currentLanguageInfo?.flag}
          </span>
          <div className="language-display-card__language-info">
            <span className="language-display-card__language-name">
              {currentLanguageInfo?.name}
            </span>
            <span className="language-display-card__language-native">
              {currentLanguageInfo?.nativeName}
            </span>
          </div>
        </div>
      </div>

      {!disabled && (
        <div className="language-display-card__hint">
          Click to change language
        </div>
      )}
    </div>
  );
};

export default LanguageDisplayCard;
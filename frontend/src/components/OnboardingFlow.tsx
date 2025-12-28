import React, { useState } from 'react';
import { 
  Building2, 
  Languages, 
  Settings, 
  CheckCircle, 
  Mic, 
  UtensilsCrossed, 
  ShoppingBag, 
  Globe, 
  MapPin, 
  Database 
} from 'lucide-react';
import type { UserPreferences } from '../types/user';
import { useSavePreferences } from '../hooks/usePreferences';
import LanguageSelector from './LanguageSelector';
import { DEFAULT_USER_PREFERENCES } from '../types/user';
import './Settings.css';

interface OnboardingFlowProps {
  onComplete: (preferences: UserPreferences) => void;
  onSkip?: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to The Local Guide!',
    description: 'Your companion for exploring Varanasi with local slang translation and authentic recommendations.',
    icon: Building2
  },
  {
    id: 'language',
    title: 'Choose Your Language',
    description: 'Select your preferred language for translations and recommendations.',
    icon: Languages
  },
  {
    id: 'features',
    title: 'Enable Features',
    description: 'Customize your experience by enabling the features you want to use.',
    icon: Settings
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start exploring Varanasi with personalized recommendations and translations.',
    icon: CheckCircle
  }
];

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [error, setError] = useState<string | null>(null);
  
  const savePreferencesMutation = useSavePreferences();

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeOnboarding = async () => {
    setError(null);

    try {
      await savePreferencesMutation.mutateAsync(preferences);
      onComplete(preferences);
    } catch (err) {
      setError('Failed to save preferences. Please try again.');
      console.error('Error saving preferences:', err);
    }
  };

  const skipOnboarding = () => {
    onSkip?.();
  };

  /*
  const getIconSvg = (iconType: string) => {
    switch (iconType) {
      case 'temple':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="onboarding-icon">
            <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
            <path d="M12 4.5L4 8.5v8.5c0 4.28 2.88 7.61 7 8.96 4.12-1.35 7-4.68 7-8.96V8.5l-8-4z" fill="rgba(255,255,255,0.3)"/>
          </svg>
        );
      case 'language':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="onboarding-icon">
            <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
          </svg>
        );
      case 'settings':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="onboarding-icon">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
        );
      case 'celebration':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="onboarding-icon">
            <path d="M9 11H7v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9h-2v11H9v-9z"/>
            <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95z"/>
            <path d="M12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05C5.95 2.55 2 6.82 2 12c0 5.52 4.48 10 10 10v-3z"/>
          </svg>
        );
      case 'voice':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="feature-icon">
            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
          </svg>
        );
      case 'location':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="feature-icon">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        );
      case 'cache':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="feature-icon">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        );
      case 'food':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="feature-icon">
            <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.20-1.10-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
          </svg>
        );
      case 'shop':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="feature-icon">
            <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        );
      case 'translate':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="feature-icon">
            <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
          </svg>
        );
      default:
        return null;
    }
  };
  */

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return (
          <div className="onboarding-step__content">
            <div className="onboarding-welcome">
              <p>
                Discover authentic street food, local shops, and understand Varanasi slang 
                with real-time translation powered by Google's advanced AI.
              </p>
              <ul className="onboarding-features">
                <li>
                  <Mic className="feature-icon" size={24} />
                  <span>Voice-to-text translation</span>
                </li>
                <li>
                  <UtensilsCrossed className="feature-icon" size={24} />
                  <span>Local food recommendations</span>
                </li>
                <li>
                  <ShoppingBag className="feature-icon" size={24} />
                  <span>Authentic shop discoveries</span>
                </li>
                <li>
                  <Globe className="feature-icon" size={24} />
                  <span>Multi-language support</span>
                </li>
              </ul>
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="onboarding-step__content">
            <div className="onboarding-language">
              <p>Choose your preferred language for the best experience:</p>
              <LanguageSelector
                selectedLanguage={preferences.preferredLanguage}
                onLanguageChange={(language) => updatePreference('preferredLanguage', language)}
                className="onboarding-language__selector"
              />
              <p className="onboarding-language__note">
                You can change this later in settings.
              </p>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="onboarding-step__content">
            <div className="onboarding-features-step">
              <div className="onboarding-option">
                <div className="onboarding-option__header">
                  <Mic className="feature-icon" size={24} />
                  <label className="onboarding-option__label">
                    <input
                      type="checkbox"
                      checked={preferences.voiceInputEnabled}
                      onChange={(e) => updatePreference('voiceInputEnabled', e.target.checked)}
                    />
                    <span>Enable voice input</span>
                  </label>
                </div>
                <p className="onboarding-option__description">
                  Use your microphone to translate spoken words and phrases.
                </p>
              </div>

              <div className="onboarding-option">
                <div className="onboarding-option__header">
                  <MapPin className="feature-icon" size={24} />
                  <label className="onboarding-option__label">
                    <input
                      type="checkbox"
                      checked={preferences.locationSharing}
                      onChange={(e) => updatePreference('locationSharing', e.target.checked)}
                    />
                    <span>Share location for better recommendations</span>
                  </label>
                </div>
                <p className="onboarding-option__description">
                  Get more relevant recommendations based on your current location.
                </p>
              </div>

              <div className="onboarding-option">
                <div className="onboarding-option__header">
                  <Database className="feature-icon" size={24} />
                  <label className="onboarding-option__label">
                    <input
                      type="checkbox"
                      checked={preferences.cacheTranslations}
                      onChange={(e) => updatePreference('cacheTranslations', e.target.checked)}
                    />
                    <span>Cache translations for offline use</span>
                  </label>
                </div>
                <p className="onboarding-option__description">
                  Store frequently used translations for faster access.
                </p>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="onboarding-step__content">
            <div className="onboarding-complete">
              <p>
                Your preferences have been saved! You're ready to explore Varanasi 
                with personalized recommendations and translations.
              </p>
              <div className="onboarding-complete__summary">
                <h4>Your Settings:</h4>
                <ul>
                  <li>Language: {preferences.preferredLanguage.toUpperCase()}</li>
                  <li>Voice Input: {preferences.voiceInputEnabled ? 'Enabled' : 'Disabled'}</li>
                  <li>Location Sharing: {preferences.locationSharing ? 'Enabled' : 'Disabled'}</li>
                  <li>Translation Caching: {preferences.cacheTranslations ? 'Enabled' : 'Disabled'}</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-flow">
        <div className="onboarding-header">
          <div className="onboarding-progress">
            <div className="onboarding-progress__bar">
              <div 
                className="onboarding-progress__fill"
                style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
              />
            </div>
            <span className="onboarding-progress__text">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </span>
          </div>

          {onSkip && currentStep < ONBOARDING_STEPS.length - 1 && (
            <button 
              className="onboarding-skip"
              onClick={skipOnboarding}
            >
              Skip
            </button>
          )}
        </div>

        <div className="onboarding-content">
          <div className="onboarding-title-section">
            <div className="onboarding-title__icon">
              <currentStepData.icon className="onboarding-icon" size={64} />
            </div>
            <h2 className="onboarding-title">{currentStepData.title}</h2>
          </div>
          <p className="onboarding-description">{currentStepData.description}</p>
          
          {error && (
            <div className="onboarding-error">
              {error}
            </div>
          )}

          {renderStepContent()}
        </div>

        <div className="onboarding-footer">
          <button
            className="onboarding-button onboarding-button--secondary"
            onClick={prevStep}
            disabled={currentStep === 0 || savePreferencesMutation.isPending}
          >
            Back
          </button>

          {/* Temporary skip button for testing */}
          <button
            className="onboarding-button"
            onClick={() => onSkip?.()}
            style={{ backgroundColor: '#ff4444', color: 'white' }}
          >
            Skip (Test)
          </button>

          {isLastStep ? (
            <button
              className="onboarding-button onboarding-button--primary"
              onClick={completeOnboarding}
              disabled={savePreferencesMutation.isPending}
            >
              {savePreferencesMutation.isPending ? 'Saving...' : 'Get Started'}
            </button>
          ) : (
            <button
              className="onboarding-button onboarding-button--primary"
              onClick={nextStep}
              disabled={savePreferencesMutation.isPending}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
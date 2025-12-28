import React, { useState, useCallback } from 'react';
import { MessageSquare, Mic, MapPin, Settings, Wifi, WifiOff } from 'lucide-react';
import IndianLayout from './IndianLayout';
import IndianSlangTranslator from './IndianSlangTranslator';
import VoiceInput from './VoiceInput';
import RecommendationDisplay from './RecommendationDisplay';
import SettingsPanel from './SettingsPanel';
import OnboardingFlow from './OnboardingFlow';
import ErrorBoundary from './ErrorBoundary';
import { CacheStatus } from './CacheStatus';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { getUserFriendlyError, logError } from '../utils/errorUtils';
import type { TranslationResult, SupportedLanguage } from '../types/translation';
import type { UserPreferences } from '../types/user';
// import { preferencesService } from '../services/preferencesService';
import './IndianApp.css';

const IndianApp: React.FC = () => {
  // Fixed to Varanasi only
  const currentCity = 'varanasi';
  const [activeTab, setActiveTab] = useState('translation');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>('en');
  const [isRecording, setIsRecording] = useState(false);
  const [lastTranslation, setLastTranslation] = useState<TranslationResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Debug showOnboarding state changes
  React.useEffect(() => {
    console.log('showOnboarding state changed to:', showOnboarding);
  }, [showOnboarding]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { preferences, isFirstTimeUser, updatePreferences } = useUserPreferences();
  const { 
    error, 
    isRetrying, 
    canRetry, 
    executeWithRetry, 
    retry, 
    clearError,
    isNetworkError,
    isServerError 
  } = useErrorHandler();

  // Monitor online/offline status
  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      clearError();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [clearError]);

  // Show onboarding for first-time users
  React.useEffect(() => {
    console.log('IndianApp effect - isFirstTimeUser:', isFirstTimeUser, 'showOnboarding:', showOnboarding, 'preferences:', preferences);
    if (isFirstTimeUser && !showOnboarding) {
      console.log('Setting showOnboarding to true');
      setShowOnboarding(true);
    } else if (preferences && !isFirstTimeUser) {
      console.log('Setting target language from preferences:', preferences.preferredLanguage);
      // Set target language from preferences
      setTargetLanguage(preferences.preferredLanguage);
    }
  }, [isFirstTimeUser, preferences?.preferredLanguage, showOnboarding]);

  const handleTranslation = useCallback((result: TranslationResult) => {
    setLastTranslation(result);
  }, []);

  const handleLanguageChange = useCallback(async (language: SupportedLanguage) => {
    setTargetLanguage(language);
    try {
      await executeWithRetry(async () => {
        await updatePreferences({ preferredLanguage: language });
      });
      clearError();
    } catch (error) {
      logError(error, 'Language preference update');
      // Revert the UI change if the update failed
      if (preferences) {
        setTargetLanguage(preferences.preferredLanguage);
      }
      throw error;
    }
  }, [executeWithRetry, updatePreferences, preferences?.preferredLanguage, clearError]);

  const handleStartRecording = useCallback(() => {
    setIsRecording(true);
  }, []);

  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  const handleAudioData = useCallback(async (audioBlob: Blob) => {
    console.log('Audio data received:', audioBlob);
    // Process audio with speech-to-text API
  }, []);

  const handleTranscript = useCallback((transcript: string, confidence: number) => {
    console.log('Transcript received:', transcript, 'Confidence:', confidence);
    // Auto-translate the transcript
  }, []);

  const handleOnboardingComplete = useCallback(async (newPreferences: UserPreferences) => {
    console.log('handleOnboardingComplete called with:', newPreferences);
    // Force close onboarding immediately
    setShowOnboarding(false);
    clearError();
  }, [clearError]);

  const handleOnboardingSkip = useCallback(() => {
    console.log('handleOnboardingSkip called');
    setShowOnboarding(false);
  }, []);

  const handlePreferencesChange = useCallback((newPreferences: UserPreferences) => {
    // Handle preference changes
    console.log('Preferences updated:', newPreferences);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'translation':
        return (
          <ErrorBoundary
            onError={(error) => logError(error, 'Translation component')}
          >
            <IndianSlangTranslator
              targetLanguage={targetLanguage}
              onTranslation={handleTranslation}
              onLanguageChange={handleLanguageChange}
              currentCity={currentCity}
            />
          </ErrorBoundary>
        );
      
      case 'voice':
        return (
          <ErrorBoundary
            onError={(error) => logError(error, 'Voice input component')}
          >
            <div className="voice-section">
              <div className="section-header temple-symbol">
                <h2>Voice Translation</h2>
                <p>Speak naturally and get instant translations</p>
              </div>
              <VoiceInput
                isRecording={isRecording}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                onAudioData={handleAudioData}
                onTranscript={handleTranscript}
              />
            </div>
          </ErrorBoundary>
        );
      
      case 'recommendations':
        return (
          <ErrorBoundary
            onError={(error) => logError(error, 'Recommendations component')}
          >
            <div className="recommendations-section">
              <div className="section-header lotus-symbol">
                <h2>Local Recommendations</h2>
                <p>Discover authentic experiences in {currentCity}</p>
              </div>
              <RecommendationDisplay />
            </div>
          </ErrorBoundary>
        );
      
      default:
        return null;
    }
  };

  return (
    <IndianLayout>
      <div className="indian-app">
        {/* Navigation Tabs */}
        <div className="app-navigation">
          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'translation' ? 'active' : ''}`}
              onClick={() => setActiveTab('translation')}
            >
              <MessageSquare className="tab-icon" size={20} />
              <span className="tab-label">Translation</span>
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'voice' ? 'active' : ''}`}
              onClick={() => setActiveTab('voice')}
            >
              <Mic className="tab-icon" size={20} />
              <span className="tab-label">Voice Mode</span>
            </button>
            
            <button
              className={`nav-tab ${activeTab === 'recommendations' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommendations')}
            >
              <MapPin className="tab-icon" size={20} />
              <span className="tab-label">Local Guide</span>
            </button>
          </div>
          
          <div className="nav-actions">
            <div className="status-indicators">
              <div className="connection-status" title={isOnline ? "Online" : "Offline"}>
                {isOnline ? (
                  <Wifi className="status-icon online" size={16} />
                ) : (
                  <WifiOff className="status-icon offline" size={16} />
                )}
              </div>
              <CacheStatus showDetails={false} className="cache-indicator" />
            </div>
            
            <button
              className="action-button"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <Settings className="button-icon" size={20} />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <div className="error-content">
              <span className="error-icon">
                {isNetworkError ? '📡' : isServerError ? '🔧' : '⚠️'}
              </span>
              <div className="error-details">
                <div className="error-title">
                  {getUserFriendlyError(error).title}
                </div>
                <div className="error-message">
                  {getUserFriendlyError(error).message}
                </div>
                {getUserFriendlyError(error).action && (
                  <div className="error-action">
                    {getUserFriendlyError(error).action}
                  </div>
                )}
              </div>
              <div className="error-actions">
                {canRetry && !isRetrying && (
                  <button 
                    className="error-retry"
                    onClick={() => retry(() => Promise.resolve())}
                    disabled={isRetrying}
                    title="Retry"
                  >
                    {isRetrying ? '⏳' : '🔄'}
                  </button>
                )}
                <button 
                  className="error-dismiss"
                  onClick={clearError}
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="app-content">
          {renderTabContent()}
        </div>

        {/* Last Translation Display */}
        {lastTranslation && (
          <div className="last-translation">
            <div className="translation-summary om-symbol">
              <h3>Recent Translation</h3>
              <div className="translation-pair">
                <span className="original">"{lastTranslation.originalText}"</span>
                <span className="arrow">→</span>
                <span className="translated">"{lastTranslation.translatedText}"</span>
              </div>
              <span className="confidence">
                {Math.round(lastTranslation.confidence * 100)}% confident
              </span>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            onPreferencesChange={handlePreferencesChange}
          />
        )}

        {/* Onboarding Flow */}
        {showOnboarding && (
          <OnboardingFlow
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        )}
      </div>
    </IndianLayout>
  );
};

export default IndianApp;
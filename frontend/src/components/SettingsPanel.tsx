import React, { useState, useEffect } from 'react';
import { MapPin, Database, Mic, Bell, Save } from 'lucide-react';
import type { UserPreferences } from '../types/user';
import { preferencesService } from '../services/preferencesService';
import { DEFAULT_USER_PREFERENCES } from '../types/user';
import './Settings.css';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesChange?: (preferences: UserPreferences) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  onPreferencesChange
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load preferences on component mount
  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userPrefs = await preferencesService.getPreferences();
      setPreferences(userPrefs);
    } catch (err) {
      setError('Failed to load preferences');
      console.error('Error loading preferences:', err);
      
      // Try to load from cache
      const cachedPrefs = preferencesService.getCachedPreferences();
      if (cachedPrefs) {
        setPreferences(cachedPrefs);
      }
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await preferencesService.savePreferences(preferences);
      setSuccessMessage('Preferences saved successfully!');
      onPreferencesChange?.(preferences);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to save preferences');
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  // const resetPreferences = async () => {
  //   if (!confirm('Are you sure you want to reset all preferences to default?')) {
  //     return;
  //   }
  //   
  //   setSaving(true);
  //   setError(null);
  //   setSuccessMessage(null);
  //   
  //   try {
  //     await preferencesService.resetPreferences();
  //     setPreferences(DEFAULT_USER_PREFERENCES);
  //     setSuccessMessage('Preferences reset to default!');
  //     onPreferencesChange?.(DEFAULT_USER_PREFERENCES);
  //     
  //     setTimeout(() => setSuccessMessage(null), 3000);
  //   } catch (err) {
  //     setError('Failed to reset preferences');
  //     console.error('Error resetting preferences:', err);
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNotificationPreference = (
    key: keyof UserPreferences['notificationPreferences'],
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="settings-panel-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header with City Info */}
        <div className="settings-panel__header">
          <div className="settings-header__content">
            <div className="settings-header__city">
              <div className="settings-city__icon">🛕</div>
              <div className="settings-city__info">
                <h1 className="settings-city__name">Settings</h1>
                <p className="settings-city__subtitle">Varanasi - The Spiritual Capital</p>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-panel__content">
          {loading && (
            <div className="settings-panel__loading">
              <div className="settings-loading__spinner"></div>
              <span>Loading preferences...</span>
            </div>
          )}

          {error && (
            <div className="settings-panel__message settings-panel__message--error">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="settings-panel__message settings-panel__message--success">
              {successMessage}
            </div>
          )}

          {!loading && (
            <>
              {/* Privacy & Data Section */}
              <section className="settings-section">
                <div className="settings-section__header">
                  <Database size={20} />
                  <h3>Privacy & Data</h3>
                </div>
                
                <div className="settings-option-card">
                  <div className="settings-option__content">
                    <div className="settings-option__info">
                      <MapPin size={18} className="settings-option__icon" />
                      <div>
                        <span className="settings-option__title">Share location for better recommendations</span>
                        <p className="settings-option__description">
                          Allow the app to use your location to provide more relevant local recommendations.
                        </p>
                      </div>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={preferences?.locationSharing || false}
                        onChange={(e) => updatePreference('locationSharing', e.target.checked)}
                        disabled={saving}
                      />
                      <span className="settings-toggle__slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-option-card">
                  <div className="settings-option__content">
                    <div className="settings-option__info">
                      <Database size={18} className="settings-option__icon" />
                      <div>
                        <span className="settings-option__title">Cache translations for faster access</span>
                        <p className="settings-option__description">
                          Store frequently used translations locally for quicker access.
                        </p>
                      </div>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={preferences?.cacheTranslations || true}
                        onChange={(e) => updatePreference('cacheTranslations', e.target.checked)}
                        disabled={saving}
                      />
                      <span className="settings-toggle__slider"></span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Voice Input Section */}
              <section className="settings-section">
                <div className="settings-section__header">
                  <Mic size={20} />
                  <h3>Voice Mode</h3>
                </div>
                
                <div className="settings-option-card">
                  <div className="settings-option__content">
                    <div className="settings-option__info">
                      <Mic size={18} className="settings-option__icon" />
                      <div>
                        <span className="settings-option__title">Enable voice input</span>
                        <p className="settings-option__description">
                          Allow voice recording for speech-to-text translation.
                        </p>
                      </div>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={preferences?.voiceInputEnabled || true}
                        onChange={(e) => updatePreference('voiceInputEnabled', e.target.checked)}
                        disabled={saving}
                      />
                      <span className="settings-toggle__slider"></span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Notifications Section */}
              <section className="settings-section">
                <div className="settings-section__header">
                  <Bell size={20} />
                  <h3>Notifications</h3>
                </div>
                
                <div className="settings-option-card">
                  <div className="settings-option__content">
                    <div className="settings-option__info">
                      <Bell size={18} className="settings-option__icon" />
                      <div>
                        <span className="settings-option__title">New recommendations</span>
                      </div>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={preferences?.notificationPreferences?.newRecommendations || false}
                        onChange={(e) => updateNotificationPreference('newRecommendations', e.target.checked)}
                        disabled={saving}
                      />
                      <span className="settings-toggle__slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-option-card">
                  <div className="settings-option__content">
                    <div className="settings-option__info">
                      <Database size={18} className="settings-option__icon" />
                      <div>
                        <span className="settings-option__title">Translation improvements</span>
                      </div>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={preferences?.notificationPreferences?.translationUpdates || false}
                        onChange={(e) => updateNotificationPreference('translationUpdates', e.target.checked)}
                        disabled={saving}
                      />
                      <span className="settings-toggle__slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-option-card">
                  <div className="settings-option__content">
                    <div className="settings-option__info">
                      <Bell size={18} className="settings-option__icon" />
                      <div>
                        <span className="settings-option__title">System updates</span>
                      </div>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={preferences?.notificationPreferences?.systemUpdates || false}
                        onChange={(e) => updateNotificationPreference('systemUpdates', e.target.checked)}
                        disabled={saving}
                      />
                      <span className="settings-toggle__slider"></span>
                    </label>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="settings-panel__actions">
          <button
            className="settings-action-button settings-action-button--primary"
            onClick={savePreferences}
            disabled={saving || loading}
          >
            <Save size={18} />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
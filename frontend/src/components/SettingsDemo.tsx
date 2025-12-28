import React, { useState } from 'react';
import SettingsPanel from './SettingsPanel';
import OnboardingFlow from './OnboardingFlow';
// import { useUserPreferences } from '../hooks/useUserPreferences';
import './Settings.css';

const SettingsDemo: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // const { preferences, updatePreferences } = useUserPreferences();

  const handlePreferencesChange = (newPreferences: any) => {
    console.log('Preferences updated:', newPreferences);
  };

  const handleOnboardingComplete = (newPreferences: any) => {
    console.log('Onboarding completed with preferences:', newPreferences);
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    console.log('Onboarding skipped');
    setShowOnboarding(false);
  };

  return (
    <div style={{ 
      padding: '2rem', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '2rem',
        borderRadius: '1.5rem',
        textAlign: 'center',
        color: 'white',
        maxWidth: '600px'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '800', 
          marginBottom: '1rem',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          🏛️ The Local Guide
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          marginBottom: '2rem',
          opacity: 0.9,
          lineHeight: '1.6'
        }}>
          Experience the new modern UI with beautiful animations and mobile-friendly design
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              padding: '1rem 2rem',
              borderRadius: '1rem',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: 'white',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
            }}
          >
            ⚙️ Open Settings
          </button>
          
          <button
            onClick={() => setShowOnboarding(true)}
            style={{
              padding: '1rem 2rem',
              borderRadius: '1rem',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🚀 Start Onboarding
          </button>
        </div>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '1.5rem',
        borderRadius: '1rem',
        color: 'white',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          ✨ New Features
        </h3>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: 0,
          display: 'grid',
          gap: '0.5rem',
          textAlign: 'left'
        }}>
          <li>🎨 Modern gradient backgrounds and glassmorphism effects</li>
          <li>📱 Fully responsive mobile-first design</li>
          <li>🌊 Smooth animations and micro-interactions</li>
          <li>🌙 Dark mode support with system preference detection</li>
          <li>💫 Beautiful hover effects and transitions</li>
          <li>🎯 Improved accessibility and touch targets</li>
        </ul>
      </div>

      {showSettings && (
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onPreferencesChange={handlePreferencesChange}
        />
      )}

      {showOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </div>
  );
};

export default SettingsDemo;
import React, { useState, useEffect } from 'react';
import { Building2, Landmark, Waves, Castle, Mountain } from 'lucide-react';
import CitySelector from './CitySelector';
import SettingsPanel from './SettingsPanel';
import OnboardingFlow from './OnboardingFlow';
import { useUserPreferences } from '../hooks/useUserPreferences';
import '../styles/themes.css';
import './ModernLayout.css';

interface City {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
  theme: string;
}

const cities: City[] = [
  {
    id: 'varanasi',
    name: 'Varanasi',
    icon: Building2,
    description: 'Sacred city of temples',
    color: '#FF6B35',
    theme: 'theme-varanasi'
  },
  {
    id: 'delhi',
    name: 'Delhi',
    icon: Landmark,
    description: 'Capital of India',
    color: '#DC2626',
    theme: 'theme-delhi'
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    icon: Waves,
    description: 'City of dreams',
    color: '#0EA5E9',
    theme: 'theme-mumbai'
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    icon: Castle,
    description: 'The Pink City',
    color: '#EC4899',
    theme: 'theme-jaipur'
  },
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    icon: Mountain,
    description: 'Yoga capital',
    color: '#059669',
    theme: 'theme-rishikesh'
  }
];

interface ModernLayoutProps {
  children: React.ReactNode;
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState<City>(cities[0]);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { isFirstTimeUser } = useUserPreferences();

  // Show onboarding for first-time users
  useEffect(() => {
    if (isFirstTimeUser) {
      setShowOnboarding(true);
    }
  }, [isFirstTimeUser]);

  // Apply theme class to body
  useEffect(() => {
    document.body.className = `themed-background ${selectedCity.theme}`;
    
    // Update city background
    const existingBg = document.querySelector('.city-background');
    if (existingBg) {
      existingBg.remove();
    }
    
    const cityBg = document.createElement('div');
    cityBg.className = `city-background ${selectedCity.name}`;
    document.body.appendChild(cityBg);
    
    return () => {
      const bg = document.querySelector('.city-background');
      if (bg) bg.remove();
    };
  }, [selectedCity]);

  const handleCityChange = (cityId: string) => {
    const city = cities.find(c => c.id === cityId);
    if (city) {
      setSelectedCity(city);
    }
    setShowCitySelector(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="modern-layout">
      {/* Mandala Overlay */}
      <div className="mandala-overlay rotating-mandala"></div>
      
      {/* Header */}
      <header className="modern-header themed-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-title floating">
              <span className="app-icon">🕉️</span>
              The Local Guide
            </h1>
            <p className="app-subtitle">
              Sacred journeys through India's spiritual cities
            </p>
          </div>
          
          <div className="header-right">
            <button
              className="city-button themed-button"
              onClick={() => setShowCitySelector(true)}
            >
              <span className="city-button__icon">
                <selectedCity.icon size={20} />
              </span>
              <span className="city-button__text">{selectedCity.name}</span>
            </button>
            
            <button
              className="settings-button themed-button"
              onClick={() => setShowSettings(true)}
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="modern-nav">
        <div className="nav-content">
          <div className="nav-tabs">
            <button className="nav-tab nav-tab--active">
              <span className="nav-tab__icon">🗣️</span>
              <span className="nav-tab__text">Translation</span>
            </button>
            <button className="nav-tab">
              <span className="nav-tab__icon">🎤</span>
              <span className="nav-tab__text">Voice</span>
            </button>
            <button className="nav-tab">
              <span className="nav-tab__icon">🍛</span>
              <span className="nav-tab__text">Food</span>
            </button>
            <button className="nav-tab">
              <span className="nav-tab__icon">🛍️</span>
              <span className="nav-tab__text">Shops</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="modern-main">
        <div className="main-content">
          {children}
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fab-container">
        <button 
          className="fab glowing"
          onClick={() => setShowCitySelector(true)}
          title="Change City"
        >
          <selectedCity.icon size={24} />
        </button>
      </div>

      {/* Modals */}
      {showCitySelector && (
        <div className="modal-overlay" onClick={() => setShowCitySelector(false)}>
          <div className="modal-content themed-card" onClick={(e) => e.stopPropagation()}>
            <CitySelector
              currentCity={selectedCity.id}
              onCityChange={handleCityChange}
            />
            <button 
              className="modal-close"
              onClick={() => setShowCitySelector(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
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

export default ModernLayout;
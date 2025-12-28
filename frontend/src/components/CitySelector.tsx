import React, { useState } from 'react';
import { Building2, Landmark, Waves, Castle, Mountain, ChevronDown } from 'lucide-react';
import './CitySelector.css';

interface City {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

interface CitySelectorProps {
  currentCity: string;
  onCityChange: (city: string) => void;
}

const cities: City[] = [
  {
    id: 'varanasi',
    name: 'Varanasi',
    icon: Building2,
    description: 'Sacred city of temples',
    color: '#FF6B35'
  },
  {
    id: 'delhi',
    name: 'Delhi',
    icon: Landmark,
    description: 'Capital of India',
    color: '#DC2626'
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    icon: Waves,
    description: 'City of dreams',
    color: '#0EA5E9'
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    icon: Castle,
    description: 'The Pink City',
    color: '#EC4899'
  },
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    icon: Mountain,
    description: 'Yoga capital',
    color: '#059669'
  }
];

const CitySelector: React.FC<CitySelectorProps> = ({ currentCity, onCityChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(currentCity);

  const currentCityData = cities.find(city => city.id === selectedCity) || cities[0];

  const handleCitySelect = (cityId: string) => {
    setSelectedCity(cityId);
    onCityChange(cityId);
    setIsOpen(false);
  };

  return (
    <div className="city-selector">
      <button 
        className="city-selector__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="current-city">
          <currentCityData.icon className="current-city__icon" size={24} />
          <div className="current-city__info">
            <span className="current-city__name">{currentCityData.name}</span>
            <span className="current-city__desc">{currentCityData.description}</span>
          </div>
        </div>
        <ChevronDown className={`dropdown-arrow ${isOpen ? 'open' : ''}`} size={16} />
      </button>

      {isOpen && (
        <>
          <div className="city-selector__overlay" onClick={() => setIsOpen(false)} />
          <div className="city-selector__dropdown">
            <div className="dropdown-header">
              <h3 className="om-symbol">Choose Your City</h3>
              <p>Experience India through different cultural lenses</p>
            </div>
            
            <div className="city-grid">
              {cities.map((city) => (
                <button
                  key={city.id}
                  className={`city-option ${selectedCity === city.id ? 'selected' : ''}`}
                  onClick={() => handleCitySelect(city.id)}
                  style={{ '--city-color': city.color } as React.CSSProperties}
                >
                  <city.icon className="city-option__icon" size={32} />
                  <div className="city-option__info">
                    <span className="city-option__name">{city.name}</span>
                    <span className="city-option__desc">{city.description}</span>
                  </div>
                  <div className="city-option__indicator">
                    {selectedCity === city.id && <span className="checkmark">✓</span>}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="dropdown-footer">
              <p className="lotus-symbol">Each city brings its unique colors and culture</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CitySelector;
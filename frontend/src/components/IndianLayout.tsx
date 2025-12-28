import React, { useEffect } from 'react';
import { Landmark, Waves, Castle, Mountain } from 'lucide-react';
import TempleIcon from './TempleIcon';
import '../styles/themes.css';
import './IndianLayout.css';

interface IndianLayoutProps {
  children: React.ReactNode;
}

const IndianLayout: React.FC<IndianLayoutProps> = ({ children }) => {
  // Fixed to Varanasi only
  const currentCity = 'varanasi';

  useEffect(() => {
    document.body.className = `theme-varanasi pattern-mandala`;
  }, []);

  const getCityInfo = (city: string) => {
    const cityData = {
      varanasi: {
        name: 'Varanasi',
        subtitle: 'The Spiritual Capital',
        description: 'Ancient city of temples and ghats along the sacred Ganges',
        icon: TempleIcon,
        pattern: 'pattern-mandala'
      },
      delhi: {
        name: 'Delhi',
        subtitle: 'The Heart of India',
        description: 'Historic capital with Mughal architecture and modern vibrancy',
        icon: Landmark,
        pattern: 'pattern-paisley'
      },
      mumbai: {
        name: 'Mumbai',
        subtitle: 'The City of Dreams',
        description: 'Bollywood capital and financial hub by the Arabian Sea',
        icon: Waves,
        pattern: 'pattern-lotus'
      },
      jaipur: {
        name: 'Jaipur',
        subtitle: 'The Pink City',
        description: 'Royal palaces and vibrant bazaars in Rajasthan',
        icon: Castle,
        pattern: 'pattern-paisley'
      },
      rishikesh: {
        name: 'Rishikesh',
        subtitle: 'Yoga Capital of the World',
        description: 'Spiritual retreat in the Himalayan foothills',
        icon: Mountain,
        pattern: 'pattern-lotus'
      }
    };
    return cityData[city as keyof typeof cityData] || cityData.varanasi;
  };

  const cityInfo = getCityInfo(currentCity);

  return (
    <div className={`indian-layout theme-varanasi pattern-mandala`}>
      {/* Header with Indian design elements */}
      <header className="indian-header">
        <div className="header-decoration">
          <div className="mandala-border"></div>
        </div>
        
        <div className="header-content">
          <div className="city-info">
            <span className="city-icon" style={{ fontSize: '4rem' }}>🛕</span>
            <div className="city-details">
              <h1 className="city-name">{cityInfo.name}</h1>
              <p className="city-subtitle">{cityInfo.subtitle}</p>
            </div>
          </div>
        </div>
        
        <div className="header-decoration bottom">
          <div className="lotus-border"></div>
        </div>
      </header>

      {/* Main content area */}
      <main className="indian-main">
        <div className="content-container">
          <div className="cultural-sidebar">
            <div className="cultural-element">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>🛕</span>
              </div>
              <h3>The Local Guide</h3>
              <p>{cityInfo.description}</p>
            </div>
            
            <div className="cultural-stats">
              <div className="stat-item diya-symbol">
                <span className="stat-number">1000+</span>
                <span className="stat-label">Local Phrases</span>
              </div>
              <div className="stat-item lotus-symbol">
                <span className="stat-number">500+</span>
                <span className="stat-label">Recommendations</span>
              </div>
            </div>
          </div>
          
          <div className="main-content">
            {children}
          </div>
        </div>
      </main>

      {/* Footer with Indian patterns */}
      <footer className="indian-footer">
        <div className="footer-pattern">
          <div className="rangoli-design"></div>
        </div>
        <div className="footer-content">
          <p className="om-symbol">Discover the soul of India, one city at a time</p>
          <p className="built-with">
    Built with ❤️ using{" "}
    <a
      href="https://kiro.ai"
      target="_blank"
      rel="noopener noreferrer"
    >
      Kiro
    </a>
  </p>

        </div>
      </footer>
    </div>
  );
};

export default IndianLayout;
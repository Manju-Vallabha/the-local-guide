# Frontend - The Local Guide 🎨

> **Modern React application with Indian cultural design system and voice-powered translation**

[![React](https://img.shields.io/badge/React-19.2.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-purple)](https://vitejs.dev/)
[![Material-UI](https://img.shields.io/badge/Material--UI-7.3.6-blue)](https://mui.com/)

## 🏗️ Architecture Overview

The frontend is built with modern React patterns and TypeScript for type safety, featuring:

- **Component-Based Architecture**: Modular, reusable components with clear separation of concerns
- **Cultural Design System**: Indian-themed UI with city-specific color palettes and animations
- **Voice Integration**: Web Audio API for high-quality speech input processing
- **State Management**: React Query for server state and React hooks for local state
- **Responsive Design**: Mobile-first approach optimized for Indian smartphone users

## 📁 Project Structure

```
frontend/
├── public/                     # Static assets
│   ├── index.html             # Main HTML template
│   └── vite.svg               # Vite logo
├── src/                       # Source code
│   ├── components/            # React components
│   │   ├── layout/           # Layout components
│   │   ├── translation/      # Translation-related components
│   │   ├── recommendations/  # Recommendation components
│   │   ├── ui/              # Reusable UI components
│   │   └── index.ts         # Component exports
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API services and utilities
│   ├── styles/              # Global styles and themes
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── test/                # Test utilities and setup
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global CSS styles
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── vitest.config.ts         # Vitest test configuration
└── eslint.config.js         # ESLint configuration
```

## 🧩 Component Architecture

### **Core Layout Components**

#### `IndianApp.tsx` - Main Application Shell
```typescript
// Cultural-themed main application with city-specific theming
interface IndianAppProps {
  selectedCity: CityTheme;
  onCityChange: (city: CityTheme) => void;
}
```
- **Features**: City-specific color schemes, cultural animations, responsive layout
- **Styling**: `IndianApp.css` with glassmorphism effects and cultural patterns

#### `IndianLayout.tsx` - Primary Layout Container
```typescript
// Main layout with navigation and content areas
interface IndianLayoutProps {
  children: React.ReactNode;
  currentCity: CityTheme;
}
```
- **Features**: Responsive navigation, cultural header design, content organization
- **Styling**: `IndianLayout.css` with Indian design patterns and animations

#### `ModernLayout.tsx` - Alternative Modern Layout
```typescript
// Clean, modern layout option for different user preferences
interface ModernLayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
}
```

### **Translation Components**

#### `IndianSlangTranslator.tsx` - Main Translation Interface
```typescript
interface SlangTranslatorProps {
  targetLanguage: SupportedLanguage;
  onTranslationResult: (result: TranslationResult) => void;
}
```
- **Features**: 
  - Text input with cultural context
  - Real-time translation with confidence scores
  - Cultural insights and usage guidance
  - Error handling with user-friendly messages
- **Styling**: `IndianSlangTranslator.css` with cultural design elements

#### `VoiceInput.tsx` - Voice Recording Component
```typescript
interface VoiceInputProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAudioData: (audioBlob: Blob) => void;
}
```
- **Features**:
  - Web Audio API integration (16kHz, LINEAR16 format)
  - Visual recording indicators with cultural animations
  - Microphone permission handling
  - Audio quality optimization for Indian accents
- **Styling**: `VoiceInput.css` with pulsing animations and cultural colors

#### `LanguageDisplayCard.tsx` - Language Selection Display
```typescript
interface LanguageDisplayCardProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  className?: string;
}
```
- **Features**:
  - Prominent language display with native script
  - Quick language switching interface
  - Cultural flag/symbol integration
  - Accessibility-compliant design

### **Recommendation Components**

#### `RecommendationEngine.tsx` - Main Recommendation Controller
```typescript
interface RecommendationEngineProps {
  category: RecommendationCategory;
  location?: string;
  onRecommendations: (items: RecommendationItem[]) => void;
}
```
- **Features**:
  - Category-based filtering (food, shops, crafts)
  - Search functionality with cultural context
  - Location-based recommendations
  - Caching for offline access

#### `RecommendationGrid.tsx` - Grid Layout for Recommendations
```typescript
interface RecommendationGridProps {
  items: RecommendationItem[];
  onItemSelect: (item: RecommendationItem) => void;
  loading?: boolean;
}
```
- **Features**:
  - Responsive grid layout
  - Lazy loading for performance
  - Cultural card design with Indian patterns
  - Accessibility-compliant navigation

#### `RecommendationCard.tsx` - Individual Recommendation Display
```typescript
interface RecommendationCardProps {
  item: RecommendationItem;
  onClick: (item: RecommendationItem) => void;
  variant?: 'compact' | 'detailed';
}
```
- **Features**:
  - Rich media display (images, ratings, cultural insights)
  - Safety and hygiene indicators
  - Cultural context and etiquette tips
  - Price range and timing information

### **UI Components**

#### `CitySelector.tsx` - City Theme Selection
```typescript
interface CitySelectorProps {
  selectedCity: CityTheme;
  onCityChange: (city: CityTheme) => void;
  cities: CityTheme[];
}
```
- **Features**:
  - Visual city selection with cultural imagery
  - Theme preview functionality
  - Smooth transitions between themes
- **Styling**: `CitySelector.css` with city-specific color previews

#### `SettingsPanel.tsx` - User Settings Interface
```typescript
interface SettingsPanelProps {
  preferences: UserPreferences;
  onPreferencesChange: (prefs: UserPreferences) => void;
  isOpen: boolean;
  onClose: () => void;
}
```
- **Features**:
  - Comprehensive preference management
  - Cultural sensitivity settings
  - Accessibility options
  - Data privacy controls

#### `OnboardingFlow.tsx` - First-Time User Experience
```typescript
interface OnboardingFlowProps {
  onComplete: (preferences: UserPreferences) => void;
  onSkip: () => void;
}
```
- **Features**:
  - Cultural introduction and context
  - Language preference setup
  - Feature tour with cultural examples
  - Accessibility onboarding

### **Utility Components**

#### `ErrorBoundary.tsx` - Error Handling
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}
```
- **Features**:
  - Graceful error handling with cultural messaging
  - Error reporting and recovery options
  - User-friendly error displays

#### `CacheStatus.tsx` - Cache Management Display
```typescript
interface CacheStatusProps {
  cacheStats: CacheStatistics;
  onClearCache: () => void;
}
```
- **Features**:
  - Cache usage visualization
  - Offline capability indicators
  - Cache management controls

## 🎨 Design System

### **Cultural Color Palettes**

#### Varanasi Theme - Sacred Saffron & Ganges Blue
```css
:root {
  --varanasi-primary: #FF6B35;      /* Sacred Saffron */
  --varanasi-secondary: #004E89;    /* Ganges Blue */
  --varanasi-accent: #FFD23F;       /* Temple Gold */
  --varanasi-surface: rgba(255, 107, 53, 0.1);
}
```

#### Delhi Theme - Red Fort Red & Lotus Gold
```css
:root {
  --delhi-primary: #C5282F;         /* Red Fort Red */
  --delhi-secondary: #F4A261;       /* Lotus Gold */
  --delhi-accent: #E76F51;          /* Sunset Orange */
  --delhi-surface: rgba(197, 40, 47, 0.1);
}
```

#### Mumbai Theme - Arabian Sea Blue & Sunset Orange
```css
:root {
  --mumbai-primary: #264653;        /* Arabian Sea */
  --mumbai-secondary: #F4A261;      /* Sunset Orange */
  --mumbai-accent: #E9C46A;         /* Golden Hour */
  --mumbai-surface: rgba(38, 70, 83, 0.1);
}
```

### **Cultural Animations**

#### Puja Glow Effect
```css
@keyframes pujaGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 107, 53, 0.3); }
  50% { box-shadow: 0 0 40px rgba(255, 107, 53, 0.6); }
}
```

#### Aarti Wave Animation
```css
@keyframes aartiWave {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-5px) rotate(1deg); }
  75% { transform: translateY(5px) rotate(-1deg); }
}
```

#### Mandala Spin
```css
@keyframes mandalaSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### **Typography System**

```css
/* Hindi/Devanagari Support */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@300;400;500;700&display=swap');

/* Telugu Support */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@300;400;500;700&display=swap');

/* English with Indian Context */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

## 🔧 Custom Hooks

### **useTranslation** - Translation State Management
```typescript
interface UseTranslationReturn {
  translate: (text: string, targetLang: string) => Promise<TranslationResult>;
  isTranslating: boolean;
  error: string | null;
  history: TranslationResult[];
  clearHistory: () => void;
}
```

### **useVoiceInput** - Voice Recording Management
```typescript
interface UseVoiceInputReturn {
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  error: string | null;
  audioLevel: number;
}
```

### **useRecommendations** - Recommendation Data Management
```typescript
interface UseRecommendationsReturn {
  recommendations: RecommendationItem[];
  loading: boolean;
  error: string | null;
  searchRecommendations: (query: string) => void;
  getByCategory: (category: string) => void;
  refresh: () => void;
}
```

### **useCulturalTheme** - Cultural Theme Management
```typescript
interface UseCulturalThemeReturn {
  currentTheme: CityTheme;
  setTheme: (theme: CityTheme) => void;
  themeClasses: string[];
  animations: CulturalAnimations;
}
```

## 🛠️ Services

### **API Service** - Backend Communication
```typescript
class ApiService {
  private baseUrl: string;
  private cache: Map<string, any>;
  
  async translateText(request: TranslationRequest): Promise<TranslationResponse>;
  async speechToText(audioBlob: Blob): Promise<SpeechToTextResponse>;
  async getRecommendations(category?: string): Promise<RecommendationResponse>;
  async savePreferences(prefs: UserPreferences): Promise<void>;
}
```

### **Audio Service** - Voice Processing
```typescript
class AudioService {
  private mediaRecorder: MediaRecorder | null;
  private audioContext: AudioContext | null;
  
  async requestMicrophoneAccess(): Promise<MediaStream>;
  async startRecording(): Promise<void>;
  async stopRecording(): Promise<Blob>;
  getAudioLevel(): number;
  convertToRequiredFormat(blob: Blob): Promise<Blob>;
}
```

### **Cache Service** - Offline Support
```typescript
class CacheService {
  private storage: Storage;
  private memoryCache: Map<string, any>;
  
  async set(key: string, value: any, ttl?: number): Promise<void>;
  async get(key: string): Promise<any>;
  async clear(): Promise<void>;
  getStats(): CacheStatistics;
}
```

## 📱 Responsive Design

### **Breakpoint System**
```css
/* Mobile First Approach */
:root {
  --mobile: 320px;
  --tablet: 768px;
  --desktop: 1024px;
  --large: 1440px;
}

@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Large Desktop */ }
```

### **Touch-Friendly Design**
- **Minimum Touch Targets**: 44px × 44px (iOS guidelines)
- **Gesture Support**: Swipe navigation, pinch-to-zoom for images
- **Voice Input Optimization**: Large, accessible voice buttons
- **Cultural Considerations**: Right-to-left text support for Urdu/Arabic

## 🧪 Testing Strategy

### **Component Testing**
```typescript
// Example: LanguageDisplayCard.test.tsx
describe('LanguageDisplayCard', () => {
  it('displays current language correctly', () => {
    render(<LanguageDisplayCard currentLanguage="hi" />);
    expect(screen.getByText('हिंदी')).toBeInTheDocument();
  });
  
  it('handles language change', async () => {
    const onLanguageChange = jest.fn();
    render(<LanguageDisplayCard onLanguageChange={onLanguageChange} />);
    
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('English'));
    
    expect(onLanguageChange).toHaveBeenCalledWith('en');
  });
});
```

### **Integration Testing**
- **Voice Input Flow**: Record → Process → Translate → Display
- **Recommendation Flow**: Search → Filter → Display → Select
- **Cultural Theme**: Theme Selection → UI Update → Persistence

### **Accessibility Testing**
- **Screen Reader Support**: ARIA labels in multiple languages
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG 2.1 AA compliance
- **Voice Control**: Voice navigation for hands-free use

## 🚀 Performance Optimization

### **Code Splitting**
```typescript
// Lazy loading for better performance
const RecommendationEngine = lazy(() => import('./components/RecommendationEngine'));
const SettingsPanel = lazy(() => import('./components/SettingsPanel'));
```

### **Image Optimization**
- **WebP Format**: Modern image format with fallbacks
- **Lazy Loading**: Intersection Observer for images
- **Responsive Images**: Multiple sizes for different devices
- **Cultural Icons**: SVG icons for scalability

### **Bundle Optimization**
- **Tree Shaking**: Remove unused code
- **Code Splitting**: Route-based and component-based splitting
- **Compression**: Gzip/Brotli compression
- **CDN Integration**: Static asset delivery optimization

## 🌐 Internationalization (i18n)

### **Language Support**
```typescript
interface SupportedLanguages {
  en: 'English';
  hi: 'हिंदी';
  te: 'తెలుగు';
}
```

### **Cultural Localization**
- **Date/Time Formats**: Indian standard time, local calendars
- **Number Formats**: Indian numbering system (lakhs, crores)
- **Currency**: Indian Rupee (₹) formatting
- **Cultural Context**: Festival dates, regional customs

## 🔧 Development Setup

### **Prerequisites**
```bash
# Node.js 18+ and npm
node --version  # v18.0.0+
npm --version   # 8.0.0+
```

### **Installation**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

### **Environment Variables**
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_VOICE_INPUT=true
VITE_CACHE_ENABLED=true
VITE_CULTURAL_ANIMATIONS=true

# .env.production
VITE_API_BASE_URL=https://your-api-url
VITE_ENABLE_VOICE_INPUT=true
VITE_CACHE_ENABLED=true
VITE_CULTURAL_ANIMATIONS=true
```

## 📊 Performance Metrics

### **Core Web Vitals**
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### **Bundle Analysis**
```bash
# Analyze bundle size
npm run build
npm run analyze

# Expected bundle sizes:
# - Main bundle: ~150KB (gzipped)
# - Vendor bundle: ~200KB (gzipped)
# - Cultural assets: ~50KB (gzipped)
```

## 🔒 Security Considerations

### **Input Validation**
- **XSS Prevention**: Sanitized user inputs
- **Audio Security**: Validated audio formats and sizes
- **API Security**: Request validation and rate limiting

### **Privacy Protection**
- **Voice Data**: No permanent storage of audio
- **User Preferences**: Local storage with encryption
- **Cultural Sensitivity**: Respectful data handling

---

**Built with ❤️ and cultural awareness using [Kiro AI](https://kiro.ai)**
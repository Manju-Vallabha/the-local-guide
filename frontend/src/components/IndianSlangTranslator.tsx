import React, { useState } from 'react';
import type { SupportedLanguage, TranslationResult } from '../types/translation';
import { translationService } from '../services/translationService';
import LanguageDisplayCard from './LanguageDisplayCard';
import './IndianSlangTranslator.css';

interface IndianSlangTranslatorProps {
  targetLanguage: SupportedLanguage;
  onTranslation: (result: TranslationResult) => void;
  onLanguageChange: (language: SupportedLanguage) => void;
  currentCity?: string;
}

const IndianSlangTranslator: React.FC<IndianSlangTranslatorProps> = ({
  targetLanguage,
  onTranslation,
  onLanguageChange,
  currentCity = 'varanasi'
}) => {
  const [inputText, setInputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastResult, setLastResult] = useState<TranslationResult | null>(null);

  const getCityExamples = (city: string) => {
    const examples = {
      varanasi: [
        { text: 'बाबा जी कैसे हैं?' },
        { text: 'गंगा आरती देखने चलें' },
        { text: 'यहाँ का खाना बहुत मजेदार है' }
      ],
      delhi: [
        { text: 'यार, कहाँ जा रहे हो?' },
        { text: 'दिल्ली की गर्मी बहुत है' },
        { text: 'मेट्रो से चलते हैं' }
      ],
      mumbai: [
        { text: 'भाई, ट्रेन कब आएगी?' },
        { text: 'वडा पाव खाना है' },
        { text: 'मुंबई की बारिश शुरू हो गई' }
      ],
      jaipur: [
        { text: 'राजस्थानी खाना बहुत स्वादिष्ट है' },
        { text: 'हवा महल देखने चलें' },
        { text: 'यहाँ की कलाकृति अद्भुत है' }
      ],
      rishikesh: [
        { text: 'योग कक्षा कब है?' },
        { text: 'गंगा का पानी बहुत ठंडा है' },
        { text: 'ध्यान करने का समय है' }
      ]
    };
    return examples[city as keyof typeof examples] || examples.varanasi;
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsTranslating(true);
    
    try {
      const response = await translationService.translateText({
        text: inputText.trim(),
        targetLanguage: targetLanguage,
        context: 'varanasi_slang'
      });
      
      const result: TranslationResult = {
        originalText: response.originalText,
        translatedText: response.translatedText,
        confidence: response.confidence,
        detectedLanguage: response.detectedLanguage
      };
      
      setLastResult(result);
      onTranslation(result);
    } catch (error) {
      console.error('Translation error:', error);
      
      // Show error to user
      const errorResult: TranslationResult = {
        originalText: inputText,
        translatedText: `Error: ${error instanceof Error ? error.message : 'Translation failed'}`,
        confidence: 0,
        detectedLanguage: undefined
      };
      
      setLastResult(errorResult);
      onTranslation(errorResult);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleExampleClick = async (example: { text: string }) => {
    setInputText(example.text);
    setIsTranslating(true);
    
    try {
      // Use real API instead of mock translation
      const response = await translationService.translateText({
        text: example.text,
        targetLanguage: targetLanguage,
        context: 'varanasi_slang'
      });
      
      const result: TranslationResult = {
        originalText: response.originalText,
        translatedText: response.translatedText,
        confidence: response.confidence,
        detectedLanguage: response.detectedLanguage
      };
      
      setLastResult(result);
      onTranslation(result);
    } catch (error) {
      console.error('Translation error for example:', error);
      
      // Fallback to show error
      const errorResult: TranslationResult = {
        originalText: example.text,
        translatedText: `Error: ${error instanceof Error ? error.message : 'Translation failed'}`,
        confidence: 0,
        detectedLanguage: undefined
      };
      
      setLastResult(errorResult);
      onTranslation(errorResult);
    } finally {
      setIsTranslating(false);
    }
  };

  const examples = getCityExamples(currentCity);

  return (
    <div className="indian-translator">
      <div className="translator-header">
        <h2 className="temple-symbol">Local Slang Translator</h2>
        <p>Understand the heart of India through its languages</p>
      </div>

      <div className="translator-content">
        <div className="translation-area">
          <div className="input-section">
            <label className="input-label diya-symbol">
              Enter local text or slang
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type in Hindi, local dialect, or slang..."
              className="indian-textarea"
              rows={4}
            />
            
            <div className="action-buttons">
              <LanguageDisplayCard
                currentLanguage={targetLanguage}
                onLanguageChange={onLanguageChange}
                className="translator-language-card"
              />
              
              <div className="button-group">
                <button
                  onClick={handleTranslate}
                  disabled={!inputText.trim() || isTranslating}
                  className="translate-button"
                >
                  {isTranslating ? (
                    <>
                      <span className="spinner"></span>
                      Translating...
                    </>
                  ) : (
                    <>
                      <span className="om-symbol"></span>
                      Translate
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setInputText('')}
                  className="clear-button"
                  disabled={!inputText}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {lastResult && (
            <div className="result-section">
              <div className="result-header lotus-symbol">
                <h3>Translation Result</h3>
                <span className="confidence">
                  {Math.round(lastResult.confidence * 100)}% confident
                </span>
              </div>
              
              <div className="result-content">
                <div className="original-text">
                  <label>Original:</label>
                  <p>"{lastResult.originalText}"</p>
                </div>
                
                <div className="translated-text">
                  <label>Translation:</label>
                  <p>"{lastResult.translatedText}"</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="examples-section">
          <h3 className="examples-title diya-symbol">
            Try these local phrases from {currentCity}
          </h3>
          
          <div className="examples-grid">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="example-card"
                disabled={isTranslating}
              >
                <div className="example-original">"{example.text}"</div>
                <div className="example-action">
                  {isTranslating ? 'Translating...' : 'Click to translate →'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndianSlangTranslator;
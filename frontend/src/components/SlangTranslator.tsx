import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Translate as TranslateIcon, Clear as ClearIcon } from '@mui/icons-material';
import type { 
  TranslationResult, 
  SupportedLanguage
} from '../types/translation';
import { LANGUAGE_NAMES } from '../types/translation';

interface SlangTranslatorProps {
  targetLanguage: SupportedLanguage;
  onTranslation: (result: TranslationResult) => void;
  onLanguageChange?: (language: SupportedLanguage) => void;
}

interface TranslationState {
  isLoading: boolean;
  error: string | null;
  result: TranslationResult | null;
}

const SlangTranslator: React.FC<SlangTranslatorProps> = ({
  targetLanguage,
  onTranslation,
  onLanguageChange
}) => {
  const [inputText, setInputText] = useState('');
  const [translationState, setTranslationState] = useState<TranslationState>({
    isLoading: false,
    error: null,
    result: null
  });

  const handleLanguageChange = useCallback((event: SelectChangeEvent<SupportedLanguage>) => {
    const newLanguage = event.target.value as SupportedLanguage;
    onLanguageChange?.(newLanguage);
  }, [onLanguageChange]);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) {
      setTranslationState(prev => ({
        ...prev,
        error: 'Please enter some text to translate'
      }));
      return;
    }

    setTranslationState({
      isLoading: true,
      error: null,
      result: null
    });

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          targetLanguage,
          context: 'varanasi_slang'
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const result: TranslationResult = {
        originalText: data.originalText,
        translatedText: data.translatedText,
        confidence: data.confidence,
        detectedLanguage: data.detectedLanguage
      };

      setTranslationState({
        isLoading: false,
        error: null,
        result
      });

      onTranslation(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Translation failed';
      setTranslationState({
        isLoading: false,
        error: errorMessage,
        result: null
      });
    }
  }, [inputText, targetLanguage, onTranslation]);

  const handleClear = useCallback(() => {
    setInputText('');
    setTranslationState({
      isLoading: false,
      error: null,
      result: null
    });
  }, []);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleTranslate();
    }
  }, [handleTranslate]);

  const getConfidenceColor = (confidence: number): 'success' | 'warning' | 'error' => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TranslateIcon />
          Varanasi Slang Translator
        </Typography>

        {/* Language Selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="target-language-label">Target Language</InputLabel>
          <Select
            labelId="target-language-label"
            value={targetLanguage}
            label="Target Language"
            onChange={handleLanguageChange}
          >
            {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
              <MenuItem key={code} value={code}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Text Input */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Enter Varanasi slang or local text"
          placeholder="Type the local slang you heard..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={translationState.isLoading}
          sx={{ mb: 2 }}
        />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="contained"
            onClick={handleTranslate}
            disabled={translationState.isLoading || !inputText.trim()}
            startIcon={translationState.isLoading ? <CircularProgress size={20} /> : <TranslateIcon />}
            sx={{ flex: 1 }}
          >
            {translationState.isLoading ? 'Translating...' : 'Translate'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleClear}
            disabled={translationState.isLoading}
            startIcon={<ClearIcon />}
          >
            Clear
          </Button>
        </Box>

        {/* Loading Progress */}
        {translationState.isLoading && (
          <LinearProgress sx={{ mb: 2 }} />
        )}

        {/* Error Display */}
        {translationState.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {translationState.error}
          </Alert>
        )}

        {/* Translation Result */}
        {translationState.result && (
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Translation Result
              </Typography>
              
              {/* Original Text */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Original Text:
                </Typography>
                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                  "{translationState.result.originalText}"
                </Typography>
              </Box>

              {/* Translated Text */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Translation ({LANGUAGE_NAMES[targetLanguage]}):
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium', fontSize: '1.1rem' }}>
                  "{translationState.result.translatedText}"
                </Typography>
              </Box>

              {/* Confidence and Language Detection */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`${getConfidenceLabel(translationState.result.confidence)} (${Math.round(translationState.result.confidence * 100)}%)`}
                  color={getConfidenceColor(translationState.result.confidence)}
                  size="small"
                />
                {translationState.result.detectedLanguage && (
                  <Chip
                    label={`Detected: ${translationState.result.detectedLanguage}`}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default SlangTranslator;
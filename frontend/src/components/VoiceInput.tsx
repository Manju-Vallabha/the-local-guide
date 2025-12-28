import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import axios from 'axios';
import { useUserPreferences } from '../hooks/usePreferences';
import { LANGUAGE_CODES } from '../types/translation';
import type { SupportedLanguage } from '../types/translation';
import './VoiceInput.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface VoiceInputProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAudioData: (audioBlob: Blob) => void;
  onTranscript?: (transcript: string, confidence: number) => void;
  disabled?: boolean;
}

interface VoiceInputState {
  isSupported: boolean;
  hasPermission: boolean | null;
  error: string | null;
  isProcessing: boolean;
  audioLevel: number;
  transcript: string | null;
  confidence: number | null;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onAudioData,
  onTranscript,
  disabled = false
}) => {
  // Get user preferences for language
  const { data: preferences } = useUserPreferences();
  
  const [state, setState] = useState<VoiceInputState>({
    isSupported: false,
    hasPermission: null,
    error: null,
    isProcessing: false,
    audioLevel: 0,
    transcript: null,
    confidence: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Get language code for speech recognition
  const getLanguageCode = useCallback((): string => {
    if (!preferences?.preferredLanguage) {
      return 'en-US'; // Default to English
    }
    return LANGUAGE_CODES[preferences.preferredLanguage] || 'en-US';
  }, [preferences?.preferredLanguage]);

  // Get language name for display
  const getLanguageName = useCallback((): string => {
    if (!preferences?.preferredLanguage) {
      return 'English';
    }
    const languageNames: Record<SupportedLanguage, string> = {
      en: 'English',
      hi: 'Hindi', 
      te: 'Telugu'
    };
    return languageNames[preferences.preferredLanguage] || 'English';
  }, [preferences?.preferredLanguage]);

  // Check browser support on mount
  useEffect(() => {
    const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setState(prev => ({ ...prev, isSupported }));
  }, []);

  // Audio level monitoring with better responsiveness
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate RMS (Root Mean Square) for better audio level detection
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    const normalizedLevel = Math.min(rms / 128, 1);
    
    // Apply smoothing to reduce jitter
    setState(prev => {
      const smoothedLevel = prev.audioLevel * 0.7 + normalizedLevel * 0.3;
      return { ...prev, audioLevel: smoothedLevel };
    });
    
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  }, [isRecording]);

  // Send audio to backend for speech-to-text
  const processAudioWithBackend = useCallback(async (audioBlob: Blob) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language_code', getLanguageCode());
      formData.append('sample_rate', '48000'); // Match WebM OPUS default sample rate

      const response = await axios.post(`${API_BASE_URL}/api/speech-to-text`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
      });

      console.log('Speech-to-text response:', response.data);

      const { transcript, confidence } = response.data;
      
      setState(prev => ({ 
        ...prev, 
        transcript,
        confidence,
        isProcessing: false
      }));

      onTranscript?.(transcript, confidence);

    } catch (error) {
      console.error('Speech-to-text error:', error);
      
      let errorMessage = 'Failed to process speech';
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 503) {
          errorMessage = 'Speech recognition service is temporarily unavailable';
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid audio format or request';
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout - please try again';
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isProcessing: false
      }));
    }
  }, [onTranscript]);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      
      setState(prev => ({ ...prev, hasPermission: true, error: null }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Microphone access denied';
      setState(prev => ({ 
        ...prev, 
        hasPermission: false, 
        error: `Microphone permission required: ${errorMessage}` 
      }));
      return false;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Voice input is not supported in this browser' }));
      return;
    }

    if (state.hasPermission === null) {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Set up audio context for level monitoring (use default sample rate)
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        onAudioData(audioBlob);
        
        // Process audio with backend
        await processAudioWithBackend(audioBlob);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      onStartRecording();
      
      // Start audio level monitoring
      monitorAudioLevel();
      
      setState(prev => ({ 
        ...prev, 
        error: null, 
        transcript: null, 
        confidence: null 
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [state.isSupported, state.hasPermission, requestPermission, onStartRecording, onAudioData, monitorAudioLevel, processAudioWithBackend]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      onStopRecording();
    }
  }, [onStopRecording]);

  return (
    <div className="voice-input">
      <div className="voice-input__header">
        <Volume2 className="voice-input__icon" size={24} />
        <h3 className="voice-input__title">Voice Mode</h3>
      </div>

      <div className="voice-input__content">
        {/* Main Recording Button */}
        <div className="voice-input__controls">
          <button
            className={`voice-input__record-button ${isRecording ? 'voice-input__record-button--recording' : ''} ${
              state.hasPermission === false ? 'voice-input__record-button--disabled' : ''
            }`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || !state.isSupported || state.isProcessing}
          >
            {isRecording ? (
              <MicOff className="voice-input__button-icon" size={20} />
            ) : state.hasPermission === false ? (
              <MicOff className="voice-input__button-icon" size={20} />
            ) : (
              <Mic className="voice-input__button-icon" size={20} />
            )}
            {isRecording ? 'STOP RECORDING' : 'START RECORDING'}
          </button>
        </div>

        {/* Audio Level Indicator - Sound Wave Animation */}
        {isRecording && (
          <div className="voice-input__audio-level">
            <div className="voice-input__sound-wave">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="voice-input__wave-bar"
                  style={{
                    height: `${Math.max(10, state.audioLevel * 100 * (0.5 + Math.sin((Date.now() / 200) + i * 0.5) * 0.5))}%`,
                    animationDelay: `${i * 0.1}s`,
                    backgroundColor: state.audioLevel > 0.1 ? 'var(--primary-color)' : 'rgba(255, 107, 53, 0.3)',
                    transform: `scaleY(${0.3 + state.audioLevel * 2})`,
                  }}
                />
              ))}
            </div>
            <div className="voice-input__level-text">
              {state.audioLevel > 0.5 ? 'Speaking loudly' : 
               state.audioLevel > 0.2 ? 'Speaking' : 
               state.audioLevel > 0.05 ? 'Quiet speech' : 'Listening...'}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {state.isProcessing && (
          <div className="voice-input__status">
            <div className="voice-input__processing">
              <div className="voice-input__spinner"></div>
              Processing speech with Google Cloud...
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="voice-input__instructions">
          <p>
            Click "Start Recording" to capture audio. Speak clearly in {getLanguageName()} for 
            best results. The system will use Google Cloud Speech-to-Text to convert your speech to text.
          </p>
          {preferences?.preferredLanguage && (
            <p style={{ fontSize: '0.8rem', color: 'var(--accent-color)', marginTop: '0.5rem' }}>
              🌐 Using {getLanguageName()} ({getLanguageCode()}) based on your language preference
            </p>
          )}
        </div>

        {/* Error Messages */}
        {state.error && (
          <div className="voice-input__error">
            {state.error}
          </div>
        )}

        {/* Browser Support Warning */}
        {!state.isSupported && (
          <div className="voice-input__error">
            Voice input is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
          </div>
        )}

        {/* Permission Warning */}
        {state.isSupported && state.hasPermission === false && (
          <div className="voice-input__warning">
            Microphone access is required for voice input. Please allow microphone permissions and try again.
          </div>
        )}

        {/* Transcript Display */}
        {state.transcript && (
          <div className="voice-input__transcript">
            <h4>Speech Recognition Result</h4>
            <p className="voice-input__transcript-text">"{state.transcript}"</p>
            {state.confidence !== null && (
              <span className={`voice-input__confidence ${
                state.confidence > 0.8 ? 'voice-input__confidence--high' : 
                state.confidence > 0.6 ? 'voice-input__confidence--medium' : 
                'voice-input__confidence--low'
              }`}>
                Confidence: {Math.round(state.confidence * 100)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInput;
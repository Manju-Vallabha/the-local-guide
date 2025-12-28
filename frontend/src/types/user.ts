// User-related types and interfaces

import type { SupportedLanguage } from './translation';

export interface NotificationPreferences {
  newRecommendations: boolean;
  translationUpdates: boolean;
  systemUpdates: boolean;
}

export interface UserPreferences {
  preferredLanguage: SupportedLanguage;
  locationSharing: boolean;
  cacheTranslations: boolean;
  voiceInputEnabled: boolean;
  notificationPreferences: NotificationPreferences;
  theme?: string;
}

export interface UserSession {
  id: string;
  preferences: UserPreferences;
  createdAt: Date;
  lastActive: Date;
  ipAddress?: string;
  userAgent?: string;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  preferredLanguage: 'en',
  locationSharing: false,
  cacheTranslations: true,
  voiceInputEnabled: true,
  notificationPreferences: {
    newRecommendations: true,
    translationUpdates: false,
    systemUpdates: true
  },
  theme: 'light'
};
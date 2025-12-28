// Main types export file

// Re-export all types for easy importing
export * from './translation';
export * from './recommendations';
export * from './user';
export * from './api';
export * from './components';

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Event handler types
export type EventHandler<T = void> = (event: T) => void;
export type AsyncEventHandler<T = void> = (event: T) => Promise<void>;

// Generic callback types
export type Callback<T = void> = () => T;
export type AsyncCallback<T = void> = () => Promise<T>;

// Form-related types
export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
  valid: boolean;
}

export interface FormState<T extends Record<string, any>> {
  fields: { [K in keyof T]: FormField<T[K]> };
  isValid: boolean;
  isSubmitting: boolean;
  submitError?: string;
}
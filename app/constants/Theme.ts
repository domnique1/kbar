// constants/Theme.ts
export interface ThemeType {
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryVariant: string;
  border: string;
  card: string;
  notification: string;
  error: string; // Added error property
}

export const lightTheme: ThemeType = {
  background: '#EFFEFF',       // Very light blue background
  surface: '#FFFFFF',          // White surfaces (cards, modals)
  surfaceVariant: '#E4FFFF',   // Light blue for alternate surfaces
  text: '#2C3E50',            // Dark blue-gray text for excellent readability
  textSecondary: '#5D6D7E',   // Medium blue-gray for secondary text
  primary: '#00ADEF',          // Bright blue for primary actions
  primaryVariant: '#229FCB',   // Slightly darker blue for variants
  border: '#B3E5FC',          // Light blue borders
  card: '#FFFFFF',            // White cards
  notification: '#FF6B6B',    // Red for notifications/badges
  error: '#FF6B6B',           // Red for error states (same as notification for consistency)
};

export const darkTheme: ThemeType = {
  background: '#121212',
  surface: '#1E1E1E', 
  surfaceVariant: '#2D2D2D',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  primary: '#0a84ff',
  primaryVariant: '#007AFF',
  border: '#333333',
  card: '#1E1E1E',
  notification: '#FF453A',
  error: '#FF453A',           // Red for error states (same as notification for consistency)
};
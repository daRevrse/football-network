// ====== src/hooks/useTheme.js ======
import { useColorScheme } from 'react-native';
import { useMemo } from 'react';

const lightColors = {
  PRIMARY: '#22C55E',
  PRIMARY_LIGHT: '#86EFAC',
  PRIMARY_ULTRA_LIGHT: '#DCFCE7',

  SUCCESS: '#10B981',
  SUCCESS_LIGHT: '#D1FAE5',

  WARNING: '#F59E0B',
  WARNING_LIGHT: '#FEF3C7',

  ERROR: '#EF4444',
  ERROR_LIGHT: '#FEE2E2',

  INFO: '#3B82F6',
  INFO_LIGHT: '#DBEAFE',

  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  TEXT_MUTED: '#9CA3AF',
  TEXT_ULTRA_LIGHT: '#F3F4F6',

  WHITE: '#FFFFFF',
  BLACK: '#000000',

  BACKGROUND: '#FFFFFF',
  BACKGROUND_LIGHT: '#F9FAFB',
  BACKGROUND_DARK: '#F3F4F6',

  BORDER: '#E5E7EB',
  BORDER_LIGHT: '#F3F4F6',
};

const darkColors = {
  PRIMARY: '#22C55E',
  PRIMARY_LIGHT: '#166534',
  PRIMARY_ULTRA_LIGHT: '#052e16',

  SUCCESS: '#10B981',
  SUCCESS_LIGHT: '#064e3b',

  WARNING: '#F59E0B',
  WARNING_LIGHT: '#78350f',

  ERROR: '#EF4444',
  ERROR_LIGHT: '#7f1d1d',

  INFO: '#3B82F6',
  INFO_LIGHT: '#1e3a8a',

  TEXT_PRIMARY: '#F9FAFB',
  TEXT_SECONDARY: '#D1D5DB',
  TEXT_MUTED: '#9CA3AF',
  TEXT_ULTRA_LIGHT: '#374151',

  WHITE: '#1F2937',
  BLACK: '#F9FAFB',

  BACKGROUND: '#111827',
  BACKGROUND_LIGHT: '#1F2937',
  BACKGROUND_DARK: '#0F172A',

  BORDER: '#374151',
  BORDER_LIGHT: '#4B5563',
};

/**
 * Hook personnalisé pour gérer le thème de l'application
 * @param {string} mode - 'light', 'dark', ou 'auto' (défaut)
 * @returns {Object} { colors, isDark }
 */
export const useTheme = (mode = 'auto') => {
  const systemColorScheme = useColorScheme();

  const { colors, isDark } = useMemo(() => {
    let isDarkMode = false;

    if (mode === 'auto') {
      isDarkMode = systemColorScheme === 'dark';
    } else if (mode === 'dark') {
      isDarkMode = true;
    } else if (mode === 'light') {
      isDarkMode = false;
    }

    return {
      colors: isDarkMode ? darkColors : lightColors,
      isDark: isDarkMode,
    };
  }, [mode, systemColorScheme]);

  return { colors, isDark };
};

// Export des couleurs pour utilisation directe
export const COLORS = lightColors;
export const DARK_COLORS = darkColors;

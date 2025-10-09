// ====== src/hooks/useTheme.js ======
import { useColorScheme } from 'react-native';
import { COLORS as LIGHT_COLORS } from '../styles/theme';

// Couleurs pour le mode sombre
const DARK_COLORS = {
  // Primary
  PRIMARY: '#22C55E',
  PRIMARY_DARK: '#16A34A',
  PRIMARY_LIGHT: '#86EFAC',
  PRIMARY_ULTRA_LIGHT: '#22C55E20',

  // Secondary
  SECONDARY: '#3B82F6',
  SECONDARY_DARK: '#2563EB',
  SECONDARY_LIGHT: '#93C5FD',

  // Neutral
  WHITE: '#1F2937',
  BLACK: '#F9FAFB',

  // Background
  BACKGROUND: '#111827',
  BACKGROUND_LIGHT: '#1F2937',
  BACKGROUND_GRAY: '#374151',

  // Text
  TEXT_PRIMARY: '#F9FAFB',
  TEXT_SECONDARY: '#D1D5DB',
  TEXT_MUTED: '#9CA3AF',
  TEXT_WHITE: '#1F2937',
  TEXT_DISABLED: '#6B7280',

  // Status
  ERROR: '#EF4444',
  ERROR_LIGHT: '#7F1D1D',
  ERROR_DARK: '#FCA5A5',
  SUCCESS: '#10B981',
  SUCCESS_LIGHT: '#065F46',
  WARNING: '#F59E0B',
  WARNING_LIGHT: '#78350F',
  WARNING_DARK: '#FCD34D',
  INFO: '#0284C7',
  INFO_LIGHT: '#164E63',
  INFO_DARK: '#67E8F9',

  // UI Elements
  BORDER: '#374151',
  BORDER_FOCUS: '#22C55E',
  DIVIDER: '#374151',
  OVERLAY: 'rgba(0, 0, 0, 0.7)',
  CARD_SHADOW: 'rgba(0, 0, 0, 0.3)',
  SHADOW_DARK: 'rgba(0, 0, 0, 0.5)',
};

// Couleurs basées sur l'heure de la journée
const getDayTimeColors = () => {
  const hour = new Date().getHours();

  // Nuit (22h - 6h) -> Mode sombre
  if (hour >= 22 || hour < 6) {
    return DARK_COLORS;
  }

  // Matin/Jour (6h - 22h) -> Mode clair
  return LIGHT_COLORS;
};

export const useTheme = (mode = 'auto') => {
  const systemColorScheme = useColorScheme();

  let colors;

  switch (mode) {
    case 'light':
      colors = LIGHT_COLORS;
      break;
    case 'dark':
      colors = DARK_COLORS;
      break;
    case 'time':
      colors = getDayTimeColors();
      break;
    case 'auto':
    default:
      colors = systemColorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
      break;
  }

  return {
    colors,
    isDark: colors === DARK_COLORS,
    mode: colors === DARK_COLORS ? 'dark' : 'light',
  };
};

export { DARK_COLORS, LIGHT_COLORS };

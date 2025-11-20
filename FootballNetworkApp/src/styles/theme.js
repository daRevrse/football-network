// ====== src/styles/theme.js ======
export const COLORS = {
  // Primary
  PRIMARY: '#22C55E',
  PRIMARY_DARK: '#16A34A',
  PRIMARY_LIGHT: '#86EFAC',
  PRIMARY_ULTRA_LIGHT: '#DCFCE7',

  // Secondary
  SECONDARY: '#3B82F6',
  SECONDARY_DARK: '#2563EB',
  SECONDARY_LIGHT: '#93C5FD',

  // Tertiary
  TERTIARY: '#EF4444',
  TERTIARY_DARK: '#DC2626',
  TERTIARY_LIGHT: '#FCA5A5',

  // Neutral
  WHITE: '#FFFFFF',
  BLACK: '#000000',

  // Background
  BACKGROUND: '#FFFFFF',
  BACKGROUND_LIGHT: '#F8FAFC',
  BACKGROUND_GRAY: '#F1F5F9',

  // Text
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  TEXT_MUTED: '#9CA3AF',
  TEXT_WHITE: '#FFFFFF',
  TEXT_DISABLED: '#D1D5DB',

  // Status
  ERROR: '#EF4444',
  ERROR_LIGHT: '#FEE2E2',
  ERROR_DARK: '#991B1B',
  SUCCESS: '#10B981',
  SUCCESS_LIGHT: '#D1FAE5',
  WARNING: '#F59E0B',
  WARNING_LIGHT: '#FEF3C7',
  WARNING_DARK: '#92400E',
  INFO: '#0284C7',
  INFO_LIGHT: '#E0F2FE',
  INFO_DARK: '#0C4A6E',

  // UI Elements
  BORDER: '#E5E7EB',
  BORDER_FOCUS: '#22C55E',
  DIVIDER: '#E5E7EB',
  OVERLAY: 'rgba(0, 0, 0, 0.5)',
  CARD_SHADOW: 'rgba(0, 0, 0, 0.08)',
  SHADOW_DARK: 'rgba(0, 0, 0, 0.15)',
};

export const DIMENSIONS = {
  // Container
  CONTAINER_PADDING: 24,
  CONTAINER_PADDING_SM: 16,

  // Spacing
  SPACING_XXS: 4,
  SPACING_XS: 8,
  SPACING_SM: 12,
  SPACING_MD: 16,
  SPACING_LG: 24,
  SPACING_XL: 32,
  SPACING_XXL: 40,
  SPACING_XXXL: 48,

  // Components
  INPUT_HEIGHT: 56,
  INPUT_HEIGHT_SM: 48,
  BUTTON_HEIGHT: 56,
  BUTTON_HEIGHT_SM: 48,
  ICON_SIZE_SM: 20,
  ICON_SIZE_MD: 24,
  ICON_SIZE_LG: 32,
  ICON_SIZE_XL: 48,

  // Border Radius
  BORDER_RADIUS_XS: 4,
  BORDER_RADIUS_SM: 8,
  BORDER_RADIUS_MD: 12,
  BORDER_RADIUS_LG: 16,
  BORDER_RADIUS_XL: 24,
  BORDER_RADIUS_FULL: 9999,

  // Border Width
  BORDER_WIDTH_THIN: 1,
  BORDER_WIDTH_MEDIUM: 2,
  BORDER_WIDTH_THICK: 4,
};

export const FONTS = {
  SIZE: {
    XXS: 10,
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
    XXXL: 32,
    HUGE: 40,
  },
  WEIGHT: {
    LIGHT: '300',
    REGULAR: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
    EXTRABOLD: '800',
  },
  LINE_HEIGHT: {
    TIGHT: 1.2,
    NORMAL: 1.5,
    RELAXED: 1.75,
  },
  FAMILY: {
    REGULAR: 'Roboto-Regular',
    MEDIUM: 'Roboto-Medium',
    BOLD: 'Roboto-Bold',
  },
};

export const SHADOWS = {
  SMALL: {
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  LARGE: {
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  FOCUS: {
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const ANIMATIONS = {
  DURATION: {
    FAST: 150,
    NORMAL: 250,
    SLOW: 350,
  },
};

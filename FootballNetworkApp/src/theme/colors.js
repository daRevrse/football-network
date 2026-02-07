/**
 * Foot Connect - Design System
 * Premium Sports Editorial Aesthetic
 */

export const COLORS = {
  // === COULEURS PRINCIPALES (Spec) ===
  PRIMARY: '#007b40',           // Vert Foot Connect
  PRIMARY_DARK: '#005c30',      // Vert plus fonce
  PRIMARY_LIGHT: '#00a857',     // Vert plus clair

  // === BASE SOMBRE (Dark Mode) ===
  DARK: '#0A0A0A',              // Noir profond
  DARK_SURFACE: '#141414',      // Surface sombre
  DARK_ELEVATED: '#1C1C1C',     // Surface elevee
  DARK_CARD: '#1E1E1E',         // Carte sombre

  // === SECONDAIRE ===
  SECONDARY: '#FFFFFF',
  WHITE: '#FFFFFF',

  // === TEXTE ===
  TEXT_PRIMARY: '#FFFFFF',      // Texte principal sur dark
  TEXT_SECONDARY: '#B0B0B0',    // Texte secondaire
  TEXT_MUTED: '#707070',        // Texte attenue
  TEXT_WHITE: '#FFFFFF',
  TEXT_DARK: '#0A0A0A',         // Texte sur fond clair
  TEXT_ON_PRIMARY: '#FFFFFF',

  // === ETATS ===
  SUCCESS: '#00C853',           // Vert succes
  WARNING: '#FFB300',           // Orange avertissement
  ERROR: '#FF3D00',             // Rouge erreur
  DANGER: '#FF3D00',
  INFO: '#2196F3',              // Bleu info

  // === ARRIERE-PLANS ===
  BACKGROUND: '#0A0A0A',        // Fond principal (dark)
  BACKGROUND_LIGHT: '#FFFFFF',  // Fond clair si besoin
  BACKGROUND_SECONDARY: '#141414',
  BACKGROUND_TERTIARY: '#1C1C1C',
  CARD_BACKGROUND: '#1E1E1E',
  SURFACE: '#141414',

  // === BORDURES ===
  BORDER: '#2A2A2A',
  BORDER_LIGHT: '#3A3A3A',
  BORDER_DARK: '#1A1A1A',
  DIVIDER: '#2A2A2A',

  // === OVERLAY ===
  OVERLAY: 'rgba(0, 0, 0, 0.7)',
  OVERLAY_LIGHT: 'rgba(0, 0, 0, 0.5)',
  OVERLAY_DARK: 'rgba(0, 0, 0, 0.85)',
  OVERLAY_GREEN: 'rgba(0, 123, 64, 0.3)',

  // === GLASS EFFECT ===
  GLASS: 'rgba(255, 255, 255, 0.08)',
  GLASS_BORDER: 'rgba(255, 255, 255, 0.12)',
  GLASS_LIGHT: 'rgba(255, 255, 255, 0.05)',

  // === MATCH STATUS ===
  MATCH_PENDING: '#FFB300',
  MATCH_CONFIRMED: '#007b40',
  MATCH_IN_PROGRESS: '#2196F3',
  MATCH_COMPLETED: '#00C853',
  MATCH_CANCELLED: '#FF3D00',

  // === ROLES ===
  ROLE_PLAYER: '#2196F3',       // Bleu joueur
  ROLE_MANAGER: '#007b40',      // Vert manager
  ROLE_REFEREE: '#9C27B0',      // Violet arbitre
  ROLE_VENUE_OWNER: '#FF5722',  // Orange proprietaire

  // === CARDS (Football) ===
  YELLOW_CARD: '#FFD600',
  RED_CARD: '#FF3D00',

  // === RATINGS ===
  RATING_EXCELLENT: '#00C853',
  RATING_GOOD: '#7CB342',
  RATING_AVERAGE: '#FFB300',
  RATING_POOR: '#FF9800',
  RATING_BAD: '#FF3D00',

  // === SOCIAL ===
  LIKE: '#FF4081',
  SHARE: '#2196F3',
  COMMENT: '#B0B0B0',

  // === INPUT ===
  INPUT_BACKGROUND: 'rgba(255, 255, 255, 0.08)',
  INPUT_BORDER: 'rgba(255, 255, 255, 0.15)',
  INPUT_FOCUS: '#007b40',
  INPUT_ERROR: '#FF3D00',
  INPUT_DISABLED: '#2A2A2A',
  PLACEHOLDER: 'rgba(255, 255, 255, 0.4)',
};

// === GRADIENTS ===
export const GRADIENTS = {
  // Gradient principal vert -> noir
  primary: ['#007b40', '#004d28', '#0A0A0A'],
  primaryDiagonal: ['#007b40', '#0A0A0A'],

  // Gradient radial pour splash
  splash: ['#007b40', '#003d20', '#0A0A0A'],

  // Gradient overlay pour images
  imageOverlay: ['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.85)'],

  // Gradient pour cards
  card: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)'],

  // Gradient bouton
  button: ['#007b40', '#005c30'],
  buttonHover: ['#00a857', '#007b40'],

  // Success/Error
  success: ['#00C853', '#009624'],
  error: ['#FF3D00', '#DD2C00'],
};

// === SHADOWS ===
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: {
    shadowColor: '#007b40',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  glowStrong: {
    shadowColor: '#007b40',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 12,
  },
};

// === SPACING ===
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// === BORDER RADIUS ===
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// === TYPOGRAPHY ===
export const TYPOGRAPHY = {
  // Display (Headlines)
  displayLarge: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 48,
  },
  displayMedium: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  displaySmall: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 36,
  },
  // Headings
  headlineLarge: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 32,
  },
  headlineMedium: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 28,
  },
  headlineSmall: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 24,
  },
  // Body
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  // Labels
  labelLarge: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 14,
  },
};

export default COLORS;

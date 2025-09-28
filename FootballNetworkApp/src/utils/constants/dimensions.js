// ====== src/utils/constants/dimensions.js ======
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const DIMENSIONS = {
  SCREEN_WIDTH: width,
  SCREEN_HEIGHT: height,

  // Espacements
  SPACING_XS: 4,
  SPACING_SM: 8,
  SPACING_MD: 16,
  SPACING_LG: 24,
  SPACING_XL: 32,

  // Rayons de bordure
  BORDER_RADIUS_SM: 4,
  BORDER_RADIUS_MD: 8,
  BORDER_RADIUS_LG: 12,
  BORDER_RADIUS_XL: 16,

  // Hauteurs d'éléments
  BUTTON_HEIGHT: 48,
  INPUT_HEIGHT: 48,
  HEADER_HEIGHT: 56,
  TAB_BAR_HEIGHT: 60,

  // Largeurs
  CONTAINER_PADDING: 16,
  MAX_CONTENT_WIDTH: 400,
};

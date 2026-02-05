// ====== src/utils/imageUtils.js ======
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Options par défaut pour l'image picker
 */
const defaultImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.8,
  allowsEditing: true,
};

/**
 * Demander les permissions pour la caméra
 */
export const requestCameraPermission = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
};

/**
 * Demander les permissions pour la galerie
 */
export const requestGalleryPermission = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

/**
 * Ouvrir la caméra pour prendre une photo
 */
export const openCamera = async (options = {}) => {
  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission refusée',
        "L'application a besoin d'accéder à la caméra pour prendre des photos",
      );
      return { success: false, error: 'Permission denied' };
    }

    const result = await ImagePicker.launchCameraAsync({
      ...defaultImagePickerOptions,
      ...options,
    });

    if (result.canceled) {
      return { success: false, cancelled: true };
    }

    const image = result.assets?.[0];
    if (!image) {
      return { success: false, error: 'No image selected' };
    }

    return {
      success: true,
      image: {
        uri: image.uri,
        type: image.mimeType || 'image/jpeg',
        name: image.fileName || image.uri.split('/').pop(),
        size: image.fileSize,
        width: image.width,
        height: image.height,
      },
    };
  } catch (error) {
    console.error('Camera error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Ouvrir la galerie pour sélectionner une photo
 */
export const openGallery = async (options = {}) => {
  try {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission refusée',
        "L'application a besoin d'accéder à vos photos",
      );
      return { success: false, error: 'Permission denied' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      ...defaultImagePickerOptions,
      ...options,
    });

    if (result.canceled) {
      return { success: false, cancelled: true };
    }

    const image = result.assets?.[0];
    if (!image) {
      return { success: false, error: 'No image selected' };
    }

    return {
      success: true,
      image: {
        uri: image.uri,
        type: image.mimeType || 'image/jpeg',
        name: image.fileName || image.uri.split('/').pop(),
        size: image.fileSize,
        width: image.width,
        height: image.height,
      },
    };
  } catch (error) {
    console.error('Gallery error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Afficher un menu pour choisir entre caméra et galerie
 */
export const showImagePickerOptions = () => {
  return new Promise(resolve => {
    Alert.alert(
      'Choisir une photo',
      'Sélectionnez une source',
      [
        {
          text: 'Caméra',
          onPress: async () => {
            const result = await openCamera();
            resolve(result);
          },
        },
        {
          text: 'Galerie',
          onPress: async () => {
            const result = await openGallery();
            resolve(result);
          },
        },
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => resolve({ success: false, cancelled: true }),
        },
      ],
      { cancelable: true },
    );
  });
};

/**
 * Obtenir l'extension d'un fichier depuis son URI
 */
export const getFileExtension = uri => {
  const match = /\.(\w+)$/.exec(uri);
  return match ? match[1] : 'jpg';
};

/**
 * Obtenir le type MIME depuis l'extension
 */
export const getMimeType = extension => {
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
  };
  return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
};

/**
 * Valider la taille d'une image
 */
export const validateImageSize = (sizeInBytes, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return sizeInBytes <= maxSizeBytes;
};

/**
 * Formater la taille d'un fichier en string lisible
 */
export const formatFileSize = bytes => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Créer un FormData pour l'upload d'une image
 */
export const createImageFormData = (imageUri, fieldName = 'image') => {
  const formData = new FormData();

  const filename = imageUri.split('/').pop();
  const extension = getFileExtension(filename);
  const type = getMimeType(extension);

  formData.append(fieldName, {
    uri: imageUri,
    name: filename,
    type,
  });

  return formData;
};

/**
 * Compresser une image
 * Note: Pour une compression avancée, installer expo-image-manipulator
 */
export const compressImage = async (imageUri, options = {}) => {
  // Avec expo-image-picker, la compression est gérée via l'option quality
  // Pour une compression plus avancée, utiliser expo-image-manipulator
  return {
    success: true,
    image: {
      uri: imageUri,
      name: imageUri.split('/').pop(),
      size: null,
    },
  };
};

/**
 * Générer un nom de fichier unique
 */
export const generateUniqueFileName = (prefix = 'IMG', extension = 'jpg') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}_${timestamp}_${random}.${extension}`;
};

/**
 * Valider si une URI est une image valide
 */
export const isValidImageUri = uri => {
  if (!uri) return false;

  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  const extension = getFileExtension(uri);

  return validExtensions.includes(extension.toLowerCase());
};

/**
 * Obtenir les dimensions d'une image
 */
export const getImageDimensions = uri => {
  return new Promise((resolve, reject) => {
    const Image = require('react-native').Image;

    Image.getSize(
      uri,
      (width, height) => {
        resolve({ width, height });
      },
      error => {
        reject(error);
      },
    );
  });
};

/**
 * Créer un thumbnail depuis une image
 * Note: Pour une création de thumbnail avancée, installer expo-image-manipulator
 */
export const createThumbnail = async (imageUri, size = 200) => {
  // Retourne l'image originale - pour des thumbnails réels, utiliser expo-image-manipulator
  return {
    success: true,
    thumbnail: {
      uri: imageUri,
      size: null,
    },
  };
};

// Export de toutes les fonctions
export default {
  requestCameraPermission,
  requestGalleryPermission,
  openCamera,
  openGallery,
  showImagePickerOptions,
  getFileExtension,
  getMimeType,
  validateImageSize,
  formatFileSize,
  createImageFormData,
  compressImage,
  generateUniqueFileName,
  isValidImageUri,
  getImageDimensions,
  createThumbnail,
};

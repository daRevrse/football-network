// ====== src/utils/imageUtils.js ======
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

/**
 * Options par défaut pour l'image picker
 */
const defaultImagePickerOptions = {
  mediaType: 'photo',
  quality: 0.8,
  maxWidth: 1000,
  maxHeight: 1000,
  includeBase64: false,
  saveToPhotos: false,
};

/**
 * Demander les permissions pour la caméra (Android)
 */
export const requestCameraPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Permission Caméra',
          message: "L'application a besoin d'accéder à votre caméra",
          buttonNeutral: 'Plus tard',
          buttonNegative: 'Refuser',
          buttonPositive: 'Autoriser',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  }
  return true;
};

/**
 * Demander les permissions pour la galerie (Android)
 */
export const requestGalleryPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Permission Galerie',
          message: "L'application a besoin d'accéder à vos photos",
          buttonNeutral: 'Plus tard',
          buttonNegative: 'Refuser',
          buttonPositive: 'Autoriser',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Gallery permission error:', err);
      return false;
    }
  }
  return true;
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

    const result = await launchCamera({
      ...defaultImagePickerOptions,
      ...options,
    });

    if (result.didCancel) {
      return { success: false, cancelled: true };
    }

    if (result.errorCode) {
      console.error('Camera error:', result.errorCode, result.errorMessage);
      return { success: false, error: result.errorMessage };
    }

    const image = result.assets?.[0];
    if (!image) {
      return { success: false, error: 'No image selected' };
    }

    return {
      success: true,
      image: {
        uri: image.uri,
        type: image.type,
        name: image.fileName,
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

    const result = await launchImageLibrary({
      ...defaultImagePickerOptions,
      ...options,
    });

    if (result.didCancel) {
      return { success: false, cancelled: true };
    }

    if (result.errorCode) {
      console.error('Gallery error:', result.errorCode, result.errorMessage);
      return { success: false, error: result.errorMessage };
    }

    const image = result.assets?.[0];
    if (!image) {
      return { success: false, error: 'No image selected' };
    }

    return {
      success: true,
      image: {
        uri: image.uri,
        type: image.type,
        name: image.fileName,
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
 * Compresser une image (nécessite react-native-image-resizer)
 */
export const compressImage = async (imageUri, options = {}) => {
  try {
    // Note: Nécessite 'react-native-image-resizer'
    // npm install react-native-image-resizer

    const ImageResizer = require('react-native-image-resizer').default;

    const {
      width = 1000,
      height = 1000,
      format = 'JPEG',
      quality = 80,
    } = options;

    const resizedImage = await ImageResizer.createResizedImage(
      imageUri,
      width,
      height,
      format,
      quality,
    );

    return {
      success: true,
      image: {
        uri: resizedImage.uri,
        name: resizedImage.name,
        size: resizedImage.size,
      },
    };
  } catch (error) {
    console.error('Image compression error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
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
 */
export const createThumbnail = async (imageUri, size = 200) => {
  try {
    const ImageResizer = require('react-native-image-resizer').default;

    const thumbnail = await ImageResizer.createResizedImage(
      imageUri,
      size,
      size,
      'JPEG',
      70,
      0,
      null,
      false,
      { mode: 'cover' },
    );

    return {
      success: true,
      thumbnail: {
        uri: thumbnail.uri,
        size: thumbnail.size,
      },
    };
  } catch (error) {
    console.error('Thumbnail creation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
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

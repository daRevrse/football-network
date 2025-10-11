// ====== src/services/storage/SecureStorage.js ======
import AsyncStorage from '@react-native-async-storage/async-storage';

class SecureStorageService {
  // Clés de stockage
  static KEYS = {
    TOKEN: '@auth_token',
    REFRESH_TOKEN: '@refresh_token',
    USER: '@user_data',
    THEME: '@app_theme',
    LANGUAGE: '@app_language',
    NOTIFICATIONS_SETTINGS: '@notifications_settings',
    CACHED_TEAMS: '@cached_teams',
    CACHED_MATCHES: '@cached_matches',
    LAST_SYNC: '@last_sync',
  };

  /**
   * Sauvegarder une valeur
   */
  async set(key, value) {
    try {
      const stringValue =
        typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      return { success: true };
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer une valeur
   */
  async get(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;

      // Essayer de parser en JSON, sinon retourner la string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Supprimer une valeur
   */
  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprimer plusieurs valeurs
   */
  async removeMultiple(keys) {
    try {
      await AsyncStorage.multiRemove(keys);
      return { success: true };
    } catch (error) {
      console.error('Error removing multiple keys:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Nettoyer tout le stockage
   */
  async clearAll() {
    try {
      await AsyncStorage.clear();
      return { success: true };
    } catch (error) {
      console.error('Error clearing storage:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== AUTH ====================

  async setToken(token) {
    return await this.set(SecureStorageService.KEYS.TOKEN, token);
  }

  async getToken() {
    return await this.get(SecureStorageService.KEYS.TOKEN);
  }

  async removeToken() {
    return await this.remove(SecureStorageService.KEYS.TOKEN);
  }

  async setRefreshToken(token) {
    return await this.set(SecureStorageService.KEYS.REFRESH_TOKEN, token);
  }

  async getRefreshToken() {
    return await this.get(SecureStorageService.KEYS.REFRESH_TOKEN);
  }

  // Méthode pour sauvegarder les deux tokens en une seule fois
  async setTokens(token, refreshToken) {
    try {
      await this.setToken(token);
      if (refreshToken) {
        await this.setRefreshToken(refreshToken);
      }
      return { success: true };
    } catch (error) {
      console.error('Error saving tokens:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== USER ====================

  async setUser(userData) {
    return await this.set(SecureStorageService.KEYS.USER, userData);
  }

  async getUser() {
    return await this.get(SecureStorageService.KEYS.USER);
  }

  async updateUser(updates) {
    const currentUser = await this.getUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      return await this.setUser(updatedUser);
    }
    return { success: false, error: 'No user found' };
  }

  async removeUser() {
    return await this.remove(SecureStorageService.KEYS.USER);
  }

  // ==================== THEME ====================

  async setTheme(theme) {
    return await this.set(SecureStorageService.KEYS.THEME, theme);
  }

  async getTheme() {
    return await this.get(SecureStorageService.KEYS.THEME);
  }

  // ==================== LANGUAGE ====================

  async setLanguage(language) {
    return await this.set(SecureStorageService.KEYS.LANGUAGE, language);
  }

  async getLanguage() {
    return await this.get(SecureStorageService.KEYS.LANGUAGE);
  }

  // ==================== NOTIFICATIONS ====================

  async setNotificationsSettings(settings) {
    return await this.set(
      SecureStorageService.KEYS.NOTIFICATIONS_SETTINGS,
      settings,
    );
  }

  async getNotificationsSettings() {
    return await this.get(SecureStorageService.KEYS.NOTIFICATIONS_SETTINGS);
  }

  // ==================== CACHE ====================

  /**
   * Mettre en cache des données avec un timestamp
   */
  async setCache(key, data, expirationMinutes = 60) {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expirationMinutes,
    };
    return await this.set(key, cacheData);
  }

  /**
   * Récupérer des données du cache si elles ne sont pas expirées
   */
  async getCache(key) {
    const cacheData = await this.get(key);
    if (!cacheData || !cacheData.timestamp) {
      return null;
    }

    const now = Date.now();
    const expirationTime =
      cacheData.timestamp + cacheData.expirationMinutes * 60 * 1000;

    if (now > expirationTime) {
      // Cache expiré, le supprimer
      await this.remove(key);
      return null;
    }

    return cacheData.data;
  }

  async setCachedTeams(teams, expirationMinutes = 30) {
    return await this.setCache(
      SecureStorageService.KEYS.CACHED_TEAMS,
      teams,
      expirationMinutes,
    );
  }

  async getCachedTeams() {
    return await this.getCache(SecureStorageService.KEYS.CACHED_TEAMS);
  }

  async setCachedMatches(matches, expirationMinutes = 15) {
    return await this.setCache(
      SecureStorageService.KEYS.CACHED_MATCHES,
      matches,
      expirationMinutes,
    );
  }

  async getCachedMatches() {
    return await this.getCache(SecureStorageService.KEYS.CACHED_MATCHES);
  }

  // ==================== SYNC ====================

  async setLastSync(timestamp = Date.now()) {
    return await this.set(SecureStorageService.KEYS.LAST_SYNC, timestamp);
  }

  async getLastSync() {
    return await this.get(SecureStorageService.KEYS.LAST_SYNC);
  }

  async shouldSync(intervalMinutes = 30) {
    const lastSync = await this.getLastSync();
    if (!lastSync) return true;

    const now = Date.now();
    const syncInterval = intervalMinutes * 60 * 1000;
    return now - lastSync > syncInterval;
  }

  // ==================== LOGOUT ====================

  /**
   * Nettoyer toutes les données d'authentification et utilisateur
   */
  async logout() {
    const keysToRemove = [
      SecureStorageService.KEYS.TOKEN,
      SecureStorageService.KEYS.REFRESH_TOKEN,
      SecureStorageService.KEYS.USER,
      SecureStorageService.KEYS.CACHED_TEAMS,
      SecureStorageService.KEYS.CACHED_MATCHES,
      SecureStorageService.KEYS.LAST_SYNC,
    ];

    return await this.removeMultiple(keysToRemove);
  }

  // ==================== DEBUG ====================

  /**
   * Obtenir toutes les clés stockées (pour debug)
   */
  async getAllKeys() {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Obtenir toutes les données (pour debug)
   */
  async getAllData() {
    try {
      const keys = await this.getAllKeys();
      const data = await AsyncStorage.multiGet(keys);

      return data.reduce((acc, [key, value]) => {
        try {
          acc[key] = JSON.parse(value);
        } catch {
          acc[key] = value;
        }
        return acc;
      }, {});
    } catch (error) {
      console.error('Error getting all data:', error);
      return {};
    }
  }

  /**
   * Obtenir la taille du stockage utilisé (pour debug)
   */
  async getStorageSize() {
    try {
      const data = await this.getAllData();
      const size = JSON.stringify(data).length;
      return {
        bytes: size,
        kilobytes: (size / 1024).toFixed(2),
        megabytes: (size / 1024 / 1024).toFixed(2),
      };
    } catch (error) {
      console.error('Error getting storage size:', error);
      return { bytes: 0, kilobytes: 0, megabytes: 0 };
    }
  }
}

// Export singleton
export const SecureStorage = new SecureStorageService();

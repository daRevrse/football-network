import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

export class SecureStorage {
  // Gestion des tokens
  static async setTokens(token, refreshToken) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des tokens:', error);
    }
  }

  static async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  static async getRefreshToken() {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Erreur lors de la récupération du refresh token:', error);
      return null;
    }
  }

  // Gestion des données utilisateur
  static async setUser(userData) {
    try {
      const userString = JSON.stringify(userData);
      await AsyncStorage.setItem(USER_KEY, userString);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'utilisateur:", error);
    }
  }

  static async getUser() {
    try {
      const userString = await AsyncStorage.getItem(USER_KEY);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      return null;
    }
  }

  // Nettoyage
  static async clearToken() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression du token:', error);
    }
  }

  static async clearRefreshToken() {
    try {
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression du refresh token:', error);
    }
  }

  static async clearUser() {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
    }
  }

  static async clearAll() {
    await Promise.all([
      this.clearToken(),
      this.clearRefreshToken(),
      this.clearUser(),
    ]);
  }
}

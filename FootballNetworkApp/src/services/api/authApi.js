import { SecureStorage } from '../storage';

class AuthApiService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api'; // Changez selon votre setup
    this.timeout = 10000;
  }

  // Gestion des erreurs API
  handleApiError(error) {
    console.error('API Error:', error);

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          return {
            success: false,
            error: 'Email ou mot de passe incorrect',
            code: 'INVALID_CREDENTIALS',
          };
        case 409:
          return {
            success: false,
            error: 'Email déjà utilisé',
            code: 'EMAIL_EXISTS',
          };
        case 500:
          return {
            success: false,
            error: 'Erreur serveur, veuillez réessayer',
            code: 'SERVER_ERROR',
          };
        default:
          return {
            success: false,
            error: data.error || 'Une erreur est survenue',
            code: 'UNKNOWN_ERROR',
          };
      }
    } else if (error.request) {
      return {
        success: false,
        error: 'Problème de connexion, vérifiez votre réseau',
        code: 'NETWORK_ERROR',
      };
    } else {
      return {
        success: false,
        error: 'Une erreur inattendue est survenue',
        code: 'UNEXPECTED_ERROR',
      };
    }
  }

  // Connexion
  async login(email, password) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw { response: { status: response.status, data } };
      }

      // Sauvegarder les tokens
      await SecureStorage.setTokens(data.token, data.refreshToken);
      await SecureStorage.setUser(data.user);

      return {
        success: true,
        data: {
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken,
        },
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Inscription
  async signup(userData) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email.toLowerCase().trim(),
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone || null,
          birthDate: userData.birthDate || null,
          position: userData.position || 'any',
          skillLevel: userData.skillLevel || 'amateur',
          locationCity: userData.locationCity || null,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw { response: { status: response.status, data } };
      }

      // Sauvegarder les tokens
      await SecureStorage.setTokens(data.token, data.refreshToken);
      await SecureStorage.setUser(data.user);

      return {
        success: true,
        data: {
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken,
        },
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Vérification du token
  async verifyToken() {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw {
          response: { status: response.status, data: await response.json() },
        };
      }

      const data = await response.json();

      return {
        success: true,
        data: data.user,
      };
    } catch (error) {
      // Si le token est invalide, nettoyer le stockage
      await SecureStorage.clearAll();
      return this.handleApiError(error);
    }
  }

  // Déconnexion
  async logout() {
    try {
      // Nettoyer le stockage local
      await SecureStorage.clearAll();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Même en cas d'erreur, nettoyer le stockage
      await SecureStorage.clearAll();
      return { success: true };
    }
  }
}

export const authApi = new AuthApiService();

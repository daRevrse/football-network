// ====== src/services/api/authApi.js ======
import { SecureStorage } from '../storage/SecureStorage';
import { API_CONFIG } from '../../utils/constants';

class AuthApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  handleApiError(error) {
    console.error('Auth API Error:', error);

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          return {
            success: false,
            error: data.error || 'Données invalides',
            code: 'BAD_REQUEST',
          };
        case 401:
          return {
            success: false,
            error: 'Email ou mot de passe incorrect',
            code: 'UNAUTHORIZED',
          };
        case 409:
          return {
            success: false,
            error: 'Cet email est déjà utilisé',
            code: 'CONFLICT',
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
        error: 'Problème de connexion au serveur',
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

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(userData) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          response: { status: response.status, data: errorData },
        };
      }

      const data = await response.json();

      // Sauvegarder les tokens et l'utilisateur
      await SecureStorage.setTokens(data.token, data.refreshToken);
      await SecureStorage.setUser(data.user);

      return {
        success: true,
        data: {
          user: data.user,
          token: data.token,
        },
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(email, password) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          response: { status: response.status, data: errorData },
        };
      }

      const data = await response.json();

      // Sauvegarder les tokens et l'utilisateur
      await SecureStorage.setTokens(data.token, data.refreshToken);
      await SecureStorage.setUser(data.user);

      return {
        success: true,
        data: {
          user: data.user,
          token: data.token,
        },
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Déconnexion
   */
  async logout() {
    try {
      const token = await SecureStorage.getToken();

      if (token) {
        // Optionnel : Appeler l'API pour invalider le token côté serveur
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeout);

          await fetch(`${this.baseURL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
        } catch (error) {
          // Ignorer les erreurs de logout côté serveur
          console.warn('Logout API error:', error);
        }
      }

      // Nettoyer le stockage local
      await SecureStorage.logout();

      return {
        success: true,
        message: 'Déconnexion réussie',
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Vérifier le token actuel
   */
  async verifyToken() {
    try {
      const token = await SecureStorage.getToken();

      if (!token) {
        return {
          success: false,
          error: 'No token found',
          code: 'NO_TOKEN',
        };
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
        // Token invalide ou expiré
        await SecureStorage.logout();
        throw {
          response: {
            status: response.status,
            data: { error: 'Invalid token' },
          },
        };
      }

      const data = await response.json();

      // Mettre à jour les données utilisateur
      if (data.user) {
        await SecureStorage.setUser(data.user);
      }

      return {
        success: true,
        data: {
          user: data.user,
          valid: true,
        },
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Rafraîchir le token
   */
  async refreshToken() {
    try {
      const refreshToken = await SecureStorage.getRefreshToken();

      if (!refreshToken) {
        return {
          success: false,
          error: 'No refresh token found',
          code: 'NO_REFRESH_TOKEN',
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Refresh token invalide ou expiré
        await SecureStorage.logout();
        throw {
          response: {
            status: response.status,
            data: { error: 'Invalid refresh token' },
          },
        };
      }

      const data = await response.json();

      // Sauvegarder les nouveaux tokens
      await SecureStorage.setTokens(data.token, data.refreshToken);

      return {
        success: true,
        data: {
          token: data.token,
          refreshToken: data.refreshToken,
        },
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Demander un reset de mot de passe
   */
  async requestPasswordReset(email) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          response: { status: response.status, data: errorData },
        };
      }

      return {
        success: true,
        message: 'Email de réinitialisation envoyé',
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Réinitialiser le mot de passe avec le token
   */
  async resetPassword(token, newPassword) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          response: { status: response.status, data: errorData },
        };
      }

      return {
        success: true,
        message: 'Mot de passe réinitialisé avec succès',
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Vérifier si un email existe déjà
   */
  async checkEmailExists(email) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/auth/check-email?email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          response: { status: response.status, data: errorData },
        };
      }

      const data = await response.json();

      return {
        success: true,
        exists: data.exists,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Obtenir l'utilisateur actuellement connecté depuis le cache
   */
  async getCurrentUser() {
    try {
      const user = await SecureStorage.getUser();
      const token = await SecureStorage.getToken();

      if (!user || !token) {
        return {
          success: false,
          error: 'No user logged in',
          code: 'NO_USER',
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  async isAuthenticated() {
    const token = await SecureStorage.getToken();
    return !!token;
  }
}

// Export singleton
export const AuthApi = new AuthApiService();

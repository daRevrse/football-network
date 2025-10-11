// ====== src/services/api/userApi.js ======
import { SecureStorage } from '../storage';
import { API_CONFIG } from '../../utils/constants';

class UserApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  handleApiError(error) {
    console.error('User API Error:', error);

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          return {
            success: false,
            error: 'Session expirée',
            code: 'UNAUTHORIZED',
          };
        case 404:
          return {
            success: false,
            error: 'Utilisateur introuvable',
            code: 'NOT_FOUND',
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
        error: 'Problème de connexion',
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

  // Récupérer le profil utilisateur
  async getProfile() {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/users/profile`, {
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

      // Mettre à jour le cache local
      await SecureStorage.setUser(data.user || data);

      return {
        success: true,
        data: data.user || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Mettre à jour le profil
  async updateProfile(userData) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw {
          response: { status: response.status, data: await response.json() },
        };
      }

      const data = await response.json();

      // Mettre à jour le cache local
      await SecureStorage.setUser(data.user || data);

      return {
        success: true,
        data: data.user || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Upload photo de profil
  async uploadAvatar(imageUri) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      // Créer FormData pour l'upload
      const formData = new FormData();

      // Extraire le nom du fichier et le type
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout * 2); // Plus de temps pour l'upload

      const response = await fetch(`${this.baseURL}/users/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Ne pas définir Content-Type pour FormData, il sera automatique
        },
        body: formData,
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
        data: data.avatarUrl || data.avatar || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Récupérer les statistiques de l'utilisateur
  async getStats() {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/users/stats`, {
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
        data: data.stats || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Changer le mot de passe
  async changePassword(currentPassword, newPassword) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw {
          response: { status: response.status, data: await response.json() },
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Supprimer le compte
  async deleteAccount(password) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/users/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw {
          response: { status: response.status, data: await response.json() },
        };
      }

      // Nettoyer le stockage local
      await SecureStorage.clearAll();

      return {
        success: true,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }
}

export const userApi = new UserApiService();

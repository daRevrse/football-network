// ====== src/services/api/userApi.js ======
import { SecureStorage } from '../storage';
import { API_CONFIG } from '../../utils/constants';
import { setMyTeams } from '../../store/slices/teamsSlice';

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
        case 400:
          return {
            success: false,
            error: data.error || 'Données invalides',
            code: 'BAD_REQUEST',
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
      await SecureStorage.setUser(data);

      return {
        success: true,
        data: data,
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

      // Préparer les données - convertir les coordonnées si présentes
      const requestBody = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        bio: userData.bio,
        position: userData.position,
        skillLevel: userData.skillLevel,
        locationCity: userData.locationCity,
      };

      // Ajouter les coordonnées si disponibles
      if (userData.coordinates) {
        requestBody.coordinates = {
          lat: userData.coordinates.lat,
          lng: userData.coordinates.lng,
        };
      }

      const response = await fetch(`${this.baseURL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
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
      await SecureStorage.setUser(data);

      return {
        success: true,
        data: data,
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
      const timeoutId = setTimeout(() => controller.abort(), this.timeout * 3); // Plus de temps pour l'upload

      const response = await fetch(`${this.baseURL}/users/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Ne pas définir Content-Type pour FormData
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

      // Retourner l'URL de l'avatar
      return {
        success: true,
        data: data.avatarUrl || data.avatar || data.profilePicture,
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
        // Si l'endpoint n'existe pas encore, retourner des stats par défaut
        if (response.status === 404) {
          return {
            success: true,
            data: {
              totalMatches: 0,
              wins: 0,
              goals: 0,
              assists: 0,
            },
          };
        }

        throw {
          response: { status: response.status, data: await response.json() },
        };
      }

      const data = await response.json();

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      // En cas d'erreur, retourner des stats par défaut
      return {
        success: true,
        data: {
          totalMatches: 0,
          wins: 0,
          goals: 0,
          assists: 0,
        },
      };
    }
  }

  // Rechercher des utilisateurs
  async searchUsers(query, filters = {}) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      // Construire les paramètres de requête
      const params = new URLSearchParams({
        q: query,
        ...filters,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/users/search?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw {
          response: { status: response.status, data: await response.json() },
        };
      }

      const data = await response.json();

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Récupérer un utilisateur par ID
  async getUserById(userId) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/users/${userId}`, {
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
        data: data,
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
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
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

      return {
        success: true,
        message: 'Mot de passe modifié avec succès',
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
        const errorData = await response.json();
        throw {
          response: { status: response.status, data: errorData },
        };
      }

      // Nettoyer le stockage local
      await SecureStorage.clearAll();

      return {
        success: true,
        message: 'Compte supprimé avec succès',
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }
}

// Export singleton
export const UserApi = new UserApiService();

// ====== src/services/api/teamsApi.js ======
import { SecureStorage } from '../storage';
import { API_CONFIG } from '../../utils/constants';

class TeamsApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Gestion des erreurs API
  handleApiError(error) {
    console.error('Teams API Error:', error);

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          return {
            success: false,
            error: 'Session expirée, veuillez vous reconnecter',
            code: 'UNAUTHORIZED',
          };
        case 404:
          return {
            success: false,
            error: 'Équipe introuvable',
            code: 'NOT_FOUND',
          };
        case 403:
          return {
            success: false,
            error: "Vous n'avez pas les droits pour cette action",
            code: 'FORBIDDEN',
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

  // Récupérer mes équipes
  async getMyTeams() {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/teams/my-teams`, {
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
        data: data.teams || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Créer une équipe
  async createTeam(teamData) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(teamData),
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
        data: data.team || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Récupérer les détails d'une équipe
  async getTeamById(teamId) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/teams/${teamId}`, {
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
        data: data.team || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Mettre à jour une équipe
  async updateTeam(teamId, teamData) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(teamData),
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
        data: data.team || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Supprimer une équipe
  async deleteTeam(teamId) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/teams/${teamId}`, {
        method: 'DELETE',
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

      return {
        success: true,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Récupérer les membres d'une équipe
  async getTeamMembers(teamId) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/teams/${teamId}/members`, {
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
        data: data.members || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Inviter un joueur dans une équipe
  async invitePlayer(teamId, email) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/player-invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId, email }),
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
        data: data.invitation || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Retirer un membre d'une équipe
  async removeMember(teamId, userId) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/teams/${teamId}/members/${userId}`,
        {
          method: 'DELETE',
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

      return {
        success: true,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Changer le rôle d'un membre
  async updateMemberRole(teamId, userId, role) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/teams/${teamId}/members/${userId}/role`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role }),
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
        data: data.member || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Rechercher des équipes
  async searchTeams(filters = {}) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      // Construire les query params
      const queryParams = new URLSearchParams();
      if (filters.skillLevel)
        queryParams.append('skillLevel', filters.skillLevel);
      if (filters.distance) queryParams.append('distance', filters.distance);
      if (filters.locationCity)
        queryParams.append('city', filters.locationCity);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/teams/search?${queryParams.toString()}`,
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
        data: data.teams || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }
}

export const teamsApi = new TeamsApiService();

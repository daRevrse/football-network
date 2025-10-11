// ====== src/services/api/matchesApi.js ======
import { SecureStorage } from '../storage';
import { API_CONFIG } from '../../utils/constants';

class MatchesApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  handleApiError(error) {
    console.error('Matches API Error:', error);

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
            error: 'Match introuvable',
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

  // Récupérer tous les matchs
  async getMatches(params = {}) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.teamId) queryParams.append('teamId', params.teamId);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/matches?${queryParams.toString()}`,
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
        data: data.matches || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Créer un match
  async createMatch(matchData) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(matchData),
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
        data: data.match || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Récupérer les détails d'un match
  async getMatchById(matchId) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/matches/${matchId}`, {
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
        data: data.match || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Mettre à jour un match
  async updateMatch(matchId, matchData) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/matches/${matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(matchData),
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
        data: data.match || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Annuler un match
  async cancelMatch(matchId) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/matches/${matchId}/cancel`,
        {
          method: 'PATCH',
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

  // Récupérer les invitations
  async getInvitations() {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/match-invitations`, {
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
        data: data.invitations || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Répondre à une invitation
  async respondToInvitation(invitationId, response, message = null) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const apiResponse = await fetch(
        `${this.baseURL}/match-invitations/${invitationId}/respond`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ response, message }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!apiResponse.ok) {
        throw {
          response: {
            status: apiResponse.status,
            data: await apiResponse.json(),
          },
        };
      }

      const data = await apiResponse.json();

      return {
        success: true,
        data: data.invitation || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // Mettre à jour le score d'un match
  async updateScore(matchId, scoreData) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/matches/${matchId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(scoreData),
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
        data: data.match || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }
}

export const matchesApi = new MatchesApiService();

// ====== src/services/api/matchesApi.js - SERVICE API COMPLET ======
import { SecureStorage } from '../storage';
import { API_CONFIG } from '../../utils/constants';

class MatchesApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // ==================== GESTION DES ERREURS ====================
  handleApiError(error) {
    console.error('Matches API Error:', error);

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: "Délai d'attente dépassé",
        code: 'TIMEOUT',
      };
    }

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
        case 403:
          return {
            success: false,
            error: "Vous n'avez pas les droits pour cette action",
            code: 'FORBIDDEN',
          };
        case 404:
          return {
            success: false,
            error: 'Match introuvable',
            code: 'NOT_FOUND',
          };
        case 409:
          return {
            success: false,
            error: data.error || 'Conflit de données',
            code: 'CONFLICT',
          };
        case 422:
          return {
            success: false,
            error: data.error || 'Données invalides',
            code: 'VALIDATION_ERROR',
            details: data.details,
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

  // ==================== RÉCUPÉRATION DES MATCHS ====================

  /**
   * Récupérer mes matchs
   */
  async getMyMatches(filters = {}) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      // Construire les query params
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.offset) queryParams.append('offset', filters.offset);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/matches/my-matches?${queryParams.toString()}`,
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

  /**
   * Récupérer les détails d'un match
   */
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

  // ==================== CRÉATION ET MODIFICATION ====================

  /**
   * Créer un match
   */
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

  /**
   * Mettre à jour un match
   */
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

  /**
   * Mettre à jour le score d'un match
   */
  async updateMatchScore(matchId, team1Score, team2Score) {
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
        body: JSON.stringify({
          team1_score: team1Score,
          team2_score: team2Score,
        }),
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

  /**
   * Annuler un match
   */
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
          method: 'POST',
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

  /**
   * Supprimer un match
   */
  async deleteMatch(matchId) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/matches/${matchId}`, {
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

  // ==================== INVITATIONS ====================

  /**
   * Créer et envoyer une invitation de match directe
   */
  async createMatchInvitation(invitationData) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/matches/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invitationData),
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

  /**
   * Envoyer une invitation de match
   */
  async sendInvitation(matchId, teamId, message) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/matches/${matchId}/invitations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ team_id: teamId, message }),
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
        data: data.invitation || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Récupérer les invitations reçues
   */
  async getReceivedInvitations(status = 'all') {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const queryParams = new URLSearchParams();
      if (status !== 'all') queryParams.append('status', status);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${
          this.baseURL
        }/matches/invitations/received?${queryParams.toString()}`,
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
        data: data.invitations || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Récupérer les invitations envoyées
   */
  async getSentInvitations(status = 'all') {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const queryParams = new URLSearchParams();
      if (status !== 'all') queryParams.append('status', status);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/matches/invitations/sent?${queryParams.toString()}`,
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
        data: data.invitations || data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Répondre à une invitation
   */
  async respondToInvitation(invitationId, response) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const apiResponse = await fetch(
        `${this.baseURL}/matches/invitations/${invitationId}/respond`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ response }),
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

  /**
   * Annuler une invitation envoyée
   */
  async cancelInvitation(invitationId) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/matches/invitations/${invitationId}`,
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

  // ==================== RECHERCHE ET FILTRES ====================

  /**
   * Rechercher des matchs
   */
  async searchMatches(filters = {}) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const queryParams = new URLSearchParams();
      if (filters.date) queryParams.append('date', filters.date);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.teamId) queryParams.append('teamId', filters.teamId);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.offset) queryParams.append('offset', filters.offset);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/matches/search?${queryParams.toString()}`,
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

  /**
   * Récupérer les matchs à venir
   */
  async getUpcomingMatches(limit = 10) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        return { success: false, error: 'Non authentifié' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/matches/upcoming?limit=${limit}`,
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
}

// Export une instance unique (singleton)
export const matchesApi = new MatchesApiService();

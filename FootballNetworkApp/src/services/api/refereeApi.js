// ====== src/services/api/refereeApi.js - SERVICE API ARBITRE ======
import { SecureStorage } from '../storage';
import { API_CONFIG } from '../../utils/constants';

class RefereeApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  handleApiError(error) {
    console.error('Referee API Error:', error);

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
          return { success: false, error: 'Session expirée', code: 'UNAUTHORIZED' };
        case 403:
          return { success: false, error: "Vous n'avez pas les droits", code: 'FORBIDDEN' };
        case 404:
          return { success: false, error: 'Ressource introuvable', code: 'NOT_FOUND' };
        default:
          return { success: false, error: data.error || 'Erreur serveur', code: 'UNKNOWN' };
      }
    }

    return { success: false, error: 'Erreur de connexion', code: 'NETWORK_ERROR' };
  }

  /**
   * Récupérer les détails complets d'un match pour l'arbitre
   */
  async getMatchDetails(matchId) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) return { success: false, error: 'Non authentifié' };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/referee/${matchId}/details`,
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
        throw { response: { status: response.status, data: await response.json() } };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Récupérer la fiche de match imprimable
   */
  async getMatchSheet(matchId) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) return { success: false, error: 'Non authentifié' };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/referee/${matchId}/match-sheet`,
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
        throw { response: { status: response.status, data: await response.json() } };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Enregistrer un rapport de match
   */
  async saveMatchReport(matchId, reportData) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) return { success: false, error: 'Non authentifié' };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/referee/${matchId}/report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(reportData),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw { response: { status: response.status, data: await response.json() } };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Soumettre le rapport final
   */
  async submitMatchReport(matchId) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) return { success: false, error: 'Non authentifié' };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/referee/${matchId}/submit-report`,
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
        throw { response: { status: response.status, data: await response.json() } };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Enregistrer un but
   */
  async recordGoal(matchId, goalData) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) return { success: false, error: 'Non authentifié' };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/referee/${matchId}/goals`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(goalData),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw { response: { status: response.status, data: await response.json() } };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Signaler un incident (carton, blessure, etc.)
   */
  async reportIncident(matchId, incidentData) {
    try {
      const token = await SecureStorage.getToken();
      if (!token) return { success: false, error: 'Non authentifié' };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseURL}/referee/${matchId}/report-incident`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(incidentData),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw { response: { status: response.status, data: await response.json() } };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return this.handleApiError(error);
    }
  }
}

// Export une instance unique (singleton)
export const refereeApi = new RefereeApiService();

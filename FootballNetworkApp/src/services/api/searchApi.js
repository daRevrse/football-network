// ====== src/services/api/searchApi.js ======
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../utils/constants/api';

// Instance Axios avec configuration de base
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  error => {
    return Promise.reject(error);
  },
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token invalide ou expiré
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      // Navigation vers Login pourrait être gérée ici
    }
    return Promise.reject(error);
  },
);

/**
 * API de recherche
 */
export const searchApi = {
  /**
   * Recherche globale
   * @param {string} query - Terme de recherche
   * @param {string} type - Type de recherche ('all', 'teams', 'players', 'matches')
   * @returns {Promise} - Résultats de recherche
   */
  search: async (query, type = 'all') => {
    try {
      const response = await api.get('/search', {
        params: {
          q: query,
          type: type,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw error;
    }
  },

  /**
   * Récupérer des suggestions de recherche
   * @returns {Promise} - Suggestions de recherche
   */
  getSuggestions: async () => {
    try {
      const response = await api.get('/search/suggestions');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions:', error);
      throw error;
    }
  },

  /**
   * Recherche d'équipes uniquement
   * @param {string} query - Terme de recherche
   * @returns {Promise} - Résultats des équipes
   */
  searchTeams: async query => {
    try {
      const response = await api.get('/search', {
        params: {
          q: query,
          type: 'teams',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche d\'équipes:', error);
      throw error;
    }
  },

  /**
   * Recherche de joueurs uniquement
   * @param {string} query - Terme de recherche
   * @returns {Promise} - Résultats des joueurs
   */
  searchPlayers: async query => {
    try {
      const response = await api.get('/search', {
        params: {
          q: query,
          type: 'players',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de joueurs:', error);
      throw error;
    }
  },

  /**
   * Recherche de matchs uniquement
   * @param {string} query - Terme de recherche
   * @returns {Promise} - Résultats des matchs
   */
  searchMatches: async query => {
    try {
      const response = await api.get('/search', {
        params: {
          q: query,
          type: 'matches',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de matchs:', error);
      throw error;
    }
  },
};

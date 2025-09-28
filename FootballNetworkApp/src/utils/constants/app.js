// ====== src/utils/constants/app.js ======
// Constantes de l'application
export const APP_NAME = 'Football Network';
export const APP_VERSION = '1.0.0';

// Niveaux de compétence des équipes
export const TEAM_SKILL_LEVELS = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
  { value: 'expert', label: 'Expert' },
];

// Types de matchs
export const MATCH_TYPES = [
  { value: 'friendly', label: 'Match amical' },
  { value: 'league', label: 'Championnat' },
  { value: 'cup', label: 'Coupe' },
  { value: 'tournament', label: 'Tournoi' },
];

// Statuts des matchs
export const MATCH_STATUSES = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'ongoing', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
];

// Types de notifications
export const NOTIFICATION_TYPES = {
  MATCH_INVITATION: 'match_invitation',
  PLAYER_INVITATION: 'player_invitation',
  MATCH_UPDATE: 'match_update',
  TEAM_UPDATE: 'team_update',
  GENERAL: 'general',
};

// Distances de recherche (en km)
export const SEARCH_DISTANCES = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 15, label: '15 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
];

// Types de terrain
export const FIELD_TYPES = [
  { value: 'grass', label: 'Herbe naturelle' },
  { value: 'artificial', label: 'Synthétique' },
  { value: 'indoor', label: 'Salle' },
  { value: 'concrete', label: 'Béton' },
];

// Positions des joueurs
export const PLAYER_POSITIONS = [
  { value: 'goalkeeper', label: 'Gardien' },
  { value: 'defender', label: 'Défenseur' },
  { value: 'midfielder', label: 'Milieu' },
  { value: 'forward', label: 'Attaquant' },
  { value: 'versatile', label: 'Polyvalent' },
];

// Régions/Villes principales (à adapter selon votre zone)
export const CITIES = [
  { value: 'paris', label: 'Paris' },
  { value: 'lyon', label: 'Lyon' },
  { value: 'marseille', label: 'Marseille' },
  { value: 'toulouse', label: 'Toulouse' },
  { value: 'nice', label: 'Nice' },
  { value: 'nantes', label: 'Nantes' },
  { value: 'montpellier', label: 'Montpellier' },
  { value: 'strasbourg', label: 'Strasbourg' },
  { value: 'bordeaux', label: 'Bordeaux' },
  { value: 'lille', label: 'Lille' },
];

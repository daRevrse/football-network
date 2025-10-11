// ====== src/utils/dateUtils.js ======

/**
 * Formater une date en format lisible
 * @param {string|Date} date - La date à formater
 * @param {string} format - Le format souhaité ('short', 'long', 'full', 'time')
 * @returns {string} La date formatée
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  const options = {
    short: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  };

  return dateObj.toLocaleDateString('fr-FR', options[format] || options.short);
};

/**
 * Formater une date de manière relative (il y a X jours/heures)
 */
export const formatRelativeDate = date => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now - dateObj;

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffWeeks === 1) return 'Il y a 1 semaine';
  if (diffWeeks < 4) return `Il y a ${diffWeeks} semaines`;
  if (diffMonths === 1) return 'Il y a 1 mois';
  if (diffMonths < 12) return `Il y a ${diffMonths} mois`;
  if (diffYears === 1) return 'Il y a 1 an';
  return `Il y a ${diffYears} ans`;
};

/**
 * Formater l'heure
 */
export const formatTime = date => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  return dateObj.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formater une durée en heures et minutes
 */
export const formatDuration = minutes => {
  if (!minutes || minutes < 0) return '0 min';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

/**
 * Obtenir le jour de la semaine
 */
export const getDayOfWeek = date => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  return dateObj.toLocaleDateString('fr-FR', { weekday: 'long' });
};

/**
 * Vérifier si une date est aujourd'hui
 */
export const isToday = date => {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};

/**
 * Vérifier si une date est demain
 */
export const isTomorrow = date => {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    dateObj.getDate() === tomorrow.getDate() &&
    dateObj.getMonth() === tomorrow.getMonth() &&
    dateObj.getFullYear() === tomorrow.getFullYear()
  );
};

/**
 * Vérifier si une date est dans le passé
 */
export const isPast = date => {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
};

/**
 * Vérifier si une date est dans le futur
 */
export const isFuture = date => {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
};

/**
 * Obtenir la date du début de la journée
 */
export const startOfDay = date => {
  const dateObj = date ? new Date(date) : new Date();
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
};

/**
 * Obtenir la date de fin de la journée
 */
export const endOfDay = date => {
  const dateObj = date ? new Date(date) : new Date();
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
};

/**
 * Ajouter des jours à une date
 */
export const addDays = (date, days) => {
  const dateObj = date ? new Date(date) : new Date();
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};

/**
 * Ajouter des heures à une date
 */
export const addHours = (date, hours) => {
  const dateObj = date ? new Date(date) : new Date();
  dateObj.setHours(dateObj.getHours() + hours);
  return dateObj;
};

/**
 * Ajouter des minutes à une date
 */
export const addMinutes = (date, minutes) => {
  const dateObj = date ? new Date(date) : new Date();
  dateObj.setMinutes(dateObj.getMinutes() + minutes);
  return dateObj;
};

/**
 * Obtenir la différence en jours entre deux dates
 */
export const getDaysDifference = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Obtenir l'âge depuis une date de naissance
 */
export const getAge = birthDate => {
  if (!birthDate) return null;

  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Formater une plage de dates
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // Même jour
  if (
    start.getDate() === end.getDate() &&
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${formatDate(start, 'short')} de ${formatTime(
      start,
    )} à ${formatTime(end)}`;
  }

  // Jours différents
  return `Du ${formatDate(start, 'short')} au ${formatDate(end, 'short')}`;
};

/**
 * Obtenir le nombre de jours dans un mois
 */
export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Obtenir le premier jour du mois
 */
export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1);
};

/**
 * Obtenir le dernier jour du mois
 */
export const getLastDayOfMonth = (year, month) => {
  return new Date(year, month + 1, 0);
};

/**
 * Formater une date pour l'affichage de match
 */
export const formatMatchDate = date => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isToday(dateObj)) {
    return `Aujourd'hui à ${formatTime(dateObj)}`;
  }

  if (isTomorrow(dateObj)) {
    return `Demain à ${formatTime(dateObj)}`;
  }

  const daysDiff = getDaysDifference(new Date(), dateObj);

  if (daysDiff <= 7) {
    return `${getDayOfWeek(dateObj)} à ${formatTime(dateObj)}`;
  }

  return `${formatDate(dateObj, 'short')} à ${formatTime(dateObj)}`;
};

/**
 * Vérifier si une date est dans la semaine courante
 */
export const isThisWeek = date => {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return dateObj >= startOfWeek && dateObj <= endOfWeek;
};

/**
 * Vérifier si une date est dans le mois courant
 */
export const isThisMonth = date => {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  return (
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear()
  );
};

/**
 * Convertir une date au format ISO
 */
export const toISOString = date => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString();
};

/**
 * Parser une date depuis un string ISO
 */
export const parseISODate = isoString => {
  if (!isoString) return null;

  return new Date(isoString);
};

// Export de toutes les fonctions
export default {
  formatDate,
  formatRelativeDate,
  formatTime,
  formatDuration,
  getDayOfWeek,
  isToday,
  isTomorrow,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  addDays,
  addHours,
  addMinutes,
  getDaysDifference,
  getAge,
  formatDateRange,
  getDaysInMonth,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  formatMatchDate,
  isThisWeek,
  isThisMonth,
  toISOString,
  parseISODate,
};

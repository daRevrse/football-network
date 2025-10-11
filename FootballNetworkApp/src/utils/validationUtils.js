// ====== src/utils/validationUtils.js ======

/**
 * Valider une adresse email
 */
export const validateEmail = email => {
  if (!email) {
    return { isValid: false, error: 'Email requis' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Email invalide' };
  }

  return { isValid: true };
};

/**
 * Valider un mot de passe
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false,
  } = options;

  if (!password) {
    return { isValid: false, error: 'Mot de passe requis' };
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      error: `Le mot de passe doit contenir au moins ${minLength} caractères`,
    };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Le mot de passe doit contenir au moins une majuscule',
    };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: 'Le mot de passe doit contenir au moins une minuscule',
    };
  }

  if (requireNumbers && !/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: 'Le mot de passe doit contenir au moins un chiffre',
    };
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      error: 'Le mot de passe doit contenir au moins un caractère spécial',
    };
  }

  return { isValid: true };
};

/**
 * Valider un numéro de téléphone
 */
export const validatePhone = phone => {
  if (!phone) {
    return { isValid: false, error: 'Numéro de téléphone requis' };
  }

  // Accepte les formats: +33612345678, 0612345678, 06 12 34 56 78, etc.
  const phoneRegex = /^[\d\s\+\-\(\)]+$/;

  if (!phoneRegex.test(phone)) {
    return { isValid: false, error: 'Numéro de téléphone invalide' };
  }

  // Vérifier qu'il y a au moins 10 chiffres
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return {
      isValid: false,
      error: 'Le numéro doit contenir au moins 10 chiffres',
    };
  }

  return { isValid: true };
};

/**
 * Valider un nom (prénom ou nom de famille)
 */
export const validateName = (name, fieldName = 'Nom') => {
  if (!name) {
    return { isValid: false, error: `${fieldName} requis` };
  }

  if (name.trim().length < 2) {
    return {
      isValid: false,
      error: `${fieldName} doit contenir au moins 2 caractères`,
    };
  }

  if (name.length > 50) {
    return {
      isValid: false,
      error: `${fieldName} ne peut pas dépasser 50 caractères`,
    };
  }

  // Vérifier que le nom contient uniquement des lettres, espaces, tirets, apostrophes
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
  if (!nameRegex.test(name)) {
    return {
      isValid: false,
      error: `${fieldName} contient des caractères invalides`,
    };
  }

  return { isValid: true };
};

/**
 * Valider une date de naissance
 */
export const validateBirthDate = date => {
  if (!date) {
    return { isValid: false, error: 'Date de naissance requise' };
  }

  const birthDate = new Date(date);
  const today = new Date();

  // Vérifier que la date est valide
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, error: 'Date invalide' };
  }

  // Vérifier que la date n'est pas dans le futur
  if (birthDate > today) {
    return { isValid: false, error: 'La date ne peut pas être dans le futur' };
  }

  // Calculer l'âge
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  let finalAge = age;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    finalAge--;
  }

  // Vérifier l'âge minimum (13 ans)
  if (finalAge < 13) {
    return {
      isValid: false,
      error: 'Vous devez avoir au moins 13 ans',
    };
  }

  // Vérifier l'âge maximum (120 ans)
  if (finalAge > 120) {
    return { isValid: false, error: 'Date de naissance invalide' };
  }

  return { isValid: true, age: finalAge };
};

/**
 * Valider une biographie
 */
export const validateBio = (bio, maxLength = 500) => {
  if (!bio) {
    return { isValid: true }; // La bio est optionnelle
  }

  if (bio.length > maxLength) {
    return {
      isValid: false,
      error: `La biographie ne peut pas dépasser ${maxLength} caractères`,
    };
  }

  return { isValid: true };
};

/**
 * Valider une ville
 */
export const validateCity = city => {
  if (!city) {
    return { isValid: true }; // La ville est optionnelle
  }

  if (city.length < 2) {
    return {
      isValid: false,
      error: 'Le nom de la ville doit contenir au moins 2 caractères',
    };
  }

  if (city.length > 100) {
    return {
      isValid: false,
      error: 'Le nom de la ville ne peut pas dépasser 100 caractères',
    };
  }

  return { isValid: true };
};

/**
 * Valider un nom d'équipe
 */
export const validateTeamName = name => {
  if (!name) {
    return { isValid: false, error: "Nom de l'équipe requis" };
  }

  if (name.trim().length < 3) {
    return {
      isValid: false,
      error: 'Le nom doit contenir au moins 3 caractères',
    };
  }

  if (name.length > 50) {
    return {
      isValid: false,
      error: 'Le nom ne peut pas dépasser 50 caractères',
    };
  }

  return { isValid: true };
};

/**
 * Valider une URL
 */
export const validateUrl = url => {
  if (!url) {
    return { isValid: true }; // L'URL est optionnelle
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'URL invalide' };
  }
};

/**
 * Valider un nombre de joueurs
 */
export const validatePlayerCount = (count, min = 5, max = 30) => {
  if (!count) {
    return { isValid: false, error: 'Nombre de joueurs requis' };
  }

  const numCount = parseInt(count, 10);

  if (isNaN(numCount)) {
    return { isValid: false, error: 'Nombre invalide' };
  }

  if (numCount < min) {
    return {
      isValid: false,
      error: `Minimum ${min} joueurs requis`,
    };
  }

  if (numCount > max) {
    return {
      isValid: false,
      error: `Maximum ${max} joueurs autorisés`,
    };
  }

  return { isValid: true };
};

/**
 * Valider une position de joueur
 */
export const validatePosition = position => {
  const validPositions = [
    'goalkeeper',
    'defender',
    'midfielder',
    'forward',
    'any',
  ];

  if (!position) {
    return { isValid: true }; // La position est optionnelle
  }

  if (!validPositions.includes(position)) {
    return { isValid: false, error: 'Position invalide' };
  }

  return { isValid: true };
};

/**
 * Valider un niveau de compétence
 */
export const validateSkillLevel = level => {
  const validLevels = [
    'beginner',
    'amateur',
    'intermediate',
    'advanced',
    'semi_pro',
  ];

  if (!level) {
    return { isValid: true }; // Le niveau est optionnel
  }

  if (!validLevels.includes(level)) {
    return { isValid: false, error: 'Niveau invalide' };
  }

  return { isValid: true };
};

/**
 * Valider un profil complet
 */
export const validateProfile = profileData => {
  const errors = {};

  // Validation du prénom
  const firstNameValidation = validateName(profileData.firstName, 'Prénom');
  if (!firstNameValidation.isValid) {
    errors.firstName = firstNameValidation.error;
  }

  // Validation du nom
  const lastNameValidation = validateName(profileData.lastName, 'Nom');
  if (!lastNameValidation.isValid) {
    errors.lastName = lastNameValidation.error;
  }

  // Validation du téléphone (optionnel)
  if (profileData.phone) {
    const phoneValidation = validatePhone(profileData.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error;
    }
  }

  // Validation de la date de naissance (optionnelle)
  if (profileData.birthDate) {
    const birthDateValidation = validateBirthDate(profileData.birthDate);
    if (!birthDateValidation.isValid) {
      errors.birthDate = birthDateValidation.error;
    }
  }

  // Validation de la bio (optionnelle)
  if (profileData.bio) {
    const bioValidation = validateBio(profileData.bio);
    if (!bioValidation.isValid) {
      errors.bio = bioValidation.error;
    }
  }

  // Validation de la position (optionnelle)
  if (profileData.position) {
    const positionValidation = validatePosition(profileData.position);
    if (!positionValidation.isValid) {
      errors.position = positionValidation.error;
    }
  }

  // Validation du niveau (optionnel)
  if (profileData.skillLevel) {
    const skillValidation = validateSkillLevel(profileData.skillLevel);
    if (!skillValidation.isValid) {
      errors.skillLevel = skillValidation.error;
    }
  }

  // Validation de la ville (optionnelle)
  if (profileData.locationCity) {
    const cityValidation = validateCity(profileData.locationCity);
    if (!cityValidation.isValid) {
      errors.locationCity = cityValidation.error;
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return { isValid, errors };
};

/**
 * Sanitizer pour éviter les injections XSS
 */
export const sanitizeInput = input => {
  if (!input) return '';

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Vérifier la force d'un mot de passe
 */
export const getPasswordStrength = password => {
  if (!password) return { strength: 0, label: 'Aucun' };

  let strength = 0;

  // Longueur
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Complexité
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

  const labels = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Fort', 'Très fort'];

  return {
    strength,
    label: labels[Math.min(strength, 5)],
    percentage: (strength / 6) * 100,
  };
};

// Export de toutes les fonctions
export default {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validateBirthDate,
  validateBio,
  validateCity,
  validateTeamName,
  validateUrl,
  validatePlayerCount,
  validatePosition,
  validateSkillLevel,
  validateProfile,
  sanitizeInput,
  getPasswordStrength,
};

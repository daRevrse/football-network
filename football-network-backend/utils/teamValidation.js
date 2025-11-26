const db = require('../config/database');

/**
 * Vérifie qu'une équipe a le nombre minimum de joueurs actifs
 * @param {number} teamId - ID de l'équipe
 * @param {number} minPlayers - Nombre minimum requis (défaut: 6)
 * @returns {Promise<{isValid: boolean, playersCount: number, message: string}>}
 */
async function validateTeamPlayerCount(teamId, minPlayers = 6) {
  try {
    const [result] = await db.execute(
      `SELECT COUNT(*) as players_count
       FROM team_members
       WHERE team_id = ? AND is_active = true`,
      [teamId]
    );

    const playersCount = result[0].players_count;
    const isValid = playersCount >= minPlayers;

    return {
      isValid,
      playersCount,
      message: isValid
        ? `Équipe valide avec ${playersCount} joueurs`
        : `Équipe invalide: ${playersCount} joueur(s), minimum ${minPlayers} requis`
    };
  } catch (error) {
    console.error('Error validating team player count:', error);
    throw error;
  }
}

/**
 * Enregistre une validation dans la table team_match_validations
 * @param {object} validation - Données de validation
 */
async function logTeamValidation(validation) {
  try {
    await db.execute(
      `INSERT INTO team_match_validations
       (team_id, match_id, invitation_id, validation_type, players_count, minimum_required, is_valid, validated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        validation.teamId,
        validation.matchId || null,
        validation.invitationId || null,
        validation.validationType,
        validation.playersCount,
        validation.minimumRequired || 6,
        validation.isValid,
        validation.validatedBy || null
      ]
    );
  } catch (error) {
    console.error('Error logging team validation:', error);
    // Non-bloquant, on continue même si le log échoue
  }
}

/**
 * Valide les deux équipes pour un match
 * @param {number} team1Id - ID première équipe
 * @param {number} team2Id - ID deuxième équipe
 * @param {number} minPlayers - Nombre minimum requis
 * @returns {Promise<{isValid: boolean, team1: object, team2: object}>}
 */
async function validateBothTeams(team1Id, team2Id, minPlayers = 6) {
  const team1Validation = await validateTeamPlayerCount(team1Id, minPlayers);
  const team2Validation = await validateTeamPlayerCount(team2Id, minPlayers);

  return {
    isValid: team1Validation.isValid && team2Validation.isValid,
    team1: team1Validation,
    team2: team2Validation
  };
}

module.exports = {
  validateTeamPlayerCount,
  logTeamValidation,
  validateBothTeams
};

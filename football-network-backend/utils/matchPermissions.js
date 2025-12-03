const db = require("../config/database");

/**
 * Vérifie si un utilisateur est manager de l'équipe domicile d'un match
 * @param {number} userId - ID de l'utilisateur
 * @param {number} matchId - ID du match
 * @returns {Promise<Object>} { isManager: boolean, teamId: number|null, match: Object|null }
 */
async function isHomeTeamManager(userId, matchId) {
  try {
    const [matches] = await db.execute(
      `SELECT m.*, ht.captain_id as home_captain_id
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       WHERE m.id = ?`,
      [matchId]
    );

    if (matches.length === 0) {
      return { isManager: false, teamId: null, match: null };
    }

    const match = matches[0];

    // Vérifier si l'utilisateur est manager de l'équipe domicile
    const [membership] = await db.execute(
      `SELECT team_id, role
       FROM team_members
       WHERE user_id = ? AND team_id = ? AND role = 'manager' AND is_active = true`,
      [userId, match.home_team_id]
    );

    return {
      isManager: membership.length > 0,
      teamId: match.home_team_id,
      match: match
    };
  } catch (error) {
    console.error("Error checking home team manager:", error);
    return { isManager: false, teamId: null, match: null };
  }
}

/**
 * Vérifie si un utilisateur est manager d'une des deux équipes d'un match
 * @param {number} userId - ID de l'utilisateur
 * @param {number} matchId - ID du match
 * @returns {Promise<Object>} { isManager: boolean, teamId: number|null, teamType: 'home'|'away'|null, match: Object|null }
 */
async function isMatchTeamManager(userId, matchId) {
  try {
    const [matches] = await db.execute(
      `SELECT m.*,
              ht.captain_id as home_captain_id,
              at.captain_id as away_captain_id
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       WHERE m.id = ?`,
      [matchId]
    );

    if (matches.length === 0) {
      return { isManager: false, teamId: null, teamType: null, match: null };
    }

    const match = matches[0];

    // Vérifier si l'utilisateur est manager d'une des deux équipes
    const [membership] = await db.execute(
      `SELECT team_id, role
       FROM team_members
       WHERE user_id = ?
       AND (team_id = ? OR team_id = ?)
       AND role = 'manager'
       AND is_active = true`,
      [userId, match.home_team_id, match.away_team_id || 0]
    );

    if (membership.length === 0) {
      return { isManager: false, teamId: null, teamType: null, match: match };
    }

    const teamType = membership[0].team_id === match.home_team_id ? 'home' : 'away';

    return {
      isManager: true,
      teamId: membership[0].team_id,
      teamType: teamType,
      match: match
    };
  } catch (error) {
    console.error("Error checking match team manager:", error);
    return { isManager: false, teamId: null, teamType: null, match: null };
  }
}

/**
 * Vérifie si un utilisateur peut gérer un match (manager de l'équipe domicile uniquement)
 * @param {number} userId - ID de l'utilisateur
 * @param {number} matchId - ID du match
 * @returns {Promise<Object>} { canManage: boolean, role: 'manager'|null, match: Object|null }
 */
async function canManageMatch(userId, matchId) {
  try {
    const [matches] = await db.execute(
      `SELECT m.* FROM matches m WHERE m.id = ?`,
      [matchId]
    );

    if (matches.length === 0) {
      return { canManage: false, role: null, match: null };
    }

    const match = matches[0];

    // Vérifier si l'utilisateur est manager de l'équipe domicile
    const [membership] = await db.execute(
      `SELECT team_id, role
       FROM team_members
       WHERE user_id = ? AND team_id = ? AND role = 'manager' AND is_active = true`,
      [userId, match.home_team_id]
    );

    if (membership.length > 0) {
      return { canManage: true, role: 'manager', match: match };
    }

    return { canManage: false, role: null, match: match };
  } catch (error) {
    console.error("Error checking match management permission:", error);
    return { canManage: false, role: null, match: null };
  }
}

module.exports = {
  isHomeTeamManager,
  isMatchTeamManager,
  canManageMatch
};

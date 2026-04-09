const db = require('../config/database');

/**
 * Service de gestion automatique des statistiques
 * Calcule et met à jour les stats après validation d'un match
 */
class MatchStatisticsService {
  /**
   * Calculer toutes les statistiques pour un match
   * Appelé automatiquement après validation du score
   */
  async calculateMatchStatistics(matchId) {
    try {
      console.log(`📊 Calculating statistics for match ${matchId}...`);

      // Récupérer les infos du match
      const [matches] = await db.execute(
        `SELECT
          m.*,
          ht.id as home_team_id,
          at.id as away_team_id
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         LEFT JOIN teams at ON m.away_team_id = at.id
         WHERE m.id = ? AND m.status = 'completed'`,
        [matchId]
      );

      if (matches.length === 0) {
        console.log(`⚠️ Match ${matchId} not found or not completed`);
        return;
      }

      const match = matches[0];

      // Calculer les stats du match
      await this.calculateMatchTeamStatistics(match);

      // Calculer les stats des joueurs participants
      await this.calculatePlayerMatchStatistics(match);

      // Mettre à jour les stats de saison
      await this.updateSeasonStatistics(match);

      // Mettre à jour les stats de cartons si des incidents ont été rapportés
      await this.updatePlayerCardStatistics(matchId);

      console.log(`✅ Statistics calculated successfully for match ${matchId}`);

    } catch (error) {
      console.error('Calculate match statistics error:', error);
      throw error;
    }
  }

  /**
   * Calculer les stats par équipe pour un match
   */
  async calculateMatchTeamStatistics(match) {
    const homeScore = match.home_score || 0;
    const awayScore = match.away_score || 0;

    // Déterminer le résultat pour chaque équipe
    let homeResult, awayResult;
    if (homeScore > awayScore) {
      homeResult = 'win';
      awayResult = 'loss';
    } else if (homeScore < awayScore) {
      homeResult = 'loss';
      awayResult = 'win';
    } else {
      homeResult = 'draw';
      awayResult = 'draw';
    }

    // Stats équipe domicile
    await db.execute(
      `INSERT INTO match_statistics
       (match_id, team_id, goals_scored, goals_conceded, result, clean_sheet)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         goals_scored = VALUES(goals_scored),
         goals_conceded = VALUES(goals_conceded),
         result = VALUES(result),
         clean_sheet = VALUES(clean_sheet),
         updated_at = NOW()`,
      [match.id, match.home_team_id, homeScore, awayScore, homeResult, awayScore === 0]
    );

    // Stats équipe extérieure (si existe)
    if (match.away_team_id) {
      await db.execute(
        `INSERT INTO match_statistics
         (match_id, team_id, goals_scored, goals_conceded, result, clean_sheet)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           goals_scored = VALUES(goals_scored),
           goals_conceded = VALUES(goals_conceded),
           result = VALUES(result),
           clean_sheet = VALUES(clean_sheet),
           updated_at = NOW()`,
        [match.id, match.away_team_id, awayScore, homeScore, awayResult, homeScore === 0]
      );
    }

    console.log(`✅ Match team stats recorded: ${homeResult} for home, ${awayResult} for away`);
  }

  /**
   * Calculer les stats des joueurs pour un match
   * Basé sur les participations confirmées
   */
  async calculatePlayerMatchStatistics(match) {
    // Récupérer tous les joueurs qui ont participé au match
    const [participants] = await db.execute(
      `SELECT
         mp.user_id,
         mp.team_id,
         mp.status
       FROM match_participations mp
       WHERE mp.match_id = ? AND mp.status = 'confirmed'`,
      [match.id]
    );

    // Durée standard du match (120 minutes)
    const matchDuration = match.duration_minutes || 120;

    for (const participant of participants) {
      // Récupérer les incidents pour ce joueur (cartons, buts, etc.)
      const [incidents] = await db.execute(
        `SELECT incident_type
         FROM match_incidents
         WHERE match_id = ? AND player_id = ?`,
        [match.id, participant.user_id]
      );

      let yellowCards = 0;
      let redCards = 0;

      incidents.forEach(incident => {
        if (incident.incident_type === 'yellow_card') yellowCards++;
        if (incident.incident_type === 'red_card') redCards++;
      });

      // Insérer/mettre à jour les stats du joueur
      await db.execute(
        `INSERT INTO player_match_statistics
         (match_id, player_id, team_id, minutes_played, yellow_cards, red_cards, participated)
         VALUES (?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           minutes_played = VALUES(minutes_played),
           yellow_cards = VALUES(yellow_cards),
           red_cards = VALUES(red_cards),
           updated_at = NOW()`,
        [match.id, participant.user_id, participant.team_id, matchDuration, yellowCards, redCards]
      );
    }

    console.log(`✅ Player match stats recorded for ${participants.length} players`);
  }

  /**
   * Mettre à jour les statistiques de saison agrégées
   */
  async updateSeasonStatistics(match) {
    const season = this.getCurrentSeason();
    const homeScore = match.home_score || 0;
    const awayScore = match.away_score || 0;

    // Mise à jour stats équipe domicile
    await this.updateTeamSeasonStats(
      match.home_team_id,
      season,
      homeScore,
      awayScore
    );

    // Mise à jour stats équipe extérieure
    if (match.away_team_id) {
      await this.updateTeamSeasonStats(
        match.away_team_id,
        season,
        awayScore,
        homeScore
      );
    }

    // Mise à jour stats joueurs
    await this.updatePlayersSeasonStats(match.id, season);

    console.log(`✅ Season statistics updated for season ${season}`);
  }

  /**
   * Mettre à jour les stats de saison d'une équipe
   */
  async updateTeamSeasonStats(teamId, season, goalsScored, goalsConceded) {
    let matchResult;
    if (goalsScored > goalsConceded) {
      matchResult = { won: 1, drawn: 0, lost: 0 };
    } else if (goalsScored < goalsConceded) {
      matchResult = { won: 0, drawn: 0, lost: 1 };
    } else {
      matchResult = { won: 0, drawn: 1, lost: 0 };
    }

    const cleanSheet = goalsConceded === 0 ? 1 : 0;

    await db.execute(
      `INSERT INTO team_season_statistics
       (team_id, season, matches_played, matches_won, matches_drawn, matches_lost,
        goals_for, goals_against, clean_sheets)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         matches_played = matches_played + 1,
         matches_won = matches_won + VALUES(matches_won),
         matches_drawn = matches_drawn + VALUES(matches_drawn),
         matches_lost = matches_lost + VALUES(matches_lost),
         goals_for = goals_for + VALUES(goals_for),
         goals_against = goals_against + VALUES(goals_against),
         clean_sheets = clean_sheets + VALUES(clean_sheets),
         last_updated = NOW()`,
      [teamId, season, matchResult.won, matchResult.drawn, matchResult.lost,
       goalsScored, goalsConceded, cleanSheet]
    );
  }

  /**
   * Mettre à jour les stats de saison des joueurs
   */
  async updatePlayersSeasonStats(matchId, season) {
    // Récupérer les stats de match de tous les joueurs
    const [playerStats] = await db.execute(
      `SELECT player_id, team_id, minutes_played, goals, assists, yellow_cards, red_cards
       FROM player_match_statistics
       WHERE match_id = ?`,
      [matchId]
    );

    for (const stats of playerStats) {
      await db.execute(
        `INSERT INTO player_season_statistics
         (player_id, team_id, season, matches_played, goals, assists,
          minutes_played, yellow_cards, red_cards)
         VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           matches_played = matches_played + 1,
           goals = goals + VALUES(goals),
           assists = assists + VALUES(assists),
           minutes_played = minutes_played + VALUES(minutes_played),
           yellow_cards = yellow_cards + VALUES(yellow_cards),
           red_cards = red_cards + VALUES(red_cards),
           last_updated = NOW()`,
        [stats.player_id, stats.team_id, season,
         stats.goals || 0, stats.assists || 0, stats.minutes_played || 0,
         stats.yellow_cards || 0, stats.red_cards || 0]
      );
    }
  }

  /**
   * Mettre à jour les stats de cartons depuis les incidents
   */
  async updatePlayerCardStatistics(matchId) {
    const season = this.getCurrentSeason();

    // Récupérer tous les cartons du match
    const [incidents] = await db.execute(
      `SELECT player_id, team_id, incident_type, reported_at
       FROM match_incidents
       WHERE match_id = ? AND incident_type IN ('yellow_card', 'red_card')`,
      [matchId]
    );

    for (const incident of incidents) {
      if (!incident.player_id) continue;

      const yellowCard = incident.incident_type === 'yellow_card' ? 1 : 0;
      const redCard = incident.incident_type === 'red_card' ? 1 : 0;

      await db.execute(
        `INSERT INTO player_card_statistics
         (player_id, team_id, season, yellow_cards, red_cards, total_matches_played, last_card_date)
         VALUES (?, ?, ?, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
           yellow_cards = yellow_cards + VALUES(yellow_cards),
           red_cards = red_cards + VALUES(red_cards),
           last_card_date = VALUES(last_card_date),
           updated_at = NOW()`,
        [incident.player_id, incident.team_id, season, yellowCard, redCard, incident.reported_at]
      );
    }
  }

  /**
   * Obtenir la saison courante
   * Format: "2024-2025"
   */
  getCurrentSeason() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 0-indexed

    // Si on est entre janvier et juin, c'est la saison année-1/année
    // Si on est entre juillet et décembre, c'est la saison année/année+1
    if (month <= 6) {
      return `${year - 1}-${year}`;
    } else {
      return `${year}-${year + 1}`;
    }
  }

  /**
   * Obtenir les statistiques d'une équipe pour une saison
   */
  async getTeamSeasonStats(teamId, season = null) {
    season = season || this.getCurrentSeason();

    const [stats] = await db.execute(
      `SELECT * FROM team_season_statistics
       WHERE team_id = ? AND season = ?`,
      [teamId, season]
    );

    return stats[0] || null;
  }

  /**
   * Obtenir les statistiques d'un joueur pour une saison
   */
  async getPlayerSeasonStats(playerId, season = null) {
    season = season || this.getCurrentSeason();

    const [stats] = await db.execute(
      `SELECT * FROM player_season_statistics
       WHERE player_id = ? AND season = ?`,
      [playerId, season]
    );

    return stats[0] || null;
  }

  /**
   * Obtenir le classement des équipes pour une saison
   */
  async getLeagueStandings(season = null) {
    season = season || this.getCurrentSeason();

    const [standings] = await db.execute(
      `SELECT
         tss.*,
         t.name as team_name,
         t.logo_id,
         u.stored_filename as logo_filename
       FROM team_season_statistics tss
       JOIN teams t ON tss.team_id = t.id
       LEFT JOIN uploads u ON t.logo_id = u.id AND u.is_active = true
       WHERE tss.season = ?
       ORDER BY tss.points DESC, tss.goal_difference DESC, tss.goals_for DESC`,
      [season]
    );

    return standings;
  }

  /**
   * Obtenir les meilleurs buteurs pour une saison
   */
  async getTopScorers(season = null, limit = 10) {
    season = season || this.getCurrentSeason();

    const [scorers] = await db.execute(
      `SELECT
         pss.*,
         u.first_name,
         u.last_name,
         u.profile_picture_id,
         t.name as team_name
       FROM player_season_statistics pss
       JOIN users u ON pss.player_id = u.id
       JOIN teams t ON pss.team_id = t.id
       WHERE pss.season = ?
       ORDER BY pss.goals DESC, pss.assists DESC
       LIMIT ?`,
      [season, limit]
    );

    return scorers;
  }
}

module.exports = new MatchStatisticsService();

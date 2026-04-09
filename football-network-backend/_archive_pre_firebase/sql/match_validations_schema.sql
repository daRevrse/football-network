-- ============================================
-- TABLE MATCH_VALIDATIONS
-- Historique unifié des validations de score (managers + arbitre)
-- ============================================

CREATE TABLE IF NOT EXISTS match_validations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  validator_id INT NOT NULL COMMENT 'ID de l''utilisateur qui valide',
  validator_role ENUM('home_manager', 'away_manager', 'home_captain', 'away_captain', 'referee') NOT NULL,
  validation_type ENUM('score', 'dispute', 'correction') DEFAULT 'score',
  home_score INT NOT NULL,
  away_score INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'disputed') DEFAULT 'pending',
  notes TEXT COMMENT 'Notes ou raison de la validation/dispute',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (validator_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_match_validations (match_id),
  INDEX idx_validator (validator_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE MATCH_STATISTICS
-- Statistiques automatiques des matchs
-- ============================================

CREATE TABLE IF NOT EXISTS match_statistics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  team_id INT NOT NULL,
  -- Stats équipe
  goals_scored INT DEFAULT 0,
  goals_conceded INT DEFAULT 0,
  result ENUM('win', 'draw', 'loss') NOT NULL,
  clean_sheet BOOLEAN DEFAULT FALSE,
  -- Stats calculées automatiquement
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_match_team (match_id, team_id),
  INDEX idx_team_stats (team_id),
  INDEX idx_result (result)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE PLAYER_MATCH_STATISTICS
-- Statistiques individuelles des joueurs par match
-- ============================================

CREATE TABLE IF NOT EXISTS player_match_statistics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  player_id INT NOT NULL,
  team_id INT NOT NULL,
  -- Stats joueur
  goals INT DEFAULT 0,
  assists INT DEFAULT 0,
  minutes_played INT DEFAULT 0,
  yellow_cards INT DEFAULT 0,
  red_cards INT DEFAULT 0,
  -- Participation
  participated BOOLEAN DEFAULT TRUE,
  was_starter BOOLEAN DEFAULT TRUE,
  -- Métadonnées
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_player_match (match_id, player_id),
  INDEX idx_player_stats (player_id),
  INDEX idx_team_match (team_id, match_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE TEAM_SEASON_STATISTICS
-- Agrégation des stats par saison
-- ============================================

CREATE TABLE IF NOT EXISTS team_season_statistics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  season VARCHAR(20) DEFAULT '2024-2025',
  -- Matchs
  matches_played INT DEFAULT 0,
  matches_won INT DEFAULT 0,
  matches_drawn INT DEFAULT 0,
  matches_lost INT DEFAULT 0,
  -- Buts
  goals_for INT DEFAULT 0,
  goals_against INT DEFAULT 0,
  goal_difference INT GENERATED ALWAYS AS (goals_for - goals_against) STORED,
  clean_sheets INT DEFAULT 0,
  -- Points (3 pour victoire, 1 pour nul)
  points INT GENERATED ALWAYS AS (matches_won * 3 + matches_drawn) STORED,
  -- Métadonnées
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_season (team_id, season),
  INDEX idx_season (season),
  INDEX idx_points (points DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE PLAYER_SEASON_STATISTICS
-- Agrégation des stats joueur par saison
-- ============================================

CREATE TABLE IF NOT EXISTS player_season_statistics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  team_id INT NOT NULL,
  season VARCHAR(20) DEFAULT '2024-2025',
  -- Stats cumulées
  matches_played INT DEFAULT 0,
  goals INT DEFAULT 0,
  assists INT DEFAULT 0,
  minutes_played INT DEFAULT 0,
  yellow_cards INT DEFAULT 0,
  red_cards INT DEFAULT 0,
  -- Moyennes
  average_goals DECIMAL(4,2) GENERATED ALWAYS AS (
    CASE WHEN matches_played > 0 THEN goals / matches_played ELSE 0 END
  ) STORED,
  average_minutes DECIMAL(5,1) GENERATED ALWAYS AS (
    CASE WHEN matches_played > 0 THEN minutes_played / matches_played ELSE 0 END
  ) STORED,
  -- Métadonnées
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_player_team_season (player_id, team_id, season),
  INDEX idx_player_season (player_id, season),
  INDEX idx_goals (goals DESC),
  INDEX idx_assists (assists DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

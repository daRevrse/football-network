-- ============================================
-- GESTION DES MATCHS PAR L'ARBITRE
-- ============================================

-- Ajouter les colonnes pour le suivi des actions de l'arbitre
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS started_by_referee BOOLEAN DEFAULT FALSE COMMENT 'Match démarré par l''arbitre',
ADD COLUMN IF NOT EXISTS is_referee_verified BOOLEAN DEFAULT FALSE COMMENT 'Score vérifié et certifié par l''arbitre',
ADD COLUMN IF NOT EXISTS referee_validation_notes TEXT COMMENT 'Notes de validation de l''arbitre',
ADD COLUMN IF NOT EXISTS referee_validated_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Date de validation par l''arbitre',
ADD COLUMN IF NOT EXISTS referee_validated_by INT COMMENT 'ID de l''arbitre qui a validé',
ADD INDEX idx_referee_verified (is_referee_verified),
ADD INDEX idx_referee_validated_at (referee_validated_at);

-- Table des incidents de match rapportés par l'arbitre
CREATE TABLE IF NOT EXISTS match_incidents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  referee_id INT NOT NULL,
  team_id INT NOT NULL,
  player_id INT,
  incident_type ENUM('yellow_card', 'red_card', 'injury', 'misconduct', 'other') NOT NULL,
  description TEXT NOT NULL,
  minute_occurred INT COMMENT 'Minute du match où l''incident s''est produit',
  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (referee_id) REFERENCES referees(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_match_incidents (match_id),
  INDEX idx_referee_incidents (referee_id),
  INDEX idx_incident_type (incident_type),
  INDEX idx_reported_at (reported_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des statistiques de carte pour les joueurs
CREATE TABLE IF NOT EXISTS player_card_statistics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  team_id INT NOT NULL,
  season VARCHAR(20) DEFAULT '2024-2025',
  yellow_cards INT DEFAULT 0,
  red_cards INT DEFAULT 0,
  total_matches_played INT DEFAULT 0,
  last_card_date TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_player_team_season (player_id, team_id, season),
  INDEX idx_player_cards (player_id),
  INDEX idx_team_cards (team_id),
  INDEX idx_season (season)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

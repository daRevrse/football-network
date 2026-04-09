-- ============================================
-- TABLE MATCH_PARTICIPATIONS
-- Gestion des confirmations de présence des joueurs pour chaque match
-- ============================================

CREATE TABLE IF NOT EXISTS match_participations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  team_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('pending', 'confirmed', 'declined', 'maybe') DEFAULT 'pending',
  response_note TEXT,
  responded_at TIMESTAMP NULL DEFAULT NULL,
  notified_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participation (match_id, user_id),
  INDEX idx_match (match_id),
  INDEX idx_team (team_id),
  INDEX idx_status (status),
  INDEX idx_user_pending (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE MATCH_VALIDATION_HISTORY
-- Historique des validations automatiques de matchs
-- ============================================

CREATE TABLE IF NOT EXISTS match_validation_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  validation_type ENUM('auto_check', 'manual_override', 'pre_match_validation') NOT NULL,
  home_team_confirmed INT NOT NULL COMMENT 'Nombre de joueurs confirmés équipe domicile',
  away_team_confirmed INT NOT NULL COMMENT 'Nombre de joueurs confirmés équipe extérieure',
  is_valid BOOLEAN NOT NULL,
  validation_status ENUM('validated', 'warning', 'critical') NOT NULL,
  notes TEXT,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  INDEX idx_match (match_id),
  INDEX idx_status (validation_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Ajout de colonnes au table MATCHES pour tracking validation
-- ============================================

ALTER TABLE matches
ADD COLUMN participation_validated BOOLEAN DEFAULT FALSE AFTER venue_confirmed,
ADD COLUMN last_validation_check TIMESTAMP NULL DEFAULT NULL AFTER participation_validated,
ADD COLUMN validation_warnings INT DEFAULT 0 AFTER last_validation_check;

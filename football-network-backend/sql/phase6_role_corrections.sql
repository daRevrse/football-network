-- =====================================================
-- PHASE 6: Role Corrections & Jersey Numbers
-- Football Network - Corrections système
-- =====================================================

-- 1. Ajouter jersey_number (dossard) à team_members
-- Chaque joueur a un dossard unique par équipe (1-99)
ALTER TABLE team_members
ADD COLUMN jersey_number INT DEFAULT NULL,
ADD CONSTRAINT chk_jersey_number CHECK (jersey_number BETWEEN 1 AND 99),
ADD UNIQUE KEY unique_team_jersey (team_id, jersey_number);

-- 2. Ajouter flag is_captain (le capitaine reste un joueur, pas un rôle système)
-- Le capitaine est un titre, pas un rôle privilégié
ALTER TABLE team_members
ADD COLUMN is_captain BOOLEAN DEFAULT FALSE;

-- 3. Table pour notation des joueurs par le manager après chaque match
CREATE TABLE IF NOT EXISTS player_match_ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  player_id INT NOT NULL,
  team_id INT NOT NULL,
  rated_by INT NOT NULL COMMENT 'Manager qui a noté',
  rating INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 10),
  UNIQUE KEY unique_player_match_rating (match_id, player_id),
  INDEX idx_match_ratings (match_id),
  INDEX idx_player_ratings (player_id),
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (rated_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Ajouter note moyenne générale sur le profil joueur
ALTER TABLE users
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT NULL COMMENT 'Note moyenne générale (1-10)',
ADD COLUMN total_ratings INT DEFAULT 0 COMMENT 'Nombre total de notations reçues';

-- 5. Modifier le statut des réservations pour le workflow 2 phases
-- pending -> manager_confirmed -> confirmed
ALTER TABLE venue_bookings
MODIFY COLUMN status ENUM(
  'pending',
  'manager_confirmed',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
) DEFAULT 'pending';

-- 6. Ajouter colonnes de traçabilité pour confirmation terrain
ALTER TABLE venue_bookings
ADD COLUMN manager_confirmed_at TIMESTAMP NULL,
ADD COLUMN manager_confirmed_by INT NULL,
ADD CONSTRAINT fk_manager_confirmed_by FOREIGN KEY (manager_confirmed_by) REFERENCES users(id);

-- 7. Table pour les rapports de match (arbitre)
CREATE TABLE IF NOT EXISTS match_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  referee_id INT NOT NULL,
  home_score INT NOT NULL DEFAULT 0,
  away_score INT NOT NULL DEFAULT 0,
  match_summary TEXT,
  weather_conditions VARCHAR(50),
  pitch_conditions VARCHAR(50),
  status ENUM('draft', 'submitted', 'validated') DEFAULT 'draft',
  submitted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_match_report (match_id),
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (referee_id) REFERENCES referees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table pour les buts marqués
CREATE TABLE IF NOT EXISTS match_goals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  team_id INT NOT NULL,
  scorer_id INT NULL COMMENT 'Joueur qui a marqué',
  assister_id INT NULL COMMENT 'Joueur qui a fait la passe décisive',
  minute_scored INT NOT NULL,
  goal_type ENUM('regular', 'penalty', 'own_goal', 'free_kick', 'header') DEFAULT 'regular',
  notes TEXT,
  recorded_by INT NULL COMMENT 'Arbitre ou manager qui a enregistré',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_match_goals (match_id),
  INDEX idx_scorer (scorer_id),
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (scorer_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assister_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Index pour optimiser les requêtes de disponibilité
CREATE INDEX idx_venue_bookings_availability ON venue_bookings(location_id, booking_date, status);
CREATE INDEX idx_referee_availability_date ON referee_availability(referee_id, date, is_available);

-- 10. Vue pour calculer facilement la note moyenne d'un joueur
CREATE OR REPLACE VIEW v_player_average_ratings AS
SELECT
  player_id,
  AVG(rating) as average_rating,
  COUNT(*) as total_ratings,
  MIN(rating) as min_rating,
  MAX(rating) as max_rating
FROM player_match_ratings
GROUP BY player_id;

-- ============================================
-- PHASE 4: AMÉLIORATIONS ET SUPERADMIN
-- ============================================

-- ============================================
-- 1. MODIFICATION TABLE MATCH_INVITATIONS
-- Ajouter terrain et arbitres dans l'invitation
-- ============================================

ALTER TABLE match_invitations
ADD COLUMN venue_id INT AFTER proposed_location_id,
ADD COLUMN requires_referee BOOLEAN DEFAULT FALSE AFTER venue_id,
ADD COLUMN preferred_referee_id INT AFTER requires_referee,
ADD INDEX idx_venue_id (venue_id),
ADD INDEX idx_referee_id (preferred_referee_id),
ADD FOREIGN KEY (venue_id) REFERENCES locations(id) ON DELETE SET NULL,
ADD FOREIGN KEY (preferred_referee_id) REFERENCES referees(id) ON DELETE SET NULL;

-- ============================================
-- 2. MODIFICATION TABLE MATCHES
-- Marquer terrain et arbitres comme optionnels mais trackés
-- ============================================

ALTER TABLE matches
ADD COLUMN venue_booking_id INT AFTER location_id,
ADD COLUMN venue_confirmed BOOLEAN DEFAULT FALSE AFTER venue_booking_id,
ADD INDEX idx_venue_booking (venue_booking_id),
ADD FOREIGN KEY (venue_booking_id) REFERENCES venue_bookings(id) ON DELETE SET NULL;

-- ============================================
-- 3. TABLE USERS - AJOUTER RÔLE SUPERADMIN
-- ============================================

ALTER TABLE users
MODIFY COLUMN user_type ENUM('player', 'manager', 'superadmin') DEFAULT 'player';

-- ============================================
-- 4. TABLE DE VALIDATION MINIMUM JOUEURS
-- Stocker l'historique des vérifications
-- ============================================

CREATE TABLE IF NOT EXISTS team_match_validations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  match_id INT,
  invitation_id INT,
  validation_type ENUM('send_invitation', 'accept_invitation', 'match_start') NOT NULL,
  players_count INT NOT NULL,
  minimum_required INT DEFAULT 6,
  is_valid BOOLEAN NOT NULL,
  validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  validated_by INT,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL,
  FOREIGN KEY (invitation_id) REFERENCES match_invitations(id) ON DELETE SET NULL,
  FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_team_validation (team_id, validation_type),
  INDEX idx_match_validation (match_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. TABLE INVITATIONS JOUEURS AMÉLIORÉE
-- Ajouter recherche par nom/email
-- ============================================

ALTER TABLE player_invitations
ADD COLUMN invited_email VARCHAR(100) AFTER user_id,
ADD COLUMN invited_name VARCHAR(100) AFTER invited_email,
ADD COLUMN invitation_token VARCHAR(64) AFTER message,
ADD COLUMN token_expires_at TIMESTAMP AFTER invitation_token,
ADD INDEX idx_email (invited_email),
ADD INDEX idx_token (invitation_token);

-- ============================================
-- 6. TABLE ADMIN LOGS
-- Tracer toutes les actions admin
-- ============================================

CREATE TABLE IF NOT EXISTS admin_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id INT,
  action_details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_admin_action (admin_id, action_type),
  INDEX idx_target (target_type, target_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. TABLE SYSTEM SETTINGS
-- Paramètres globaux du système
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE COMMENT 'Accessible sans auth',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_key (setting_key),
  INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. INSERTION PARAMÈTRES PAR DÉFAUT
-- ============================================

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('min_players_per_match', '6', 'number', 'Nombre minimum de joueurs par équipe pour un match', true),
('max_invitation_duration_days', '7', 'number', 'Durée de validité des invitations en jours', true),
('enable_referee_requirement', 'false', 'boolean', 'Rendre les arbitres obligatoires', true),
('enable_venue_requirement', 'false', 'boolean', 'Rendre les terrains obligatoires', true),
('platform_fee_percentage', '0', 'number', 'Commission plateforme sur réservations (%)', false),
('support_email', 'support@football-network.com', 'string', 'Email de support', true),
('max_teams_per_user', '3', 'number', 'Nombre max d\'équipes par utilisateur', true)
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- ============================================
-- 9. TABLE REPORTS (SIGNALEMENTS)
-- Signalements utilisateurs/équipes/matchs
-- ============================================

CREATE TABLE IF NOT EXISTS reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reporter_id INT NOT NULL,
  reported_type ENUM('user', 'team', 'match', 'venue', 'referee') NOT NULL,
  reported_id INT NOT NULL,
  reason ENUM('inappropriate_behavior', 'spam', 'fraud', 'violence', 'other') NOT NULL,
  description TEXT NOT NULL,
  status ENUM('pending', 'investigating', 'resolved', 'dismissed') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  assigned_to INT,
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_reported (reported_type, reported_id),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. TABLE BANS (SANCTIONS)
-- Gestion des sanctions/bannissements
-- Note: Au moins un de user_id ou team_id doit être renseigné
-- ============================================

CREATE TABLE IF NOT EXISTS bans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  team_id INT DEFAULT NULL,
  ban_type ENUM('warning', 'temporary', 'permanent') NOT NULL,
  reason TEXT NOT NULL,
  banned_by INT NOT NULL,
  starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMP NULL DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, is_active),
  INDEX idx_team_active (team_id, is_active),
  INDEX idx_type (ban_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FIN DE LA MIGRATION PHASE 4
-- ============================================

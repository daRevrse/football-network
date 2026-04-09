-- ============================================
-- AJOUT DU TYPE UTILISATEUR "REFEREE"
-- ============================================

-- Modifier l'ENUM user_type pour inclure 'referee'
ALTER TABLE users
MODIFY COLUMN user_type ENUM('player', 'manager', 'superadmin', 'venue_owner', 'referee') DEFAULT 'player';

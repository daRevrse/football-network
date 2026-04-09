-- ============================================
-- MISE À JOUR DES TYPES D'UTILISATEURS
-- Ajoute venue_owner et referee si manquants
-- ============================================

-- Mettre à jour l'ENUM pour inclure tous les types d'utilisateurs
ALTER TABLE users
MODIFY COLUMN user_type ENUM('player', 'manager', 'referee', 'venue_owner', 'superadmin') DEFAULT 'player';

-- Vérifier que la colonne owner_id existe dans locations
-- Si elle n'existe pas, l'ajouter
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'locations'
               AND COLUMN_NAME = 'owner_id');

SET @query = IF(@exist = 0,
    'ALTER TABLE locations ADD COLUMN owner_id INT AFTER id, ADD FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT "owner_id column already exists"');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier que la colonne is_managed existe dans locations
SET @exist2 := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'locations'
                AND COLUMN_NAME = 'is_managed');

SET @query2 = IF(@exist2 = 0,
    'ALTER TABLE locations ADD COLUMN is_managed BOOLEAN DEFAULT FALSE',
    'SELECT "is_managed column already exists"');

PREPARE stmt2 FROM @query2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

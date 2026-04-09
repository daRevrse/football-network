-- ============================================
-- GESTION AUTOMATIQUE DES STATUTS DE MATCH
-- ============================================

-- Ajouter les colonnes pour tracker les changements automatiques de statut
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Horodatage du démarrage automatique/manuel du match',
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Horodatage de la fin automatique/manuelle du match',
ADD INDEX idx_status_match_date (status, match_date),
ADD INDEX idx_started_at (started_at),
ADD INDEX idx_completed_at (completed_at);

-- Mettre à jour les statuts existants si nécessaire
-- Note: Cette requête peut être exécutée pour mettre à jour les matchs existants
UPDATE matches
SET started_at = match_date
WHERE status IN ('in_progress', 'completed')
  AND started_at IS NULL
  AND match_date <= NOW();

UPDATE matches
SET completed_at = DATE_ADD(COALESCE(started_at, match_date), INTERVAL 120 MINUTE)
WHERE status = 'completed'
  AND completed_at IS NULL
  AND (started_at IS NOT NULL OR match_date <= NOW());

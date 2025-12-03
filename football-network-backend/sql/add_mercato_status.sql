-- Ajout du statut mercato pour les équipes
-- Date: 2025-12-03
-- Description: Permet aux équipes d'activer/désactiver l'acceptation de nouvelles demandes d'adhésion

ALTER TABLE teams
ADD COLUMN IF NOT EXISTS mercato_actif BOOLEAN DEFAULT TRUE COMMENT 'Si true, les joueurs peuvent demander à rejoindre l''équipe';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_teams_mercato_actif ON teams(mercato_actif);

-- Commentaire
ALTER TABLE teams COMMENT = 'Équipes avec gestion du mercato (fenêtre de transfert)';

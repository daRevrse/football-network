-- Migration: Ajouter la colonne verify_player_availability à match_invitations
-- Date: 2025-01-26

ALTER TABLE match_invitations
ADD COLUMN IF NOT EXISTS verify_player_availability BOOLEAN DEFAULT FALSE COMMENT 'Si true, validation des 6 joueurs minimum requise avant création invitation';

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_match_invitations_verify_availability
ON match_invitations(verify_player_availability);

-- Commentaire sur la colonne
ALTER TABLE match_invitations COMMENT = 'Invitations de match avec option de vérification disponibilité joueurs';

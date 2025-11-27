-- Migration: Ajouter les champs de réponse du propriétaire de terrain
-- Date: 2025-01-26

ALTER TABLE venue_bookings
ADD COLUMN IF NOT EXISTS owner_response_message TEXT COMMENT 'Message de réponse du propriétaire',
ADD COLUMN IF NOT EXISTS owner_responded_at TIMESTAMP NULL COMMENT 'Date de réponse du propriétaire';

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_venue_bookings_owner_responded
ON venue_bookings(owner_responded_at);

-- Ajouter un commentaire sur la table
ALTER TABLE venue_bookings COMMENT = 'Réservations de terrains avec gestion des réponses propriétaires';

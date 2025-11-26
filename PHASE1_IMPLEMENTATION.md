# Phase 1 - Implémentation Terminée

## 🎯 Objectifs Phase 1

- ✅ Amélioration du système Player/Manager
- ✅ Extension base de données pour stades/terrains
- ✅ Système complet de gestion des arbitres
- ✅ Système de tarification flexible pour les terrains
- ✅ Middleware de vérification de rôles

---

## 📦 Modifications de la Base de Données

### 1. Extension Table `locations` (Stades/Terrains)

**Nouvelles colonnes ajoutées :**
- `owner_type` : Type de propriétaire (public, private, club, partner)
- `manager_name`, `manager_phone`, `manager_email` : Contact gestionnaire
- `opening_hours` (JSON) : Horaires d'ouverture
- `facilities` (JSON) : Équipements (vestiaires, douches, parking, etc.)
- `field_surface` : Type de surface (natural_grass, synthetic, hybrid, indoor)
- `field_size` : Taille terrain (11v11, 7v7, 5v5)
- `capacity` : Nombre de spectateurs
- `is_partner` : Statut partenaire
- `partner_discount` : % de réduction partenaire
- `partner_since` : Date début partenariat
- `rating` : Note moyenne
- `total_ratings` : Nombre total d'avis
- `photo_id`, `banner_id` : Photos du terrain

### 2. Nouvelle Table `venue_pricing`

**Tarification flexible basée sur :**
- Type de jeu (5v5, 7v7, 11v11, futsal, training, tournament)
- Durée en minutes (60, 90, 120, etc.)
- Type de jour (weekday, weekend, holiday)
- Créneau horaire (morning, afternoon, evening, night)

**Exemple :**
```sql
-- Terrain 11v11, 90 minutes, semaine, soirée : 80€
-- Terrain 11v11, 90 minutes, weekend, après-midi : 100€
-- Terrain 7v7, 60 minutes, semaine, soirée : 50€
```

### 3. Nouvelle Table `venue_partnerships`

Gestion des partenariats avec 4 niveaux :
- Bronze
- Silver
- Gold
- Platinum

Chaque partenariat inclut :
- Pourcentage de réduction
- Dates de validité
- Conditions du partenariat
- Avantages supplémentaires (JSON)
- Contacts

### 4. Nouvelle Table `venue_bookings`

Système complet de réservation :
- Lien avec match et équipe
- Gestion des créneaux horaires
- Calcul du prix (base + réduction)
- Statuts : pending, confirmed, cancelled, completed, no_show
- Paiement : pending, paid, refunded, cancelled

### 5. Nouvelle Table `venue_ratings`

Système d'avis sur les terrains :
- Note globale (1-5)
- Note état du terrain
- Note des équipements
- Note du service
- Commentaires et photos
- Vérification si réservation confirmée

### 6. Nouvelle Table `referees`

Profil complet des arbitres :
- Informations personnelles
- Numéro de licence et niveau (regional, national, international, trainee)
- Années d'expérience
- Spécialisations (JSON)
- Langues parlées (JSON)
- Localisation et distance max de déplacement
- Tarif horaire
- Note moyenne et statistiques

### 7. Nouvelle Table `referee_availability`

Gestion des disponibilités arbitres :
- Date et créneaux horaires
- Statut disponible/indisponible
- Raison d'indisponibilité

### 8. Nouvelle Table `match_referee_assignments`

Assignation arbitres aux matchs :
- Rôles : main, assistant_1, assistant_2, fourth_official
- Statuts : pending, confirmed, declined, completed, cancelled
- Gestion des honoraires
- Notes

### 9. Nouvelle Table `referee_ratings`

Évaluation des arbitres :
- Note globale
- Note équité
- Note communication
- Note professionnalisme
- Commentaires

### 10. Nouvelle Table `referee_certifications`

Gestion des licences et certificats :
- Type : license, training, specialization, award
- Dates d'émission et expiration
- Documents scannés
- Statut vérifié

### 11. Modification Table `matches`

**Nouvelles colonnes :**
- `has_referee` : Indique si un arbitre est demandé
- `referee_verified` : Arbitre a validé le match
- `referee_verified_at` : Date de validation arbitre
- `referee_notes` : Notes de l'arbitre sur le match

---

## 🔧 Modifications Backend

### 1. Authentification améliorée

**Fichier : [football-network-backend/routes/auth.js](football-network-backend/routes/auth.js)**

**Changements :**
- ✅ Login inclut maintenant `user_type` dans le token JWT
- ✅ Login retourne `user_type` dans la réponse
- ✅ Refresh token inclut `user_type`

**Avant :**
```javascript
// Token ne contenait que userId et email
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: "24h" }
);
```

**Après :**
```javascript
// Token contient aussi userType
const token = jwt.sign(
  { userId: user.id, email: user.email, userType: user.user_type },
  process.env.JWT_SECRET,
  { expiresIn: "24h" }
);
```

### 2. Middleware de rôles

**Fichier : [football-network-backend/middleware/auth.js](football-network-backend/middleware/auth.js)**

**Nouvelles fonctions exportées :**
- `requireRole(allowedRoles)` : Middleware générique
- `requireManager` : Vérifie que l'utilisateur est un manager
- `requirePlayer` : Vérifie que l'utilisateur est un player

**Utilisation :**

```javascript
const { authenticateToken, requireManager, requireRole } = require('../middleware/auth');

// Route réservée aux managers
router.post('/teams', authenticateToken, requireManager, (req, res) => {
  // Seuls les managers peuvent créer des équipes
});

// Route pour managers ET players
router.get('/matches', authenticateToken, requireRole(['manager', 'player']), (req, res) => {
  // Les deux types peuvent accéder
});

// Route pour un rôle spécifique
router.post('/referee/register', authenticateToken, (req, res) => {
  // Accessible à tous les utilisateurs authentifiés
});
```

---

## 🚀 Migration de la Base de Données

### Étape 1 : Sauvegarde

```bash
# Sauvegarder la base de données avant migration
mysqldump -u root -p football_network > backup_pre_phase1.sql
```

### Étape 2 : Exécution du script

```bash
# Se connecter à MySQL
mysql -u root -p football_network

# Exécuter le script de migration
source football-network-backend/sql/phase1_schema_extensions.sql;
```

**OU via la ligne de commande directe :**

```bash
mysql -u root -p football_network < football-network-backend/sql/phase1_schema_extensions.sql
```

### Étape 3 : Vérification

```sql
-- Vérifier les nouvelles colonnes de locations
DESCRIBE locations;

-- Vérifier les nouvelles tables
SHOW TABLES LIKE 'venue_%';
SHOW TABLES LIKE 'referee%';
SHOW TABLES LIKE 'match_referee%';

-- Vérifier les données de test insérées
SELECT * FROM venue_pricing;
```

---

## 📝 Exemples de Données JSON

### `facilities` pour locations

```json
{
  "parking": true,
  "lockerRooms": 4,
  "showers": true,
  "cafeteria": true,
  "lighting": "LED",
  "sound_system": false,
  "wifi": true,
  "firstAid": true,
  "equipment_storage": true
}
```

### `opening_hours` pour locations

```json
{
  "monday": { "open": "08:00", "close": "23:00" },
  "tuesday": { "open": "08:00", "close": "23:00" },
  "wednesday": { "open": "08:00", "close": "23:00" },
  "thursday": { "open": "08:00", "close": "23:00" },
  "friday": { "open": "08:00", "close": "23:00" },
  "saturday": { "open": "09:00", "close": "22:00" },
  "sunday": { "open": "09:00", "close": "22:00" }
}
```

### `benefits` pour venue_partnerships

```json
{
  "priority_booking": true,
  "premium_lockerRoom": true,
  "free_equipment": ["balls", "bibs"],
  "dedicated_parking": 10,
  "promotional_visibility": true
}
```

### `specializations` pour referees

```json
["5v5", "7v7", "11v11", "futsal", "youth", "women"]
```

### `languages` pour referees

```json
["fr", "en", "es", "ar"]
```

---

## 🎯 Prochaines Étapes

La **Phase 1** est maintenant terminée. Les fondations sont en place pour :

### Phase 2 - Backend Routes (À venir)
- Routes pour la gestion des stades (`/venues`)
- Routes pour les partenariats (`/partnerships`)
- Routes pour les réservations (`/bookings`)
- Routes pour les arbitres (`/referees`)
- Routes pour les assignations arbitres (`/referee-assignments`)

### Phase 3 - Frontend Components (À venir)
- Composants de recherche de terrains
- Interface de réservation
- Profils et recherche d'arbitres
- Assignation d'arbitres aux matchs
- Système de notation

### Phase 4 - Intégration (À venir)
- Modification du flow de création de match
- Ajout sélection terrain dans invitations
- Notifications pour arbitres et réservations
- Dashboard adapté par rôle (Manager/Player)

---

## ⚠️ Notes Importantes

1. **Migration irreversible** : Sauvegarder la DB avant d'exécuter le script
2. **Données de test** : Le script insère quelques exemples de tarifs - à supprimer en production
3. **Performance** : Les nouveaux index ont été ajoutés pour optimiser les requêtes
4. **Compatibilité** : Les colonnes existantes de `locations` et `matches` ne sont pas modifiées (sauf ajout)
5. **Middleware** : Pensez à protéger vos routes avec les nouveaux middlewares de rôle

---

## 🐛 En cas de problème

### Rollback de la migration

```bash
# Restaurer la sauvegarde
mysql -u root -p football_network < backup_pre_phase1.sql
```

### Vérifier les contraintes de clés étrangères

```sql
-- Si erreur de foreign key
SET FOREIGN_KEY_CHECKS = 0;
-- Exécuter le script
SET FOREIGN_KEY_CHECKS = 1;
```

---

**Phase 1 complétée le :** 2025-11-26
**Prêt pour Phase 2 :** ✅

# Phase 2 - Backend Routes Terminée ✅

## 📦 Routes Créées

### 1. **Venues Routes** - [routes/venues.js](football-network-backend/routes/venues.js)

#### GET `/api/venues`
Liste des stades/terrains avec filtres
- **Query params:** city, field_surface, field_size, is_partner, min_rating, game_type, limit, offset
- **Auth:** Non requise
- **Response:** Liste des terrains avec photos, rating, équipements, tarifs

#### GET `/api/venues/partners`
Liste des stades partenaires
- **Auth:** Non requise
- **Response:** Terrains partenaires avec avantages

#### GET `/api/venues/:id`
Détails complets d'un terrain
- **Auth:** Non requise
- **Response:** Infos terrain + tarifs + avis récents + partenariat

#### GET `/api/venues/:id/availability`
Vérifier disponibilité d'un terrain
- **Query params:** date, duration, game_type
- **Auth:** Non requise
- **Response:** Créneaux réservés + horaires d'ouverture + tarif

#### POST `/api/venues/:id/book`
Réserver un terrain
- **Auth:** Requise (Manager only)
- **Body:** teamId, bookingDate, startTime, endTime, gameType, matchId?, notes?
- **Response:** Réservation créée avec calcul prix (base + réduction partenaire)

#### POST `/api/venues/:id/rate`
Noter un terrain
- **Auth:** Requise
- **Body:** rating, fieldConditionRating?, facilitiesRating?, serviceRating?, comment?, bookingId?
- **Response:** Note enregistrée + nouvelle moyenne terrain

---

### 2. **Bookings Routes** - [routes/bookings.js](football-network-backend/routes/bookings.js)

#### GET `/api/bookings/my-bookings`
Réservations de l'utilisateur
- **Auth:** Requise
- **Query params:** status, limit, offset
- **Response:** Liste des réservations avec détails terrain et équipe

#### GET `/api/bookings/team/:teamId`
Réservations d'une équipe
- **Auth:** Requise (membre de l'équipe)
- **Query params:** status, upcoming, limit, offset
- **Response:** Réservations de l'équipe

#### GET `/api/bookings/:id`
Détails d'une réservation
- **Auth:** Requise (membre de l'équipe)
- **Response:** Détails complets réservation + contact terrain

#### PATCH `/api/bookings/:id/confirm`
Confirmer une réservation
- **Auth:** Requise (capitaine ou créateur)
- **Response:** Statut changé à 'confirmed'

#### PATCH `/api/bookings/:id/cancel`
Annuler une réservation
- **Auth:** Requise (capitaine ou créateur)
- **Body:** reason?
- **Response:** Statut changé à 'cancelled'

#### PATCH `/api/bookings/:id/complete`
Marquer réservation terminée
- **Auth:** Requise (capitaine ou créateur)
- **Response:** Statut changé à 'completed'

#### PATCH `/api/bookings/:id/payment`
Mettre à jour le paiement
- **Auth:** Requise (capitaine ou créateur)
- **Body:** paymentStatus, paymentMethod?
- **Response:** Paiement mis à jour

---

### 3. **Referees Routes** - [routes/referees.js](football-network-backend/routes/referees.js)

#### POST `/api/referees`
Enregistrer un nouvel arbitre
- **Auth:** Requise
- **Body:** firstName, lastName, email, phone?, licenseNumber?, licenseLevel?, experienceYears?, bio?, specializations?, languages?, locationCity?, maxTravelDistance?, hourlyRate?
- **Response:** Profil arbitre créé

#### GET `/api/referees`
Liste des arbitres avec filtres
- **Query params:** city, license_level, min_experience, min_rating, available_only, specialization, limit, offset
- **Response:** Liste arbitres avec rating et stats

#### GET `/api/referees/:id`
Détails complets d'un arbitre
- **Auth:** Non requise
- **Response:** Profil + certifications + avis récents + matchs récents

#### PUT `/api/referees/:id`
Modifier profil arbitre
- **Auth:** Requise (propriétaire du profil)
- **Body:** firstName?, lastName?, phone?, bio?, specializations?, languages?, locationCity?, maxTravelDistance?, hourlyRate?, isAvailable?
- **Response:** Profil mis à jour

#### GET `/api/referees/:id/matches`
Historique des matchs d'un arbitre
- **Query params:** status, limit, offset
- **Response:** Liste des matchs arbitrés

#### POST `/api/referees/:id/availability`
Définir disponibilités
- **Auth:** Requise (propriétaire du profil)
- **Body:** date, isAvailable, startTime?, endTime?, reason?
- **Response:** Disponibilité enregistrée

#### GET `/api/referees/:id/availability`
Voir disponibilités
- **Query params:** start_date?, end_date?
- **Response:** Liste des disponibilités

---

### 4. **Referee Assignments Routes** - [routes/referee-assignments.js](football-network-backend/routes/referee-assignments.js)

#### POST `/api/referee-assignments`
Assigner un arbitre à un match
- **Auth:** Requise (Manager + capitaine du match)
- **Body:** matchId, refereeId, role?, fee?, notes?
- **Response:** Assignation créée + notification arbitre

#### GET `/api/referee-assignments/match/:matchId`
Arbitres assignés à un match
- **Auth:** Requise
- **Response:** Liste des arbitres du match (main, assistants)

#### GET `/api/referee-assignments/referee/:refereeId`
Assignations d'un arbitre
- **Query params:** status, upcoming, limit, offset
- **Response:** Missions de l'arbitre

#### PATCH `/api/referee-assignments/:id/confirm`
Arbitre confirme sa présence
- **Auth:** Requise (arbitre assigné)
- **Response:** Confirmation enregistrée + notification capitaines

#### PATCH `/api/referee-assignments/:id/decline`
Arbitre décline
- **Auth:** Requise (arbitre assigné)
- **Body:** reason
- **Response:** Déclin enregistré + notification capitaines

#### POST `/api/referee-assignments/:id/rate`
Noter un arbitre après match
- **Auth:** Requise (Manager + capitaine)
- **Body:** rating, fairnessRating?, communicationRating?, professionalismRating?, comment?
- **Response:** Note enregistrée + nouvelle moyenne arbitre

#### PATCH `/api/referee-assignments/:id/complete`
Marquer assignation terminée
- **Auth:** Requise (arbitre)
- **Response:** Statut completed + compteur matchs incrémenté

---

## 🔐 Authentification & Autorisation

### Middleware utilisés :
- `authenticateToken` : Vérifie JWT token
- `requireManager` : Réservé aux managers
- `requireRole(['manager', 'player'])` : Plusieurs rôles autorisés

### Exemples d'utilisation :

```javascript
// Route publique
router.get("/venues", async (req, res) => { ... });

// Route authentifiée
router.get("/bookings/my-bookings", authenticateToken, async (req, res) => { ... });

// Route managers uniquement
router.post("/venues/:id/book", authenticateToken, requireManager, async (req, res) => { ... });
```

---

## 📊 Modèles de Données

### Pricing Calculation (Réservations)
```javascript
// Facteurs de prix
- game_type: 5v5, 7v7, 11v11, futsal, training, tournament
- duration_minutes: 60, 90, 120, etc.
- day_type: weekday, weekend, holiday
- time_slot: morning, afternoon, evening, night

// Calcul
basePrice = venue_pricing WHERE (location_id, game_type, duration, day_type, time_slot)
discount = partnership.discount_percentage (si partenaire)
finalPrice = basePrice - (basePrice * discount / 100)
```

### Referee Rating Calculation
```javascript
// Notes multiples
- rating (global): 1-5
- fairness_rating: 1-5
- communication_rating: 1-5
- professionalism_rating: 1-5

// Moyenne
avgRating = AVG(rating) FROM referee_ratings WHERE referee_id = X
```

---

## 🔔 Notifications Intégrées

### Événements notifiés :
1. **Réservation terrain** → Capitaines
2. **Arbitre assigné** → Arbitre
3. **Arbitre confirme** → Capitaines
4. **Arbitre décline** → Capitaines
5. **Match validé** → Tous (si arbitre)

### Utilisation NotificationService :
```javascript
await NotificationService.createNotification({
  userId: targetUserId,
  type: "referee_assignment",
  title: "Nouvelle assignation",
  message: "Vous avez été assigné...",
  relatedId: matchId,
  relatedType: "match"
});
```

---

## 🧪 Tests Recommandés

### Scénarios à tester :

#### Terrains
1. ✅ Recherche terrains avec filtres
2. ✅ Vérification disponibilité
3. ✅ Réservation avec calcul prix
4. ✅ Conflit de créneaux
5. ✅ Application réduction partenaire
6. ✅ Notation terrain

#### Arbitres
1. ✅ Enregistrement arbitre
2. ✅ Recherche avec spécialisations
3. ✅ Gestion disponibilités
4. ✅ Assignation au match
5. ✅ Confirmation/Déclin arbitre
6. ✅ Notation après match

#### Sécurité
1. ✅ Seuls managers peuvent réserver
2. ✅ Seuls capitaines peuvent assigner arbitres
3. ✅ Seuls arbitres peuvent confirmer/décliner
4. ✅ Vérification appartenance équipe

---

## 📝 Exemples d'Utilisation

### Réserver un terrain
```bash
POST /api/venues/5/book
Authorization: Bearer <token>
Content-Type: application/json

{
  "teamId": 12,
  "bookingDate": "2025-12-15",
  "startTime": "18:00",
  "endTime": "19:30",
  "gameType": "11v11",
  "matchId": 45,
  "notes": "Match important"
}
```

### Assigner un arbitre
```bash
POST /api/referee-assignments
Authorization: Bearer <token>
Content-Type: application/json

{
  "matchId": 45,
  "refereeId": 8,
  "role": "main",
  "fee": 50.00,
  "notes": "Arbitre expérimenté demandé"
}
```

### Rechercher arbitres disponibles
```bash
GET /api/referees?city=Paris&license_level=national&available_only=true&specialization=11v11&min_rating=4
```

---

## 🚀 Prochaines Étapes

**Phase 2 complétée ✅**

**Phase 3 - Frontend Components** (À venir) :
- VenueSearch.js
- VenueDetails.js
- VenueBooking.js
- RefereeSearch.js
- RefereeProfile.js
- AssignReferee.js
- RateReferee.js
- MyBookings.js

**Phase 4 - Intégration** (À venir) :
- Modifier SendInvitationModal (sélection terrain)
- Modifier MatchDetails (afficher terrain + arbitre)
- Dashboard adapté par rôle
- Notifications temps réel

---

**Phase 2 complétée le :** 2025-11-26
**Nombre total de routes :** 26 endpoints
**Prêt pour Phase 3 :** ✅

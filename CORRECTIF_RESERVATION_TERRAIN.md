# ✅ Correctif : Réservation Automatique de Terrain

## 🎯 Problème Identifié

Lorsque les joueurs confirment leur participation (6+ par équipe), le match passe bien à `'confirmed'` mais **la réservation de terrain reste en statut `'pending'`** au lieu de se confirmer automatiquement.

## 📊 Workflow Avant vs Après

### ❌ AVANT (Problématique)

```
1. Invitation acceptée → Match créé (status: 'pending')
2. Réservation créée (status: 'pending')
3. Joueurs confirment participation (6+ par équipe)
4. validateMatchParticipation() appelée
5. Match.participation_validated = true
6. ⚠️ Match.status reste 'pending'
7. ⚠️ Réservation.status reste 'pending'
```

**Résultat:** Match validé mais réservation jamais confirmée

### ✅ APRÈS (Corrigé)

```
1. Invitation acceptée → Match créé (status: 'pending')
2. Réservation créée (status: 'pending')
3. Joueurs confirment participation (6+ par équipe)
4. validateMatchParticipation() appelée
5. ✅ Match.status = 'confirmed' (automatique)
6. ✅ Réservation.status = 'confirmed' (automatique)
7. Match.participation_validated = true
```

**Résultat:** Match ET réservation confirmés automatiquement

---

## 🔧 Modifications Backend

### 1. Validation Automatique des Participations

**Fichier:** [utils/matchParticipation.js:125-215](football-network-backend/utils/matchParticipation.js#L125-L215)

**Changements:**
- Récupération du `venue_booking_id` lors de la validation
- Si 6+ confirmations par équipe ET match en 'pending':
  - Match passe à `'confirmed'`
  - Réservation associée passe à `'confirmed'`
- Logs clairs pour traçabilité

**Code ajouté:**
```javascript
// Si validation réussie (6+ joueurs par équipe)
if (status.isValid) {
  // Récupérer les infos du match
  const [matchInfo] = await db.execute(
    'SELECT status, venue_booking_id FROM matches WHERE id = ?',
    [matchId]
  );

  if (matchInfo.length > 0) {
    const currentMatchStatus = matchInfo[0].status;
    const venueBookingId = matchInfo[0].venue_booking_id;

    // Si le match est en 'pending', le passer à 'confirmed'
    if (currentMatchStatus === 'pending') {
      await db.execute(
        `UPDATE matches
         SET status = 'confirmed',
             participation_validated = true,
             last_validation_check = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [matchId]
      );

      console.log(`Match ${matchId} status updated from 'pending' to 'confirmed' (6+ confirmations per team)`);

      // Si une réservation de terrain existe, la confirmer aussi
      if (venueBookingId) {
        await db.execute(
          `UPDATE venue_bookings
           SET status = 'confirmed'
           WHERE id = ? AND status = 'pending'`,
          [venueBookingId]
        );

        console.log(`Venue booking ${venueBookingId} auto-confirmed for match ${matchId}`);
      }
    }
  }
}
```

### 2. Endpoint de Réservation Manuelle

**Fichier:** [routes/matches.js:2102-2256](football-network-backend/routes/matches.js#L2102-L2256)

**Endpoint créé:** `POST /api/matches/:matchId/book-venue`

**Fonctionnalités:**
- Accessible uniquement aux **capitaines** des équipes du match
- Vérifications:
  - Match existe
  - Utilisateur est capitaine d'une des équipes
  - Match n'a pas déjà une réservation
  - Terrain existe et actif
- Calcul automatique:
  - Prix selon horaire/jour/type de jeu
  - Réduction partenaire si applicable
  - Horaires de début/fin
- Création réservation + lien bidirectionnel avec match
- Retourne les détails de la réservation

**Paramètres:**
```json
{
  "venueId": 123,
  "durationMinutes": 90  // optionnel, défaut 90
}
```

---

## 🎨 Modifications Frontend

### 1. Bouton "Réserver un Terrain"

**Fichier:** [MatchDetails.js:361-412](football-network-frontend/src/components/matches/MatchDetails.js#L361-L412)

**Ajouts:**
- Bouton visible uniquement si:
  - Utilisateur = capitaine (`canManage`)
  - Match n'a pas de réservation (`!match.venueBookingId`)
  - Match non annulé (`match.status !== 'cancelled'`)
- Badge "Terrain réservé" (vert) si réservation existe
- États ajoutés:
  ```javascript
  const [bookingVenue, setBookingVenue] = useState(false);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [venues, setVenues] = useState([]);
  ```

### 2. Modal de Sélection de Terrain

**Fichier:** [MatchDetails.js:501-586](football-network-frontend/src/components/matches/MatchDetails.js#L501-L586)

**Fonctionnalités:**
- Liste tous les terrains disponibles
- Sélection par radio button
- Affichage: nom, ville, adresse, type de terrain
- Bouton "Confirmer la réservation" avec loader
- Annulation possible
- Appel API `POST /api/matches/:matchId/book-venue`
- Rechargement automatique du match après réservation

### 3. Fonctions Ajoutées

**Fonction `handleBookVenue`:**
```javascript
const handleBookVenue = async (venueId) => {
  try {
    setBookingVenue(true);
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_BASE_URL}/matches/${matchId}/book-venue`,
      { venueId, durationMinutes: 90 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success("Réservation créée avec succès !");
    setShowVenueModal(false);
    loadMatch();
  } catch (error) {
    toast.error(error.response?.data?.error || "Erreur lors de la réservation");
  } finally {
    setBookingVenue(false);
  }
};
```

**Fonction `loadVenues`:**
```javascript
const loadVenues = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/venues`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setVenues(response.data || []);
  } catch (error) {
    console.error("Error loading venues:", error);
  }
};
```

---

## 📋 Scénarios d'Utilisation

### Scénario 1 : Réservation Automatique (Terrain Spécifié dans Invitation)

```
1. Manager A envoie invitation à Manager B
   - venueId = 5 (Terrain spécifié)
   - verifyPlayerAvailability = false

2. Manager B accepte
   → Match créé (status: 'pending')
   → Réservation créée automatiquement (status: 'pending')

3. Joueurs confirment participation
   → Joueur 1 confirme
   → Joueur 2 confirme
   → ...
   → Joueur 6 équipe A confirme
   → Joueur 6 équipe B confirme

4. ✅ Automatiquement:
   → Match.status = 'confirmed'
   → Réservation.status = 'confirmed'
   → Propriétaire terrain reçoit notification
```

### Scénario 2 : Réservation Manuelle (Pas de Terrain Initial)

```
1. Manager A envoie invitation à Manager B
   - venueId = null (Pas de terrain)

2. Manager B accepte
   → Match créé (status: 'pending')
   → Pas de réservation

3. Joueurs confirment participation (6+ par équipe)
   → Match.status = 'confirmed'

4. Manager A va sur page détails du match
   → Voit bouton "Réserver un terrain"
   → Clique

5. Modal s'ouvre avec liste des terrains
   → Manager A sélectionne terrain ID 7
   → Clique "Confirmer la réservation"

6. ✅ Réservation créée:
   → Réservation.status = 'pending' (attente validation propriétaire)
   → Match.venue_booking_id = [nouvel ID]
   → Match.location_id = 7
```

### Scénario 3 : Réservation Automatique Échoue

```
1. Invitation acceptée avec venueId = 8
2. Création réservation échoue (terrain indisponible)
   → Match créé quand même
   → Pas de réservation

3. Joueurs confirment (6+ par équipe)
   → Match.status = 'confirmed'

4. Capitaine voit qu'il n'y a pas de réservation
   → Utilise bouton "Réserver un terrain"
   → Sélectionne un autre terrain
   → Réservation créée manuellement
```

---

## ✅ Avantages de la Solution

### 1. Réservation Automatique
- ✅ Moins d'actions manuelles pour les capitaines
- ✅ Pas d'oubli de réserver le terrain
- ✅ Notification automatique au propriétaire
- ✅ Terrain confirmé dès que match validé

### 2. Réservation Manuelle (Fallback)
- ✅ Flexibilité si invitation sans terrain
- ✅ Possibilité de changer de terrain
- ✅ Interface intuitive avec modal
- ✅ Sécurité : uniquement capitaines

### 3. Double Workflow
- ✅ Automatique si terrain dans invitation
- ✅ Manuel si besoin ultérieur
- ✅ Pas de blocage si réservation auto échoue

---

## 🧪 Tests à Effectuer

### Test 1 : Réservation Automatique
1. Créer invitation avec terrain et `verifyPlayerAvailability = false`
2. Accepter invitation
3. Vérifier que réservation créée avec `status = 'pending'`
4. Faire confirmer 6 joueurs équipe A
5. Faire confirmer 6 joueurs équipe B
6. ✅ Vérifier:
   - `matches.status = 'confirmed'`
   - `venue_bookings.status = 'confirmed'`
   - Logs backend confirment l'auto-confirmation

### Test 2 : Réservation Manuelle
1. Créer match sans terrain
2. Faire confirmer 6+ joueurs par équipe
3. Se connecter en tant que capitaine
4. Aller sur page détails du match
5. ✅ Vérifier bouton "Réserver un terrain" visible
6. Cliquer sur le bouton
7. ✅ Vérifier modal s'ouvre avec liste terrains
8. Sélectionner un terrain
9. Confirmer
10. ✅ Vérifier:
    - Toast success affiché
    - Badge "Terrain réservé" apparaît
    - `matches.venue_booking_id` mis à jour
    - Réservation créée en base

### Test 3 : Bouton Invisible si Conditions Non Remplies
1. Se connecter en tant que joueur (non capitaine)
2. Aller sur détails match
3. ✅ Bouton "Réserver un terrain" invisible

4. Se connecter en tant que capitaine
5. Aller sur match déjà avec réservation
6. ✅ Bouton invisible

7. Aller sur match annulé
8. ✅ Bouton invisible

### Test 4 : Permissions API
1. Tenter appel API `POST /matches/:id/book-venue` sans être capitaine
2. ✅ Erreur 403 "Only team captains can book..."

3. Tenter avec match ayant déjà une réservation
4. ✅ Erreur 400 "This match already has a venue booking"

---

## 📊 Base de Données

### Tables Impactées

**`matches`**
- `status` : Mis à jour automatiquement `'pending'` → `'confirmed'`
- `participation_validated` : Mis à `true` quand 6+ confirmations
- `venue_booking_id` : Lié à la réservation créée

**`venue_bookings`**
- `status` : Mis à jour automatiquement `'pending'` → `'confirmed'`
- `match_id` : Lien vers le match

**`match_participations`**
- `status` : `'pending'` → `'confirmed'` par les joueurs
- Trigger la validation automatique via `updateParticipation()`

---

## 🚀 Déploiement

### Backend
1. ✅ Code modifié : `utils/matchParticipation.js`
2. ✅ Endpoint ajouté : `routes/matches.js`
3. ⏳ Redémarrer serveur backend
4. ⏳ Tester endpoint manuellement (Postman/curl)

### Frontend
1. ✅ Code modifié : `MatchDetails.js`
2. ⏳ Rebuild frontend (`npm run build`)
3. ⏳ Tester interface utilisateur

### Vérifications
- [ ] Logs backend montrent les auto-confirmations
- [ ] Modal terrains fonctionne
- [ ] Bouton visible/invisible selon conditions
- [ ] Réservation automatique fonctionne
- [ ] Réservation manuelle fonctionne
- [ ] Permissions respectées

---

## 📝 Notes Importantes

1. **Transaction Safety** : La validation automatique utilise `db.execute()` (pas de transaction) car c'est déclenché après la confirmation des joueurs (opérations déjà validées individuellement).

2. **Rollback Non Nécessaire** : Si l'update de réservation échoue, le match reste confirmé (cohérent car 6+ joueurs). La réservation peut être créée manuellement ensuite.

3. **Logs Importants** : Les logs permettent de tracer les confirmations automatiques:
   ```
   Match 42 status updated from 'pending' to 'confirmed' (6+ confirmations per team)
   Venue booking 15 auto-confirmed for match 42
   ```

4. **Compatibilité** :
   - Anciens matchs créés avec `verify_player_availability = true` ne sont pas affectés (déjà `'confirmed'` dès création)
   - Nouveaux matchs avec `verify_player_availability = false` bénéficient de l'auto-confirmation

---

## ✅ Status Final

| Fonctionnalité | Status | Notes |
|----------------|--------|-------|
| Validation auto match | ✅ Implémenté | `validateMatchParticipation()` |
| Confirmation auto réservation | ✅ Implémenté | Si `venue_booking_id` existe |
| Endpoint réservation manuelle | ✅ Implémenté | `POST /matches/:id/book-venue` |
| Bouton frontend | ✅ Implémenté | Conditionnel selon permissions |
| Modal sélection terrain | ✅ Implémenté | Avec liste terrains |
| Tests manuels | ⏳ En attente | À effectuer |

**Prêt pour tests utilisateurs** 🎉

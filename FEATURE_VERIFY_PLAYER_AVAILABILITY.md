# 🎯 Feature: Vérification de Disponibilité des Joueurs

## 📋 Description

Ajout d'une option lors de la création d'invitation de match permettant de choisir entre deux modes de validation :

### Mode 1: Vérification Activée (`verifyPlayerAvailability = true`)
- **Validation stricte avant création invitation**
- Équipe envoyeuse : minimum 6 joueurs actifs requis
- Équipe receveuse : minimum 6 joueurs actifs requis lors de l'acceptation
- **Match créé avec statut `confirmed`** dès acceptation
- Workflow rapide pour matchs organisés avec effectifs garantis

### Mode 2: Vérification Désactivée (`verifyPlayerAvailability = false`)
- **Pas de validation d'effectif à la création**
- Invitation envoyée sans contrainte de nombre de joueurs
- Équipe receveuse peut accepter sans validation d'effectif
- **Match créé avec statut `pending`** après acceptation
- Confirmation finale dépend des participations individuelles des joueurs
- Workflow flexible pour matchs informels

---

## 🔧 Modifications Backend

### 1. Table `match_invitations`

**Nouvelle colonne:**
```sql
verify_player_availability BOOLEAN DEFAULT FALSE
```

**Migration:** [add_verify_player_availability_column.sql](football-network-backend/migrations/add_verify_player_availability_column.sql)

```sql
ALTER TABLE match_invitations
ADD COLUMN IF NOT EXISTS verify_player_availability BOOLEAN DEFAULT FALSE
COMMENT 'Si true, validation des 6 joueurs minimum requise avant création invitation';
```

### 2. Route: POST /api/matches/invitations

**Fichier:** [routes/matches.js:12-151](football-network-backend/routes/matches.js#L12-L151)

**Nouveau paramètre:**
```javascript
body("verifyPlayerAvailability").optional().isBoolean()
```

**Logique modifiée (lignes 61-83):**
```javascript
// Si verifyPlayerAvailability = true, vérifier que l'équipe a minimum 6 joueurs
if (verifyPlayerAvailability === true) {
  const senderValidation = await validateTeamPlayerCount(senderTeamId, 6);
  if (!senderValidation.isValid) {
    return res.status(400).json({
      error: "Insufficient players",
      message: senderValidation.message,
      playersCount: senderValidation.playersCount,
      minimumRequired: 6
    });
  }

  // Enregistrer la validation
  await logTeamValidation({
    teamId: senderTeamId,
    invitationId: null,
    validationType: 'send_invitation',
    playersCount: senderValidation.playersCount,
    minimumRequired: 6,
    isValid: true,
    validatedBy: req.user.id
  });
}
// Si false, pas de validation → invitation envoyée directement
```

**Insertion dans la base (lignes 127-143):**
```javascript
INSERT INTO match_invitations
(sender_team_id, receiver_team_id, proposed_date, proposed_location_id,
 venue_id, requires_referee, preferred_referee_id, verify_player_availability, message, expires_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

### 3. Route: PATCH /api/matches/invitations/:id/respond

**Fichier:** [routes/matches.js:306-555](football-network-backend/routes/matches.js#L306-L555)

**Logique modifiée lors de l'acceptation (lignes 372-394):**

```javascript
// Vérifier que l'équipe receveuse a minimum 6 joueurs
// (si acceptation ET si verify_player_availability = true)
if (response === 'accepted' && invitation.verify_player_availability === 1) {
  const receiverValidation = await validateTeamPlayerCount(invitation.receiver_team_id, 6);
  if (!receiverValidation.isValid) {
    return res.status(400).json({
      error: "Insufficient players",
      message: receiverValidation.message,
      playersCount: receiverValidation.playersCount,
      minimumRequired: 6
    });
  }

  // Enregistrer la validation
  await logTeamValidation({
    teamId: invitation.receiver_team_id,
    invitationId: invitationId,
    validationType: 'accept_invitation',
    playersCount: receiverValidation.playersCount,
    minimumRequired: 6,
    isValid: true,
    validatedBy: req.user.id
  });
}
```

**Statut du match créé (lignes 485-503):**
```javascript
// Déterminer le statut du match selon verify_player_availability
// Si verify_player_availability = true → 'confirmed' (validations faites)
// Si verify_player_availability = false → 'pending' (attente confirmations joueurs)
const matchStatus = invitation.verify_player_availability === 1 ? 'confirmed' : 'pending';

// Créer le match
const [matchResult] = await connection.execute(
  `INSERT INTO matches
   (home_team_id, away_team_id, match_date, location_id, venue_booking_id, has_referee, status)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [
    invitation.receiver_team_id,
    invitation.sender_team_id,
    invitation.proposed_date,
    invitation.venue_id || invitation.proposed_location_id,
    venueBookingId,
    invitation.requires_referee || false,
    matchStatus, // 'confirmed' ou 'pending'
  ]
);
```

---

## 🎨 Modifications Frontend

### Composant: SendInvitationModal

**Fichier:** [SendInvitationModal.js](football-network-frontend/src/components/matches/SendInvitationModal.js)

#### 1. Nouvel État (ligne 52)

```javascript
const [verifyPlayerAvailability, setVerifyPlayerAvailability] = useState(true);
```

**Défaut:** `true` (vérification activée par défaut pour sécurité)

#### 2. Nouvelle Section UI (après Date/Heure/Lieu)

```jsx
{/* 3. Options */}
<div className="space-y-4">
  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
    Options
  </h3>

  {/* Vérification disponibilité joueurs */}
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
    <label className="flex items-start space-x-3 cursor-pointer">
      <input
        type="checkbox"
        checked={verifyPlayerAvailability}
        onChange={(e) => setVerifyPlayerAvailability(e.target.checked)}
        className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">
            Vérifier la disponibilité des joueurs
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {verifyPlayerAvailability ? (
            <>
              <strong>Activé:</strong> Les deux équipes doivent avoir minimum 6 joueurs disponibles.
              Le match sera <strong>confirmé automatiquement</strong> dès l'acceptation de l'invitation.
            </>
          ) : (
            <>
              <strong>Désactivé:</strong> Pas de vérification immédiate.
              Le match restera en <strong>attente</strong> jusqu'à ce que les joueurs confirment leur participation.
            </>
          )}
        </p>
      </div>
    </label>
  </div>
</div>
```

**Design:**
- Checkbox avec état clair (activé/désactivé)
- Description dynamique selon l'état
- Badge bleu pour attirer l'attention
- Icône CheckCircle pour clarté

#### 3. Payload Modifié (lignes 141-156)

```javascript
const payload = {
  senderTeamId: parseInt(data.senderTeamId),
  receiverTeamId: selectedReceiver.id,
  proposedDate: proposedDate.toISOString(),
  proposedLocationId:
    data.proposedLocationId && data.proposedLocationId !== ""
      ? parseInt(data.proposedLocationId)
      : null,
  verifyPlayerAvailability: verifyPlayerAvailability, // ✅ NOUVEAU
  message: data.message,
};

const token = localStorage.getItem("token");
await axios.post(`${API_BASE_URL}/matches/invitations`, payload, {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## 🔄 Flux Complet

### Scénario A: Vérification Activée (`verifyPlayerAvailability = true`)

```
1. Capitaine A remplit formulaire
   └─ Coche "Vérifier disponibilité joueurs" (activé par défaut)

2. Clique "Envoyer invitation"
   └─ POST /api/matches/invitations { verifyPlayerAvailability: true }

3. Backend valide effectif équipe A
   ├─ Si < 6 joueurs → ERREUR "Insufficient players"
   └─ Si ≥ 6 joueurs → Invitation créée

4. Capitaine B reçoit invitation
   └─ Clique "Accepter"

5. Backend valide effectif équipe B
   ├─ Si < 6 joueurs → ERREUR "Insufficient players"
   └─ Si ≥ 6 joueurs → Continue

6. Match créé avec status = 'confirmed'
   └─ Prêt à jouer immédiatement (après validation terrain si applicable)
```

### Scénario B: Vérification Désactivée (`verifyPlayerAvailability = false`)

```
1. Capitaine A remplit formulaire
   └─ Décoche "Vérifier disponibilité joueurs"

2. Clique "Envoyer invitation"
   └─ POST /api/matches/invitations { verifyPlayerAvailability: false }

3. Backend crée invitation SANS validation effectif
   └─ Invitation envoyée même avec < 6 joueurs

4. Capitaine B reçoit invitation
   └─ Clique "Accepter"

5. Backend accepte SANS validation effectif
   └─ Pas de vérification du nombre de joueurs

6. Match créé avec status = 'pending'
   └─ Participations créées pour tous les joueurs

7. Joueurs confirment individuellement leur participation
   └─ Via /api/participations/:id (PATCH)

8. Quand minimum 6 confirmations par équipe atteint
   └─ Match peut passer à 'confirmed' (manuellement ou automatiquement)
```

---

## 📊 Comparaison des Modes

| Aspect | Vérification Activée (true) | Vérification Désactivée (false) |
|--------|----------------------------|--------------------------------|
| **Validation création** | ✅ Min 6 joueurs requis | ❌ Pas de validation |
| **Validation acceptation** | ✅ Min 6 joueurs requis | ❌ Pas de validation |
| **Statut match après acceptation** | `confirmed` | `pending` |
| **Prêt à jouer** | Immédiatement | Après confirmations joueurs |
| **Workflow** | Rapide | Flexible |
| **Cas d'usage** | Matchs officiels, compétitions | Matchs amicaux, informels |
| **Risque annulation** | Faible | Moyen (si joueurs se désistent) |

---

## 🎯 Cas d'Usage

### ✅ Vérification Activée (Recommandé pour)

- **Matchs de championnat**
- **Tournois**
- **Matchs officiels avec enjeux**
- **Réservation terrain payante**
- **Arbitre assigné**
- Besoin de garantie d'effectif

### ✅ Vérification Désactivée (Adapté pour)

- **Matchs amicaux entre amis**
- **Entraînements inter-équipes**
- **Matchs spontanés**
- **Organisation flexible**
- Disponibilité incertaine des joueurs

---

## 🧪 Tests Recommandés

### Test 1: Création invitation avec vérification activée et effectif insuffisant

```javascript
POST /api/matches/invitations
{
  "senderTeamId": 1,
  "receiverTeamId": 2,
  "proposedDate": "2025-02-01T15:00:00Z",
  "verifyPlayerAvailability": true
}

// Équipe 1 a seulement 4 joueurs actifs
// Résultat attendu: 400 Bad Request
{
  "error": "Insufficient players",
  "playersCount": 4,
  "minimumRequired": 6
}
```

### Test 2: Création invitation avec vérification désactivée

```javascript
POST /api/matches/invitations
{
  "senderTeamId": 1,
  "receiverTeamId": 2,
  "proposedDate": "2025-02-01T15:00:00Z",
  "verifyPlayerAvailability": false
}

// Équipe 1 a seulement 2 joueurs actifs
// Résultat attendu: 201 Created
{
  "message": "Match invitation sent successfully",
  "invitationId": 42
}
```

### Test 3: Acceptation avec vérification activée

```javascript
PATCH /api/matches/invitations/42/respond
{
  "response": "accepted"
}

// Invitation avec verify_player_availability = true
// Équipe B a 8 joueurs actifs
// Résultat attendu: Match créé avec status = 'confirmed'
```

### Test 4: Acceptation avec vérification désactivée

```javascript
PATCH /api/matches/invitations/43/respond
{
  "response": "accepted"
}

// Invitation avec verify_player_availability = false
// Équipe B a 3 joueurs actifs
// Résultat attendu: Match créé avec status = 'pending'
```

---

## 📝 Notes de Déploiement

### 1. Migration SQL Obligatoire

```bash
# Exécuter dans MySQL Workbench ou via CLI
mysql -u root -p football_network < migrations/add_verify_player_availability_column.sql
```

### 2. Comportement par Défaut

- **Nouvelles invitations:** `verifyPlayerAvailability = false` par défaut en DB
- **Frontend:** Checkbox cochée par défaut (`true`) pour sécurité
- **Rétrocompatibilité:** Invitations existantes traitées comme `false`

### 3. Pas de Breaking Changes

- API compatible avec anciennes versions
- Paramètre optionnel (`optional().isBoolean()`)
- Anciennes invitations sans ce champ fonctionnent normalement

---

## ✅ Statut d'Implémentation

| Composant | Statut | Fichier |
|-----------|--------|---------|
| Migration DB | ✅ Créé | `migrations/add_verify_player_availability_column.sql` |
| Route POST invitation | ✅ Modifié | `routes/matches.js:12-151` |
| Route PATCH respond | ✅ Modifié | `routes/matches.js:306-555` |
| Frontend SendInvitationModal | ✅ Modifié | `SendInvitationModal.js` |
| UI Checkbox + Description | ✅ Ajouté | Nouvelle section "Options" |
| Payload API | ✅ Mis à jour | Inclut `verifyPlayerAvailability` |
| Documentation | ✅ Complète | Ce fichier |

---

## 🚀 Prochaines Étapes (Optionnel)

### Améliorations Futures

1. **Notification différenciée:**
   - Message différent selon mode choisi
   - Alerte si désactivation avec terrain payant

2. **Statistiques:**
   - Taux d'annulation selon mode
   - Préférence utilisateurs

3. **Règles métier:**
   - Forcer vérification si arbitre assigné
   - Forcer vérification si terrain partenaire premium

4. **UX améliorée:**
   - Recommandation basée sur historique équipe
   - Warning si équipe habituellement < 6 joueurs

---

## 📚 Références

- [WORKFLOWS_ESSENTIELS.md](WORKFLOWS_ESSENTIELS.md) - Workflows généraux
- [ANALYSE_FLUX_ACCEPTATION_INVITATION.md](ANALYSE_FLUX_ACCEPTATION_INVITATION.md) - Analyse flux acceptation
- [routes/matches.js](football-network-backend/routes/matches.js) - Code backend
- [SendInvitationModal.js](football-network-frontend/src/components/matches/SendInvitationModal.js) - Code frontend

# Phase 4 - Modifications Critiques

## 🔧 Modifications à Appliquer

### 1. Migration Base de Données

**Fichier :** `football-network-backend/sql/phase4_improvements.sql`

```bash
mysql -u root -p football_network < football-network-backend/sql/phase4_improvements.sql
```

**Ce qui est ajouté :**
- ✅ Colonnes `venue_id`, `requires_referee`, `preferred_referee_id` dans `match_invitations`
- ✅ Colonnes `venue_booking_id`, `venue_confirmed` dans `matches`
- ✅ Type utilisateur `superadmin`
- ✅ Table `team_match_validations` (validation minimum joueurs)
- ✅ Colonnes `invited_email`, `invited_name` dans `player_invitations`
- ✅ Table `admin_logs` (logs admin)
- ✅ Table `system_settings` (paramètres globaux)
- ✅ Table `reports` (signalements)
- ✅ Table `bans` (sanctions)

---

### 2. Modification Route Invitation Match

**Fichier :** `football-network-backend/routes/matches.js`

**Ligne 1-7, ajouter l'import :**
```javascript
const { validateTeamPlayerCount, logTeamValidation } = require("../utils/teamValidation");
```

**Ligne 10-23, modifier la validation :**
```javascript
router.post(
  "/invitations",
  [
    authenticateToken,
    body("senderTeamId").isInt().withMessage("Sender team ID is required"),
    body("receiverTeamId").isInt().withMessage("Receiver team ID is required"),
    body("proposedDate").isISO8601().withMessage("Valid date is required"),
    body("proposedLocationId").optional({ nullable: true, checkFalsy: true }).isInt(),
    body("venueId").optional({ nullable: true, checkFalsy: true }).isInt(),  // NOUVEAU
    body("requiresReferee").optional().isBoolean(),                           // NOUVEAU
    body("preferredRefereeId").optional({ nullable: true, checkFalsy: true }).isInt(), // NOUVEAU
    body("message").optional({ nullable: true, checkFalsy: true }).isLength({ max: 500 }),
  ],
```

**Ligne 31-37, ajouter les nouveaux champs :**
```javascript
const {
  senderTeamId,
  receiverTeamId,
  proposedDate,
  proposedLocationId,
  venueId,              // NOUVEAU
  requiresReferee,      // NOUVEAU
  preferredRefereeId,   // NOUVEAU
  message,
} = req.body;
```

**Après la ligne 49 (après vérification capitaine), ajouter :**
```javascript
// NOUVEAU : Vérifier que l'équipe a minimum 6 joueurs
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
  invitationId: null, // Sera mis à jour après création
  validationType: 'send_invitation',
  playersCount: senderValidation.playersCount,
  minimumRequired: 6,
  isValid: true,
  validatedBy: req.user.id
});
```

**Ligne 93-105, modifier l'INSERT :**
```javascript
// Créer l'invitation
const [result] = await db.execute(
  `INSERT INTO match_invitations
   (sender_team_id, receiver_team_id, proposed_date, proposed_location_id,
    venue_id, requires_referee, preferred_referee_id, message, expires_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    senderTeamId,
    receiverTeamId,
    proposedDate,
    proposedLocationId || null,
    venueId || null,              // NOUVEAU
    requiresReferee || false,     // NOUVEAU
    preferredRefereeId || null,   // NOUVEAU
    message || null,
    expiresAt,
  ]
);
```

---

### 3. Modification Route Accepter Invitation

**Fichier :** `football-network-backend/routes/matches.js`

**Dans la route PATCH `/invitations/:id/respond` (vers ligne 272-380), ajouter AVANT le `connection.beginTransaction()` :**

```javascript
// NOUVEAU : Vérifier que l'équipe receveuse a minimum 6 joueurs
if (response === 'accepted') {
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

**Dans le bloc `if (response === 'accepted')` (vers ligne 344-360), modifier la création du match :**

```javascript
if (response === "accepted") {
  // Créer le match avec les infos venue et referee si fournis
  const [matchResult] = await connection.execute(
    `INSERT INTO matches
     (home_team_id, away_team_id, match_date, location_id, venue_booking_id, has_referee, status)
     VALUES (?, ?, ?, ?, ?, ?, 'confirmed')`,
    [
      invitation.receiver_team_id,
      invitation.sender_team_id,
      invitation.proposed_date,
      invitation.proposed_location_id,
      null, // venue_booking_id sera créé séparément si venueId fourni
      invitation.requires_referee || false,
    ]
  );

  const matchId = matchResult.insertId;

  // Si un arbitre préféré est spécifié, créer l'assignation
  if (invitation.preferred_referee_id) {
    await connection.execute(
      `INSERT INTO match_referee_assignments (match_id, referee_id, role, assigned_by, status)
       VALUES (?, ?, 'main', ?, 'pending')`,
      [matchId, invitation.preferred_referee_id, req.user.id]
    );
  }

  // Lier l'invitation au match créé
  await connection.execute(
    "UPDATE match_invitations SET match_id = ? WHERE id = ?",
    [matchId, invitationId]
  );
}
```

---

### 4. Modification Route Invitation Joueurs

**Fichier :** `football-network-backend/routes/teams.js`

**Chercher la route POST `/teams/:id/invite` et modifier complètement :**

```javascript
router.post(
  "/:id/invite",
  [
    authenticateToken,
    body("userIdOrEmail").trim().notEmpty().withMessage("User ID or email required"),
    body("message").optional().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const teamId = req.params.id;
      const { userIdOrEmail, message } = req.body;

      // Vérifier que l'utilisateur est capitaine
      const [teamCheck] = await db.execute(
        'SELECT id, name FROM teams WHERE id = ? AND captain_id = ?',
        [teamId, req.user.id]
      );

      if (teamCheck.length === 0) {
        return res.status(403).json({ error: "Only team captain can invite players" });
      }

      let userId = null;
      let invitedEmail = null;
      let invitedName = null;

      // Déterminer si c'est un ID ou un email
      if (!isNaN(userIdOrEmail)) {
        // C'est un ID
        userId = parseInt(userIdOrEmail);
        const [users] = await db.execute(
          "SELECT id, email, first_name, last_name FROM users WHERE id = ? AND user_type = 'player'",
          [userId]
        );

        if (users.length === 0) {
          return res.status(404).json({ error: "Player not found" });
        }

        invitedEmail = users[0].email;
        invitedName = `${users[0].first_name} ${users[0].last_name}`;
      } else {
        // C'est un email ou un nom
        const isEmail = userIdOrEmail.includes('@');

        if (isEmail) {
          // Recherche par email
          invitedEmail = userIdOrEmail;
          const [users] = await db.execute(
            "SELECT id, first_name, last_name FROM users WHERE email = ? AND user_type = 'player'",
            [invitedEmail]
          );

          if (users.length > 0) {
            userId = users[0].id;
            invitedName = `${users[0].first_name} ${users[0].last_name}`;
          }
        } else {
          // Recherche par nom
          invitedName = userIdOrEmail;
          const searchPattern = `%${userIdOrEmail}%`;
          const [users] = await db.execute(
            `SELECT id, email, first_name, last_name
             FROM users
             WHERE (CONCAT(first_name, ' ', last_name) LIKE ?
                    OR first_name LIKE ?
                    OR last_name LIKE ?)
             AND user_type = 'player'
             LIMIT 5`,
            [searchPattern, searchPattern, searchPattern]
          );

          if (users.length === 0) {
            return res.status(404).json({ error: "No player found with this name" });
          }

          if (users.length > 1) {
            // Plusieurs résultats, retourner la liste pour que l'utilisateur choisisse
            return res.status(300).json({
              message: "Multiple players found, please specify",
              players: users.map(u => ({
                id: u.id,
                name: `${u.first_name} ${u.last_name}`,
                email: u.email
              }))
            });
          }

          // Un seul résultat
          userId = users[0].id;
          invitedEmail = users[0].email;
          invitedName = `${users[0].first_name} ${users[0].last_name}`;
        }
      }

      // Vérifier si déjà membre
      if (userId) {
        const [existing] = await db.execute(
          "SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND is_active = true",
          [teamId, userId]
        );

        if (existing.length > 0) {
          return res.status(400).json({ error: "Player is already a team member" });
        }

        // Vérifier invitation en attente
        const [pendingInvites] = await db.execute(
          "SELECT id FROM player_invitations WHERE team_id = ? AND user_id = ? AND status = 'pending'",
          [teamId, userId]
        );

        if (pendingInvites.length > 0) {
          return res.status(400).json({ error: "Invitation already sent to this player" });
        }
      }

      // Générer token pour invitation externe (si pas d'userId)
      const token = !userId ? require('crypto').randomBytes(32).toString('hex') : null;
      const tokenExpires = !userId ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;

      // Créer l'invitation
      const [result] = await db.execute(
        `INSERT INTO player_invitations
         (team_id, user_id, invited_by, invited_email, invited_name, message, invitation_token, token_expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [teamId, userId, req.user.id, invitedEmail, invitedName, message || null, token, tokenExpires]
      );

      // TODO: Envoyer email si invité externe (!userId)

      res.status(201).json({
        message: "Invitation sent successfully",
        invitationId: result.insertId,
        invitedPlayer: { email: invitedEmail, name: invitedName },
        requiresEmailConfirmation: !userId
      });
    } catch (error) {
      console.error("Invite player error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
```

---

## 📦 Fichiers Créés

1. **[phase4_improvements.sql](football-network-backend/sql/phase4_improvements.sql)** - Migration complète
2. **[teamValidation.js](football-network-backend/utils/teamValidation.js)** - Helper validation joueurs

---

## ⚠️ Instructions d'Application

### Étape 1 : Migration BDD
```bash
mysql -u root -p football_network < football-network-backend/sql/phase4_improvements.sql
```

### Étape 2 : Créer le dossier utils
```bash
mkdir football-network-backend/utils
```
Le fichier `teamValidation.js` est déjà créé.

### Étape 3 : Modifier les fichiers
- Appliquer les modifications indiquées dans ce document à :
  - `matches.js` (invitation + acceptation)
  - `teams.js` (invitation joueurs)

### Étape 4 : Redémarrer le serveur
```bash
cd football-network-backend
npm start
```

---

## 🎯 Prochaine Étape

**Panel Superadmin** - À créer dans la prochaine itération

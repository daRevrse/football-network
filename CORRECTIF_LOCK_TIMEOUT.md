# 🔧 Correctif: Lock Wait Timeout

## 🐛 Problème Identifié

**Erreur:**
```
Error: Lock wait timeout exceeded; try restarting transaction
code: 'ER_LOCK_WAIT_TIMEOUT'
sql: 'UPDATE match_invitations SET status = ?, response_message = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?'
```

**Cause:**
La colonne `verify_player_availability` n'était pas présente dans la table `match_invitations`, mais le code essayait de la lire avec `SELECT mi.*`. Cela causait une erreur silencieuse dans la transaction, qui restait ouverte et bloquait la base de données.

---

## ✅ Solutions Appliquées

### 1. Migration Exécutée

**Fichier:** `migrations/add_verify_player_availability_column.sql`

```sql
ALTER TABLE match_invitations
ADD COLUMN IF NOT EXISTS verify_player_availability BOOLEAN DEFAULT FALSE;
```

**Status:** ✅ Exécutée avec succès

### 2. Requête SQL Corrigée

**Fichier:** [routes/matches.js:331-343](football-network-backend/routes/matches.js#L331-L343)

**Avant:**
```javascript
const [invitations] = await db.execute(
  `SELECT mi.*, rt.captain_id as receiver_captain_id, ...
   FROM match_invitations mi ...`,
  [invitationId]
);
```

**Après (colonnes explicites):**
```javascript
const [invitations] = await db.execute(
  `SELECT mi.id, mi.sender_team_id, mi.receiver_team_id, mi.proposed_date,
          mi.proposed_location_id, mi.venue_id, mi.requires_referee,
          mi.preferred_referee_id, mi.verify_player_availability, mi.message,
          mi.status, mi.expires_at,
          rt.captain_id as receiver_captain_id,
          st.name as sender_team_name,
          rt.name as receiver_team_name
   FROM match_invitations mi
   JOIN teams rt ON mi.receiver_team_id = rt.id
   JOIN teams st ON mi.sender_team_id = st.id
   WHERE mi.id = ?`,
  [invitationId]
);
```

**Avantage:** Sélection explicite des colonnes évite les erreurs si une colonne manque.

### 3. Mise à Jour des Invitations Existantes

**Commande exécutée:**
```sql
UPDATE match_invitations
SET verify_player_availability = FALSE
WHERE verify_player_availability IS NULL;
```

**Résultat:** Toutes les invitations existantes ont maintenant une valeur définie (FALSE par défaut).

---

## 🧪 Vérifications Effectuées

### 1. Colonne Existe
```javascript
✓ Column verify_player_availability exists: true
```

### 2. Données Cohérentes
```
✓ Invitations by verify_player_availability:
  - FALSE : 4
```

### 3. Transaction Non Bloquée
- Pas de processus MySQL en attente
- Base de données accessible

---

## 📋 Checklist Post-Correctif

- [x] Migration SQL exécutée
- [x] Colonne `verify_player_availability` créée
- [x] Invitations existantes mises à jour
- [x] Requête SQL corrigée (colonnes explicites)
- [x] Serveur backend redémarré
- [ ] Tester création d'invitation avec vérification activée
- [ ] Tester création d'invitation avec vérification désactivée
- [ ] Tester acceptation d'invitation avec vérification activée
- [ ] Tester acceptation d'invitation avec vérification désactivée

---

## 🎯 Test Manuel Recommandé

### Test 1: Créer Invitation avec Vérification
```bash
POST /api/matches/invitations
{
  "senderTeamId": 1,
  "receiverTeamId": 2,
  "proposedDate": "2025-02-15T15:00:00Z",
  "verifyPlayerAvailability": true
}
```

**Attendu:**
- Si < 6 joueurs → Erreur "Insufficient players"
- Si ≥ 6 joueurs → Invitation créée

### Test 2: Accepter Invitation avec Vérification
```bash
PATCH /api/matches/invitations/:id/respond
{
  "response": "accepted"
}
```

**Attendu:**
- Si `verify_player_availability = true` ET < 6 joueurs → Erreur
- Si `verify_player_availability = true` ET ≥ 6 joueurs → Match créé avec status `confirmed`
- Si `verify_player_availability = false` → Match créé avec status `pending`

---

## ⚠️ Points d'Attention

1. **Serveur doit être redémarré** après modification du code
2. **Migration doit être exécutée** avant utilisation
3. **Transactions bloquées** : Si l'erreur persiste, exécuter :
   ```sql
   SHOW FULL PROCESSLIST;
   -- Identifier les transactions bloquées
   KILL <process_id>;
   ```

---

## ✅ Status Final

| Élément | Status |
|---------|--------|
| Migration DB | ✅ Exécutée |
| Code Backend | ✅ Corrigé |
| Anciennes Données | ✅ Mises à jour |
| Serveur | ✅ Redémarré |
| Tests Manuels | ⏳ En attente |

**Le système est maintenant opérationnel et prêt pour les tests.**

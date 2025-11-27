# 🧪 Tests pour Verify Player Availability

## ✅ Correctifs Appliqués

1. ✅ Migration exécutée : colonne `verify_player_availability` créée
2. ✅ Requête SQL corrigée : colonnes explicites au lieu de `SELECT mi.*`
3. ✅ Anciennes invitations mises à jour avec valeur par défaut `FALSE`
4. ✅ Serveur backend redémarré et fonctionnel

---

## 📋 Tests à Effectuer

### Test 1: Créer Invitation AVEC Vérification (verifyPlayerAvailability = true)

**Prérequis:**
- Équipe A avec minimum 6 joueurs actifs
- Équipe B existante

**Étapes:**
1. Se connecter en tant que capitaine de l'équipe A
2. Aller sur "Mes Matchs" → "Invitations"
3. Cliquer "Lancer un défi"
4. Remplir le formulaire:
   - Sélectionner équipe A
   - Rechercher et sélectionner équipe B
   - Choisir date/heure
   - **Vérifier que la checkbox "Vérifier disponibilité joueurs" est COCHÉE**
5. Cliquer "Envoyer invitation"

**Résultat attendu:**
- ✅ Si équipe A a ≥ 6 joueurs : Invitation envoyée avec succès
- ❌ Si équipe A a < 6 joueurs : Erreur "Effectif insuffisant : X/6 joueurs requis"

---

### Test 2: Créer Invitation SANS Vérification (verifyPlayerAvailability = false)

**Prérequis:**
- Équipe C avec moins de 6 joueurs (ex: 3 joueurs)
- Équipe D existante

**Étapes:**
1. Se connecter en tant que capitaine de l'équipe C
2. Aller sur "Mes Matchs" → "Invitations"
3. Cliquer "Lancer un défi"
4. Remplir le formulaire:
   - Sélectionner équipe C (3 joueurs)
   - Rechercher et sélectionner équipe D
   - Choisir date/heure
   - **DÉCOCHER la checkbox "Vérifier disponibilité joueurs"**
5. Cliquer "Envoyer invitation"

**Résultat attendu:**
- ✅ Invitation envoyée avec succès MÊME avec 3 joueurs
- ✅ Message de confirmation affiché
- ✅ Description affiche : "Le match restera en attente jusqu'à ce que les joueurs confirment"

---

### Test 3: Accepter Invitation AVEC Vérification (invitation.verify_player_availability = true)

**Prérequis:**
- Invitation créée avec `verifyPlayerAvailability = true`
- Équipe B (receveuse) avec ≥ 6 joueurs

**Étapes:**
1. Se connecter en tant que capitaine de l'équipe B (receveuse)
2. Aller sur "Mes Matchs" → "Invitations" → Onglet "Reçues"
3. Cliquer sur l'invitation
4. Vérifier le badge indiquant le terrain (vert ou jaune)
5. Cliquer "Accepter"
6. Optionnel : Ajouter un message
7. Confirmer

**Résultat attendu:**
- ✅ Si équipe B a ≥ 6 joueurs : Invitation acceptée
- ✅ Match créé avec **status = `confirmed`**
- ✅ Participations créées pour tous les joueurs
- ✅ Redirection vers la liste des matchs
- ❌ Si équipe B a < 6 joueurs : Erreur "Effectif insuffisant : X/6 joueurs requis"

**Vérification en base:**
```sql
SELECT id, status FROM matches ORDER BY id DESC LIMIT 1;
-- Résultat attendu : status = 'confirmed'
```

---

### Test 4: Accepter Invitation SANS Vérification (invitation.verify_player_availability = false)

**Prérequis:**
- Invitation créée avec `verifyPlayerAvailability = false`
- Équipe D (receveuse) avec n'importe quel nombre de joueurs (même < 6)

**Étapes:**
1. Se connecter en tant que capitaine de l'équipe D (receveuse)
2. Aller sur "Mes Matchs" → "Invitations" → Onglet "Reçues"
3. Cliquer sur l'invitation
4. Cliquer "Accepter"
5. Confirmer

**Résultat attendu:**
- ✅ Invitation acceptée SANS vérification d'effectif
- ✅ Match créé avec **status = `pending`**
- ✅ Participations créées pour tous les joueurs
- ✅ Les joueurs doivent confirmer individuellement leur participation
- ✅ Message indiquant que le match est en attente de confirmation des joueurs

**Vérification en base:**
```sql
SELECT id, status FROM matches ORDER BY id DESC LIMIT 1;
-- Résultat attendu : status = 'pending'
```

---

### Test 5: Vérifier Différence Visuelle dans le Modal d'Acceptation

**Étapes:**
1. Avoir 2 invitations : une avec vérification, une sans
2. Ouvrir la première (avec vérification)
3. Observer l'interface
4. Ouvrir la deuxième (sans vérification)
5. Observer l'interface

**Résultat attendu:**
- Les deux modals se ressemblent
- Badges terrain identiques (vert si terrain, jaune sinon)
- **Note:** Pas de différence visuelle actuellement entre les deux modes
- **Amélioration future:** Ajouter un badge indiquant le mode de vérification

---

### Test 6: Workflow Complet - Mode Strict

**Scénario:** Match officiel avec vérification

**Étapes:**
1. Capitaine A crée invitation avec vérification activée (équipe A = 8 joueurs)
2. Capitaine B accepte invitation (équipe B = 7 joueurs)
3. Match créé avec status `confirmed`
4. **Vérifier que les joueurs peuvent voir le match immédiatement**
5. Capitaines peuvent commencer à gérer le match (score, etc.)

**Résultat attendu:**
- ✅ Match immédiatement prêt
- ✅ Status = `confirmed`
- ✅ Pas besoin d'attendre les confirmations joueurs

---

### Test 7: Workflow Complet - Mode Flexible

**Scénario:** Match amical sans vérification

**Étapes:**
1. Capitaine C crée invitation SANS vérification (équipe C = 4 joueurs)
2. Capitaine D accepte invitation (équipe D = 5 joueurs)
3. Match créé avec status `pending`
4. Joueurs des 2 équipes voient le match dans leurs participations
5. Les joueurs confirment individuellement leur présence
6. Une fois 6+ confirmations par équipe atteintes → Match peut passer à `confirmed`

**Résultat attendu:**
- ✅ Match créé même avec effectifs faibles
- ✅ Status = `pending`
- ✅ Workflow flexible basé sur les confirmations réelles

---

## 🐛 Erreurs à Surveiller

### Erreur 1: Lock Wait Timeout
```
Error: Lock wait timeout exceeded; try restarting transaction
```

**Cause:** Transaction bloquée dans la base de données

**Solution:**
```sql
SHOW FULL PROCESSLIST;
KILL <process_id>; -- ID du processus bloquant
```

### Erreur 2: Insufficient Players (si vérification activée)
```json
{
  "error": "Insufficient players",
  "playersCount": 4,
  "minimumRequired": 6
}
```

**Cause:** Normale si équipe a < 6 joueurs et vérification activée

**Solution:** Désactiver la vérification OU recruter plus de joueurs

### Erreur 3: Column Not Found
```
Unknown column 'verify_player_availability'
```

**Cause:** Migration non exécutée

**Solution:**
```bash
cd football-network-backend
mysql -u root -p football_network < migrations/add_verify_player_availability_column.sql
```

---

## 📊 Tableau Récapitulatif des Comportements

| Vérification | Effectif Envoyeur | Effectif Receveur | Création Invitation | Acceptation | Status Match |
|--------------|-------------------|-------------------|---------------------|-------------|--------------|
| ✅ Activée | ≥ 6 | ≥ 6 | ✅ OK | ✅ OK | `confirmed` |
| ✅ Activée | < 6 | - | ❌ Erreur | - | - |
| ✅ Activée | ≥ 6 | < 6 | ✅ OK | ❌ Erreur | - |
| ❌ Désactivée | N'importe | N'importe | ✅ OK | ✅ OK | `pending` |

---

## ✅ Checklist de Test

### Backend
- [ ] Migration exécutée
- [ ] Serveur redémarré
- [ ] Logs backend sans erreur
- [ ] Colonne `verify_player_availability` visible en DB

### Frontend
- [ ] Checkbox visible dans SendInvitationModal
- [ ] Description dynamique (activé/désactivé)
- [ ] Valeur envoyée dans le payload API

### Workflow Vérification Activée
- [ ] Création bloquée si < 6 joueurs
- [ ] Acceptation bloquée si receveur < 6 joueurs
- [ ] Match créé avec status `confirmed`
- [ ] Participations créées

### Workflow Vérification Désactivée
- [ ] Création OK même avec < 6 joueurs
- [ ] Acceptation OK même si receveur < 6 joueurs
- [ ] Match créé avec status `pending`
- [ ] Participations créées

### Cas Limites
- [ ] Invitation existante (avant migration) fonctionne
- [ ] Équipe avec exactement 6 joueurs acceptée
- [ ] Équipe avec 5 joueurs rejetée (si vérification)

---

## 🚀 Commandes Utiles

### Vérifier l'État de la Base
```bash
cd football-network-backend
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'football_network'
  });
  const [cols] = await conn.execute(
    \"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='match_invitations' AND COLUMN_NAME='verify_player_availability'\"
  );
  console.log('Column exists:', cols.length > 0);
  await conn.end();
})();
"
```

### Vérifier les Invitations
```sql
SELECT id, sender_team_id, receiver_team_id, verify_player_availability, status
FROM match_invitations
ORDER BY created_at DESC
LIMIT 5;
```

### Vérifier les Matchs Créés
```sql
SELECT m.id, m.status, m.home_team_id, m.away_team_id,
       mi.verify_player_availability
FROM matches m
LEFT JOIN match_invitations mi ON m.id = mi.match_id
ORDER BY m.created_at DESC
LIMIT 5;
```

---

## 📝 Notes pour les Testeurs

1. **Environnement de test recommandé:**
   - Minimum 4 équipes différentes
   - Équipes avec différents effectifs (3, 5, 6, 8 joueurs)
   - 2 utilisateurs minimum (pour tester envoyeur/receveur)

2. **Données de test suggérées:**
   ```sql
   -- Équipe avec peu de joueurs (3)
   -- Équipe avec effectif limite (6)
   -- Équipe avec bon effectif (8+)
   ```

3. **Ordre de test recommandé:**
   - Test 1 (création avec vérification et bon effectif)
   - Test 2 (création sans vérification et faible effectif)
   - Test 3 (acceptation avec vérification)
   - Test 4 (acceptation sans vérification)
   - Tests 6 et 7 (workflows complets)

---

**Status:** ✅ Prêt pour les tests
**Dernière mise à jour:** 2025-01-26

# Type d'utilisateur "Referee" (Arbitre)

## ✅ Implémentation complète

Le type d'utilisateur **"referee"** a été ajouté au système avec toutes les fonctionnalités nécessaires.

---

## 📋 Types d'utilisateurs disponibles

Le système supporte maintenant 5 types d'utilisateurs :

| Type | Description | Accès |
|------|-------------|-------|
| `player` | Joueur standard | Matchs, équipes, profil |
| `manager` | Manager d'équipe | Gestion équipe + accès joueur |
| `referee` | Arbitre certifié | Gestion matchs + rapports |
| `venue_owner` | Propriétaire de terrain | Gestion terrains/réservations |
| `superadmin` | Administrateur | Accès complet système |

---

## 🔧 Migration SQL appliquée

```sql
ALTER TABLE users
MODIFY COLUMN user_type ENUM('player', 'manager', 'superadmin', 'venue_owner', 'referee')
DEFAULT 'player';
```

**Script** : `node scripts/addRefereeUserType.js`
**Statut** : ✅ Appliqué avec succès

---

## 🎯 Fonctionnalités Arbitre

### 1. Inscription en tant qu'arbitre

Quand un utilisateur s'inscrit comme arbitre via `POST /api/referees`, son type d'utilisateur est **automatiquement changé en "referee"**.

```javascript
// Transaction atomique
1. Créer le profil dans la table `referees`
2. Mettre à jour user_type = 'referee' dans `users`
```

### 2. Middlewares disponibles

```javascript
const { requireReferee } = require('../middleware/auth');

// Route réservée aux arbitres
router.get('/referee-only', authenticateToken, requireReferee, handler);
```

**Middlewares disponibles** :
- `requirePlayer` - Joueurs uniquement
- `requireManager` - Managers uniquement
- `requireReferee` - Arbitres uniquement ✨ NOUVEAU
- `requireAdmin` - Admins uniquement ✨ NOUVEAU
- `requireRole(['referee', 'manager'])` - Plusieurs rôles

### 3. Routes arbitre protégées

Toutes les routes `/api/referee/matches/*` vérifient automatiquement que l'utilisateur :
1. Est authentifié
2. A un profil arbitre actif dans la table `referees`

---

## 🔐 Permissions

### Routes accessibles aux arbitres

| Route | Permission | Description |
|-------|-----------|-------------|
| `POST /api/referees` | Authentifié | S'inscrire comme arbitre |
| `GET /api/referee/matches/my-matches` | Arbitre | Voir mes matchs |
| `POST /api/referee/matches/:id/start` | Arbitre assigné | Démarrer match |
| `POST /api/referee/matches/:id/validate-score` | Arbitre assigné | Valider score |
| `POST /api/referee/matches/:id/report-incident` | Arbitre assigné | Rapporter incident |

---

## 📊 Exemple : Devenir arbitre

### 1. Un utilisateur s'inscrit normalement
```http
POST /api/auth/register
{
  "email": "john@referee.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Referee"
}
```

**Résultat** : `user_type = 'player'` (par défaut)

### 2. Il s'enregistre comme arbitre
```http
POST /api/referees
Authorization: Bearer <token>
{
  "firstName": "John",
  "lastName": "Referee",
  "email": "john@referee.com",
  "phone": "+33612345678",
  "licenseNumber": "REF-2024-001",
  "licenseLevel": "national",
  "experienceYears": 5,
  "locationCity": "Paris",
  "hourlyRate": 50.00
}
```

**Résultat** :
- ✅ Profil arbitre créé dans `referees`
- ✅ `user_type = 'referee'` automatiquement

### 3. Il accède aux routes arbitre
```http
GET /api/referee/matches/my-matches
Authorization: Bearer <token>
```

**Résultat** : ✅ Accès autorisé (type = referee)

---

## 🔄 Mise à jour automatique

Le script de migration a automatiquement mis à jour tous les utilisateurs qui avaient déjà un profil arbitre :

```sql
UPDATE users u
JOIN referees r ON r.user_id = u.id
SET u.user_type = 'referee'
WHERE u.user_type = 'player'
AND r.is_active = true
```

---

## 🎓 Workflow complet

```
1. Utilisateur s'inscrit → user_type = 'player'
2. Utilisateur devient arbitre → user_type = 'referee' (automatique)
3. Arbitre assigné à match
4. Arbitre gère le match (démarrer, valider, incidents)
5. Score certifié officiellement
```

---

## 🧪 Tests

### Test 1 : Vérifier le type après inscription arbitre
```sql
-- Avant inscription arbitre
SELECT user_type FROM users WHERE email = 'john@referee.com';
-- Résultat: player

-- Après inscription arbitre
SELECT user_type FROM users WHERE email = 'john@referee.com';
-- Résultat: referee
```

### Test 2 : Vérifier accès routes arbitre
```javascript
// Devrait échouer (403) si user_type != 'referee'
GET /api/referee/matches/my-matches

// Devrait réussir si user_type = 'referee'
GET /api/referee/matches/my-matches
```

---

## 📦 Fichiers modifiés/créés

### Créés (2)
1. `sql/add_referee_user_type.sql` - Schéma SQL
2. `scripts/addRefereeUserType.js` - Script de migration

### Modifiés (2)
1. `middleware/auth.js` - Ajout middlewares `requireReferee` et `requireAdmin`
2. `routes/referees.js` - Mise à jour automatique du user_type lors de l'inscription

---

## ✅ Validation

- ✅ Type "referee" ajouté à l'ENUM user_type
- ✅ Inscription arbitre met à jour automatiquement le type
- ✅ Middlewares `requireReferee` et `requireAdmin` créés
- ✅ Routes arbitre protégées correctement
- ✅ Transaction atomique garantit cohérence
- ✅ Utilisateurs existants mis à jour automatiquement

---

## 🚀 Déploiement

**Migration déjà appliquée** :
```bash
✅ node scripts/addRefereeUserType.js
```

**Redémarrer le serveur** pour charger les modifications :
```bash
npm start
```

---

## 📝 Notes importantes

1. **Un utilisateur ne peut avoir qu'un seul type** : player OU manager OU referee OU venue_owner OU superadmin
2. **Le changement est automatique** : Pas besoin de le gérer manuellement
3. **Réversible** : Un admin peut changer le type manuellement si nécessaire
4. **Permissions strictes** : Les routes arbitre vérifient le type ET le profil arbitre actif

---

**Date** : 2 Décembre 2025
**Version** : 1.0.1
**Statut** : ✅ Production Ready

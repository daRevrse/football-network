# Fix : Inscription Arbitre - Erreur 400

## ❌ Problème

Lors de l'inscription en tant qu'arbitre, l'utilisateur recevait une **erreur 400** même sans remplir le numéro de licence.

### Cause
1. La validation backend (`/auth/signup`) n'acceptait que `["player", "manager"]`
2. Le backend ne gérait pas la création du profil arbitre lors du signup
3. Les champs arbitre (`licenseNumber`, `licenseLevel`, `experienceYears`) n'étaient pas traités

---

## ✅ Solution implémentée

### 1. Validation mise à jour

**Fichier** : [routes/auth.js](football-network-backend/routes/auth.js#17-20)

```javascript
// AVANT
body("userType")
  .optional()
  .isIn(["player", "manager"])
  .withMessage("User type must be player or manager")

// APRÈS
body("userType")
  .optional()
  .isIn(["player", "manager", "referee"])
  .withMessage("User type must be player, manager or referee")
```

### 2. Extraction des champs arbitre

**Fichier** : [routes/auth.js](football-network-backend/routes/auth.js#53-69)

```javascript
const {
  email,
  password,
  firstName,
  lastName,
  phone,
  birthDate,
  userType = "player",
  teamName,
  position,
  skillLevel,
  locationCity,
  // Champs arbitre ✨
  licenseNumber,
  licenseLevel,
  experienceYears,
} = req.body;
```

### 3. Logique de création du profil arbitre

**Fichier** : [routes/auth.js](football-network-backend/routes/auth.js#138-163)

```javascript
// === LOGIQUE ARBITRE : CRÉATION DU PROFIL ARBITRE ===
if (userType === "referee") {
  // 1. Créer le profil arbitre dans la table referees
  await db.execute(
    `INSERT INTO referees
     (user_id, first_name, last_name, email, phone, license_number, license_level,
      experience_years, location_city)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newUserId,
      firstName,
      lastName,
      email,
      phone || null,
      licenseNumber || null,        // ✅ Optionnel
      licenseLevel || 'regional',    // ✅ Valeur par défaut
      experienceYears || 0,          // ✅ Valeur par défaut
      locationCity || null
    ]
  );

  // 2. Mettre à jour le user_type en 'referee'
  await db.execute(
    `UPDATE users SET user_type = 'referee' WHERE id = ?`,
    [newUserId]
  );
}
```

---

## 🔄 Workflow complet Arbitre

```
1. Frontend : Utilisateur remplit le formulaire "Arbitre"
   ├─ Champs obligatoires : firstName, lastName, email, password, locationCity
   └─ Champs optionnels : licenseNumber, licenseLevel, experienceYears

2. Frontend : Payload envoyé à /api/auth/signup
   {
     "userType": "referee",
     "firstName": "John",
     "lastName": "Referee",
     "email": "john@referee.com",
     "password": "SecurePass123",
     "locationCity": "Paris",
     "licenseNumber": "",           // Peut être vide
     "licenseLevel": "regional",
     "experienceYears": 5
   }

3. Backend : Validation accepte "referee"
   ✅ userType validé

4. Backend : Création du compte utilisateur
   ✅ INSERT INTO users (user_type = 'player' temporairement)

5. Backend : Détection userType === 'referee'
   ├─ ✅ INSERT INTO referees (profil arbitre créé)
   └─ ✅ UPDATE users SET user_type = 'referee'

6. Backend : Email de vérification envoyé
   ✅ Email envoyé avec token

7. Frontend : Redirection vers message "Vérifiez vos emails"
   ✅ Utilisateur reçoit confirmation
```

---

## 🧪 Tests

### Test 1 : Inscription avec tous les champs
```json
{
  "userType": "referee",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@referee.com",
  "password": "SecurePass123",
  "locationCity": "Paris",
  "licenseNumber": "REF-2024-001",
  "licenseLevel": "national",
  "experienceYears": 5
}
```
**Résultat attendu** : ✅ 201 Created

### Test 2 : Inscription SANS numéro de licence ✨
```json
{
  "userType": "referee",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@referee.com",
  "password": "SecurePass123",
  "locationCity": "Lyon",
  "licenseNumber": "",          // Vide
  "licenseLevel": "",           // Vide
  "experienceYears": ""         // Vide
}
```
**Résultat attendu** : ✅ 201 Created
- `license_number` = NULL
- `license_level` = 'regional' (défaut)
- `experience_years` = 0 (défaut)

### Test 3 : Vérification base de données
```sql
-- 1. Vérifier l'utilisateur
SELECT id, email, user_type FROM users WHERE email = 'jane@referee.com';
-- Attendu: user_type = 'referee'

-- 2. Vérifier le profil arbitre
SELECT * FROM referees WHERE email = 'jane@referee.com';
-- Attendu: profil créé avec valeurs par défaut si champs vides
```

---

## 📊 Valeurs par défaut

| Champ | Si vide/null | Valeur par défaut |
|-------|--------------|-------------------|
| `licenseNumber` | ✅ | NULL |
| `licenseLevel` | ✅ | 'regional' |
| `experienceYears` | ✅ | 0 |
| `phone` | ✅ | NULL |
| `locationCity` | ❌ | Obligatoire |

---

## 🔐 Sécurité

- ✅ Email de vérification obligatoire avant connexion
- ✅ Mot de passe hashé (bcrypt, 12 rounds)
- ✅ Token de vérification unique (32 bytes)
- ✅ Expiration du token (24h)
- ✅ Validation express-validator
- ✅ Protection contre email déjà enregistré

---

## ✅ Checklist

- ✅ Validation `userType` accepte "referee"
- ✅ Extraction des champs arbitre
- ✅ Création profil dans table `referees`
- ✅ Mise à jour `user_type` en 'referee'
- ✅ Gestion des valeurs NULL/par défaut
- ✅ Email de vérification envoyé
- ✅ Test avec champs vides
- ✅ Test avec tous les champs remplis

---

## 🚀 Déploiement

Aucune migration SQL nécessaire. Les modifications sont **uniquement dans le code backend**.

**Redémarrage requis** :
```bash
cd football-network-backend
npm start
```

---

## 📝 Notes importantes

1. **Ordre des opérations** : Le profil arbitre est créé **après** l'utilisateur mais **avant** l'envoi de l'email
2. **user_type initial** : Tous les utilisateurs sont créés avec `user_type = 'player'` puis mis à jour en 'referee' si nécessaire
3. **Champs optionnels** : Tous les champs arbitre sont optionnels (sauf ceux hérités : email, password, etc.)
4. **Double profil** : Un arbitre a un enregistrement dans `users` ET `referees`

---

**Date** : 2 Décembre 2025
**Version** : 1.0.3
**Statut** : ✅ **Fix appliqué et testé**

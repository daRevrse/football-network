# Inscription Arbitre - Frontend

## ✅ Implémentation complète

Le frontend a été adapté pour permettre l'inscription directe en tant qu'**Arbitre** dès la page d'inscription.

---

## 🎨 Modifications apportées

### 1. Sélecteur de rôle à 3 options

Le sélecteur de rôle a été étendu pour inclure **3 types d'utilisateurs** :

```
┌─────────┬─────────┬─────────┐
│ Joueur  │ Manager │ Arbitre │
└─────────┴─────────┴─────────┘
```

- **Joueur** 👤 - Position, Niveau
- **Manager** 💼 - Nom d'équipe
- **Arbitre** 🎺 - Numéro licence, Niveau licence, Expérience

### 2. Champs conditionnels pour Arbitre

Quand l'utilisateur sélectionne "Arbitre", les champs suivants s'affichent :

| Champ | Type | Obligatoire | Exemple |
|-------|------|-------------|---------|
| Numéro de licence | Texte | Non | REF-2024-001 |
| Niveau de licence | Select | Non | Régional, National, International |
| Années d'expérience | Number | Non | 5 |
| Ville | Texte | Oui | Paris |

### 3. Options niveau de licence

```javascript
- Stagiaire (trainee)
- Régional (regional)
- National (national)
- International (international)
```

---

## 🔧 Schéma de validation (Yup)

Le schéma de validation a été mis à jour pour accepter le type "referee" :

```javascript
userType: yup.string().oneOf(["player", "manager", "referee"]).required()

// Validation conditionnelle
licenseNumber: yup.string().when("userType", {
  is: "referee",
  then: (schema) => schema.optional(),
  otherwise: (schema) => schema.nullable(),
})
```

---

## 📋 Workflow d'inscription Arbitre

```
1. Utilisateur arrive sur /signup
2. Sélectionne "Arbitre" 🎺
3. Remplit :
   - Informations personnelles (prénom, nom)
   - Contact (email, téléphone)
   - Mot de passe
   - Profil arbitre (licence, niveau, expérience)
   - Ville
4. Clique sur "Devenir arbitre"
5. Backend :
   - Crée le compte user (type = 'player' temporairement)
   - Crée le profil arbitre dans la table `referees`
   - Met à jour user_type = 'referee' automatiquement
6. Utilisateur redirigé vers /dashboard
```

---

## 🎯 Payload envoyé au backend

### Exemple pour un arbitre

```json
{
  "userType": "referee",
  "email": "john.referee@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "firstName": "John",
  "lastName": "Referee",
  "phone": "+33612345678",
  "licenseNumber": "REF-2024-001",
  "licenseLevel": "national",
  "experienceYears": 5,
  "locationCity": "Paris"
}
```

**Note** : Les champs `position`, `skillLevel`, et `teamName` sont supprimés du payload avant l'envoi.

---

## 🖥️ Interface utilisateur

### Bouton "Arbitre"
```jsx
<button onClick={() => handleTypeChange("referee")}>
  <Whistle className="w-8 h-8" />
  <span>Arbitre</span>
</button>
```

### Section conditionnelle
```jsx
{userType === "referee" && (
  <>
    <InputField name="licenseNumber" label="Numéro de licence" />
    <select name="licenseLevel">
      <option value="trainee">Stagiaire</option>
      <option value="regional">Régional</option>
      <option value="national">National</option>
      <option value="international">International</option>
    </select>
    <InputField name="experienceYears" type="number" label="Années d'expérience" />
  </>
)}
```

### Bouton d'inscription dynamique
```jsx
{userType === "manager" ? "Créer mon équipe" :
 userType === "referee" ? "Devenir arbitre" :
 "S'inscrire et jouer"}
```

---

## 📱 Responsive

Le design est **entièrement responsive** :

- **Desktop** : 3 colonnes (Joueur | Manager | Arbitre)
- **Mobile** : Grille adaptative avec 3 boutons sur une ligne
- **Champs** : S'adaptent automatiquement selon la largeur d'écran

---

## 🔐 Sécurité

- ✅ Validation côté client (Yup schema)
- ✅ Validation côté serveur (express-validator)
- ✅ Nettoyage des données avant envoi
- ✅ Protection CSRF via tokens JWT
- ✅ Mots de passe hashés (bcrypt)

---

## 🧪 Tests recommandés

### Test 1 : Inscription Joueur
1. Sélectionner "Joueur"
2. Vérifier que les champs Position et Niveau s'affichent
3. Soumettre le formulaire
4. Vérifier redirection vers /dashboard

### Test 2 : Inscription Manager
1. Sélectionner "Manager"
2. Vérifier que le champ "Nom de l'équipe" s'affiche
3. Soumettre le formulaire
4. Vérifier création de l'équipe

### Test 3 : Inscription Arbitre ✨
1. Sélectionner "Arbitre"
2. Vérifier que les champs Licence, Niveau, Expérience s'affichent
3. Soumettre le formulaire
4. Vérifier dans la BD :
   - `users.user_type` = 'referee'
   - Profil créé dans `referees`
5. Vérifier redirection vers /dashboard

### Test 4 : Changement de type
1. Sélectionner "Joueur"
2. Remplir Position
3. Changer pour "Arbitre"
4. Vérifier que Position n'est plus visible
5. Vérifier que les champs Arbitre s'affichent

---

## 🎨 Design

- **Icônes** : Lucide React (Whistle pour arbitre)
- **Couleurs** : Vert (#22c55e) pour actif, Gris pour inactif
- **Transitions** : Smooth sur hover et focus
- **Effets** : Backdrop blur, gradients, ombres

---

## 📦 Fichier modifié

**Fichier** : [src/components/auth/Signup.js](football-network-frontend/src/components/auth/Signup.js)

**Lignes modifiées** :
- Import Whistle icon (ligne 18)
- Schema validation (ligne 24-79)
- onSubmit cleanup (ligne 113-140)
- Sélecteur 3 boutons (ligne 200-251)
- Section conditionnelle arbitre (ligne 465-513)
- Bouton dynamique (ligne 536-542)

---

## ✅ Checklist

- ✅ Import icône Whistle
- ✅ Validation Yup pour type "referee"
- ✅ Champs conditionnels arbitre
- ✅ Nettoyage payload avant envoi
- ✅ Bouton "Devenir arbitre"
- ✅ Layout 3 colonnes responsive
- ✅ Niveaux de licence (4 options)
- ✅ Champ expérience (number)
- ✅ Design cohérent avec le reste

---

## 🚀 Déploiement

Aucune migration nécessaire côté frontend. Les modifications sont **immédiatement actives** après redémarrage du serveur de développement.

```bash
cd football-network-frontend
npm start
```

---

## 🎉 Résultat

Les utilisateurs peuvent maintenant **s'inscrire directement comme arbitre** depuis la page d'inscription, avec un formulaire adapté et une expérience utilisateur fluide !

**Date** : 2 Décembre 2025
**Version** : 1.0.2
**Statut** : ✅ Production Ready

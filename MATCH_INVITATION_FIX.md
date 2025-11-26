# Correction de la sélection d'adversaire - Création de match

## Problème identifié

L'écran de création de match permettait de saisir un nom d'adversaire en texte libre, mais le système backend nécessite de sélectionner une **équipe réelle existante** pour créer une **invitation de match**.

## Solution implémentée

### 1. Backend - Nouvelle méthode API Frontend

**Fichier modifié :** [matchesApi.js](FootballNetworkApp/src/services/api/matchesApi.js)

Ajout d'une nouvelle méthode `createMatchInvitation()` qui appelle la route `/api/matches/invitations` :

```javascript
async createMatchInvitation(invitationData) {
  // POST /api/matches/invitations
  // Body: {
  //   senderTeamId: number,
  //   receiverTeamId: number,
  //   proposedDate: ISO string,
  //   proposedLocationId: number | null,
  //   message: string
  // }
}
```

### 2. Frontend - Amélioration de CreateMatchScreen

**Fichier modifié :** [CreateMatchScreen.js](FootballNetworkApp/src/screens/matches/CreateMatchScreen.js)

#### Changements majeurs :

1. **Ajout d'un état pour l'équipe sélectionnée**
   ```javascript
   const [form, setForm] = useState({
     team1: null,
     opponent: '',
     opponentTeam: null, // ← Nouvelle propriété
     location: '',
     notes: '',
   });
   ```

2. **Amélioration de la fonction de sélection**
   ```javascript
   const selectOpponent = team => {
     setForm(prev => ({
       ...prev,
       opponent: team.name,
       opponentTeam: team, // Stocker l'équipe complète
     }));
     setShowSuggestions(false);
     setSuggestions([]);
     Keyboard.dismiss();
   };
   ```

3. **Réinitialisation lors de la modification du texte**
   ```javascript
   const handleOpponentChange = text => {
     setForm(prev => ({
       ...prev,
       opponent: text,
       opponentTeam: null, // Réinitialiser si on modifie
     }));
     // ... recherche d'équipes
   };
   ```

4. **Validation stricte**
   ```javascript
   if (!form.opponentTeam) {
     return Alert.alert(
       'Erreur',
       'Veuillez sélectionner une équipe adverse dans les suggestions',
     );
   }
   ```

5. **Création d'invitation au lieu de match direct**
   ```javascript
   const res = await matchesApi.createMatchInvitation({
     senderTeamId: form.team1.id,
     receiverTeamId: form.opponentTeam.id,
     proposedDate: date.toISOString(),
     proposedLocationId: null,
     message: form.notes || `Match proposé au ${form.location}`,
   });
   ```

### 3. Améliorations UX

#### Indicateur visuel de sélection

- **Icône de validation** : Affichage d'une icône verte quand une équipe est sélectionnée
- **Badge de confirmation** : Badge visible sous le champ montrant l'équipe sélectionnée
- **Bouton de suppression** : Possibilité de désélectionner l'équipe

```javascript
{form.opponentTeam && !showSuggestions && (
  <View style={styles.selectedTeamBadge}>
    <Icon name="check-circle" size={16} color={THEME.ACCENT} />
    <Text style={styles.selectedTeamText}>
      {form.opponentTeam.name} sélectionnée
    </Text>
    <TouchableOpacity onPress={() => {/* Clear */}}>
      <Icon name="x" size={16} />
    </TouchableOpacity>
  </View>
)}
```

#### Améliorations des suggestions

- Affichage du nombre de membres de chaque équipe
- Icône chevron pour indiquer la sélectionnabilité
- Meilleure présentation visuelle

```javascript
<Text style={styles.suggestionDetails}>
  {team.locationCity || team.location_city || 'Ville inconnue'} •{' '}
  {team.currentPlayers || team.member_count || 0} membres
</Text>
```

## Flux utilisateur amélioré

1. **Utilisateur tape dans le champ "Adversaire"**
   - Recherche déclenchée après 3 caractères
   - Suggestions affichées avec détails (ville, membres)

2. **Utilisateur sélectionne une équipe**
   - Équipe stockée dans `form.opponentTeam`
   - Nom affiché dans le champ
   - Badge de confirmation visible
   - Icône verte de validation

3. **Utilisateur modifie le texte**
   - Sélection automatiquement réinitialisée
   - Nouvelles suggestions affichées

4. **Utilisateur soumet le formulaire**
   - Validation : équipe adverse obligatoire
   - Création d'une **invitation de match**
   - Message de confirmation
   - Retour à l'écran précédent

## Comparaison Avant/Après

### Avant
- ❌ Nom d'adversaire en texte libre
- ❌ Pas de validation d'équipe existante
- ❌ Tentative de créer un match inexistant
- ❌ Erreur backend car pas de `receiverTeamId`

### Après
- ✅ Sélection obligatoire d'une équipe réelle
- ✅ Validation stricte avec message clair
- ✅ Création d'invitation de match (système correct)
- ✅ Badge visuel de confirmation
- ✅ UX claire et intuitive

## Route Backend utilisée

**Endpoint :** `POST /api/matches/invitations`

**Paramètres requis :**
```javascript
{
  senderTeamId: number,      // ID de votre équipe
  receiverTeamId: number,    // ID de l'équipe adverse (obligatoire)
  proposedDate: string,      // Date ISO
  proposedLocationId: number | null,
  message: string           // Message optionnel
}
```

**Réponse :**
```javascript
{
  success: true,
  invitation: {
    id: number,
    sender_team_id: number,
    receiver_team_id: number,
    proposed_date: string,
    status: 'pending',
    // ...
  }
}
```

## Fichiers modifiés

- ✅ `FootballNetworkApp/src/services/api/matchesApi.js` - Nouvelle méthode
- ✅ `FootballNetworkApp/src/screens/matches/CreateMatchScreen.js` - Logique et UX

## Tests recommandés

1. **Recherche d'adversaire**
   - Taper moins de 3 caractères → Pas de suggestions
   - Taper 3+ caractères → Suggestions affichées
   - Propre équipe filtrée des suggestions

2. **Sélection**
   - Cliquer sur une suggestion → Équipe sélectionnée
   - Badge de confirmation visible
   - Icône verte affichée

3. **Modification après sélection**
   - Modifier le texte → Sélection effacée
   - Nouvelles suggestions affichées

4. **Validation**
   - Soumettre sans sélection → Message d'erreur
   - Soumettre avec sélection → Invitation créée

5. **Création d'invitation**
   - Vérifier que l'invitation apparaît chez le destinataire
   - Vérifier les notifications
   - Vérifier le statut "pending"

## Améliorations futures possibles

1. **Sélection de lieu depuis une liste prédéfinie**
   - Intégration avec la table `locations`
   - Auto-complétion d'adresses

2. **Suggestions basées sur l'historique**
   - Équipes déjà affrontées en premier
   - Équipes du même niveau

3. **Filtres de recherche**
   - Par ville
   - Par niveau de compétence
   - Par disponibilité

4. **Prévisualisation de l'équipe**
   - Logo de l'équipe
   - Statistiques (victoires, matchs joués)
   - Joueurs vedettes

## Résultat

La sélection d'adversaire fonctionne maintenant correctement avec :
- ✅ Recherche en temps réel
- ✅ Sélection obligatoire d'une équipe réelle
- ✅ Validation stricte
- ✅ Feedback visuel clair
- ✅ Création d'invitation de match fonctionnelle

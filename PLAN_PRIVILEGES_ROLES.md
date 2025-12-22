# Plan d'Application des Privilèges par Rôle

## Vue d'ensemble
Ce document présente le plan détaillé pour appliquer les privilèges basés sur les rôles (Player, Manager, Referee) à travers toute l'application mobile Football Network.

## Rôles Utilisateurs

### 1. **Player (Joueur)**
- Peut rejoindre des équipes
- Peut participer à des matchs
- Peut rechercher des joueurs/équipes
- Peut recevoir/accepter des invitations
- **NE PEUT PAS** créer des matchs (sauf s'il est capitaine)
- **NE PEUT PAS** gérer des équipes (sauf s'il est capitaine/owner)

### 2. **Manager**
- Peut créer et gérer des équipes
- Peut créer et organiser des matchs
- Peut inviter des joueurs
- Peut recruter des joueurs
- Peut gérer les compositions d'équipe
- Accès complet aux fonctionnalités de gestion

### 3. **Referee (Arbitre)**
- Peut voir les matchs assignés
- Peut valider les scores
- Peut gérer les statistiques de match
- **NE PEUT PAS** créer/gérer des équipes
- **NE PEUT PAS** créer des matchs
- Interface dédiée pour l'arbitrage

---

## Navigation Principale (MainTabNavigator)

### État Actuel ✅
- ✅ Dashboard adapté selon le rôle (PlayerDashboard, ManagerDashboard, RefereeDashboard)
- ✅ Onglet Teams masqué pour les arbitres
- ✅ Badges de notification sur Profile et Matches

### Améliorations à Apporter
- Aucune modification nécessaire

---

## 1. Teams Stack (TeamsStackNavigator)

### Écrans Actuels
1. **MyTeamsScreen** - Liste des équipes
2. **CreateTeamScreen** - Créer une équipe
3. **TeamDetailScreen** - Détails d'une équipe
4. **EditTeamScreen** - Modifier une équipe
5. **TeamMembersScreen** - Membres de l'équipe

### Permissions Requises

#### MyTeamsScreen
- **Player**:
  - Voir les équipes dont il est membre
  - Peut créer une équipe (devient alors manager de cette équipe)
  - Badge "Capitaine" si rôle = captain/owner
- **Manager**:
  - Voir toutes ses équipes (owner/captain)
  - Bouton "Créer une équipe" toujours visible
- **Referee**:
  - ❌ Pas d'accès (onglet déjà masqué)

#### CreateTeamScreen
- **Player**: ✅ Accès (peut devenir manager)
- **Manager**: ✅ Accès complet
- **Referee**: ❌ Pas d'accès

#### TeamDetailScreen
- **Player**:
  - Vue en lecture seule si simple membre
  - Boutons d'édition visibles si captain/owner
- **Manager**:
  - Accès complet si owner/captain de l'équipe
  - Boutons: Éditer, Gérer membres, Inviter, Supprimer
- **Referee**: ❌ Pas d'accès

#### EditTeamScreen
- **Player**: ✅ Si captain/owner de l'équipe
- **Manager**: ✅ Si owner/captain de l'équipe
- **Referee**: ❌ Pas d'accès

#### TeamMembersScreen
- **Player**: ✅ Vue lecture seule ou gestion si captain
- **Manager**: ✅ Gestion complète si owner/captain
- **Referee**: ❌ Pas d'accès

### Actions à Effectuer
1. ✅ Pas de changement au niveau du navigator (déjà masqué pour referee)
2. ⚠️ Vérifier les permissions dans TeamDetailScreen
3. ⚠️ Vérifier les permissions dans EditTeamScreen
4. ⚠️ Vérifier MyTeamsScreen pour bien afficher le rôle

---

## 2. Matches Stack (MatchesStackNavigator)

### Écrans Actuels
1. **MatchesScreen** - Liste des matchs (Player/Manager)
2. **RefereeMatchesScreen** - Dashboard arbitre
3. **CreateMatchScreen** - Créer un match
4. **MatchDetailScreen** - Détails d'un match
5. **PublicMatchDetailScreen** - Détails publics
6. **InvitationsScreen** - Invitations reçues

### Permissions Requises

#### MatchesScreen
- **Player**:
  - Voir ses matchs (participant)
  - Bouton "Créer un match" masqué
  - Peut accepter/refuser invitations
- **Manager**:
  - Voir ses matchs (organisés + participant)
  - Bouton "Créer un match" visible
  - Gestion complète des matchs organisés
- **Referee**:
  - ❌ N'utilise pas cet écran (utilise RefereeMatchesScreen)

#### RefereeMatchesScreen
- **Player**: ❌ Pas d'accès
- **Manager**: ❌ Pas d'accès
- **Referee**: ✅ Accès exclusif (déjà implémenté)

#### CreateMatchScreen
- **Player**: ❌ Pas d'accès (sauf si captain d'une équipe)
- **Manager**: ✅ Accès complet
- **Referee**: ❌ Pas d'accès

#### MatchDetailScreen
- **Player**:
  - Vue lecture seule
  - Peut accepter/refuser invitation
  - Pas de boutons de gestion
- **Manager**:
  - Gestion complète si organisateur
  - Boutons: Modifier, Annuler, Assigner arbitre, Gérer composition
- **Referee**:
  - Vue lecture seule
  - Zone spéciale pour valider le score si assigné

#### InvitationsScreen
- **Player**: ✅ Voir et gérer ses invitations
- **Manager**: ✅ Voir et gérer ses invitations
- **Referee**: ✅ Voir invitations d'arbitrage

### État Actuel
- ✅ Navigator déjà adapté (RefereeMatchesScreen pour referee)
- ✅ MatchDetailScreen a déjà les permissions (modifié précédemment)
- ⚠️ Vérifier MatchesScreen pour masquer le bouton "Créer" pour les players
- ⚠️ Vérifier CreateMatchScreen pour bloquer l'accès selon le rôle

### Actions à Effectuer
1. ⚠️ Modifier MatchesScreen pour masquer le bouton "Créer un match" si userType === 'player'
2. ⚠️ Ajouter une vérification dans CreateMatchScreen pour rediriger si pas manager
3. ✅ MatchDetailScreen déjà sécurisé

---

## 3. Search Stack (SearchStackNavigator)

### Écrans Actuels
1. **SearchScreen** - Recherche de joueurs/équipes

### Permissions Requises

#### SearchScreen
- **Player**:
  - Recherche de joueurs
  - Recherche d'équipes
  - Peut envoyer des demandes pour rejoindre
- **Manager**:
  - Recherche de joueurs pour recruter
  - Recherche d'équipes
  - Peut inviter des joueurs dans ses équipes
- **Referee**:
  - Recherche en lecture seule
  - Pas de fonctionnalités d'invitation

### Actions à Effectuer
1. ⚠️ Vérifier SearchScreen pour adapter les actions selon le rôle
2. ⚠️ Masquer les boutons "Inviter" pour les arbitres
3. ⚠️ Adapter les filtres selon le rôle

---

## 4. Profile Stack (ProfileStackNavigator)

### Écrans Actuels
1. **ProfileScreen** - Profil de l'utilisateur
2. **EditProfileScreen** - Modifier le profil
3. **SettingsScreen** - Paramètres
4. **PrivacyScreen** - Confidentialité
5. **HelpScreen** - Aide
6. **NotificationsCenterScreen** - Centre de notifications

### Permissions Requises

#### ProfileScreen
- **Tous les rôles**:
  - ✅ Accès complet à son propre profil
  - Statistiques adaptées selon le rôle:
    - Player: Matchs joués, buts, assists
    - Manager: Équipes gérées, matchs organisés
    - Referee: Matchs arbitrés, validations

#### EditProfileScreen
- **Tous les rôles**: ✅ Accès complet

#### SettingsScreen
- **Tous les rôles**: ✅ Accès complet

#### Autres écrans
- **Tous les rôles**: ✅ Accès complet

### Actions à Effectuer
1. ⚠️ Vérifier ProfileScreen pour afficher des statistiques adaptées au rôle
2. ⚠️ Adapter la section "Mes Statistiques" selon le type d'utilisateur

---

## 5. Feed (FeedScreen)

### Permissions Requises
- **Player**:
  - Voir le feed de ses équipes
  - Créer des posts
  - Commenter et liker
- **Manager**:
  - Voir le feed de toutes ses équipes
  - Créer des posts
  - Commenter et liker
  - Posts d'annonces d'équipe
- **Referee**:
  - Vue en lecture seule du feed public
  - Pas de création de posts

### Actions à Effectuer
1. ⚠️ Vérifier FeedScreen pour adapter les boutons selon le rôle
2. ⚠️ Masquer le bouton "Créer un post" pour les arbitres

---

## Résumé des Modifications Prioritaires

### Priorité Haute 🔴 - ✅ COMPLÉTÉ
1. ✅ **MatchesScreen**: Masquer le bouton "Créer un match" pour les players
   - Ajout de `useSelector` pour récupérer le `userType`
   - Création de `canCreateMatch = userType === 'manager'`
   - Bouton "Créer" affiché conditionnellement avec `{canCreateMatch && ...}`
   - Lien "Organiser un match" dans l'état vide également conditionnel
   - Ajout du style `headerActions` pour grouper les boutons

2. ✅ **CreateMatchScreen**: Vérifier les permissions d'accès (manager/captain)
   - Ajout de `useSelector` pour récupérer le `userType`
   - Vérification au chargement: redirection avec Alert si `userType === 'player'`
   - Alert si aucune équipe à gérer (manager sans équipe)
   - Navigation vers CreateTeam si nécessaire
   - Chargement des équipes conditionnel (seulement si pas player)

3. ✅ **SearchScreen**: Adapter les actions selon le rôle
   - Écran déjà fonctionnel (pas de boutons d'action spécifiques à masquer)
   - La navigation vers les détails reste accessible à tous les rôles
   - Les actions d'invitation sont gérées dans les écrans de détail

### Priorité Moyenne 🟡 - ✅ COMPLÉTÉ
4. ✅ **TeamDetailScreen**: Vérifier l'affichage des boutons selon le rôle
   - Ajout de `useSelector` pour récupérer `user`
   - Amélioration de la logique de permissions:
     - `isOwner = team.role === 'owner' || team.role === 'captain'`
     - `isManager = team.manager_id === user?.id`
     - `isCaptain = team.captain_id === user?.id`
     - `canManage = isOwner || isManager || isCaptain`
   - Boutons de gestion (Planifier match, Mercato) affichés uniquement si `canManage`

### Priorité Basse 🟢 - ✅ COMPLÉTÉ
5. ✅ **MyTeamsScreen**: Afficher clairement le rôle (owner/captain/member)
   - Fonction `getRoleBadge()` pour déterminer le badge selon le rôle
   - Badge "MANAGER" (vert) avec icône shield pour les owners
   - Badge "CAPITAINE" (orange) avec icône star pour les captains
   - Pas de badge pour les simples membres
   - Bouton "Gestion" affiché uniquement si `canManage`
   - Styles mis à jour pour supporter les couleurs dynamiques

### En Attente ⏳
6. **ProfileScreen**: Adapter les statistiques selon le rôle (À faire)
7. **FeedScreen**: Adapter les actions de création selon le rôle (À faire)
8. **InvitationsScreen**: Vérifier l'affichage selon le type d'invitation (À faire)

---

## Checklist de Vérification Finale

### Navigation
- [x] MainTabNavigator: Dashboards adaptés par rôle
- [x] MainTabNavigator: Onglet Teams masqué pour referee
- [x] MatchesStackNavigator: RefereeMatchesScreen pour referee
- [ ] Tous les screens ont des vérifications de permission

### Screens - Teams
- [x] MyTeamsScreen: Affichage du rôle (owner/captain/member)
- [ ] CreateTeamScreen: Accessible aux players et managers
- [x] TeamDetailScreen: Boutons conditionnels selon rôle
- [ ] EditTeamScreen: Vérification owner/captain
- [ ] TeamMembersScreen: Gestion selon rôle

### Screens - Matches
- [x] MatchesScreen: Bouton "Créer" masqué pour players
- [x] CreateMatchScreen: Protection manager/captain only
- [x] MatchDetailScreen: Permissions déjà implémentées
- [x] RefereeMatchesScreen: Interface arbitre dédiée
- [ ] InvitationsScreen: Adaptation selon type d'invitation

### Screens - Search
- [x] SearchScreen: Actions adaptées par rôle (pas de modifications nécessaires)
- [x] SearchScreen: Boutons d'invitation conditionnels (gérés dans les écrans de détail)

### Screens - Profile
- [ ] ProfileScreen: Statistiques adaptées par rôle
- [ ] EditProfileScreen: Champs spécifiques au rôle
- [ ] Autres screens: Accès universel

### Screens - Feed
- [ ] FeedScreen: Boutons de création conditionnels

---

## Notes Techniques

### Récupération du Rôle Utilisateur
```javascript
import { useSelector } from 'react-redux';

const { user } = useSelector(state => state.auth);
const userType = user?.userType; // 'player' | 'manager' | 'referee'
```

### Pattern de Vérification des Permissions
```javascript
// Dans un écran d'équipe
const isOwner = team.manager_id === user?.id;
const isCaptain = team.captain_id === user?.id;
const canManage = isOwner || isCaptain;

// Dans un écran de match
const isOrganizer = match.organizer_id === user?.id;
const isManager = userType === 'manager';
const isReferee = userType === 'referee' && match.referee_id === user?.id;
```

### Affichage Conditionnel
```javascript
{userType === 'manager' && (
  <TouchableOpacity onPress={handleCreateMatch}>
    <Text>Créer un match</Text>
  </TouchableOpacity>
)}

{canManage && (
  <TouchableOpacity onPress={handleEdit}>
    <Text>Modifier</Text>
  </TouchableOpacity>
)}
```

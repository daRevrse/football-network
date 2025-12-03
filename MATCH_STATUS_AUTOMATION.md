# Gestion Automatique des Statuts de Match

## Vue d'ensemble

Ce document décrit l'implémentation de la gestion automatique des statuts de match dans le système Football Network.

## Fonctionnalités implémentées

### 1. Changement automatique de statut au début du match
- **Déclencheur** : Lorsque l'heure de début du match (`match_date`) est atteinte
- **Condition** : Le match doit être dans le statut `confirmed`
- **Action** : Le statut passe automatiquement à `in_progress`
- **Notification** : Les deux capitaines sont notifiés du démarrage du match

### 2. Changement automatique de statut après 120 minutes
- **Déclencheur** : 120 minutes après le début du match (couvre le temps réglementaire + mi-temps + temps additionnel)
- **Condition** : Le match doit être dans le statut `in_progress`
- **Action** : Le statut passe automatiquement à `completed`
- **Notification** : Les deux capitaines sont notifiés pour saisir le score final

### 3. Gestion du match par le manager de l'équipe domicile
- Les managers (pas seulement les capitaines) de l'équipe domicile peuvent maintenant :
  - ✅ Modifier le match ([PUT /api/matches/:id](football-network-backend/routes/matches.js#1650))
  - ✅ Confirmer le match ([PATCH /api/matches/:id/confirm](football-network-backend/routes/matches.js#1759))
  - ✅ Supprimer le match ([DELETE /api/matches/:id](football-network-backend/routes/matches.js#1912))
- Les managers **et** capitaines des deux équipes peuvent :
  - ✅ Démarrer le match ([PATCH /api/matches/:id/start](football-network-backend/routes/matches.js#1974))
  - ✅ Terminer le match ([PATCH /api/matches/:id/complete](football-network-backend/routes/matches.js#2046))

### 4. Système de validation des scores (déjà en place)
Le système actuel de validation est maintenu :
- Double validation par les deux capitaines
- Système de contestation en cas de désaccord
- Historique des validations

## Architecture

### Services créés

#### 1. MatchStatusService ([services/MatchStatusService.js](football-network-backend/services/MatchStatusService.js))
Service principal qui gère automatiquement les statuts des matchs :

```javascript
// Démarrage automatique
MatchStatusService.start(1); // Vérifie toutes les minutes

// Méthodes principales
- checkMatchStatuses()       // Vérifie tous les matchs
- checkMatchesToStart()       // Démarre les matchs confirmés
- checkMatchesToComplete()    // Termine les matchs en cours après 120 min
- checkSingleMatch(matchId)   // Vérifie un match spécifique
```

#### 2. Utilitaires de permissions ([utils/matchPermissions.js](football-network-backend/utils/matchPermissions.js))
Fonctions helper pour vérifier les permissions :

```javascript
- canManageMatch(userId, matchId)        // Manager ou capitaine équipe domicile
- isHomeTeamManager(userId, matchId)     // Manager équipe domicile uniquement
- isMatchTeamManager(userId, matchId)    // Manager d'une des deux équipes
```

### Modifications de la base de données

#### Nouvelles colonnes sur la table `matches`
```sql
ALTER TABLE matches
ADD COLUMN started_at TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL,
ADD INDEX idx_status_match_date (status, match_date),
ADD INDEX idx_started_at (started_at),
ADD INDEX idx_completed_at (completed_at);
```

**Script d'application** : [scripts/applyMatchStatusSchema.js](football-network-backend/scripts/applyMatchStatusSchema.js)

```bash
node scripts/applyMatchStatusSchema.js
```

## Configuration

### Intervalle de vérification
Par défaut, le service vérifie les matchs toutes les **1 minute**. Vous pouvez modifier cet intervalle dans [server.js](football-network-backend/server.js#259) :

```javascript
// Vérifier toutes les 1 minute (recommandé)
MatchStatusService.start(1);

// Vérifier toutes les 5 minutes
MatchStatusService.start(5);
```

### Durée du match
La durée par défaut est de **120 minutes**. Vous pouvez la modifier dans [MatchStatusService.js](football-network-backend/services/MatchStatusService.js#17) :

```javascript
this.MATCH_DURATION = 120; // 120 minutes
```

## API Endpoints modifiés

### Routes avec permissions élargies aux managers

| Route | Méthode | Permission | Description |
|-------|---------|-----------|-------------|
| `/api/matches/:id` | PUT | Manager/Capitaine domicile | Modifier le match |
| `/api/matches/:id/confirm` | PATCH | Manager/Capitaine domicile | Confirmer le match |
| `/api/matches/:id/start` | PATCH | Manager/Capitaine des 2 équipes | Démarrer le match |
| `/api/matches/:id/complete` | PATCH | Manager/Capitaine des 2 équipes | Terminer le match |
| `/api/matches/:id` | DELETE | Manager/Capitaine domicile | Supprimer le match |
| `/api/matches/:id/cancel` | PATCH | Manager/Capitaine des 2 équipes | Annuler le match |

## Flux de vie d'un match

```
1. pending
   ↓ (Acceptation invitation + validation joueurs)
2. confirmed
   ↓ (Heure de début atteinte - AUTOMATIQUE)
3. in_progress
   ↓ (120 minutes écoulées - AUTOMATIQUE ou manuel)
4. completed
   ↓ (Saisie et validation des scores)
5. Scores validés
```

## Notifications envoyées

### Au démarrage automatique
- **Type** : `match_started`
- **Destinataires** : Capitaines des deux équipes
- **Message** : "Le match [Équipe A] vs [Équipe B] a démarré automatiquement."

### À la fin automatique
- **Type** : `match_completed`
- **Destinataires** : Capitaines des deux équipes
- **Message** : "Le match [Équipe A] vs [Équipe B] est terminé. Veuillez saisir le score final."

## Tests

### Test manuel du service

1. Créer un match avec une date dans le passé proche :
```sql
UPDATE matches
SET match_date = DATE_SUB(NOW(), INTERVAL 2 MINUTE),
    status = 'confirmed'
WHERE id = [match_id];
```

2. Attendre 1 minute (intervalle de vérification)

3. Vérifier que le statut est passé à `in_progress` :
```sql
SELECT id, status, started_at FROM matches WHERE id = [match_id];
```

4. Attendre que 120 minutes se soient écoulées ou modifier manuellement :
```sql
UPDATE matches
SET started_at = DATE_SUB(NOW(), INTERVAL 121 MINUTE)
WHERE id = [match_id];
```

5. Attendre 1 minute et vérifier que le statut est passé à `completed`

### Test des permissions manager

1. Créer un utilisateur manager (non capitaine) d'une équipe
2. Essayer de modifier un match où cette équipe est l'équipe domicile
3. Vérifier que la requête aboutit avec succès

## Logs du service

Le service génère des logs détaillés :

```
✅ Starting MatchStatusService (checking every 1 minute(s))
🔍 Checking match statuses at 2025-12-02T13:38:09.437Z
🎯 Found 2 match(es) to start
✅ Match 42 started automatically: Team A vs Team B
🏁 Found 1 match(es) to complete
✅ Match 38 completed automatically: Team C vs Team D
```

## Arrêt propre du service

Le service s'arrête automatiquement lors de l'arrêt du serveur :

```javascript
process.on('SIGTERM', () => {
  MatchStatusService.stop();
  server.close();
});
```

## Améliorations futures possibles

1. **Durée de match configurable** : Permettre une durée différente selon le type de match (7v7, 11v11, etc.)
2. **Notifications push** : Envoyer des notifications push mobiles en plus des notifications web
3. **Statistiques** : Tracker le nombre de matchs démarrés/terminés automatiquement
4. **API admin** : Permettre aux admins de forcer le changement de statut
5. **Rappels** : Envoyer des rappels 15 minutes avant le début du match
6. **Validation automatique** : Si un arbitre est présent, valider automatiquement les scores

## Support

Pour toute question ou problème, consulter :
- Les logs du serveur
- La table `match_validations` pour l'historique
- La table `notifications` pour vérifier l'envoi des notifications

## Fichiers modifiés/créés

### Nouveaux fichiers
- [football-network-backend/services/MatchStatusService.js](football-network-backend/services/MatchStatusService.js)
- [football-network-backend/utils/matchPermissions.js](football-network-backend/utils/matchPermissions.js)
- [football-network-backend/scripts/applyMatchStatusSchema.js](football-network-backend/scripts/applyMatchStatusSchema.js)
- [football-network-backend/sql/match_status_automation.sql](football-network-backend/sql/match_status_automation.sql)

### Fichiers modifiés
- [football-network-backend/server.js](football-network-backend/server.js) - Intégration du service
- [football-network-backend/routes/matches.js](football-network-backend/routes/matches.js) - Permissions élargies aux managers

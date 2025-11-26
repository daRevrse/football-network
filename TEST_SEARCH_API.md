# Test de l'API de Recherche

## Comment tester

### 1. Démarrer le backend
```bash
cd football-network-backend
npm start
```

### 2. Tests avec curl ou Postman

#### a) Recherche globale (tous les types)
```bash
curl -X GET "http://192.168.1.97:5000/api/search?q=paris" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### b) Recherche d'équipes uniquement
```bash
curl -X GET "http://192.168.1.97:5000/api/search?q=paris&type=teams" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### c) Recherche de joueurs uniquement
```bash
curl -X GET "http://192.168.1.97:5000/api/search?q=jean&type=players" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### d) Recherche de matchs uniquement
```bash
curl -X GET "http://192.168.1.97:5000/api/search?q=paris&type=matches" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### e) Récupérer des suggestions
```bash
curl -X GET "http://192.168.1.97:5000/api/search/suggestions" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Tester depuis l'application mobile

1. Assurez-vous que le backend est démarré
2. Lancez l'application React Native
3. Naviguez vers l'écran de recherche
4. Tapez au moins 3 caractères dans la barre de recherche
5. Vérifiez que les résultats s'affichent correctement

## Structure de la réponse API

### Recherche globale
```json
{
  "success": true,
  "query": "paris",
  "results": {
    "teams": [
      {
        "id": 1,
        "name": "Paris FC",
        "city": "Paris",
        "description": "...",
        "logoUrl": "/uploads/teams/team-logo-123.jpg",
        "bannerUrl": "/uploads/teams/variants/banner-medium-456.jpg",
        "members": 5,
        "created_at": "2025-01-20T..."
      }
    ],
    "players": [
      {
        "id": 1,
        "name": "John Doe",
        "first_name": "John",
        "last_name": "Doe",
        "position": "Attaquant",
        "profilePictureUrl": "/uploads/users/profile-789.jpg",
        "bio": "...",
        "teams_count": 2
      }
    ],
    "matches": [
      {
        "id": 1,
        "date": "2025-02-15T14:00:00.000Z",
        "location": "Stade de Paris",
        "status": "scheduled",
        "match_type": "friendly",
        "team1": {
          "id": 1,
          "name": "Paris FC",
          "logoUrl": "/uploads/teams/team1-logo.jpg"
        },
        "team2": {
          "id": 2,
          "name": "Lyon FC",
          "logoUrl": "/uploads/teams/team2-logo.jpg"
        }
      }
    ]
  },
  "count": {
    "teams": 1,
    "players": 1,
    "matches": 1,
    "total": 3
  }
}
```

### Notes sur les URLs d'images
- Les URLs d'images sont relatives et doivent être préfixées avec l'URL du serveur
- Format complet: `http://192.168.1.97:5000${logoUrl}`
- Les logos d'équipes sont dans `/uploads/teams/`
- Les photos de profil sont dans `/uploads/users/`
- Les banners utilisent des variants (small, medium, large) pour optimiser le chargement

## Fonctionnalités implémentées

✅ Recherche globale (équipes, joueurs, matchs)
✅ Filtres par type (all, teams, players, matches)
✅ Debounce de 600ms pour éviter trop de requêtes
✅ Historique des recherches récentes (stocké localement)
✅ Suggestions de recherche
✅ Affichage des résultats avec badges et icônes colorées
✅ Navigation vers les détails (à compléter pour les joueurs/matchs)
✅ Gestion des états de chargement et des erreurs
✅ Interface moderne avec thème dark

## Notes importantes

- La recherche nécessite au moins 2 caractères
- L'authentification est requise (token JWT)
- Les résultats sont limités à 20 par type
- Les recherches récentes sont limitées à 10 entrées

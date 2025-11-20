# Configuration de l'envoi d'emails

## Pour le développement (Ethereal Email)

Ethereal Email est un service SMTP de test qui capture les emails sans les envoyer réellement.

### Étapes :

1. Créer un compte de test sur [Ethereal Email](https://ethereal.email/create)
2. Copier les identifiants générés
3. Mettre à jour le fichier `.env` :

```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=votre_username@ethereal.email
SMTP_PASS=votre_mot_de_passe
FROM_EMAIL=noreply@football-network.com
```

4. Quand un email est envoyé, le lien de preview s'affiche dans la console du serveur

## Pour la production

### Option 1 : Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre.email@gmail.com
SMTP_PASS=votre_app_password
FROM_EMAIL=votre.email@gmail.com
```

**Important :** Pour Gmail, vous devez créer un "App Password" :
1. Activer la validation en 2 étapes sur votre compte Google
2. Aller dans "Sécurité" > "Mots de passe des applications"
3. Générer un mot de passe d'application pour "Mail"
4. Utiliser ce mot de passe dans SMTP_PASS

### Option 2 : SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=votre_api_key_sendgrid
FROM_EMAIL=noreply@votredomaine.com
```

### Option 3 : Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@votredomaine.mailgun.org
SMTP_PASS=votre_password_mailgun
FROM_EMAIL=noreply@votredomaine.com
```

## Test de l'envoi d'emails

Pour tester l'envoi d'emails, vous pouvez :

1. Utiliser l'interface frontend : `/forgot-password`
2. Ou tester via curl :

```bash
curl -X POST http://localhost:5000/api/password/forgot \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Flux de réinitialisation de mot de passe

1. L'utilisateur demande un reset via `/forgot-password`
2. Le système génère un token sécurisé
3. Un email est envoyé avec le lien de réinitialisation
4. L'utilisateur clique sur le lien (valide 1 heure)
5. L'utilisateur entre un nouveau mot de passe
6. Le token est marqué comme utilisé

## Sécurité

- Les tokens sont hashés avec SHA-256 avant stockage
- Les tokens expirent après 1 heure
- Un token ne peut être utilisé qu'une seule fois
- Les anciens tokens non utilisés sont invalidés lors d'une nouvelle demande

#!/bin/bash

# Script d'application de la migration Phase 1
# Football Network - Stades & Arbitres

echo "========================================"
echo "Football Network - Phase 1 Migration"
echo "========================================"
echo ""

# Variables
DB_NAME="football_network"
BACKUP_FILE="backup_pre_phase1_$(date +%Y%m%d_%H%M%S).sql"
MIGRATION_FILE="phase1_schema_extensions.sql"

# Vérifier que le fichier de migration existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Erreur: Le fichier $MIGRATION_FILE n'existe pas"
    exit 1
fi

echo "📊 Base de données: $DB_NAME"
echo "💾 Fichier de sauvegarde: $BACKUP_FILE"
echo "📄 Script de migration: $MIGRATION_FILE"
echo ""

# Demander confirmation
read -p "⚠️  Voulez-vous continuer? (o/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo "❌ Migration annulée"
    exit 1
fi

# Demander les credentials MySQL
read -p "Utilisateur MySQL (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Mot de passe MySQL: " DB_PASSWORD
echo ""
echo ""

# Étape 1: Sauvegarde
echo "📦 Étape 1/3: Sauvegarde de la base de données..."
mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Sauvegarde créée: $BACKUP_FILE"
else
    echo "❌ Erreur lors de la sauvegarde"
    exit 1
fi

# Étape 2: Application de la migration
echo ""
echo "🚀 Étape 2/3: Application de la migration..."
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$MIGRATION_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Migration appliquée avec succès"
else
    echo "❌ Erreur lors de la migration"
    echo "💡 Pour restaurer la sauvegarde:"
    echo "   mysql -u $DB_USER -p $DB_NAME < $BACKUP_FILE"
    exit 1
fi

# Étape 3: Vérification
echo ""
echo "🔍 Étape 3/3: Vérification..."

# Compter les nouvelles tables
TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = '$DB_NAME'
    AND table_name IN ('venue_pricing', 'venue_partnerships', 'venue_bookings', 'venue_ratings',
                       'referees', 'referee_availability', 'match_referee_assignments',
                       'referee_ratings', 'referee_certifications')
" 2>/dev/null)

echo "📊 Nouvelles tables créées: $TABLE_COUNT/9"

if [ "$TABLE_COUNT" -eq 9 ]; then
    echo "✅ Toutes les tables ont été créées"
else
    echo "⚠️  Attention: Il manque $((9 - TABLE_COUNT)) table(s)"
fi

echo ""
echo "========================================"
echo "✨ Migration Phase 1 terminée!"
echo "========================================"
echo ""
echo "📝 Sauvegarde disponible: $BACKUP_FILE"
echo "📖 Documentation: ../PHASE1_IMPLEMENTATION.md"
echo ""
echo "🎯 Prochaine étape: Phase 2 - Backend Routes"
echo ""

@echo off
setlocal enabledelayedexpansion

REM Script d'application de la migration Phase 1
REM Football Network - Stades & Arbitres

echo ========================================
echo Football Network - Phase 1 Migration
echo ========================================
echo.

REM Variables
set DB_NAME=football_network
set MIGRATION_FILE=phase1_schema_extensions.sql

REM Générer un nom de fichier de sauvegarde avec timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set BACKUP_FILE=backup_pre_phase1_%mydate%_%mytime%.sql

REM Vérifier que le fichier de migration existe
if not exist "%MIGRATION_FILE%" (
    echo ❌ Erreur: Le fichier %MIGRATION_FILE% n'existe pas
    pause
    exit /b 1
)

echo 📊 Base de données: %DB_NAME%
echo 💾 Fichier de sauvegarde: %BACKUP_FILE%
echo 📄 Script de migration: %MIGRATION_FILE%
echo.

REM Demander confirmation
set /p CONFIRM="⚠️  Voulez-vous continuer? (o/n): "
if /i not "%CONFIRM%"=="o" (
    echo ❌ Migration annulée
    pause
    exit /b 1
)

REM Demander les credentials MySQL
set /p DB_USER="Utilisateur MySQL (default: root): "
if "%DB_USER%"=="" set DB_USER=root

echo.
set "psCommand=powershell -Command "$pword = read-host 'Mot de passe MySQL' -AsSecureString ; ^
    $BSTR=[System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pword); ^
    [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)""
for /f "usebackq delims=" %%p in (`%psCommand%`) do set DB_PASSWORD=%%p

echo.

REM Étape 1: Sauvegarde
echo 📦 Étape 1/3: Sauvegarde de la base de données...
mysqldump -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% > %BACKUP_FILE% 2>nul

if %errorlevel% equ 0 (
    echo ✅ Sauvegarde créée: %BACKUP_FILE%
) else (
    echo ❌ Erreur lors de la sauvegarde
    echo 💡 Vérifiez que MySQL est installé et accessible
    pause
    exit /b 1
)

REM Étape 2: Application de la migration
echo.
echo 🚀 Étape 2/3: Application de la migration...
mysql -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < %MIGRATION_FILE% 2>nul

if %errorlevel% equ 0 (
    echo ✅ Migration appliquée avec succès
) else (
    echo ❌ Erreur lors de la migration
    echo 💡 Pour restaurer la sauvegarde:
    echo    mysql -u %DB_USER% -p %DB_NAME% ^< %BACKUP_FILE%
    pause
    exit /b 1
)

REM Étape 3: Vérification
echo.
echo 🔍 Étape 3/3: Vérification...
echo 📊 Vérification des nouvelles tables...

mysql -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "SHOW TABLES LIKE 'venue%%';" 2>nul
mysql -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "SHOW TABLES LIKE 'referee%%';" 2>nul

echo.
echo ========================================
echo ✨ Migration Phase 1 terminée!
echo ========================================
echo.
echo 📝 Sauvegarde disponible: %BACKUP_FILE%
echo 📖 Documentation: ..\PHASE1_IMPLEMENTATION.md
echo.
echo 🎯 Prochaine étape: Phase 2 - Backend Routes
echo.
pause

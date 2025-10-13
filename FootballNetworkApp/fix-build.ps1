# fix-build.ps1 - Version Agressive
Write-Host "=== Nettoyage COMPLET du build Android ===" -ForegroundColor Cyan

# 1. Arrêter tous les processus
Write-Host "Arrêt des processus..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Stop-Process -Name java -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Supprimer tous les .cxx (CMake cache)
Write-Host "Suppression des caches CMake..." -ForegroundColor Yellow
Get-ChildItem -Path .\node_modules -Recurse -Directory -Filter ".cxx" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# 3. Supprimer builds Android
Write-Host "Suppression des builds Android..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .\android\.gradle -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\android\app\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\android\build -ErrorAction SilentlyContinue

# 4. Supprimer caches Gradle globaux
Write-Host "Suppression des caches Gradle globaux..." -ForegroundColor Yellow
$gradleCaches = "$env:USERPROFILE\.gradle\caches"
if (Test-Path $gradleCaches) {
    Remove-Item -Recurse -Force $gradleCaches -ErrorAction SilentlyContinue
}

# 5. Supprimer le dossier .cxx de l'app si existe
Write-Host "Nettoyage final..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .\android\app\.cxx -ErrorAction SilentlyContinue

Write-Host "`n=== Nettoyage terminé! ===" -ForegroundColor Green
Write-Host "Exécutez maintenant: npm run android" -ForegroundColor Green
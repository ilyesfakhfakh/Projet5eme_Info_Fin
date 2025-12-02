@echo off
echo ========================================
echo ARRET DE TOUS LES SERVEURS
echo ========================================
echo.

echo Arret de tous les processus Node.js...
taskkill /F /IM node.exe >nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ Serveurs arretes avec succes!
) else (
    echo ℹ️  Aucun serveur en cours d'execution
)

echo.
echo ========================================
echo TOUS LES SERVEURS SONT ARRETES
echo ========================================
echo.
pause

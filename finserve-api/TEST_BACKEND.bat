@echo off
echo ========================================
echo TEST BACKEND STREAMING
echo ========================================
echo.

echo [1/3] Arret du backend actuel...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo.
echo [2/3] Demarrage du backend...
echo.
cd /d "%~dp0"
start cmd /k "npm start"

echo.
echo [3/3] Attendre 10 secondes pour le demarrage...
timeout /t 10

echo.
echo ========================================
echo VERIFICATION:
echo ========================================
echo.
echo 1. Regarde la console qui vient de s'ouvrir
echo.
echo TU DOIS VOIR:
echo   [OK] Connection has been established successfully
echo   [OK] Database resync done successfully
echo   [OK] Socket.IO streaming initialized
echo   [OK] Streaming routes loaded
echo   [OK] Simulateur de Marche API (HTTP) avec Socket.IO sur le port 3200
echo.
echo 2. Ouvre dans le navigateur:
echo    http://localhost:3200/api/v1/streaming/live
echo.
echo TU DOIS VOIR:
echo    {"success":true,"count":0,"streams":[]}
echo.
echo ========================================
echo.
pause

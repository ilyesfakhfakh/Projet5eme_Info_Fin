@echo off
echo ========================================
echo DEMARRAGE COMPLET DU PROJET
echo ========================================
echo.

echo [1/2] Demarrage du BACKEND (port 3200)...
cd /d "%~dp0finserve-api"
start "Backend API" cmd /k "npm start"
timeout /t 3 >nul

echo.
echo [2/2] Demarrage du FRONTEND (port 3000)...
cd /d "%~dp0berry-free-react-admin-template\vite"
start "Frontend React" cmd /k "npm start"

echo.
echo ========================================
echo SERVEURS EN COURS DE DEMARRAGE
echo ========================================
echo.
echo Backend:  http://localhost:3200
echo Frontend: http://localhost:3000/free
echo.
echo Attendre 10 secondes pour le demarrage complet...
timeout /t 10

echo.
echo Les deux fenetres de serveurs sont ouvertes!
echo NE PAS LES FERMER pendant que vous utilisez l'app.
echo.
pause

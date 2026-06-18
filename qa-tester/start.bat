@echo off
echo ========================================
echo  QA Tester - BBV Inversiones
echo ========================================
echo.

echo [1/2] Iniciando backend (puerto 5050)...
start "QA-Backend" cmd /c "cd /d %~dp0backend && python main.py"

echo [2/2] Iniciando frontend (puerto 5174)...
start "QA-Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"

echo.
echo Backend:  http://localhost:5050
echo Frontend: http://localhost:5174
echo.
echo Espera unos segundos a que ambos servidores inicien...
pause

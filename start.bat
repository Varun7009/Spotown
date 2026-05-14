@echo off
setlocal enabledelayedexpansion
title Spotown - Launcher
cls

echo.
echo    ============================================================
echo         SPOTOWN  --  MUSIC DOWNLOADER ENGINE
echo    ============================================================
echo.
echo    [1/3] Starting Spotown Backend Server...
start "Spotown Backend" cmd /c "npx ts-node server.ts"

echo    [2/3] Starting Spotown Frontend Server...
start "Spotown Frontend" cmd /c "npm run dev"

echo.
echo    [3/3] Waiting for servers to initialize (5s)...
timeout /t 5 /nobreak > nul

echo.
echo    ============================================================
echo    [DONE] Launching Spotown in your browser...
echo    ============================================================
echo.
start http://localhost:3000

echo.
echo    Everything is up and running! 
echo.
echo    - Keep the two separate windows open to keep the app alive.
echo    - If you close them, the app will stop working.
echo.
pause

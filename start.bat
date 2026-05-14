@echo off
setlocal enabledelayedexpansion
title Spotown - Launching
mode con: cols=100 lines=30

:: Clear screen and set colors
cls
color 0A

echo.
echo    ================================================================================
echo      ____  ____   ___  _______  _____  _      _  __ _  
echo     / ___||  _ \ / _ \/__   __||  _  || |    | ||  \ | | 
echo     \___ \| |_) | | | |  | |   | | | || | /\ | ||   \| | 
echo      ___) |  __/| |_| |  | |   | |_| || |/  \| || |\   | 
echo     |____/|_|    \___/   |_|   \_____/\__/  \__/|_| \__| 
echo.
echo    ================================================================================
echo.
echo    [1/3] Starting Spotown Backend (Port 3001)...
start "Spotown Backend" cmd /c "npx ts-node server.ts"

echo    [2/3] Starting Spotown Frontend (Port 3000)...
start "Spotown Frontend" cmd /c "npm run dev"

echo    [3/3] Waiting for servers to initialize...
timeout /t 5 /nobreak > nul

echo    [DONE] Launching Browser...
start http://localhost:3000

echo.
echo    --------------------------------------------------------------------------------
echo    Everything is running! 
echo    - Keep the two black windows open to keep the site running.
echo    - Close them when you want to stop the servers.
echo    --------------------------------------------------------------------------------
echo.
pause

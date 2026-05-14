@echo off
setlocal enabledelayedexpansion
title Spotown Installer
cls

echo.
echo    ============================================================
echo         SPOTOWN  --  INSTALLER AND SETUP
echo    ============================================================
echo.
echo    This script will check and install all required
echo    components so Spotown can run on your computer.
echo.

echo    Checking for Windows Package Manager (winget)...
winget --version 1>NUL 2>NUL
if %errorlevel% neq 0 (
    echo.
    echo    [ERROR] winget was not found on your system.
    echo    Please install "App Installer" from the Microsoft Store.
    echo.
    pause
    exit /b 1
)
echo    [OK] winget found.
echo.

echo    Scanning for installed components...
echo.

set "hasNode=0"
set "hasPython=0"
set "hasFFmpeg=0"
set "hasYTDLP=0"

node -v 1>NUL 2>NUL
if %errorlevel% equ 0 set "hasNode=1"

python --version 1>NUL 2>NUL
if %errorlevel% equ 0 set "hasPython=1"

ffmpeg -version 1>NUL 2>NUL
if %errorlevel% equ 0 set "hasFFmpeg=1"

yt-dlp --version 1>NUL 2>NUL
if %errorlevel% equ 0 set "hasYTDLP=1"

echo    COMPONENT           STATUS          DOWNLOAD SIZE
echo    ============================================================
if !hasNode! equ 1 (echo    Node.js LTS         Installed       --) else (echo    Node.js LTS         MISSING         ~30 MB)
if !hasPython! equ 1 (echo    Python 3.x          Installed       --) else (echo    Python 3.x          MISSING         ~25 MB)
if !hasFFmpeg! equ 1 (echo    FFmpeg              Installed       --) else (echo    FFmpeg              MISSING         ~100 MB)
if !hasYTDLP! equ 1 (echo    yt-dlp              Installed       --) else (echo    yt-dlp              MISSING         ~15 MB)
echo    npm packages        Will install    ~50 MB
echo    ============================================================
echo.

if !hasNode! equ 1 (
    if !hasPython! equ 1 (
        if !hasFFmpeg! equ 1 (
            if !hasYTDLP! equ 1 (
                echo    All tools are already installed. Running npm install...
                echo.
                call npm install
                goto :done
            )
        )
    )
)

set /p "confirm=    Install missing components now? (y/n): "
if /i not "!confirm!" == "y" (
    echo.
    echo    Cancelled.
    pause
    exit /b 0
)

echo.
echo    ============================================================
echo    INSTALLING - Please wait, this may take a few minutes.
echo    ============================================================
echo.

if !hasNode! equ 0 (
    echo    Step 1/4 - Installing Node.js LTS...
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    echo    Step 1/4 - Done.
    echo.
) else (
    echo    Step 1/4 - Node.js already installed. Skipped.
)

if !hasPython! equ 0 (
    echo    Step 2/4 - Installing Python 3...
    winget install Python.Python.3.12 --silent --accept-package-agreements --accept-source-agreements
    echo    Step 2/4 - Done.
    echo.
) else (
    echo    Step 2/4 - Python already installed. Skipped.
)

if !hasFFmpeg! equ 0 (
    echo    Step 3/4 - Installing FFmpeg...
    winget install Gyan.FFmpeg --silent --accept-package-agreements --accept-source-agreements
    echo    Step 3/4 - Done.
    echo.
) else (
    echo    Step 3/4 - FFmpeg already installed. Skipped.
)

if !hasYTDLP! equ 0 (
    echo    Step 4/4 - Installing yt-dlp...
    winget install yt-dlp.yt-dlp --silent --accept-package-agreements --accept-source-agreements
    echo    Step 4/4 - Done.
    echo.
) else (
    echo    Step 4/4 - yt-dlp already installed. Skipped.
)

echo    Final step - Installing npm packages...
call npm install

:done
echo.
echo    ============================================================
echo    SETUP COMPLETE - You are ready to go!
echo    ============================================================
echo.
echo    IMPORTANT: If you just installed Node, Python or FFmpeg,
echo    please CLOSE this window and open a new one before
echo    running start.bat
echo.
echo    Then just run start.bat and Spotown will launch!
echo.
pause

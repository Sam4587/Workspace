@echo off
echo ========================================
echo    AI Content Flow - Browser Detector
echo ========================================
echo.
echo Detecting browsers...
echo.

cd /d "%~dp0"

if not exist "scripts\detect-browser.cjs" (
    echo [ERROR] Cannot find scripts\detect-browser.cjs
    echo Please run this script from project root
    pause
    exit /b 1
)

node scripts\detect-browser.cjs

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to detect browsers
    echo.
    pause
)

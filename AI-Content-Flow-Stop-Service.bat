@echo off
echo ========================================
echo    AI Content Flow - Service Stopper
echo ========================================
echo.
echo Stopping services...
echo.

cd /d "%~dp0"

if not exist "scripts\stop-service.cjs" (
    echo [ERROR] Cannot find scripts\stop-service.cjs
    echo Please run this script from project root
    pause
    exit /b 1
)

node scripts\stop-service.cjs

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to stop services
    echo.
    pause
)

@echo off
echo ========================================
echo    AI Content Flow - Service Diagnostic
echo ========================================
echo.
echo Running diagnostics...
echo.

cd /d "%~dp0"

if not exist "scripts\diagnose-services.cjs" (
    echo [ERROR] Cannot find scripts\diagnose-services.cjs
    echo Please run this script from project root
    pause
    exit /b 1
)

node scripts\diagnose-services.cjs

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Diagnostic failed
    echo.
    pause
)

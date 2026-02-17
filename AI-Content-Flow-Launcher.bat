@echo off
setlocal enabledelayedexpansion

:: Set UTF-8 encoding
call :setUTF8

title AI Content Flow Launcher

cls

echo.
echo ============================================
echo    AI Content Flow Launcher
echo ============================================
echo.
echo  Starting project services...
echo.
echo  Service Port Configuration:
echo    Frontend: http://localhost:5174
echo    Backend:  http://localhost:5001
echo    MongoDB:  27017
echo    Redis:    6379
echo.

:: Check Node.js
echo [Check] Checking Node.js environment...
node --version >nul 2>&1
if errorlevel 1 (
    echo [Error] Node.js not detected. Please install Node.js 18+
    echo [Info] Download: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('node --version') do (
    echo [OK] Node.js version: %%a
)

:: Switch to project directory
cd /d "%~dp0"
echo [Info] Project directory: %CD%

:: Check scripts directory
echo [Check] Checking launcher script...
if not exist "scripts\project-launcher.cjs" (
    echo [Error] Launcher script not found: scripts\project-launcher.cjs
    echo [Info] Please ensure running from project root
    pause
    exit /b 1
)
echo [OK] Launcher script found

:: Start project
echo.
echo [Start] Starting services...
echo.

node scripts/project-launcher.cjs %*

:: Get exit code
set EXIT_CODE=%ERRORLEVEL%

:: Pause if failed
if %EXIT_CODE% neq 0 (
    echo.
    echo [Error] Startup failed, exit code: %EXIT_CODE%
    echo.
    pause
)

exit /b %EXIT_CODE%

:setUTF8
:: Try to set UTF-8 encoding
chcp 65001 >nul 2>&1
if errorlevel 1 (
    :: Fallback to default encoding
    chcp 936 >nul 2>&1
)
goto :eof

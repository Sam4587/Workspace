@echo off
setlocal enabledelayedexpansion

:: Set UTF-8 encoding
call :setUTF8

title AI Content Flow - 后台服务停止器

cls

echo.
echo ============================================
echo    AI Content Flow - 后台服务停止器
echo ============================================
echo.
echo  这个程序会停止所有后台运行的 AI Content Flow 服务。
echo.

:: Switch to project directory
cd /d "%~dp0"
echo [Info] Project directory: %CD%

:: Check scripts directory
echo [Check] Checking stop script...
if not exist "scripts\stop-service.cjs" (
    echo [Error] Stop script not found: scripts\stop-service.cjs
    echo [Info] Please ensure running from project root
    pause
    exit /b 1
)
echo [OK] Stop script found

:: Stop services
echo.
echo [Stop] Stopping background services...
echo.

node scripts\stop-service.cjs %*

:: Get exit code
set EXIT_CODE=%ERRORLEVEL%

:: Pause if failed
if %EXIT_CODE% neq 0 (
    echo.
    echo [Error] Stop failed, exit code: %EXIT_CODE%
    echo.
    pause
) else (
    echo.
    echo [OK] All services stopped!
    echo.
    timeout /t 3 >nul
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

@echo off
setlocal enabledelayedexpansion

:: Set UTF-8 encoding
call :setUTF8

title AI Content Flow - 后台服务启动器

cls

echo.
echo ============================================
echo    AI Content Flow - 后台服务启动器
echo ============================================
echo.
echo  这个启动器会在后台运行服务，
echo  你可以关闭这个窗口，服务会继续运行！
echo.
echo  Service Port Configuration:
echo    Frontend: http://localhost:5174
echo    Backend:  http://localhost:5001
echo.
echo  提示：如需停止服务，请运行 AI-Content-Flow-Stop-Service.bat
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
echo [Check] Checking service script...
if not exist "scripts\start-service.cjs" (
    echo [Error] Service script not found: scripts\start-service.cjs
    echo [Info] Please ensure running from project root
    pause
    exit /b 1
)
echo [OK] Service script found

:: Start project
echo.
echo [Start] Starting background services...
echo.

node scripts\start-service.cjs %*

:: Get exit code
set EXIT_CODE=%ERRORLEVEL%

:: Pause if failed
if %EXIT_CODE% neq 0 (
    echo.
    echo [Error] Startup failed, exit code: %EXIT_CODE%
    echo.
    pause
) else (
    echo.
    echo [OK] Services started in background!
    echo [Info] You can now close this window.
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

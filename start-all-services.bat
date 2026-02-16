@echo off
chcp 65001 >nul
title Publisher Tools - 一键启动

:: 设置工作目录为脚本所在目录
cd /d "%~dp0"

echo ========================================
echo Publisher Tools 一键启动
echo ========================================
echo.

:: 检查必要文件
if not exist "publisher-web" (
    echo 错误: 找不到 publisher-web 目录
    pause
    exit /b 1
)

if not exist "test-api-server.js" (
    echo 错误: 找不到 test-api-server.js 文件
    pause
    exit /b 1
)

echo [1/4] 清理可能存在的服务进程...
taskkill /f /im node.exe /fi "WINDOWTITLE eq Publisher*" >nul 2>&1
timeout /t 1 /nobreak >nul

echo [2/4] 启动API服务...
start "Publisher API Server" cmd /k "cd /d %CD% && node test-api-server.js"
timeout /t 3 /nobreak >nul

echo [3/4] 启动前端服务...
start "Publisher Frontend" cmd /k "cd /d %CD%\publisher-web && npm run dev"
timeout /t 5 /nobreak >nul

echo [4/4] 验证服务状态...
echo.

:: 检查端口
netstat -ano | findstr :5173 >nul
if %errorlevel% equ 0 (
    echo ✓ 前端服务: http://localhost:5173
) else (
    echo × 前端服务启动失败
)

netstat -ano | findstr :3001 >nul
if %errorlevel% equ 0 (
    echo ✓ API服务: http://localhost:3001
) else (
    echo × API服务启动失败
)

echo.
echo 服务启动完成！
echo 按任意键打开浏览器访问前端界面...
pause >nul

start "" "http://localhost:5173"

echo.
echo 如需停止服务，请手动关闭对应的命令行窗口
echo 或运行 stop-services.bat 脚本
echo.
pause
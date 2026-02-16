@echo off
chcp 65001 >nul
title Publisher Tools - 服务启动器

:: 设置工作目录为脚本所在目录
cd /d "%~dp0"

echo ========================================
echo Publisher Tools 服务启动器
echo ========================================
echo.

:: 检查必要文件是否存在
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

echo [1/3] 启动测试API服务器...
start "Publisher API Server" cmd /c "node test-api-server.js & pause"

timeout /t 3 /nobreak >nul

echo [2/3] 启动前端开发服务器...
cd publisher-web
if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    npm install
)
start "Publisher Frontend" cmd /c "npm run dev & pause"

timeout /t 5 /nobreak >nul

echo [3/3] 启动完成！
echo.
echo 服务状态:
echo - API服务器: http://localhost:3001
echo - 前端界面: http://localhost:5173 (或其他自动分配端口)
echo.
echo 浏览器将自动打开前端界面...
echo 按任意键打开浏览器或关闭此窗口退出

pause >nul

:: 自动打开浏览器
start "" "http://localhost:5173"

echo.
echo 所有服务已启动完成！
echo 关闭此窗口不会停止服务
echo 如需停止服务，请手动关闭对应的命令行窗口
echo.
pause
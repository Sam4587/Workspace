@echo off
title Publisher 服务修复启动器
echo =====================================
echo 正在修复端口冲突并启动服务...
echo =====================================

:: 清理3001端口占用
echo [1/3] 清理端口3001占用...
taskkill /f /im node.exe /fi "PORT eq 3001" >nul 2>&1
taskkill /f /im node.exe /fi "WINDOWTITLE eq Publisher*" >nul 2>&1
timeout /t 2 /nobreak >nul

:: 启动测试API服务器（端口3002）
echo [2/3] 启动API服务 (端口3002)...
start "Publisher API Server" cmd /k "cd /d %CD% && node test-api-server.js --port 3002"

timeout /t 3 /nobreak >nul

:: 启动前端服务
echo [3/3] 启动前端服务...
cd publisher-web
start "Publisher Frontend" cmd /k "npm run dev"
cd ..

echo =====================================
echo 服务启动完成！
echo API服务: http://localhost:3002
echo 前端界面: http://localhost:5173
echo =====================================
pause
@echo off
chcp 65001 >nul
title AI Content Flow - 项目启动器

:: 设置窗口颜色
color 0B

:: 清屏
cls

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║              AI Content Flow - 项目启动器                  ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo  正在启动项目服务...
echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │  服务端口配置:                                          │
echo  │    前端: http://localhost:5174                          │
echo  │    后端: http://localhost:5001                          │
echo  │    MongoDB: 27017                                       │
echo  │    Redis: 6379                                          │
echo  └─────────────────────────────────────────────────────────┘
echo.

:: 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

:: 检查项目目录
cd /d "%~dp0"

:: 启动项目
echo [信息] 正在启动服务...
echo.

node scripts/project-launcher.js %*

:: 如果启动失败，暂停显示错误
if errorlevel 1 (
    echo.
    echo [错误] 启动失败，请检查错误信息
    pause
)

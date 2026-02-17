@echo off
setlocal enabledelayedexpansion

:: 设置代码页为 UTF-8 (如果失败也不影响)
chcp 65001 >nul 2>&1

title AI Content Flow - 项目启动器

:: 设置窗口颜色
color 0B

:: 清屏
cls

echo.
echo ============================================
echo    AI Content Flow - 项目启动器
echo ============================================
echo.
echo  正在启动项目服务...
echo.
echo  服务端口配置:
echo    前端: http://localhost:5174
echo    后端: http://localhost:5001
echo    MongoDB: 27017
echo    Redis: 6379
echo.

:: 检查 Node.js
echo [检查] 正在检查 Node.js 环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    echo [信息] 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('node --version') do (
    echo [成功] Node.js 版本: %%a
)

:: 切换到项目目录
cd /d "%~dp0"
echo [信息] 项目目录: %CD%

:: 检查 scripts 目录
echo [检查] 正在检查启动脚本...
if not exist "scripts\project-launcher.cjs" (
    echo [错误] 找不到启动脚本: scripts\project-launcher.cjs
    echo [信息] 请确保在项目根目录运行此脚本
    pause
    exit /b 1
)
echo [成功] 找到启动脚本

:: 启动项目
echo.
echo [启动] 正在启动服务...
echo.

node scripts/project-launcher.cjs %*

:: 获取退出码
set EXIT_CODE=%ERRORLEVEL%

:: 如果启动失败，暂停显示错误
if %EXIT_CODE% neq 0 (
    echo.
    echo [错误] 启动失败，退出码: %EXIT_CODE%
    echo.
    pause
)

exit /b %EXIT_CODE%

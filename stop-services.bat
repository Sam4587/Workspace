@echo off
chcp 65001 >nul
title Publisher Tools - 服务停止器

echo ========================================
echo Publisher Tools 服务停止器
echo ========================================
echo.

echo 正在查找并停止相关服务...

:: 停止Node.js进程
echo [1/2] 停止Node.js服务...
taskkill /f /im node.exe /fi "WINDOWTITLE eq Publisher*" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Node.js服务已停止
) else (
    echo ○ 未找到运行中的Node.js服务
)

:: 停止Vite开发服务器
echo [2/2] 停止Vite开发服务器...
taskkill /f /im node.exe /fi "WINDOWTITLE eq publisher-web*" >nul 2>&1
taskkill /f /im node.exe /fi "WINDOWTITLE eq vite*" >nul 2>&1
echo ✓ Vite服务停止命令已发送

echo.
echo 服务停止完成！
echo 如果仍有服务在运行，请手动关闭命令行窗口
echo.
pause
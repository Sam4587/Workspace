@echo off
echo 正在安装WSL...
echo 请确保以管理员身份运行此脚本

REM 启用WSL功能
echo 启用WSL功能...
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

REM 启用虚拟机平台
echo 启用虚拟机平台...
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

echo.
echo 安装完成！请重启计算机，然后再次运行此脚本的第二部分。
echo 按任意键继续重启...
pause
shutdown /r /t 0
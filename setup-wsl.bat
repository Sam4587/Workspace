@echo off
echo 正在完成WSL安装...

REM 设置WSL2为默认版本
echo 设置WSL2为默认版本...
wsl --set-default-version 2

REM 安装Ubuntu
echo 安装Ubuntu发行版...
wsl --install -d Ubuntu

echo.
echo WSL安装完成！
echo 首次启动时会要求您创建用户名和密码
echo 按任意键退出...
pause
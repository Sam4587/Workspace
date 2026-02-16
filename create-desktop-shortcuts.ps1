# 创建Publisher Tools桌面快捷方式
# 运行此脚本将在桌面上创建启动和停止服务的快捷方式

# 获取当前用户的桌面路径
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition

# 快捷方式参数
$WshShell = New-Object -ComObject WScript.Shell

# 创建启动服务快捷方式
$Shortcut1 = $WshShell.CreateShortcut("$DesktopPath\Publisher Tools Start.lnk")
$Shortcut1.TargetPath = "powershell.exe"
$Shortcut1.Arguments = "-ExecutionPolicy Bypass -File `"$ScriptPath\start-services.ps1`""
$Shortcut1.WorkingDirectory = $ScriptPath
$Shortcut1.WindowStyle = 1  # 正常窗口
$Shortcut1.IconLocation = "shell32.dll,14"  # 使用系统绿色运行图标
$Shortcut1.Description = "Start Publisher Tools Services"
$Shortcut1.Save()

# 创建一键启动快捷方式（推荐）
$Shortcut2 = $WshShell.CreateShortcut("$DesktopPath\Publisher Tools Quick Start.lnk")
$Shortcut2.TargetPath = "$ScriptPath\start-all-services.bat"
$Shortcut2.WorkingDirectory = $ScriptPath
$Shortcut2.WindowStyle = 1
$Shortcut2.IconLocation = "shell32.dll,14"
$Shortcut2.Description = "Quick Start All Services (Recommended)"
$Shortcut2.Save()

# 创建批处理版本快捷方式（兼容性更好）
$Shortcut3 = $WshShell.CreateShortcut("$DesktopPath\Publisher Tools Start(BAT).lnk")
$Shortcut3.TargetPath = "$ScriptPath\start-services.bat"
$Shortcut3.WorkingDirectory = $ScriptPath
$Shortcut3.WindowStyle = 1
$Shortcut3.IconLocation = "shell32.dll,14"
$Shortcut3.Description = "Start Publisher Tools Services (Batch Version)"
$Shortcut3.Save()

# 创建停止服务快捷方式
$Shortcut4 = $WshShell.CreateShortcut("$DesktopPath\Publisher Tools Stop.lnk")
$Shortcut4.TargetPath = "$ScriptPath\stop-services.bat"
$Shortcut4.WorkingDirectory = $ScriptPath
$Shortcut4.WindowStyle = 1
$Shortcut4.IconLocation = "shell32.dll,50"  # 使用红色停止图标
$Shortcut4.Description = "Stop Publisher Tools Services"
$Shortcut4.Save()

Write-Host "Desktop shortcuts created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Created shortcuts:" -ForegroundColor Yellow
Write-Host "1. Publisher Tools Start.lnk - PowerShell version starter" -ForegroundColor White
Write-Host "2. Publisher Tools Quick Start.lnk - Quick start all services (Recommended)" -ForegroundColor White
Write-Host "3. Publisher Tools Start(BAT).lnk - Batch version starter" -ForegroundColor White
Write-Host "4. Publisher Tools Stop.lnk - Service stopper" -ForegroundColor White
Write-Host ""
Write-Host "Double-click the shortcuts to quickly start/stop services" -ForegroundColor Cyan
Write-Host ""

# 询问是否立即测试
$choice = Read-Host "Test quick start now? (Y/N)"
if ($choice -eq 'Y' -or $choice -eq 'y') {
    Write-Host "Starting services..." -ForegroundColor Yellow
    Start-Process -FilePath "$ScriptPath\start-all-services.bat" -WindowStyle Normal
}

Write-Host "Press any key to exit..." -ForegroundColor Gray
$host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
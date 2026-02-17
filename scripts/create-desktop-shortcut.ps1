# AI Content Flow - 创建桌面快捷方式
# 在 PowerShell 中运行: .\scripts\create-desktop-shortcut.ps1

$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BatchFile = Join-Path $ProjectRoot "AI-Content-Flow-Launcher.bat"

# 检查批处理文件是否存在
if (-not (Test-Path $BatchFile)) {
    Write-Host "[错误] 找不到启动脚本: $BatchFile" -ForegroundColor Red
    exit 1
}

# 创建快捷方式
$ShortcutPath = Join-Path $DesktopPath "AI Content Flow.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $BatchFile
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.IconLocation = "$ProjectRoot\favicon.png,0"
$Shortcut.Description = "一键启动 AI Content Flow 开发环境"
$Shortcut.WindowStyle = 1  # 正常窗口

# 保存快捷方式
$Shortcut.Save()

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                           ║" -ForegroundColor Green
Write-Host "║     桌面快捷方式创建成功!                                  ║" -ForegroundColor Green
Write-Host "║                                                           ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "快捷方式位置: $ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "功能说明:" -ForegroundColor Yellow
Write-Host "  • 双击快捷方式一键启动所有服务" -ForegroundColor White
Write-Host "  • 自动检查端口占用情况" -ForegroundColor White
Write-Host "  • 自动在浏览器中打开前端页面" -ForegroundColor White
Write-Host "  • 支持优雅停止所有服务 (Ctrl+C)" -ForegroundColor White
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

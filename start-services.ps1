# Publisher Tools 启动脚本
# PowerShell版本 - 功能更完整

param(
    [switch]$Silent = $false
)

# 设置UTF-8编码
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 获取脚本所在目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptPath

function Write-Header {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Publisher Tools 服务启动器" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message, [int]$Step)
    Write-Host "[$Step/3] $Message" -ForegroundColor Yellow
}

function Check-Requirements {
    # 检查必要文件
    if (-not (Test-Path "publisher-web")) {
        Write-Host "错误: 找不到 publisher-web 目录" -ForegroundColor Red
        return $false
    }
    
    if (-not (Test-Path "test-api-server.js")) {
        Write-Host "错误: 找不到 test-api-server.js 文件" -ForegroundColor Red
        return $false
    }
    
    # 检查Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✓ Node.js版本: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "错误: 未安装Node.js或不在PATH中" -ForegroundColor Red
        return $false
    }
    
    return $true
}

function Start-Services {
    Write-Step "启动测试API服务器..." 1
    
    # 启动API服务器
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "title Publisher API Server & node test-api-server.js" -WindowStyle Normal
    
    Start-Sleep -Seconds 3
    
    Write-Step "启动前端开发服务器..." 2
    
    # 切换到前端目录
    Set-Location "publisher-web"
    
    # 检查并安装依赖
    if (-not (Test-Path "node_modules")) {
        Write-Host "首次运行，正在安装依赖..." -ForegroundColor Yellow
        npm install
    }
    
    # 启动前端服务
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "title Publisher Frontend & npm run dev" -WindowStyle Normal
    
    Set-Location ".."
    
    # 启动前端服务
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "title Publisher Frontend & npm run dev & pause" -WindowStyle Normal
    
    Set-Location ".."
    
    Start-Sleep -Seconds 5
    
    Write-Step "启动完成！" 3
    
    Write-Host ""
    Write-Host "服务状态:" -ForegroundColor Green
    Write-Host "- API服务器: http://localhost:3001" -ForegroundColor White
    Write-Host "- 前端界面: http://localhost:5173 (或其他自动分配端口)" -ForegroundColor White
    Write-Host ""
    
    if (-not $Silent) {
        Write-Host "浏览器将自动打开前端界面..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        Start-Process "http://localhost:5173"
    }
    
    Write-Host ""
    Write-Host "所有服务已启动完成！" -ForegroundColor Green
    Write-Host "关闭此窗口不会停止服务" -ForegroundColor Yellow
    Write-Host "如需停止服务，请运行 stop-services.bat" -ForegroundColor Yellow
}

# 主程序
Write-Header

if (Check-Requirements) {
    Start-Services
} else {
    Write-Host ""
    Write-Host "启动失败，请检查上述错误信息" -ForegroundColor Red
}

if (-not $Silent) {
    Write-Host ""
    Write-Host "按任意键退出..." -ForegroundColor Gray
    $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
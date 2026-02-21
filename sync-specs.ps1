#Requires -Version 5.1
<#
.SYNOPSIS
    Project Specification Sync Script - Auto sync .claude folder and .trae.md file

.DESCRIPTION
    This script synchronizes project specification files (.claude folder and .trae.md file)
    from a source location to the current or specified target project.

.PARAMETER SourcePath
    Source path for specification files. Default is script directory.

.PARAMETER TargetPath
    Target project root path. Default is current working directory.

.PARAMETER Force
    Force overwrite existing files without prompting.

.PARAMETER Backup
    Backup existing files before overwriting.

.PARAMETER DryRun
    Preview operations without executing.

.EXAMPLE
    .\sync-specs.ps1
    Sync specs to current directory

.EXAMPLE
    .\sync-specs.ps1 -TargetPath "D:\Projects\MyNewProject"
    Sync specs to specified project

.EXAMPLE
    .\sync-specs.ps1 -Force -Backup
    Force overwrite with backup

.NOTES
    Version: 1.0.0
    Author: TrendRadar Development Team
    Date: 2026-02-21
#>

param(
    [string]$SourcePath = "",
    [string]$TargetPath = "",
    [switch]$Force,
    [switch]$Backup,
    [switch]$DryRun
)

# ============================================================================
# Configuration
# ============================================================================

$DefaultSourcePath = Split-Path -Parent $MyInvocation.MyCommand.Path

$ItemsToSync = @(
    ".claude",
    ".trae.md"
)

$BackupDirFormat = "specs-backup-{0:yyyyMMdd-HHmmss}"

# ============================================================================
# Helper Functions
# ============================================================================

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )
    
    $colors = @{
        "Info"    = "Cyan"
        "Success" = "Green"
        "Warning" = "Yellow"
        "Error"   = "Red"
        "Header"  = "Magenta"
        "Detail"  = "Gray"
    }
    
    $prefix = @{
        "Info"    = "[INFO] "
        "Success" = "[OK] "
        "Warning" = "[WARN] "
        "Error"   = "[ERR] "
        "Header"  = "====== "
        "Detail"  = "  -> "
    }
    
    $color = $colors[$Type]
    $pre = $prefix[$Type]
    
    Write-Host "$pre$Message" -ForegroundColor $color
}

function Write-SectionHeader {
    param([string]$Title)
    
    Write-Host ""
    Write-ColorOutput $Title -Type Header
    Write-ColorOutput ("=" * 60) -Type Header
}

function Get-FolderSize {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) { return 0 }
    
    $size = (Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | 
             Measure-Object -Property Length -Sum).Sum
    
    return [math]::Round($size / 1KB, 2)
}

function New-BackupDirectory {
    param(
        [string]$BasePath,
        [string]$BackupDirName
    )
    
    $backupPath = Join-Path $BasePath $BackupDirName
    
    if (-not (Test-Path $backupPath)) {
        New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    }
    
    return $backupPath
}

function Move-ToBackup {
    param(
        [string]$SourceItem,
        [string]$BackupPath
    )
    
    $itemName = Split-Path $SourceItem -Leaf
    $destPath = Join-Path $BackupPath $itemName
    
    if (Test-Path $SourceItem) {
        if (Test-Path $destPath) {
            Remove-Item $destPath -Recurse -Force
        }
        Move-Item $SourceItem $destPath -Force
        return $true
    }
    return $false
}

function Copy-SpecsItem {
    param(
        [string]$SourceItem,
        [string]$TargetItem,
        [bool]$IsDirectory
    )
    
    try {
        if ($IsDirectory) {
            if (Test-Path $TargetItem) {
                Remove-Item $TargetItem -Recurse -Force
            }
            Copy-Item $SourceItem $TargetItem -Recurse -Force
        } else {
            Copy-Item $SourceItem $TargetItem -Force
        }
        return $true
    } catch {
        return $false
    }
}

function Test-SourceExists {
    param([string]$Path)
    
    $missingItems = @()
    
    foreach ($item in $ItemsToSync) {
        $fullPath = Join-Path $Path $item
        if (-not (Test-Path $fullPath)) {
            $missingItems += $item
        }
    }
    
    return $missingItems
}

function Get-SyncSummary {
    param(
        [string]$SourcePath,
        [string]$TargetPath
    )
    
    $summary = @{}
    
    foreach ($item in $ItemsToSync) {
        $sourceItem = Join-Path $SourcePath $item
        
        if (Test-Path $sourceItem) {
            $isDir = (Get-Item $sourceItem).PSIsContainer
            
            if ($isDir) {
                $fileCount = (Get-ChildItem $sourceItem -Recurse -File -ErrorAction SilentlyContinue).Count
                $size = Get-FolderSize $sourceItem
                $summary[$item] = @{
                    Type = "Directory"
                    Files = $fileCount
                    Size = "$size KB"
                }
            } else {
                $fileInfo = Get-Item $sourceItem
                $summary[$item] = @{
                    Type = "File"
                    Size = "$([math]::Round($fileInfo.Length / 1KB, 2)) KB"
                    Modified = $fileInfo.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
                }
            }
        }
    }
    
    return $summary
}

# ============================================================================
# Main Script
# ============================================================================

$startTime = Get-Date
$exitCode = 0

# Display welcome
Clear-Host
Write-SectionHeader "Project Specification Sync Tool v1.0.0"
Write-ColorOutput "Auto sync .claude folder and .trae.md file to target project" -Type Info
Write-Host ""

# Step 1: Determine paths
Write-SectionHeader "Step 1/5: Determine Paths"

if ([string]::IsNullOrEmpty($SourcePath)) {
    $SourcePath = $DefaultSourcePath
}

if ([string]::IsNullOrEmpty($TargetPath)) {
    $TargetPath = Get-Location
}

# Normalize paths
$resolvedSource = Resolve-Path $SourcePath -ErrorAction SilentlyContinue
if (-not $resolvedSource) {
    Write-ColorOutput "Cannot resolve source path: $SourcePath" -Type Error
    exit 1
}
$SourcePath = $resolvedSource.Path

$resolvedTarget = Resolve-Path $TargetPath -ErrorAction SilentlyContinue
if (-not $resolvedTarget) {
    try {
        New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
        $resolvedTarget = Resolve-Path $TargetPath
        $TargetPath = $resolvedTarget.Path
    } catch {
        Write-ColorOutput "Cannot create target path: $TargetPath" -Type Error
        exit 1
    }
} else {
    $TargetPath = $resolvedTarget.Path
}

Write-ColorOutput "Source Path: $SourcePath" -Type Detail
Write-ColorOutput "Target Path: $TargetPath" -Type Detail

# Check if source and target are the same
if ($SourcePath -eq $TargetPath) {
    Write-ColorOutput "Source and target paths are identical, no sync needed" -Type Warning
    Write-Host ""
    Write-ColorOutput "Press any key to exit..." -Type Info
    if ([Environment]::UserInteractive) {
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 0
}

# Step 2: Validate source files
Write-SectionHeader "Step 2/5: Validate Source Files"

$missingItems = Test-SourceExists $SourcePath

if ($missingItems.Count -gt 0) {
    Write-ColorOutput "Source path is missing the following files/folders:" -Type Error
    foreach ($item in $missingItems) {
        Write-ColorOutput "  - $item" -Type Error
    }
    Write-ColorOutput "Please ensure source path contains complete specification files" -Type Error
    Write-Host ""
    Write-ColorOutput "Press any key to exit..." -Type Info
    if ([Environment]::UserInteractive) {
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 1
}

Write-ColorOutput "Source files validated successfully" -Type Success

# Display sync summary
$syncSummary = Get-SyncSummary $SourcePath $TargetPath
Write-ColorOutput "Items to sync:" -Type Info
foreach ($key in $syncSummary.Keys) {
    $info = $syncSummary[$key]
    if ($info.Type -eq "Directory") {
        Write-ColorOutput "  - $key ($($info.Type), $($info.Files) files, $($info.Size))" -Type Detail
    } else {
        Write-ColorOutput "  - $key ($($info.Type), $($info.Size), modified $($info.Modified))" -Type Detail
    }
}

# Step 3: Check target path
Write-SectionHeader "Step 3/5: Check Target Path"

$existingItems = @()
foreach ($item in $ItemsToSync) {
    $targetItem = Join-Path $TargetPath $item
    if (Test-Path $targetItem) {
        $existingItems += $item
    }
}

if ($existingItems.Count -gt 0) {
    Write-ColorOutput "Target path already contains the following files/folders:" -Type Warning
    foreach ($item in $existingItems) {
        Write-ColorOutput "  - $item" -Type Warning
    }
    
    if (-not $Force) {
        Write-Host ""
        $response = Read-Host "Overwrite existing files? (Y/N/A=All/Q=Quit)"
        
        switch ($response.ToUpper()) {
            "Y" { 
                Write-ColorOutput "Will overwrite existing files" -Type Info
            }
            "A" { 
                $Force = $true
                Write-ColorOutput "Will overwrite all existing files" -Type Info
            }
            "Q" { 
                Write-ColorOutput "Operation cancelled by user" -Type Warning
                Write-Host ""
                Write-ColorOutput "Press any key to exit..." -Type Info
                if ([Environment]::UserInteractive) {
                    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
                }
                exit 0
            }
            default { 
                Write-ColorOutput "Operation cancelled by user" -Type Warning
                Write-Host ""
                Write-ColorOutput "Press any key to exit..." -Type Info
                if ([Environment]::UserInteractive) {
                    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
                }
                exit 0
            }
        }
    }
} else {
    Write-ColorOutput "Target path has no conflicting files" -Type Success
}

# DryRun mode
if ($DryRun) {
    Write-SectionHeader "DryRun Mode - Preview Operations"
    Write-ColorOutput "The following operations will be executed:" -Type Info
    
    foreach ($item in $ItemsToSync) {
        $sourceItem = Join-Path $SourcePath $item
        $targetItem = Join-Path $TargetPath $item
        
        if (Test-Path $sourceItem) {
            $isDir = (Get-Item $sourceItem).PSIsContainer
            $action = if (Test-Path $targetItem) { "OVERWRITE" } else { "CREATE" }
            $type = if ($isDir) { "Directory" } else { "File" }
            
            Write-ColorOutput "  [$action] $type - $item" -Type Detail
        }
    }
    
    Write-ColorOutput "DryRun complete, no actual operations executed" -Type Success
    Write-Host ""
    Write-ColorOutput "Press any key to exit..." -Type Info
    if ([Environment]::UserInteractive) {
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 0
}

# Step 4: Execute backup if needed
Write-SectionHeader "Step 4/5: Execute Sync"

if ($Backup -and $existingItems.Count -gt 0) {
    $backupDirName = $BackupDirFormat -f (Get-Date)
    $backupPath = New-BackupDirectory $TargetPath $backupDirName
    
    Write-ColorOutput "Creating backup directory: $backupPath" -Type Info
    
    foreach ($item in $existingItems) {
        $targetItem = Join-Path $TargetPath $item
        if (Move-ToBackup $targetItem $backupPath) {
            Write-ColorOutput "  Backed up: $item" -Type Detail
        }
    }
}

# Step 5: Execute sync
$succeededItems = @()
$failedItems = @()

foreach ($item in $ItemsToSync) {
    $sourceItem = Join-Path $SourcePath $item
    $targetItem = Join-Path $TargetPath $item
    
    if (Test-Path $sourceItem) {
        $isDir = (Get-Item $sourceItem).PSIsContainer
        
        # Remove existing if not backed up
        if ((Test-Path $targetItem) -and -not $Backup) {
            try {
                Remove-Item $targetItem -Recurse -Force -ErrorAction Stop
            } catch {
                Write-ColorOutput "  Cannot remove existing file: $item - $($_.Exception.Message)" -Type Error
                $failedItems += $item
                continue
            }
        }
        
        # Copy file/folder
        if (Copy-SpecsItem $sourceItem $targetItem $isDir) {
            $succeededItems += $item
            Write-ColorOutput "  Synced: $item" -Type Success
        } else {
            $failedItems += $item
            Write-ColorOutput "  Failed: $item" -Type Error
        }
    }
}

# Display results
Write-SectionHeader "Step 5/5: Sync Results"

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-ColorOutput "Sync completed!" -Type Success
Write-ColorOutput "Duration: $([math]::Round($duration, 2)) seconds" -Type Info
Write-ColorOutput "Succeeded: $($succeededItems.Count) items" -Type Success

if ($failedItems.Count -gt 0) {
    Write-ColorOutput "Failed: $($failedItems.Count) items" -Type Error
    foreach ($item in $failedItems) {
        Write-ColorOutput "  - $item" -Type Error
    }
    $exitCode = 1
}

# Display target path contents
Write-Host ""
Write-ColorOutput "Target path contents:" -Type Info
foreach ($item in $ItemsToSync) {
    $targetItem = Join-Path $TargetPath $item
    if (Test-Path $targetItem) {
        $isDir = (Get-Item $targetItem).PSIsContainer
        if ($isDir) {
            $fileCount = (Get-ChildItem $targetItem -Recurse -File -ErrorAction SilentlyContinue).Count
            Write-ColorOutput "  [OK] $item (Directory, $fileCount files)" -Type Success
        } else {
            Write-ColorOutput "  [OK] $item (File)" -Type Success
        }
    }
}

# Post-sync instructions
Write-Host ""
Write-ColorOutput "Next steps:" -Type Info
Write-ColorOutput "  1. Check .trae.md file and update project-specific info (name, tech stack, etc.)" -Type Detail
Write-ColorOutput "  2. Adjust rules in .claude/rules/ as needed for your project" -Type Detail
Write-ColorOutput "  3. Add custom agents or skills to respective directories if needed" -Type Detail

Write-Host ""
Write-ColorOutput "Press any key to exit..." -Type Info
if ([Environment]::UserInteractive) {
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

exit $exitCode

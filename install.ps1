# MiMo Code Story Skill Pack Installer (PowerShell)
# Usage: irm https://raw.githubusercontent.com/nihaoshi/mimoCode-story/main/install.ps1 | iex

param(
    [string]$Repo = "https://github.com/nihaoshi/mimoCode-story.git",
    [string]$InstallDir = "$HOME\mimoCode-story",
    [string]$SkillDir = "$HOME\.config\mimocode\skills"
)

Write-Host "=== MiMo Code Story Skill Pack ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command mimo -ErrorAction SilentlyContinue)) {
    Write-Host "Error: mimo not found. Install MiMo Code first:" -ForegroundColor Red
    Write-Host "  npm install -g @mimo-ai/cli"
    exit 1
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Error: git not found. Install Git first:" -ForegroundColor Red
    Write-Host "  https://git-scm.com/download/win"
    exit 1
}

Write-Host "[1/5] Cloning repo..." -ForegroundColor Yellow
if (Test-Path $InstallDir) {
    Write-Host "  Directory exists, pulling latest..."
    Push-Location $InstallDir
    git pull --quiet 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Host "Error: git pull failed. Check network." -ForegroundColor Red
        exit 1
    }
    Pop-Location
} else {
    git clone --quiet $Repo $InstallDir 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: git clone failed. Check network." -ForegroundColor Red
        Write-Host "  Download ZIP manually:" -ForegroundColor Yellow
        Write-Host "  https://github.com/nihaoshi/mimoCode-story/archive/refs/heads/main.zip"
        exit 1
    }
}

$skillsSrc = Join-Path $InstallDir "skills"
if (-not (Test-Path $skillsSrc)) {
    Write-Host "Error: skills directory not found after clone." -ForegroundColor Red
    exit 1
}

Write-Host "[2/5] Creating skill directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $SkillDir | Out-Null

Write-Host "[3/5] Copying skills..." -ForegroundColor Yellow
Copy-Item -Path (Join-Path $skillsSrc "*") -Destination ($SkillDir + "\") -Recurse -Force

Write-Host "[4/5] Checking agent-browser..." -ForegroundColor Yellow
if (-not (Get-Command agent-browser -ErrorAction SilentlyContinue)) {
    Write-Host "  Installing agent-browser (rank scraper dependency)..."
    npm install -g agent-browser 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Warning: agent-browser install failed. Rank scraping will not work." -ForegroundColor Yellow
        Write-Host "  Try manually: npm install -g agent-browser" -ForegroundColor Yellow
    } else {
        Write-Host "  agent-browser installed." -ForegroundColor Green
    }
} else {
    Write-Host "  agent-browser already installed." -ForegroundColor Green
}

Write-Host "[5/5] Verifying..." -ForegroundColor Yellow
$skills = @(
    "story", "story-setup", "story-long-write", "story-short-write",
    "story-long-analyze", "story-short-analyze", "story-scan",
    "story-long-scan", "story-short-scan", "story-deslop",
    "story-review", "story-cover", "story-import", "browser-cdp"
)
$missing = @()
foreach ($s in $skills) {
    $p = Join-Path $SkillDir (Join-Path $s "SKILL.md")
    if (-not (Test-Path $p)) {
        $missing += $s
    }
}

if ($missing.Count -gt 0) {
    Write-Host "Error: Missing skills: $($missing -join ', ')" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "Installed $($skills.Count) skills to: $SkillDir"
Write-Host ""
Write-Host "Restart MiMo Code, then use:"
Write-Host "  /story           - Main entry"
Write-Host "  /story-setup     - Init project"
Write-Host "  /story-long-write  - Long fiction"
Write-Host "  /story-short-write - Short fiction"

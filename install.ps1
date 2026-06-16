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

# 1. 验证 23 个技能
$skills = @(
    "story-mimo", "story-setup-mimo", "story-long-write-mimo", "story-short-write-mimo",
    "story-long-analyze-mimo", "story-short-analyze-mimo", "story-scan-mimo",
    "story-long-scan-mimo", "story-short-scan-mimo", "story-deslop-mimo",
    "story-review-mimo", "story-cover-mimo", "story-import-mimo", "browser-cdp-mimo",
    "story-synopsis-mimo", "story-export-mimo", "audit-mimo", "quality-mimo",
    "project-health-mimo", "distill-mimo", "dream-mimo", "goal-mimo", "story-session-mimo"
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

# 2. 验证 45 个原子技能
$atoms = @(
    "detect-banned-words", "detect-ai-sentence", "detect-consistency", "detect-foreshadow",
    "detect-wordcount", "detect-voice", "detect-emotion-curve", "detect-cross-chapter",
    "detect-satisfaction", "detect-story-gaps", "full-consistency-audit",
    "fix-banned-words", "fix-ai-sentence", "fix-psychology-externalize", "fix-rhythm-break",
    "fix-dialogue-naturalize", "fix-ending-desublimate", "fix-punctuation",
    "review-structure", "review-character", "review-writing", "review-commercial", "review-consistency",
    "rules-engine", "pre-write-checklist", "prompt-template-inject", "banned-words-preload",
    "style-constraint-gen", "character-anchor-load",
    "scrape-platform", "analyze-trend", "generate-topic-decision", "analyze-reader-profile",
    "extract-summary", "analyze-golden-chapters", "extract-chapter-summary", "analyze-aggregate",
    "extract-settings", "extract-characters", "extract-style",
    "design-volume-outline", "design-chapter-outline", "design-character", "design-worldbuilding", "generate-chapter"
)
$atomMissing = @()
foreach ($a in $atoms) {
    $p = Join-Path $SkillDir (Join-Path "atoms" (Join-Path $a "SKILL.md"))
    if (-not (Test-Path $p)) {
        $atomMissing += $a
    }
}

if ($atomMissing.Count -gt 0) {
    Write-Host "Warning: Missing atoms ($($atomMissing.Count)): $($atomMissing -join ', ')" -ForegroundColor Yellow
    Write-Host "  Atom skills may not work. Try: git pull && re-run installer" -ForegroundColor Yellow
}

# 3. 验证关键脚本
$requiredScripts = @("quality-gate.js", "style-lint.js", "consistency-check.js", "punctuation-normalize.js")
$scriptMissing = @()
foreach ($sc in $requiredScripts) {
    $p = Join-Path $SkillDir (Join-Path "_shared" (Join-Path "scripts" $sc))
    if (-not (Test-Path $p)) {
        $scriptMissing += $sc
    }
}

if ($scriptMissing.Count -gt 0) {
    Write-Host "Warning: Missing scripts ($($scriptMissing.Count)): $($scriptMissing -join ', ')" -ForegroundColor Yellow
    Write-Host "  Quality checks will not work. Try: git pull && re-run installer" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "Installed $($skills.Count) skills + $($atoms.Count) atoms to: $SkillDir"
Write-Host ""
Write-Host "Restart MiMo Code, then use:"
Write-Host "  /story-mimo           - Main entry"
Write-Host "  /story-setup-mimo     - Init project"
Write-Host "  /atom:detect-banned-words - Run single atom"
Write-Host "  /atom:fix-punctuation     - Fix punctuation"

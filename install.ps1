# MiMo Code 网文写作技能包 安装脚本 (PowerShell)
# 用法: irm https://raw.githubusercontent.com/nihaoshi/mimoCode-story/main/install.ps1 | iex

param(
    [string]$Repo = "https://github.com/nihaoshi/mimoCode-story.git",
    [string]$InstallDir = "$HOME\mimoCode-story",
    [string]$SkillDir = "$HOME\.config\mimocode\skills"
)

Write-Host "=== MiMo Code 网文写作技能包 安装 ===" -ForegroundColor Cyan
Write-Host ""

# 检查 MiMo Code 是否安装
if (-not (Get-Command mimo -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到 mimo 命令。请先安装 MiMo Code:" -ForegroundColor Red
    Write-Host "  npm install -g @mimo-ai/cli"
    exit 1
}

# 检查 git 是否安装
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到 git 命令。请先安装 Git:" -ForegroundColor Red
    Write-Host "  https://git-scm.com/download/win"
    exit 1
}

Write-Host "[1/4] 克隆仓库..." -ForegroundColor Yellow
if (Test-Path $InstallDir) {
    Write-Host "  目录已存在，拉取最新代码..."
    Push-Location $InstallDir
    git pull --quiet 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Host "错误: git pull 失败。请检查网络连接后重试。" -ForegroundColor Red
        exit 1
    }
    Pop-Location
} else {
    git clone --quiet $Repo $InstallDir 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "错误: git clone 失败。请检查网络连接后重试。" -ForegroundColor Red
        Write-Host "  如果无法访问 GitHub，可以手动下载 ZIP:" -ForegroundColor Yellow
        Write-Host "  https://github.com/nihaoshi/mimoCode-story/archive/refs/heads/main.zip"
        exit 1
    }
}

# 验证克隆结果
if (-not (Test-Path "$InstallDir\skills")) {
    Write-Host "错误: 克隆成功但未找到 skills 目录，请重新运行安装脚本。" -ForegroundColor Red
    exit 1
}

Write-Host "[2/4] 创建技能目录..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $SkillDir | Out-Null

Write-Host "[3/4] 复制 skills..." -ForegroundColor Yellow
Copy-Item -Path "$InstallDir\skills\*" -Destination "$SkillDir\" -Recurse -Force

Write-Host "[4/4] 验证安装..." -ForegroundColor Yellow
$skills = @(
    "story", "story-setup", "story-long-write", "story-short-write",
    "story-long-analyze", "story-short-analyze", "story-scan",
    "story-long-scan", "story-short-scan", "story-deslop",
    "story-review", "story-cover", "story-import", "browser-cdp"
)
$missing = @()
foreach ($s in $skills) {
    if (-not (Test-Path "$SkillDir\$s\SKILL.md")) {
        $missing += $s
    }
}

if ($missing.Count -gt 0) {
    Write-Host "错误: 以下 skill 缺失: $($missing -join ', ')" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== 安装完成 ===" -ForegroundColor Green
Write-Host "已安装 $($skills.Count) 个写作 skill 到: $SkillDir"
Write-Host ""
Write-Host "重启 MiMo Code 后可使用以下命令:"
Write-Host "  /story          - 网文工具箱主入口"
Write-Host "  /story-setup    - 初始化写作项目"
Write-Host "  /story-long-write - 写长篇小说"
Write-Host "  /story-short-write - 写短篇小说"
Write-Host ""
Write-Host "验证: mimo debug skill | Select-String story"

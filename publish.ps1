# publish.ps1 - 一键发布便签到 GitHub Releases
# 前置：已安装 GitHub CLI (https://cli.github.com) 并运行 gh auth login 登录
# 用法：在项目根目录执行  powershell -ExecutionPolicy Bypass -File publish.ps1
#
# 说明：提交署名会自动采用你的 GitHub 账号身份（noreply 邮箱），
#       仅写入本仓库的 .git/config，不改动你公司 GitLab 的全局 git 配置。

$ErrorActionPreference = "Stop"

# ---------- 定位 gh.exe（PATH 找不到时回退到默认安装路径） ----------
$gh = (Get-Command gh -ErrorAction SilentlyContinue).Source
if (-not $gh) {
  $cands = @(
    "$env:ProgramFiles\GitHub CLI\gh.exe",
    "${env:ProgramFiles(x86)}\GitHub CLI\gh.exe",
    "$env:LOCALAPPDATA\Programs\GitHub CLI\gh.exe"
  )
  $gh = $cands | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $gh) {
  Write-Host "未检测到 gh，请先安装 GitHub CLI: https://cli.github.com" -ForegroundColor Red
  exit 1
}
Write-Host "使用 gh: $gh" -ForegroundColor DarkGray

# ---------- 校验登录 ----------
& $gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "未登录 GitHub，请先执行:  gh auth login" -ForegroundColor Red
  exit 1
}

$repo = "sticky-notes"
$exe  = "dist\StickyNotes-Portable.exe"
$tag  = "v1.0.0"

if (-not (Test-Path $exe)) {
  Write-Host "未找到 $exe，请先执行 npm run dist 打包" -ForegroundColor Red
  exit 1
}
if (-not (Test-Path "RELEASE_NOTES.md")) {
  Write-Host "未找到 RELEASE_NOTES.md" -ForegroundColor Red
  exit 1
}

# ---------- 初始化仓库 ----------
if (-not (Test-Path ".git")) {
  git init | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Host "git init 失败" -ForegroundColor Red; exit 1 }
}

# ---------- 用个人 GitHub 身份署名（仅本仓库，不动全局配置） ----------
$login = (& $gh api user --jq ".login" 2>$null)
$uid   = (& $gh api user --jq ".id"    2>$null)
if ($login) { $login = $login.Trim() }
if ($uid)   { $uid   = $uid.Trim() }

if ($login -and $uid) {
  $email = "$uid+$login@users.noreply.github.com"
  git config user.name  $login
  git config user.email $email
  Write-Host "提交署名: $login <$email>  （仅本仓库）" -ForegroundColor Cyan
} else {
  Write-Host "警告：未能获取 GitHub 账号信息，将沿用现有 git 配置署名" -ForegroundColor Yellow
}

# ---------- 提交源码 ----------
git add -A
git commit -m "Initial commit: StickyNotes $tag" 2>&1 | Out-Null

# ---------- 创建公开仓库并推送 ----------
Write-Host "创建仓库并推送源码..." -ForegroundColor Cyan
& $gh repo create $repo --public --source=. --push
if ($LASTEXITCODE -ne 0) {
  Write-Host "创建仓库失败：仓库名可能已被占用，或网络异常。" -ForegroundColor Red
  exit 1
}

# ---------- 创建 Release 并上传 exe ----------
Write-Host "创建 Release 并上传 exe（约 74MB，请稍候）..." -ForegroundColor Cyan
& $gh release create $tag $exe --title "StickyNotes $tag" --notes-file RELEASE_NOTES.md
if ($LASTEXITCODE -ne 0) {
  Write-Host "创建 Release 失败，请检查网络后重试。" -ForegroundColor Red
  exit 1
}

# ---------- 输出链接 ----------
Write-Host ""
Write-Host "发布完成！" -ForegroundColor Green
Write-Host "仓库主页 : https://github.com/$login/$repo" -ForegroundColor Green
Write-Host "下载页   : https://github.com/$login/$repo/releases/latest" -ForegroundColor Green
Write-Host "exe 直链 : https://github.com/$login/$repo/releases/download/$tag/StickyNotes-Portable.exe" -ForegroundColor Green

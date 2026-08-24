# ============================================================
# tools/proposal/build.ps1
# Chrome (headless) で hotel/retail/cafe の HTML を A4 PDF 化し、
# assets/print/ に既存ファイル名で出力する。
#   使い方: pwsh -File tools/proposal/build.ps1
# ============================================================
$ErrorActionPreference = "Stop"
$src  = $PSScriptRoot                                    # ...\tools\proposal
$repo = Split-Path (Split-Path $src -Parent) -Parent     # ...\akiba-ship
$out  = Join-Path $repo "assets\print"

# --- Chrome / Edge(Chromium) を探す ---
$cands = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)
$chrome = $cands | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw "Chrome/Edge が見つかりません。" }
Write-Host "Using browser: $chrome"

# --- HTML -> PDF（既存ファイル名を維持）---
$map = [ordered]@{
  "hotel.html"  = "proposal-hotel-a4.pdf"
  "retail.html" = "proposal-retail-a4.pdf"
  "cafe.html"   = "proposal-cafe-a4.pdf"
}
foreach ($h in $map.Keys) {
  $in  = Join-Path $src $h
  $pdf = Join-Path $out $map[$h]
  $url = "file:///" + ($in -replace '\\','/')
  # @page{margin:0} 側でヘッダ/フッタ抑止。webfont 読込のため virtual-time-budget を確保。
  & $chrome --headless --disable-gpu --no-pdf-header-footer --no-margins `
      --virtual-time-budget=8000 "--print-to-pdf=$pdf" $url | Out-Null
  if (Test-Path $pdf) { Write-Host ("  OK  {0,-12} -> {1}" -f $h, $map[$h]) }
  else { throw "生成失敗: $pdf" }
}
Write-Host "Done. Output: $out"

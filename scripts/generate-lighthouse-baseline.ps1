param(
  [string]$BaseUrl = "http://127.0.0.1:3000",
  [string]$PagesFile = "scripts/lighthouse-pages.json",
  [string]$OutputRoot = "output/lighthouse/baseline",
  [string]$DateTag = (Get-Date -Format "yyyyMMdd-HHmmss")
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$repoRoot = (Get-Location).Path
$npxCmd = "C:\Program Files\nodejs\npx.cmd"
$npx = if (Test-Path $npxCmd) { $npxCmd } else { "npx" }
$pagesPath = Join-Path $repoRoot $PagesFile

if (-not (Test-Path $pagesPath)) {
  throw "Pages file not found: $pagesPath"
}

$pages = Get-Content -Raw $pagesPath | ConvertFrom-Json
if (-not $pages -or $pages.Count -eq 0) {
  throw "No pages found in $pagesPath"
}

$runRoot = Join-Path $repoRoot (Join-Path $OutputRoot $DateTag)
$jsonRoot = Join-Path $runRoot "json"
$lhciDir = Join-Path $repoRoot ".lighthouseci"

New-Item -ItemType Directory -Force -Path $runRoot | Out-Null
New-Item -ItemType Directory -Force -Path $jsonRoot | Out-Null
New-Item -ItemType Directory -Force -Path $lhciDir | Out-Null

Get-ChildItem -Path $lhciDir -Filter "lhr-*.json" -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path $lhciDir -Filter "lhr-*.html" -ErrorAction SilentlyContinue | Remove-Item -Force

$modes = @(
  @{ Name = "desktop"; ExtraArgs = @("--settings.preset=desktop") },
  @{ Name = "mobile"; ExtraArgs = @("--settings.formFactor=mobile", "--settings.screenEmulation.mobile=true") }
)

$failures = @()
$records = @()

foreach ($mode in $modes) {
  foreach ($page in $pages) {
    $url = "$BaseUrl$page"
    Write-Host "Auditing [$($mode.Name)] $url"

    $args = @(
      "-y",
      "@lhci/cli",
      "collect",
      "--url=$url",
      "--numberOfRuns=1",
      "--startServerCommand=npm run start",
      "--settings.chromeFlags=--no-sandbox --disable-dev-shm-usage"
    ) + $mode.ExtraArgs

    $before = @{}
    Get-ChildItem -Path $lhciDir -Filter "lhr-*.json" -ErrorAction SilentlyContinue | ForEach-Object {
      $before[$_.FullName] = $true
    }

    $exitCode = 0
    try {
      & $npx @args 1>$null 2>$null
      $exitCode = $LASTEXITCODE
    }
    catch {
      $exitCode = if ($LASTEXITCODE -ne $null) { $LASTEXITCODE } else { 1 }
    }

    $newReport = Get-ChildItem -Path $lhciDir -Filter "lhr-*.json" -ErrorAction SilentlyContinue |
      Where-Object { -not $before.ContainsKey($_.FullName) } |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1

    if (-not $newReport) {
      $newReport = Get-ChildItem -Path $lhciDir -Filter "lhr-*.json" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    }

    if ($newReport) {
      $report = Get-Content -Raw $newReport.FullName | ConvertFrom-Json
      $pathPart = $report.mainDocumentUrl.Replace($BaseUrl, "")
      $safeName = ($pathPart.TrimStart('/') -replace '[^a-zA-Z0-9\-\._]+','_')
      if ([string]::IsNullOrWhiteSpace($safeName)) { $safeName = "home" }
      if ($safeName.Length -gt 140) { $safeName = $safeName.Substring(0,140) }

      $modeDir = Join-Path $jsonRoot $mode.Name
      New-Item -ItemType Directory -Force -Path $modeDir | Out-Null
      $destJson = Join-Path $modeDir ("$safeName-$($newReport.BaseName).json")
      Copy-Item -Path $newReport.FullName -Destination $destJson -Force

      $records += [PSCustomObject]@{
        datetime_utc = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        baseline_tag = $DateTag
        mode = $mode.Name
        page_url = $report.finalUrl
        page_path = $pathPart
        performance_score = [math]::Round(($report.categories.performance.score * 100), 0)
        accessibility_score = [math]::Round(($report.categories.accessibility.score * 100), 0)
        best_practices_score = [math]::Round(($report.categories.'best-practices'.score * 100), 0)
        seo_score = [math]::Round(($report.categories.seo.score * 100), 0)
        pwa_score = if ($report.categories.pwa -and $null -ne $report.categories.pwa.score) { [math]::Round(($report.categories.pwa.score * 100), 0) } else { $null }
        first_contentful_paint_ms = [math]::Round($report.audits.'first-contentful-paint'.numericValue, 2)
        largest_contentful_paint_ms = [math]::Round($report.audits.'largest-contentful-paint'.numericValue, 2)
        total_blocking_time_ms = [math]::Round($report.audits.'total-blocking-time'.numericValue, 2)
        cumulative_layout_shift = [math]::Round($report.audits.'cumulative-layout-shift'.numericValue, 4)
        speed_index_ms = [math]::Round($report.audits.'speed-index'.numericValue, 2)
        interactive_ms = [math]::Round($report.audits.interactive.numericValue, 2)
        max_potential_fid_ms = [math]::Round($report.audits.'max-potential-fid'.numericValue, 2)
        server_response_time_ms = if ($report.audits.'server-response-time'.numericValue) { [math]::Round($report.audits.'server-response-time'.numericValue, 2) } else { $null }
        report_json_path = $destJson
      }
    }

    if ($exitCode -ne 0 -or -not $newReport) {
      $failures += [PSCustomObject]@{
        mode = $mode.Name
        page = $page
        url = $url
      }
    }
  }
}

if (-not $records -or $records.Count -eq 0) {
  throw "No Lighthouse reports were captured. Check command permissions and runtime logs."
}

$csvPath = Join-Path $runRoot "lighthouse-baseline.csv"
$records | Sort-Object mode, page_path | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8

$latestCsvPath = Join-Path $repoRoot "output/lighthouse/baseline/latest-lighthouse-baseline.csv"
Copy-Item -Path $csvPath -Destination $latestCsvPath -Force

$indexPath = Join-Path $repoRoot "output/lighthouse/baseline/latest-run.txt"
@(
  "generated_at_utc=$([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))"
  "baseline_tag=$DateTag"
  "csv=$csvPath"
  "json_dir=$jsonRoot"
  "report_count=$($records.Count)"
) | Set-Content -Path $indexPath -Encoding UTF8

if ($failures.Count -gt 0) {
  $failurePath = Join-Path $runRoot "lighthouse-failures.csv"
  $failures | Export-Csv -Path $failurePath -NoTypeInformation -Encoding UTF8
  Write-Host "Some audits failed. See: $failurePath"
}

Write-Host "Baseline CSV: $csvPath"
Write-Host "Latest CSV: $latestCsvPath"
Write-Host "Run index: $indexPath"
Write-Host "Reports collected: $($records.Count)"

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Url,

    [int]$Runs = 1,

    [ValidateSet('mobile', 'desktop')]
    [string]$Preset = 'mobile',

    [string]$OutputDir = 'output/lighthouse',

    [string[]]$ExtraArgs = @()
)

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    throw "npx is required to run Lighthouse CLI."
}

if ($Runs -lt 1) {
    throw "Runs must be at least 1."
}

$resolvedOutputDir = if ([System.IO.Path]::IsPathRooted($OutputDir)) {
    $OutputDir
} else {
    Join-Path (Get-Location) $OutputDir
}

New-Item -ItemType Directory -Force -Path $resolvedOutputDir | Out-Null

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'

for ($run = 1; $run -le $Runs; $run++) {
    $baseName = "lighthouse-$timestamp-run$run"
    $outputPath = Join-Path $resolvedOutputDir $baseName

    $args = @(
        '-y',
        'lighthouse',
        $Url,
        '--output', 'html',
        '--output', 'json',
        '--output-path', $outputPath,
        '--quiet'
    )

    if ($Preset -eq 'desktop') {
        $args += '--preset=desktop'
    }

    if ($ExtraArgs.Count -gt 0) {
        $args += $ExtraArgs
    }

    Write-Host "Running Lighthouse audit $run of $Runs"
    & npx @args

    if ($LASTEXITCODE -ne 0) {
        throw "Lighthouse CLI failed on run $run."
    }
}

Write-Host "Reports saved to $resolvedOutputDir"

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string[]]$Css,

    [Parameter(Mandatory = $true)]
    [string[]]$Content,

    [string[]]$Safelist = @(),

    [switch]$Rejected,

    [switch]$WriteChanges,

    [switch]$Backup,

    [string]$OutputDir
)

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    throw "npx is required to run PurgeCSS."
}

$tempOutputDir = $OutputDir
if ([string]::IsNullOrWhiteSpace($tempOutputDir)) {
    $tempOutputDir = Join-Path ([System.IO.Path]::GetTempPath()) ("purgecss-" + [guid]::NewGuid().ToString("N"))
}

New-Item -ItemType Directory -Path $tempOutputDir -Force | Out-Null

$args = @('-y', 'purgecss')
foreach ($cssPath in $Css) {
    $args += '--css'
    $args += $cssPath
}

foreach ($contentPath in $Content) {
    $args += '--content'
    $args += $contentPath
}

if ($Safelist.Count -gt 0) {
    foreach ($item in $Safelist) {
        $args += '--safelist'
        $args += $item
    }
}

if ($Rejected) {
    $args += '--rejected'
}

$args += '--output'
$args += $tempOutputDir

& npx @args

if ($LASTEXITCODE -ne 0) {
    throw "PurgeCSS exited with code $LASTEXITCODE."
}

$outputFiles = Get-ChildItem -Path $tempOutputDir -File
if (-not $WriteChanges) {
    $outputFiles | Select-Object FullName, Length
    return
}

foreach ($file in $outputFiles) {
    $target = $Css | Where-Object { [System.IO.Path]::GetFileName($_) -eq $file.Name } | Select-Object -First 1
    if (-not $target) {
        continue
    }

    if ($Backup) {
        Copy-Item -Path $target -Destination ($target + '.bak') -Force
    }

    Copy-Item -Path $file.FullName -Destination $target -Force
}

$outputFiles | Select-Object FullName, Length
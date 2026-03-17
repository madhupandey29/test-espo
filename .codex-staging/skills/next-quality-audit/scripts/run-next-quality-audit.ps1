param(
  [string]$ProjectPath = (Get-Location).Path,
  [string]$Stage = 'report',
  [switch]$DryRun,
  [switch]$AllowFix,
  [switch]$IncludePlaywright,
  [switch]$IncludeScreenshots,
  [string]$OutputJson,
  [string]$OutputMd,
  [string]$PlaywrightServerCommand
)

$cliPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\mcp-servers\next-quality-audit\cli.js'))
$args = @($cliPath, $Stage, '--project-path', $ProjectPath)

if ($DryRun) {
  $args += '--dry-run'
}

if ($AllowFix) {
  $args += '--allow-fix'
}

if ($IncludePlaywright) {
  $args += '--include-playwright'
}

if ($IncludeScreenshots) {
  $args += '--include-screenshots'
}

if ($OutputJson) {
  $args += @('--output-json', $OutputJson)
}

if ($OutputMd) {
  $args += @('--output-md', $OutputMd)
}

if ($PlaywrightServerCommand) {
  $args += @('--playwright-server-command', $PlaywrightServerCommand)
}

& node @args
exit $LASTEXITCODE

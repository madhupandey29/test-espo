[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$CliArgs = @()
)

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    throw "npx is required to run Lighthouse CI."
}

$args = @('-y', '@lhci/cli')

if ($CliArgs.Count -eq 0) {
    $args += 'autorun'
} else {
    $args += $CliArgs
}

& npx @args

if ($LASTEXITCODE -ne 0) {
    throw "Lighthouse CI exited with code $LASTEXITCODE."
}

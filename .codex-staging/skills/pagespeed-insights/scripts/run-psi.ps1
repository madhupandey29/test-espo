[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Url,

    [ValidateSet('mobile', 'desktop')]
    [string]$Strategy = 'mobile',

    [string[]]$Category = @('performance'),

    [string]$OutputFile
)

$query = [System.Collections.Generic.List[string]]::new()
$query.Add("url=$([uri]::EscapeDataString($Url))")
$query.Add("strategy=$Strategy")

foreach ($item in $Category) {
    $query.Add("category=$([uri]::EscapeDataString($item))")
}

$requestUrl = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?$($query -join '&')"
$response = Invoke-RestMethod -Uri $requestUrl -Method Get
$json = $response | ConvertTo-Json -Depth 100

if ($OutputFile) {
    $resolvedOutputFile = if ([System.IO.Path]::IsPathRooted($OutputFile)) {
        $OutputFile
    } else {
        Join-Path (Get-Location) $OutputFile
    }

    $parent = Split-Path -Parent $resolvedOutputFile
    if ($parent) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }

    Set-Content -LiteralPath $resolvedOutputFile -Value $json
    Write-Host "Saved PageSpeed Insights response to $resolvedOutputFile"
} else {
    $json
}

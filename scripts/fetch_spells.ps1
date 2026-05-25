<#
.SYNOPSIS
  Scrape D&D 5E spell pages from mythical.ink into a hardcodex-compatible CSV.

.DESCRIPTION
  For each id in $Start..$End, GET
    {BaseUrl}{id}
  parse the page, and append one row to $OutFile in this format
  (semicolon-delimited, every field quoted, UTF-8 without BOM, no header):

    Level; Name; Type; Cast Time; Range; Components; Duration; Description; Classes; Ritual

  Values are written verbatim from the page (no normalisation: cantrips read
  "Zaubertrick" in the Level column, ritual reads "Nein"/"Ja", classes are
  the localised German names, etc.). The Description column keeps the inner
  HTML fragment of the page so that <br />, <p>, <h5>, <span> etc. survive.

  Errors (network, HTTP, missing <h1>) are logged via Write-Warning and the
  loop continues.

.PARAMETER BaseUrl
  Base URL; the spell id is appended to it.

.PARAMETER Start
  First spell id (inclusive). Default 0.

.PARAMETER End
  Last spell id (inclusive). Default 395.

.PARAMETER OutFile
  Output CSV path (relative paths resolve against the current directory).

.PARAMETER DelayMs
  Polite delay between requests, in milliseconds. Default 250.

.EXAMPLE
  pwsh -File scripts/fetch_spells.ps1

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/fetch_spells.ps1 -Start 0 -End 10 -OutFile data/sample.csv
#>

[CmdletBinding()]
param(
    [string]$BaseUrl = 'https://mythical.ink/de/rpg-tools/dnd-spell-list/',
    [int]$Start = 0,
    [int]$End = 395,
    [string]$OutFile = 'data/SRD_spells_de_fetched.csv',
    [int]$DelayMs = 250
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

try {
    [Net.ServicePointManager]::SecurityProtocol =
        [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls11 -bor [Net.SecurityProtocolType]::Tls
} catch { }

$resolvedOut = if ([IO.Path]::IsPathRooted($OutFile)) {
    $OutFile
} else {
    Join-Path -Path (Get-Location) -ChildPath $OutFile
}
$outDir = Split-Path -Parent $resolvedOut
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}
if (Test-Path -LiteralPath $resolvedOut) {
    Remove-Item -LiteralPath $resolvedOut
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Quote([string]$s) {
    if ($null -eq $s) { return '""' }
    '"' + ($s -replace '"', '""') + '"'
}

function Decode-Entities([string]$s) {
    if ([string]::IsNullOrEmpty($s)) { return '' }
    [System.Net.WebUtility]::HtmlDecode($s)
}

function Strip-Tags([string]$s) {
    if ([string]::IsNullOrEmpty($s)) { return '' }
    $t = [regex]::Replace($s, '<[^>]+>', '')
    $t = [regex]::Replace($t, '\s+', ' ').Trim()
    Decode-Entities $t
}

function Get-Field([string]$html, [string]$label) {
    # Each metadata row looks like:
    #   <div class="flex">
    #     <div class="font-bold ...">LABEL<!-- -->:</div>
    #     <div class="grow ...">VALUE</div>
    #   </div>
    # VALUE may contain inner spans like <span keyword>Verzauberung</span>.
    $pattern = '<div class="font-bold[^"]*">' + [regex]::Escape($label) +
               '[^<]*(?:<!--[^>]*-->)?\s*:\s*</div>\s*' +
               '<div class="grow[^"]*">(.*?)</div>'
    $m = [regex]::Match($html, $pattern, [Text.RegularExpressions.RegexOptions]::Singleline)
    if ($m.Success) { return Strip-Tags $m.Groups[1].Value }
    return ''
}

function Get-Name([string]$html) {
    $m = [regex]::Match($html, '<h1[^>]*>(.*?)</h1>', [Text.RegularExpressions.RegexOptions]::Singleline)
    if ($m.Success) { return Strip-Tags $m.Groups[1].Value }
    return ''
}

function Get-Description([string]$html) {
    # Capture inner HTML of the description container (class starts with
    # "text-sm mb-4 basis-[60%]") up to but not including the metadata
    # container (class starts with "basis-[39%]").
    $pattern = 'text-sm mb-4 basis-\[60%\][^"]*">(.*?)</div>\s*<div class="basis-\[39%\]'
    $m = [regex]::Match($html, $pattern, [Text.RegularExpressions.RegexOptions]::Singleline)
    if (-not $m.Success) { return '' }
    $inner = $m.Groups[1].Value
    # Strip a single wrapping <div>...</div> if it is the only top-level
    # element (the simple-spell case). For complex pages (with a "Auf
    # hoeheren Graden" sub-block) leave the markup intact.
    $simple = [regex]::Match($inner, '^\s*<div>(.*)</div>\s*$', [Text.RegularExpressions.RegexOptions]::Singleline)
    if ($simple.Success) { $inner = $simple.Groups[1].Value }
    $inner = [regex]::Replace($inner, '\s+', ' ').Trim()
    Decode-Entities $inner
}

function Write-Row([string]$path, [string[]]$fields, [System.Text.UTF8Encoding]$enc) {
    $line = ($fields | ForEach-Object { Quote $_ }) -join ';'
    [IO.File]::AppendAllText($path, $line + "`r`n", $enc)
}

$total = $End - $Start + 1
$count = 0
$written = 0
$failed = 0

for ($i = $Start; $i -le $End; $i++) {
    $count++
    $url = "$BaseUrl$i"
    Write-Progress -Activity 'Fetching spells' -Status "id $i" -PercentComplete (($count / $total) * 100)

    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -UserAgent 'fetch_spells.ps1 (+nzain.github.io)' -TimeoutSec 30
    } catch {
        $failed++
        Write-Warning ("i={0}: request failed: {1}" -f $i, $_.Exception.Message)
        Start-Sleep -Milliseconds $DelayMs
        continue
    }

    if ($resp.StatusCode -ne 200) {
        $failed++
        Write-Warning ("i={0}: HTTP {1}" -f $i, $resp.StatusCode)
        Start-Sleep -Milliseconds $DelayMs
        continue
    }

    $html = [string]$resp.Content
    $name = Get-Name $html
    if ([string]::IsNullOrWhiteSpace($name)) {
        $failed++
        Write-Warning ("i={0}: no <h1> on page (probably missing id)" -f $i)
        Start-Sleep -Milliseconds $DelayMs
        continue
    }

    $level       = Get-Field $html 'Grad'
    $school      = Get-Field $html 'Schule'
    $castTime    = Get-Field $html 'Zeitaufwand'
    $duration    = Get-Field $html 'Wirkungsdauer'
    $range       = Get-Field $html 'Reichweite'
    $components  = Get-Field $html 'Komponenten'
    $classes     = Get-Field $html 'Klassen'
    $ritual      = Get-Field $html 'Ritual'
    $description = Get-Description $html

    if (-not ($level -or $school -or $castTime -or $duration -or $range -or $components)) {
        $failed++
        Write-Warning ("i={0}: no spell metadata (got '{1}') - skipping" -f $i, $name)
        Start-Sleep -Milliseconds $DelayMs
        continue
    }

    $row = @($level, $name, $school, $castTime, $range, $components, $duration, $description, $classes, $ritual)
    Write-Row -path $resolvedOut -fields $row -enc $utf8NoBom
    $written++

    Write-Host ("[{0}/{1}] id={2} {3}" -f $count, $total, $i, $name)

    if ($DelayMs -gt 0) { Start-Sleep -Milliseconds $DelayMs }
}

Write-Progress -Activity 'Fetching spells' -Completed
Write-Host ''
Write-Host ("Done. wrote={0} failed={1} out={2}" -f $written, $failed, $resolvedOut)

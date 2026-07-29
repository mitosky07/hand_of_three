param(
  [string]$AsepritePath = "C:\Proyectos\aseprite\build\bin\aseprite.exe"
)

$ErrorActionPreference = "Stop"
$project = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path.Replace("\", "/")
$script = (Join-Path $PSScriptRoot "build-aseprite-assets.lua").Replace("\", "/")

if (-not (Test-Path -LiteralPath $AsepritePath -PathType Leaf)) {
  throw "Aseprite was not found at: $AsepritePath"
}

$process = Start-Process -FilePath $AsepritePath `
  -ArgumentList @("--batch", "--script-param", "project=$project", "--script", $script) `
  -Wait -PassThru -WindowStyle Hidden
if ($process.ExitCode -ne 0) {
  throw "Aseprite asset build failed with exit code $($process.ExitCode)"
}

$sources = Get-ChildItem -LiteralPath (Join-Path $project "art-source\aseprite") -Filter *.aseprite
$exports = Get-ChildItem -LiteralPath (Join-Path $project "src\assets\ui") -Filter *.png
if ($sources.Count -lt 12 -or $exports.Count -lt 12) {
  throw "Asset build produced an incomplete set ($($sources.Count) sources, $($exports.Count) exports)."
}

$sources | Sort-Object Name | Select-Object Name, Length

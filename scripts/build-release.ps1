<#
.SYNOPSIS
  Release builder for ETS2 / ATS Stream Overlay Cockpit v0.0.4.
  Copyright (c) 2026 FooZzee. All Rights Reserved. Licensed under Proprietary Freeware License.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$ScriptPath = if ($MyInvocation.MyCommand.Path -and (Test-Path -LiteralPath $MyInvocation.MyCommand.Path)) {
    $MyInvocation.MyCommand.Path
} elseif ($PSScriptRoot) {
    Join-Path $PSScriptRoot 'build-release.ps1'
} else {
    Join-Path (Get-Location).Path 'scripts\build-release.ps1'
}

$Root = Split-Path -Parent (Split-Path -Parent $ScriptPath)
$Version = 'v0.0.4'
$PubGh = Join-Path $Root '_publish_github'
$PubRel = Join-Path $Root '_publish_release'
$StageZip = Join-Path $Root '_stage_zip_tmp'

$utf8Bom = New-Object System.Text.UTF8Encoding($true)
Get-ChildItem -Path (Join-Path $Root 'scripts') -Filter '*.ps1' | ForEach-Object {
    $txt = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
    [System.IO.File]::WriteAllText($_.FullName, $txt, $utf8Bom)
}

foreach ($dir in @($PubGh, $StageZip)) {
    if (Test-Path -LiteralPath $dir) { Remove-Item -LiteralPath $dir -Recurse -Force }
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}
if (-not (Test-Path -LiteralPath $PubRel)) { New-Item -ItemType Directory -Path $PubRel -Force | Out-Null }

$userDirs = @('assets', 'redist', 'scripts')
foreach ($d in $userDirs) {
    Copy-Item -Path (Join-Path $Root $d) -Destination (Join-Path $PubGh $d) -Recurse -Force
    Copy-Item -Path (Join-Path $Root $d) -Destination (Join-Path $StageZip $d) -Recurse -Force
}

Copy-Item -Path (Join-Path $Root 'build-installer') -Destination (Join-Path $PubGh 'build-installer') -Recurse -Force
$stageBuildRel = Join-Path $StageZip 'scripts\build-release.ps1'
if (Test-Path -LiteralPath $stageBuildRel) { Remove-Item -LiteralPath $stageBuildRel -Force }

$rootFiles = @(
    '.gitignore', 'build-and-install-plugin.bat', 'CHANGELOG.en.md', 'CHANGELOG.md', 'CHANGELOG.ru.md',
    'commands.en.md', 'commands.md', 'commands.ru.md', 'config.example.js', 'Configure-Overlay.bat',
    'Configure-Overlay.vbs', 'ets2-desktop.html', 'Install-Overlay.bat', 'LICENSE',
    'README.en.md', 'README.md', 'README.ru.md', "RELEASE_NOTES_$Version.md",
    'Start-Overlay.bat', 'start-telemetry.bat', 'Update-Overlay.bat'
)
foreach ($f in $rootFiles) {
    $src = Join-Path $Root $f
    if (-not (Test-Path -LiteralPath $src)) { throw "Missing required release file: $f" }
    Copy-Item -LiteralPath $src -Destination (Join-Path $PubGh $f) -Force
    Copy-Item -LiteralPath $src -Destination (Join-Path $StageZip $f) -Force
}

$zipPath = Join-Path $PubRel "Stream_Overlay_Cockpit-$Version.zip"
if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($StageZip, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
Remove-Item -LiteralPath $StageZip -Recurse -Force

Copy-Item -LiteralPath (Join-Path $Root "RELEASE_NOTES_$Version.md") -Destination (Join-Path $PubRel "RELEASE_NOTES_$Version.md") -Force

$csc = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$wpfDir = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\WPF'
$exePath = Join-Path $PubRel "Stream_Overlay_Cockpit_Setup_$Version.exe"
if (Test-Path -LiteralPath $exePath) { Remove-Item -LiteralPath $exePath -Force }

& $csc /nologo /target:winexe /platform:anycpu /optimize+ `
    "/out:$exePath" `
    "/win32icon:$(Join-Path $Root 'build-installer\app.ico')" `
    "/resource:$zipPath,OverlayPackage.zip" `
    "/r:System.dll" `
    "/r:System.Core.dll" `
    "/r:System.Drawing.dll" `
    "/r:System.Windows.Forms.dll" `
    "/r:System.IO.Compression.dll" `
    "/r:System.IO.Compression.FileSystem.dll" `
    "/r:System.Xaml.dll" `
    "/r:$wpfDir\PresentationFramework.dll" `
    "/r:$wpfDir\PresentationCore.dll" `
    "/r:$wpfDir\WindowsBase.dll" `
    "$(Join-Path $Root 'build-installer\InstallerApp.cs')"

if ($LASTEXITCODE -ne 0) { throw "csc.exe failed with exit code $LASTEXITCODE" }
Write-Output "RELEASE_BUILD_SUCCESS=True"

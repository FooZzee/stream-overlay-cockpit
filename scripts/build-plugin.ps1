<#
.SYNOPSIS
  Локальная сборка x64 C++ плагина overlayobs_foozzee_telemetry.dll (SCS SDK 1.16)
  и автоматическая установка в папки Euro Truck Simulator 2 и American Truck Simulator.
#>
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$projectRoot = Split-Path -Parent $PSScriptRoot
$nativeDir   = Join-Path $projectRoot 'native-plugin'
$buildDir    = Join-Path $nativeDir 'build'
$redistDir   = Join-Path $projectRoot 'redist'
$pluginName  = 'overlayobs_foozzee_telemetry'
$redistDll   = Join-Path $redistDir "$pluginName.dll"

Write-Host "=================================================================" -ForegroundColor DarkGray
Write-Host "  Сборка и установка плагина $pluginName.dll (x64)" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor DarkGray

if (-not (Test-Path (Join-Path $nativeDir 'CMakeLists.txt'))) {
  Write-Host "[ОШИБКА] Не найден $nativeDir\CMakeLists.txt" -ForegroundColor Red
  exit 1
}

# 1. Поиск Visual Studio / Build Tools через vswhere.exe
$vswhereCandidates = [System.Collections.Generic.List[string]]::new()
if (-not [string]::IsNullOrWhiteSpace(${env:ProgramFiles(x86)})) {
  $vswhereCandidates.Add((Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'))
}
if (-not [string]::IsNullOrWhiteSpace($env:ProgramFiles)) {
  $vswhereCandidates.Add((Join-Path $env:ProgramFiles 'Microsoft Visual Studio\Installer\vswhere.exe'))
}

$vswherePath = $vswhereCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $vswherePath) {
  Write-Host "[ОШИБКА] Не найден vswhere.exe. Установите Visual Studio 2022 или Build Tools for Visual Studio с компонентом 'Разработка классических приложений на C++'." -ForegroundColor Red
  exit 1
}

$vsInstallPath = & $vswherePath -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>$null | Select-Object -First 1
if ([string]::IsNullOrWhiteSpace($vsInstallPath)) {
  $vsInstallPath = & $vswherePath -latest -products * -property installationPath 2>$null | Select-Object -First 1
}
if ([string]::IsNullOrWhiteSpace($vsInstallPath) -or -not (Test-Path $vsInstallPath)) {
  Write-Host "[ОШИБКА] Не найдена установка Visual Studio с инструментами C++ (VC Tools x64)." -ForegroundColor Red
  exit 1
}

$vcvars64 = Join-Path $vsInstallPath 'VC\Auxiliary\Build\vcvars64.bat'
if (-not (Test-Path $vcvars64)) {
  Write-Host "[ОШИБКА] Не найден $vcvars64. Убедитесь, что в Visual Studio Installer выбран компонент 'MSVC ... x64/x86 build tools'." -ForegroundColor Red
  exit 1
}
Write-Host "[OK] Visual Studio : $vsInstallPath" -ForegroundColor Cyan

# Поиск cmake.exe (PATH -> встроенный в VS -> стандартный путь CMake)
$cmakeCmd = Get-Command 'cmake' -ErrorAction SilentlyContinue
$cmakeExe = if ($cmakeCmd) { $cmakeCmd.Source } else { $null }
if (-not $cmakeExe) {
  $vsCmakeCandidates = [System.Collections.Generic.List[string]]::new()
  $vsCmakeCandidates.Add((Join-Path $vsInstallPath 'Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe'))
  if (-not [string]::IsNullOrWhiteSpace($env:ProgramFiles)) {
    $vsCmakeCandidates.Add((Join-Path $env:ProgramFiles 'CMake\bin\cmake.exe'))
  }
  if (-not [string]::IsNullOrWhiteSpace(${env:ProgramFiles(x86)})) {
    $vsCmakeCandidates.Add((Join-Path ${env:ProgramFiles(x86)} 'CMake\bin\cmake.exe'))
  }
  $cmakeExe = $vsCmakeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $cmakeExe) {
  Write-Host "[ОШИБКА] Не найден cmake.exe ни в PATH, ни внутри Visual Studio." -ForegroundColor Red
  exit 1
}
Write-Host "[OK] CMake         : $cmakeExe" -ForegroundColor Cyan

# 2. Конфигурация и сборка Release x64
if (-not (Test-Path $buildDir)) {
  [void](New-Item -ItemType Directory -Path $buildDir -Force)
}

Write-Host "`n[1/3] Конфигурация и сборка $pluginName.dll (Release x64)..." -ForegroundColor Yellow
$cmdArgs = "/d /s /c `"call `"$vcvars64`" >nul && `"$cmakeExe`" -S `"$nativeDir`" -B `"$buildDir`" -A x64 && `"$cmakeExe`" --build `"$buildDir`" --config Release`""
$psi = [System.Diagnostics.ProcessStartInfo]::new('cmd.exe', $cmdArgs)
$psi.WorkingDirectory = $projectRoot
$psi.UseShellExecute = $false
$proc = [System.Diagnostics.Process]::Start($psi)
$proc.WaitForExit()
if ($proc.ExitCode -ne 0) {
  Write-Host "`n[ОШИБКА] Сборка CMake/MSVC завершилась с кодом $($proc.ExitCode)." -ForegroundColor Red
  exit $proc.ExitCode
}

$builtDllCandidates = @(
  (Join-Path $buildDir "Release\$pluginName.dll"),
  (Join-Path $buildDir "$pluginName.dll")
)
$builtDll = $builtDllCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $builtDll) {
  Write-Host "[ОШИБКА] Сборка завершилась, но $pluginName.dll не найден в $buildDir." -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $redistDir)) {
  [void](New-Item -ItemType Directory -Path $redistDir -Force)
}
Copy-Item -Path $builtDll -Destination $redistDll -Force
Write-Host "[2/3] [OK] DLL сохранена в .\redist\$pluginName.dll" -ForegroundColor Green

# Очистка устаревшего scs_direct_telemetry.dll в redist
$oldRedistDll = Join-Path $redistDir 'scs_direct_telemetry.dll'
if (Test-Path -LiteralPath $oldRedistDll) {
  try {
    Remove-Item -LiteralPath $oldRedistDll -Force -ErrorAction SilentlyContinue
    Write-Host "  [Очистка] Удален устаревший redist\scs_direct_telemetry.dll" -ForegroundColor DarkGray
  } catch {}
}

# 3. Автопоиск ETS2 / ATS через реестр Steam и libraryfolders.vdf
Write-Host "`n[3/3] Поиск установленных ETS2 и ATS в библиотеках Steam..." -ForegroundColor Yellow

$steamRoot = $null
foreach ($regPath in @(
  'HKCU:\Software\Valve\Steam',
  'HKLM:\SOFTWARE\WOW6432Node\Valve\Steam',
  'HKLM:\SOFTWARE\Valve\Steam'
)) {
  if (Test-Path $regPath) {
    $props = Get-ItemProperty -Path $regPath -ErrorAction SilentlyContinue
    if ($props.SteamPath) {
      $steamRoot = ([string]$props.SteamPath) -replace '/', '\'
      break
    }
    if ($props.InstallPath) {
      $steamRoot = ([string]$props.InstallPath) -replace '/', '\'
      break
    }
  }
}

$libraryRoots = [System.Collections.Generic.List[string]]::new()
$seenRoots = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

function Add-LibraryRoot {
  param([string]$CandidatePath)
  if ([string]::IsNullOrWhiteSpace($CandidatePath)) { return }
  $norm = ($CandidatePath.Trim() -replace '\\\\', '\' -replace '/', '\').TrimEnd('\')
  if ($norm -and (Test-Path $norm) -and $seenRoots.Add($norm)) {
    $libraryRoots.Add($norm)
  }
}

if ($steamRoot) {
  Add-LibraryRoot -CandidatePath $steamRoot
  foreach ($vdfRel in @('steamapps\libraryfolders.vdf', 'config\libraryfolders.vdf')) {
    $vdfPath = Join-Path $steamRoot $vdfRel
    if (Test-Path $vdfPath) {
      $vdfContent = Get-Content -Path $vdfPath -Raw -Encoding UTF8
      foreach ($m in [regex]::Matches($vdfContent, '"path"\s+"([^"]+)"')) {
        Add-LibraryRoot -CandidatePath $m.Groups[1].Value
      }
      foreach ($m in [regex]::Matches($vdfContent, '"\d+"\s+"([A-Za-z]:[^"]+)"')) {
        Add-LibraryRoot -CandidatePath $m.Groups[1].Value
      }
    }
  }
}

$gamesSpec = @(
  @{ Code = 'ETS2'; Folder = 'Euro Truck Simulator 2'; AppId = '227300' },
  @{ Code = 'ATS';  Folder = 'American Truck Simulator'; AppId = '270880' }
)

$installedCount = 0
foreach ($lib in $libraryRoots) {
  $commonDir = Join-Path $lib 'steamapps\common'
  if (-not (Test-Path $commonDir)) { continue }

  foreach ($game in $gamesSpec) {
    $gameFolder = Join-Path $commonDir $game.Folder
    if (-not (Test-Path $gameFolder)) {
      $acfPath = Join-Path $lib "steamapps\appmanifest_$($game.AppId).acf"
      if (Test-Path $acfPath) {
        $acfText = Get-Content -Path $acfPath -Raw -Encoding UTF8
        if ($acfText -match '"installdir"\s+"([^"]+)"') {
          $gameFolder = Join-Path $commonDir $Matches[1]
        }
      }
    }

    $win64Dir = Join-Path $gameFolder 'bin\win_x64'
    if (-not (Test-Path $win64Dir)) { continue }

    $pluginsDir = Join-Path $win64Dir 'plugins'
    if (-not (Test-Path $pluginsDir)) {
      [void](New-Item -ItemType Directory -Path $pluginsDir -Force)
    }

    # Удаление устаревшего scs_direct_telemetry.dll из папки игры
    $oldGameDll = Join-Path $pluginsDir 'scs_direct_telemetry.dll'
    if (Test-Path -LiteralPath $oldGameDll) {
      try {
        Remove-Item -LiteralPath $oldGameDll -Force -ErrorAction Stop
        Write-Host "  [$($game.Code)] Удален устаревший плагин: $oldGameDll" -ForegroundColor DarkGray
      } catch {
        Write-Host "  [$($game.Code)] [ПРЕДУПРЕЖДЕНИЕ] Не удалось удалить устаревший $oldGameDll (закройте игру, если она запущена): $($_.Exception.Message)" -ForegroundColor DarkYellow
      }
    }

    $dstDll = Join-Path $pluginsDir "$pluginName.dll"
    try {
      Copy-Item -Path $redistDll -Destination $dstDll -Force
      Write-Host "  [$($game.Code)] Установлено: $dstDll" -ForegroundColor Green
      $installedCount += 1
    } catch {
      Write-Host "  [$($game.Code)] [ОШИБКА] Не удалось скопировать DLL в $dstDll (закройте игру, если она запущена): $($_.Exception.Message)" -ForegroundColor Red
    }
  }
}

Write-Host "`n=================================================================" -ForegroundColor DarkGray
if ($installedCount -gt 0) {
  Write-Host "  [OK] Плагин скомпилирован и установлен в ETS2/ATS (игр обновлено: $installedCount)." -ForegroundColor Green
  Write-Host "  Теперь можно запускать start-telemetry.bat и игру!" -ForegroundColor Cyan
} else {
  Write-Host "  [OK] Плагин скомпилирован: $redistDll" -ForegroundColor Yellow
  Write-Host "  [!] Папки ETS2/ATS в Steam не найдены автоматически — скопируйте DLL вручную в bin\win_x64\plugins\." -ForegroundColor Yellow
}
Write-Host "=================================================================" -ForegroundColor DarkGray

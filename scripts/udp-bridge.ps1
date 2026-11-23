<#
.SYNOPSIS
  Local HTTP telemetry bridge for ETS2 / ATS (SCS Telemetry SDK 1.16 Shared Memory).
  ETS2 / ATS Cockpit Stream Overlay — Copyright (c) 2026 FooZzee. All Rights Reserved.
  - Reads Shared Memory (Local\FooZzeeSCSTelemetry) from overlayobs_foozzee_telemetry.dll -> HTTP http://127.0.0.1:30002/telemetry
  - Pure native SCS SDK 1.16 bridge (no third-party proxy apps required)
#>
param(
  [string]$BindHost = '127.0.0.1',
  [int]$HttpPort = 30002,
  [string]$SharedMemoryName = 'Local\FooZzeeSCSTelemetry',
  [int]$StaleTimeoutMs = 5000,
  [ValidateSet('', 'en', 'ru')]
  [string]$Lang = ''
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Resolve-BridgeLanguage {
  param([string]$RequestedLang)
  if ($RequestedLang -eq 'en' -or $RequestedLang -eq 'ru') {
    return $RequestedLang
  }

  $baseDir = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Location).Path }
  $configPath = Join-Path $baseDir 'config.js'
  if (Test-Path -LiteralPath $configPath) {
    try {
      $cfgRaw = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8
      $match = [regex]::Match($cfgRaw, "(?im)^\s*lang\s*:\s*['""](en|ru)['""]")
      if ($match.Success) {
        return $match.Groups[1].Value.ToLowerInvariant()
      }
    } catch {
      # Fallback below
    }
  }

  $iso = [System.Globalization.CultureInfo]::CurrentUICulture.TwoLetterISOLanguageName.ToLowerInvariant()
  if ($iso -eq 'ru') { return 'ru' }
  return 'en'
}

$uiLang = Resolve-BridgeLanguage -RequestedLang $Lang

$msg = if ($uiLang -eq 'en') {
  @{
    Title      = '  ETS2 / ATS Native SCS SDK 1.16 Shared Memory Bridge -> OBS'
    SharedMem  = "  SharedMem  : $SharedMemoryName (stale {0}ms)"
    Telemetry  = "  Telemetry  : http://${BindHost}:${HttpPort}/telemetry"
    Health     = "  Health     : http://${BindHost}:${HttpPort}/health"
    StopHint   = '  Press Ctrl+C to stop.'
    Online     = "Native SCS SDK telemetry active ($SharedMemoryName)."
    Disconnected = 'SCS plugin loaded, waiting in menu or driver seat (connected: false).'
    Offline    = "Game is not running or Shared Memory '$SharedMemoryName' not found - waiting."
    PortErr    = "Failed to bind HTTP port $HttpPort`: {0}"
    PortHint   = 'The bridge may already be running in another window or the port is busy.'
  }
} else {
  @{
    Title      = '  ETS2 / ATS Прямой мост SCS SDK 1.16 Shared Memory -> OBS'
    SharedMem  = "  SharedMem  : $SharedMemoryName (таймаут {0} мс)"
    Telemetry  = "  Telemetry  : http://${BindHost}:${HttpPort}/telemetry"
    Health     = "  Health     : http://${BindHost}:${HttpPort}/health"
    StopHint   = '  Нажмите Ctrl+C для остановки.'
    Online     = "Прямая телеметрия SCS SDK активна ($SharedMemoryName)."
    Disconnected = 'Плагин SCS загружен, симулятор в меню или не на линии (connected: false).'
    Offline    = "Игра не запущена или Shared Memory '$SharedMemoryName' не найдена — ожидание."
    PortErr    = "[ОШИБКА] Не удалось открыть порт HTTP $HttpPort`: {0}"
    PortHint   = 'Возможно, мост уже запущен в другом окне или порт занят другой программой.'
  }
}

if (-not ('ScsNativeTick' -as [type])) {
  Add-Type -TypeDefinition @'
using System.Runtime.InteropServices;
public static class ScsNativeTick {
  [DllImport("kernel32.dll")]
  public static extern ulong GetTickCount64();
}
'@
}

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$loopbackIp = [System.Net.IPAddress]::Parse($BindHost)
$effectiveStaleMs = [Math]::Max(1000, [Math]::Min(60000, $StaleTimeoutMs))
$listener = $null

function Send-HttpResponse {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [string]$Body = '',
    [long]$AgeMs = -1,
    [System.Text.Encoding]$Encoding
  )

  $bodyBytes = if ($Body.Length -gt 0) { $Encoding.GetBytes($Body) } else { [byte[]]::new(0) }

  $headers = [System.Text.StringBuilder]::new()
  [void]$headers.Append("HTTP/1.1 $StatusCode $StatusText`r`n")
  [void]$headers.Append("Access-Control-Allow-Origin: *`r`n")
  [void]$headers.Append("Access-Control-Allow-Methods: GET, OPTIONS`r`n")
  [void]$headers.Append("Access-Control-Allow-Headers: *`r`n")
  [void]$headers.Append("Access-Control-Expose-Headers: X-Telemetry-Age-Ms`r`n")
  [void]$headers.Append("Cache-Control: no-store, no-cache, must-revalidate`r`n")
  [void]$headers.Append("X-Telemetry-Age-Ms: $AgeMs`r`n")
  if ($StatusCode -ne 204) {
    [void]$headers.Append("Content-Type: application/json; charset=utf-8`r`n")
    [void]$headers.Append("Content-Length: $($bodyBytes.Length)`r`n")
  }
  [void]$headers.Append("Connection: close`r`n`r`n")

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers.ToString())
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($bodyBytes.Length -gt 0) {
    $Stream.Write($bodyBytes, 0, $bodyBytes.Length)
  }
  $Stream.Flush()
}

$script:ShmTotalSize = 65536
$script:ShmHeaderSize = 27
$script:ShmMaxPayload = 65000
$script:PacketMagic = [uint32]0x53435331
$script:TripTracker = @{
  Initialized = $false
  JobKey      = ''
  LastOdo     = -1.0
  LastFuel    = -1.0
  DrivenKm    = 0.0
  LitersUsed  = 0.0
  MaxSpeedKmh = 0
}

function Clean-PlaceName {
  param([string]$raw)
  if ([string]::IsNullOrWhiteSpace($raw)) { return '' }
  $trimmed = $raw.Trim()
  $lower = $trimmed.ToLowerInvariant()
  $invalidTokens = @('city', 'viewpoint', 'viewpoints', 'stop', 'stops', 'bus_stop', 'station', 'landmark', 'scenic', 'null', 'undefined', 'none', 'n/a', '-', '--')
  if ($invalidTokens -contains $lower) { return '' }

  # Очистка технических префиксов и суффиксов остановок (DLC Coaches / bus_job)
  # Например: stop.jokulsarlon.01 -> jokulsarlon, reykjavik_bus_station -> reykjavik
  $cleaned = $trimmed -replace '^(stop|station|terminal)[._\-\s]+', ''
  $cleaned = $cleaned -replace '[._\-\s]+(bus[._\-\s]*station|bus[._\-\s]*stop|station|terminal)$', ''
  $cleaned = $cleaned -replace '[._\-\s]+\d+$', ''
  $cleaned = $cleaned.Trim()

  $lowerCleaned = $cleaned.ToLowerInvariant()
  if ($invalidTokens -contains $lowerCleaned -or [string]::IsNullOrWhiteSpace($cleaned)) {
    return $trimmed
  }
  return $cleaned
}

function Update-TripStatistics {
  param(
    [string]$JobKey,
    [double]$OdometerKm,
    [double]$FuelAmount,
    [double]$FuelAvgL100,
    [int]$SpeedKmh
  )

  $tracker = $script:TripTracker

  if (-not $tracker.Initialized -or $JobKey -ne $tracker.JobKey) {
    $tracker.Initialized = $true
    $tracker.JobKey = $JobKey
    $tracker.DrivenKm = 0.0
    $tracker.LitersUsed = 0.0
    $tracker.MaxSpeedKmh = $SpeedKmh
    $tracker.LastOdo = if ($OdometerKm -ge 0) { $OdometerKm } else { -1.0 }
    $tracker.LastFuel = if ($FuelAmount -ge 0) { $FuelAmount } else { -1.0 }
  } else {
    if ($OdometerKm -ge 0) {
      if ($tracker.LastOdo -ge 0) {
        $deltaOdo = $OdometerKm - $tracker.LastOdo
        if ($deltaOdo -gt 0.0 -and $deltaOdo -lt 50.0) {
          $tracker.DrivenKm += $deltaOdo
        }
      }
      $tracker.LastOdo = $OdometerKm
    }

    if ($FuelAmount -ge 0) {
      if ($tracker.LastFuel -ge 0) {
        $deltaFuel = $tracker.LastFuel - $FuelAmount
        # Учитываем только расход (при дозаправке на АЗС fuel растёт — скачок вверх игнорируем)
        if ($deltaFuel -gt 0.0 -and $deltaFuel -lt 100.0) {
          $tracker.LitersUsed += $deltaFuel
        }
      }
      $tracker.LastFuel = $FuelAmount
    }

    if ($SpeedKmh -gt $tracker.MaxSpeedKmh) {
      $tracker.MaxSpeedKmh = $SpeedKmh
    }
  }

  $driven = [Math]::Round($tracker.DrivenKm, 1)
  $liters = [Math]::Round($tracker.LitersUsed, 1)
  $avg = if ($tracker.DrivenKm -gt 0.1 -and $tracker.LitersUsed -ge 0.0) {
    [Math]::Round(($tracker.LitersUsed / $tracker.DrivenKm) * 100.0, 1)
  } elseif ($FuelAvgL100 -gt 0.0) {
    [Math]::Round($FuelAvgL100, 1)
  } else {
    0.0
  }

  return @{
    driven   = $driven
    liters   = $liters
    avg      = $avg
    maxSpeed = [int]$tracker.MaxSpeedKmh
  }
}

function Read-SharedMemoryTelemetry {
  param(
    [string]$MemoryName,
    [int]$StaleMs,
    [DateTime]$EpochUtc
  )

  $mmf = $null
  $accessor = $null

  try {
    try {
      $mmf = [System.IO.MemoryMappedFiles.MemoryMappedFile]::OpenExisting(
        $MemoryName,
        [System.IO.MemoryMappedFiles.MemoryMappedFileRights]::Read
      )
    } catch {
      $script:TripTracker.Initialized = $false
      return @{
        Status = 'offline'
        AgeMs  = [long]-1
        Body   = '{"ok":false,"connected":false,"lastEvent":{"seq":0,"type":"","amount":0,"offence":"","source":"","target":"","xp":0}}'
      }
    }

    $accessor = $mmf.CreateViewAccessor(
      0,
      $script:ShmTotalSize,
      [System.IO.MemoryMappedFiles.MemoryMappedFileAccess]::Read
    )

    $hdrBuf = [byte[]]::new($script:ShmHeaderSize)
    $rawJson = $null
    $ageMs = [long]-1
    $timestampMs = [uint64]0
    $isDisconnected = $false
    $isInvalid = $false

    for ($attempt = 0; $attempt -lt 5; $attempt++) {
      $readHdr = $accessor.ReadArray(0, $hdrBuf, 0, $script:ShmHeaderSize)
      if ($readHdr -lt $script:ShmHeaderSize) {
        $isInvalid = $true
        break
      }

      $magic         = [BitConverter]::ToUInt32($hdrBuf, 0)
      $version       = [BitConverter]::ToUInt32($hdrBuf, 4)
      $seq1          = [BitConverter]::ToUInt32($hdrBuf, 8)
      $timestampMs   = [BitConverter]::ToUInt64($hdrBuf, 12)
      $connectedFlag = $hdrBuf[20]
      # offset 21: gameId, offset 22: paused
      $payloadLength = [BitConverter]::ToUInt32($hdrBuf, 23)

      if ($magic -ne $script:PacketMagic -or $version -lt 1) {
        $isInvalid = $true
        break
      }

      if (($seq1 -band 1) -ne 0) {
        [System.Threading.Thread]::SpinWait(40)
        continue
      }

      $nowTickMs = [uint64][ScsNativeTick]::GetTickCount64()
      $ageMs = if ($timestampMs -gt 0 -and $nowTickMs -ge $timestampMs) {
        [long]($nowTickMs - $timestampMs)
      } elseif ($timestampMs -eq 0) {
        [long]999999
      } else {
        [long]0
      }

      if ($connectedFlag -eq 0 -or $ageMs -gt $StaleMs) {
        $isDisconnected = $true
        break
      }

      if ($payloadLength -le 0 -or $payloadLength -gt $script:ShmMaxPayload) {
        $isInvalid = $true
        break
      }

      $jsonBytes = [byte[]]::new([int]$payloadLength)
      $readBody = $accessor.ReadArray($script:ShmHeaderSize, $jsonBytes, 0, [int]$payloadLength)
      $seq2 = $accessor.ReadUInt32(8)

      if ($readBody -lt $payloadLength -or $seq2 -ne $seq1 -or ($seq2 -band 1) -ne 0) {
        [System.Threading.Thread]::SpinWait(40)
        continue
      }

      $rawJson = [System.Text.Encoding]::UTF8.GetString($jsonBytes)
      break
    }

    if ($isInvalid) {
      $script:TripTracker.Initialized = $false
      return @{
        Status = 'offline'
        AgeMs  = [long]-1
        Body   = '{"ok":false,"connected":false,"lastEvent":{"seq":0,"type":"","amount":0,"offence":"","source":"","target":"","xp":0}}'
      }
    }

    if ($isDisconnected) {
      $script:TripTracker.Initialized = $false
      return @{
        Status = 'disconnected'
        AgeMs  = $ageMs
        Body   = '{"ok":true,"connected":false,"lastEvent":{"seq":0,"type":"","amount":0,"offence":"","source":"","target":"","xp":0}}'
      }
    }

    if ([string]::IsNullOrWhiteSpace($rawJson)) {
      return @{
        Status = 'offline'
        AgeMs  = [long]-1
        Body   = '{"ok":false,"connected":false,"lastEvent":{"seq":0,"type":"","amount":0,"offence":"","source":"","target":"","xp":0}}'
      }
    }

    $shmState = $rawJson | ConvertFrom-Json
    if ($null -eq $shmState -or $null -eq $shmState.tel) {
      return @{
        Status = 'disconnected'
        AgeMs  = $ageMs
        Body   = '{"ok":true,"connected":false}'
      }
    }

    $telIn = $shmState.tel
    $cfgIn = $shmState.cfg
    $srvIn = $shmState.srv
    $eventIn = if ($null -ne $shmState -and $null -ne $shmState.lastEvent) { $shmState.lastEvent } else { $null }

    $eventSeq = if ($null -ne $eventIn -and $null -ne $eventIn.seq) { [int64]$eventIn.seq } else { [int64]0 }
    $eventType = if ($null -ne $eventIn -and $null -ne $eventIn.type) { [string]$eventIn.type } else { '' }
    $eventAmount = if ($null -ne $eventIn -and $null -ne $eventIn.amount) { [int64]$eventIn.amount } else { [int64]0 }
    $eventOffence = if ($null -ne $eventIn -and $null -ne $eventIn.offence) { [string]$eventIn.offence } else { '' }
    $eventSource = if ($null -ne $eventIn -and $null -ne $eventIn.source) { [string]$eventIn.source } else { '' }
    $eventTarget = if ($null -ne $eventIn -and $null -ne $eventIn.target) { [string]$eventIn.target } else { '' }
    $eventXp = if ($null -ne $eventIn -and $null -ne $eventIn.xp) { [int]$eventIn.xp } else { 0 }

    $lastEventObj = [ordered]@{
      seq     = $eventSeq
      type    = $eventType
      amount  = $eventAmount
      offence = $eventOffence
      source  = $eventSource
      target  = $eventTarget
      xp      = $eventXp
    }

    # Конвертация скоростей из м/с в км/ч (целые числа для корректной авто-детекции в JS)
    $speedMs       = if ($null -ne $telIn.speedMs) { [double]$telIn.speedMs } else { 0.0 }
    $speedLimitMs  = if ($null -ne $telIn.speedLimitMs) { [double]$telIn.speedLimitMs } else { 0.0 }
    $cruiseMs      = if ($null -ne $telIn.cruiseMs) { [double]$telIn.cruiseMs } else { 0.0 }

    $speedKmh      = [int][Math]::Round([Math]::Abs($speedMs) * 3.6)
    $speedLimitKmh = if ($speedLimitMs -gt 0.1) { [int][Math]::Round($speedLimitMs * 3.6) } else { 0 }
    $cruiseKmh     = if ($cruiseMs -gt 0.1) { [int][Math]::Round($cruiseMs * 3.6) } else { 0 }
    $cruiseOn      = ($cruiseMs -gt 0.1 -and $cruiseKmh -gt 0.5)

    $displayedGear = if ($null -ne $telIn.displayedGear) { [int]$telIn.displayedGear } else { 0 }
    $dgearText = if ($displayedGear -eq 0) {
      'N'
    } elseif ($displayedGear -lt 0) {
      "R$([Math]::Abs($displayedGear))"
    } else {
      "D$displayedGear"
    }

    $odometerKm  = if ($null -ne $telIn.odometer) { [double]$telIn.odometer } else { 0.0 }
    $fuelAmount  = if ($null -ne $telIn.fuel) { [double]$telIn.fuel } else { 0.0 }
    $fuelAvgL100 = if ($null -ne $telIn.fuelAvg) { [Math]::Round([double]$telIn.fuelAvg, 1) } else { 0.0 }

    $rawSrcCity       = if ($null -ne $cfgIn -and $null -ne $cfgIn.source) { [string]$cfgIn.source.city } else { '' }
    $rawSrcComp       = if ($null -ne $cfgIn -and $null -ne $cfgIn.source) { [string]$cfgIn.source.company } else { '' }
    $rawDstCity       = if ($null -ne $cfgIn -and $null -ne $cfgIn.destination) { [string]$cfgIn.destination.city } else { '' }
    $rawDstComp       = if ($null -ne $cfgIn -and $null -ne $cfgIn.destination) { [string]$cfgIn.destination.company } else { '' }

    $srcCityRaw       = Clean-PlaceName -raw $rawSrcCity
    $srcCompRaw       = Clean-PlaceName -raw $rawSrcComp
    $dstCityRaw       = Clean-PlaceName -raw $rawDstCity
    $dstCompRaw       = Clean-PlaceName -raw $rawDstComp

    $srcCityIdRaw     = if ($null -ne $cfgIn -and $null -ne $cfgIn.source -and -not [string]::IsNullOrWhiteSpace($cfgIn.source.cityId)) { [string]$cfgIn.source.cityId } elseif ($null -ne $cfgIn -and -not [string]::IsNullOrWhiteSpace($cfgIn.sourceCityId)) { [string]$cfgIn.sourceCityId } elseif ($null -ne $cfgIn -and $null -ne $cfgIn.source -and -not [string]::IsNullOrWhiteSpace($cfgIn.source.id)) { [string]$cfgIn.source.id } else { '' }
    $srcCompIdRaw     = if ($null -ne $cfgIn -and $null -ne $cfgIn.source -and -not [string]::IsNullOrWhiteSpace($cfgIn.source.companyId)) { [string]$cfgIn.source.companyId } else { '' }
    $dstCityIdRaw     = if ($null -ne $cfgIn -and $null -ne $cfgIn.destination -and -not [string]::IsNullOrWhiteSpace($cfgIn.destination.cityId)) { [string]$cfgIn.destination.cityId } elseif ($null -ne $cfgIn -and -not [string]::IsNullOrWhiteSpace($cfgIn.destinationCityId)) { [string]$cfgIn.destinationCityId } elseif ($null -ne $cfgIn -and $null -ne $cfgIn.destination -and -not [string]::IsNullOrWhiteSpace($cfgIn.destination.id)) { [string]$cfgIn.destination.id } else { '' }
    $dstCompIdRaw     = if ($null -ne $cfgIn -and $null -ne $cfgIn.destination -and -not [string]::IsNullOrWhiteSpace($cfgIn.destination.companyId)) { [string]$cfgIn.destination.companyId } else { '' }

    $cargoRaw         = if ($null -ne $cfgIn -and $null -ne $cfgIn.cargo) { [string]$cfgIn.cargo.name } else { '' }
    $cargoIdRaw       = if ($null -ne $cfgIn -and $null -ne $cfgIn.cargo) { [string]$cfgIn.cargo.id } else { '' }
    $cargoMassKgRaw   = if ($null -ne $cfgIn -and $null -ne $cfgIn.cargo -and $null -ne $cfgIn.cargo.mass) { [double]$cfgIn.cargo.mass } else { 0.0 }
    $plannedDistKmRaw = if ($null -ne $cfgIn -and $null -ne $cfgIn.planned_distance -and $null -ne $cfgIn.planned_distance.km) { [int64]$cfgIn.planned_distance.km } else { [int64]0 }
    $incomeRaw        = if ($null -ne $cfgIn -and $null -ne $cfgIn.income) { [int64]$cfgIn.income } else { [int64]0 }
    $jobMarketRaw     = if ($null -ne $cfgIn -and $null -ne $cfgIn.job) { [string]$cfgIn.job.market } else { '' }

    # Эталонная дифференциация типов рейсов (SCS SDK 1.16 / rtrucksim_telemetry):
    # Если перевозится реальный груз (не пассажиры) с ненулевой массой — это ГРУЗОВОЙ рейс,
    # даже если шасси тягача из модов названо 'bus' / 'coach'!
    $isCargoPassengers = ($cargoIdRaw -eq 'passengers' -or $cargoRaw -like '*passengers*' -or $cargoRaw -like '*пассажир*')
    $hasRealCargo      = (-not [string]::IsNullOrWhiteSpace($cargoRaw) -and -not $isCargoPassengers) -or ($cargoMassKgRaw -gt 0 -and -not $isCargoPassengers)

    $isBusJobRaw = $false
    if (-not $hasRealCargo) {
      if ($null -ne $cfgIn -and $null -ne $cfgIn.isBusJob -and [bool]$cfgIn.isBusJob) {
        $isBusJobRaw = $true
      } elseif ($null -ne $cfgIn -and $null -ne $cfgIn.job -and ($null -ne $cfgIn.job.busJob -and [bool]$cfgIn.job.busJob -or [string]$cfgIn.job.market -eq 'bus_job')) {
        $isBusJobRaw = $true
      } elseif ($isCargoPassengers) {
        $isBusJobRaw = $true
      }
    }

    # Для автобусных рейсов при необходимости фоллбечим города отправления/назначения на остановки
    if ($isBusJobRaw) {
      if ([string]::IsNullOrWhiteSpace($srcCityRaw) -and $null -ne $cfgIn -and $null -ne $cfgIn.bus -and $null -ne $cfgIn.bus.sourceStop) {
        $busSrcCity = [string]$cfgIn.bus.sourceStop.city
        $srcCityRaw = Clean-PlaceName -raw $busSrcCity
        if ([string]::IsNullOrWhiteSpace($srcCompRaw)) {
          $busSrcComp = [string]$cfgIn.bus.sourceStop.company
          $srcCompRaw = Clean-PlaceName -raw $busSrcComp
        }
      }
      if ([string]::IsNullOrWhiteSpace($dstCityRaw) -and $null -ne $cfgIn -and $null -ne $cfgIn.bus -and $null -ne $cfgIn.bus.destinationStop) {
        $busDstCity = [string]$cfgIn.bus.destinationStop.city
        $dstCityRaw = Clean-PlaceName -raw $busDstCity
        if ([string]::IsNullOrWhiteSpace($dstCompRaw)) {
          $busDstComp = [string]$cfgIn.bus.destinationStop.company
          $dstCompRaw = Clean-PlaceName -raw $busDstComp
        }
      }
      if ([string]::IsNullOrWhiteSpace($srcCityIdRaw) -and $null -ne $cfgIn -and $null -ne $cfgIn.bus -and $null -ne $cfgIn.bus.sourceStop) {
        $srcCityIdRaw = if (-not [string]::IsNullOrWhiteSpace($cfgIn.bus.sourceStop.cityId)) { [string]$cfgIn.bus.sourceStop.cityId } else { [string]$cfgIn.bus.sourceStop.id }
      }
      if ([string]::IsNullOrWhiteSpace($dstCityIdRaw) -and $null -ne $cfgIn -and $null -ne $cfgIn.bus -and $null -ne $cfgIn.bus.destinationStop) {
        $dstCityIdRaw = if (-not [string]::IsNullOrWhiteSpace($cfgIn.bus.destinationStop.cityId)) { [string]$cfgIn.bus.destinationStop.cityId } else { [string]$cfgIn.bus.destinationStop.id }
      }
    }

    if ([string]::IsNullOrWhiteSpace($srcCityRaw) -and -not [string]::IsNullOrWhiteSpace($srcCompRaw)) {
      $srcCityRaw = $srcCompRaw
    }
    if ([string]::IsNullOrWhiteSpace($dstCityRaw) -and -not [string]::IsNullOrWhiteSpace($dstCompRaw)) {
      $dstCityRaw = $dstCompRaw
    }

    $busSatRaw = if ($isBusJobRaw) {
      if ($null -ne $telIn.busSat) {
        [Math]::Round([double]$telIn.busSat, 2)
      } elseif ($null -ne $cfgIn -and $null -ne $cfgIn.bus -and $null -ne $cfgIn.bus.satisfaction) {
        [Math]::Round([double]$cfgIn.bus.satisfaction, 2)
      } else {
        0.0
      }
    } else {
      0.0
    }
    $restStopRaw = if ($null -ne $telIn.restStop) { [int]$telIn.restStop } else { 0 }
    $electricRaw = if ($null -ne $telIn.electric) { [bool]$telIn.electric } else { $true }
    $engineRaw   = if ($null -ne $telIn.engine) { [bool]$telIn.engine } else { $true }

    $hasJob = if ($null -ne $cfgIn -and $null -ne $cfgIn.hasJob -and [bool]$cfgIn.hasJob) {
      $true
    } elseif (-not [string]::IsNullOrWhiteSpace($dstCityRaw) -or -not [string]::IsNullOrWhiteSpace($srcCityRaw) -or -not [string]::IsNullOrWhiteSpace($cargoRaw) -or ($plannedDistKmRaw -gt 0) -or ($incomeRaw -gt 0)) {
      $true
    } else {
      $false
    }

    $srcCity       = if ($hasJob) { $srcCityRaw } else { '' }
    $srcComp       = if ($hasJob) { $srcCompRaw } else { '' }
    $dstCity       = if ($hasJob) { $dstCityRaw } else { '' }
    $dstComp       = if ($hasJob) { $dstCompRaw } else { '' }
    $srcCityId     = if ($hasJob) { $srcCityIdRaw } else { '' }
    $srcCompId     = if ($hasJob) { $srcCompIdRaw } else { '' }
    $dstCityId     = if ($hasJob) { $dstCityIdRaw } else { '' }
    $dstCompId     = if ($hasJob) { $dstCompIdRaw } else { '' }
    $cargo         = if ($hasJob) { $cargoRaw } else { '' }
    $cargoId       = if ($hasJob) { $cargoIdRaw } else { '' }
    $cargoMassKg   = if ($hasJob) { $cargoMassKgRaw } else { 0.0 }
    $plannedDistKm = if ($hasJob) { $plannedDistKmRaw } else { [int64]0 }
    $income        = if ($hasJob) { $incomeRaw } else { [int64]0 }
    $jobMarket     = if ($hasJob) { $jobMarketRaw } else { '' }

    $truckBrand   = if ($null -ne $cfgIn -and $null -ne $cfgIn.truck) { [string]$cfgIn.truck.brand } else { '' }
    $truckName    = if ($null -ne $cfgIn -and $null -ne $cfgIn.truck) { [string]$cfgIn.truck.name } else { '' }
    $licensePlate = if ($null -ne $cfgIn -and $null -ne $cfgIn.truck -and $null -ne $cfgIn.truck.license) { [string]$cfgIn.truck.license.plate } else { '' }

    $jobKey = if ($hasJob) {
      "$srcCity|$dstCity|$cargo"
    } elseif ($null -ne $telIn.navDist -and [double]$telIn.navDist -gt 50.0) {
      "gps_route"
    } else {
      ""
    }

    $tripStats = Update-TripStatistics `
      -JobKey $jobKey `
      -OdometerKm $odometerKm `
      -FuelAmount $fuelAmount `
      -FuelAvgL100 $fuelAvgL100 `
      -SpeedKmh $speedKmh

    $sourceStopObj = if ($isBusJobRaw -and $hasJob) {
      $stopCity = if ($null -ne $cfgIn.bus -and $null -ne $cfgIn.bus.sourceStop -and -not [string]::IsNullOrWhiteSpace($cfgIn.bus.sourceStop.city)) { Clean-PlaceName ([string]$cfgIn.bus.sourceStop.city) } else { $srcCity }
      $stopComp = if ($null -ne $cfgIn.bus -and $null -ne $cfgIn.bus.sourceStop -and -not [string]::IsNullOrWhiteSpace($cfgIn.bus.sourceStop.company)) { Clean-PlaceName ([string]$cfgIn.bus.sourceStop.company) } else { $srcComp }
      $stopId   = if ($null -ne $cfgIn.bus -and $null -ne $cfgIn.bus.sourceStop -and -not [string]::IsNullOrWhiteSpace($cfgIn.bus.sourceStop.id)) { [string]$cfgIn.bus.sourceStop.id } else { $srcCityId }
      [ordered]@{ city = $stopCity; cityId = $stopId; company = $stopComp; companyId = $srcCompId; id = $stopId }
    } else {
      $null
    }
    $destinationStopObj = if ($isBusJobRaw -and $hasJob) {
      $dstStopCity = if ($null -ne $cfgIn.bus -and $null -ne $cfgIn.bus.destinationStop -and -not [string]::IsNullOrWhiteSpace($cfgIn.bus.destinationStop.city)) { Clean-PlaceName ([string]$cfgIn.bus.destinationStop.city) } else { $dstCity }
      $dstStopComp = if ($null -ne $cfgIn.bus -and $null -ne $cfgIn.bus.destinationStop -and -not [string]::IsNullOrWhiteSpace($cfgIn.bus.destinationStop.company)) { Clean-PlaceName ([string]$cfgIn.bus.destinationStop.company) } else { $dstComp }
      $dstStopId   = if ($null -ne $cfgIn.bus -and $null -ne $cfgIn.bus.destinationStop -and -not [string]::IsNullOrWhiteSpace($cfgIn.bus.destinationStop.id)) { [string]$cfgIn.bus.destinationStop.id } else { $dstCityId }
      [ordered]@{ city = $dstStopCity; cityId = $dstStopId; company = $dstStopComp; companyId = $dstCompId; id = $dstStopId }
    } else {
      $null
    }

    $tripObj = [ordered]@{
      active                = $hasJob
      hasJob                = $hasJob
      isBusJob              = $isBusJobRaw
      busJob                = $isBusJobRaw
      jobType               = if (-not $hasJob) { 'free_roam' } elseif ($isBusJobRaw) { 'bus_job' } else { 'freight' }
      marketType            = if ($isBusJobRaw) { 'bus_job' } elseif (-not [string]::IsNullOrWhiteSpace($jobMarket)) { $jobMarket } else { 'freight' }
      busSat                = if ($isBusJobRaw) { $busSatRaw } else { 0.0 }
      cargo                 = $cargo
      cargoId               = $cargoId
      source                = [ordered]@{ city = $srcCity; cityId = $srcCityId; company = $srcComp; companyId = $srcCompId; id = $srcCityId }
      destination           = [ordered]@{ city = $dstCity; cityId = $dstCityId; company = $dstComp; companyId = $dstCompId; id = $dstCityId }
      sourceStop            = $sourceStopObj
      destinationStop       = $destinationStopObj
      sourceCityId          = $srcCityId
      sourceCompanyId       = $srcCompId
      destinationCityId     = $dstCityId
      destinationCompanyId  = $dstCompId
      cargoMassKg           = $cargoMassKg
      plannedDistanceKm     = $plannedDistKm
      income                = $income
      jobMarket             = $jobMarket
      driven                = $tripStats.driven
      liters                = $tripStats.liters
      avg                   = $tripStats.avg
      maxSpeed              = $tripStats.maxSpeed
    }

    $telOut = [ordered]@{
      game            = [string]$telIn.game
      paused          = [bool]$telIn.paused
      speed           = $speedKmh
      speedLimit      = $speedLimitKmh
      cruise          = $cruiseKmh
      cc              = $cruiseKmh
      cruiseControl   = $cruiseKmh
      cruiseOn        = $cruiseOn
      rpm             = if ($null -ne $telIn.rpm) { [int][Math]::Round([double]$telIn.rpm) } else { 0 }
      rpmLimit        = if ($null -ne $telIn.rpmLimit) { [int]$telIn.rpmLimit } else { 0 }
      gear            = if ($null -ne $telIn.gear) { [int]$telIn.gear } else { 0 }
      dgear           = $dgearText
      displayedGear   = $displayedGear
      throttle        = [double]$telIn.throttle
      brake           = [double]$telIn.brake
      clutch          = [double]$telIn.clutch
      steer           = [double]$telIn.steer
      odometer        = [Math]::Round($odometerKm, 1)
      fuel            = [Math]::Round($fuelAmount, 1)
      fuelCap         = [double]$telIn.fuelCap
      fuelAvg         = $fuelAvgL100
      fuelRange       = if ($null -ne $telIn.fuelRange) { [int][Math]::Round([double]$telIn.fuelRange) } else { 0 }
      adblue          = [Math]::Round([double]$telIn.adblue, 1)
      adblueCap       = [double]$telIn.adblueCap
      oilTemp         = [Math]::Round([double]$telIn.oilTemp, 1)
      waterTemp       = [Math]::Round([double]$telIn.waterTemp, 1)
      air             = [Math]::Round([double]$telIn.air, 1)
      battery         = [Math]::Round([double]$telIn.battery, 1)
      navDist         = [Math]::Round([double]$telIn.navDist, 1)
      navTime         = [Math]::Round([double]$telIn.navTime, 1)
      scale           = if ([double]$telIn.scale -gt 0) { [double]$telIn.scale } else { 19.0 }
      gameTime        = [int64]$telIn.gameTime
      blinkL          = [bool]$telIn.blinkL
      blinkR          = [bool]$telIn.blinkR
      hazard          = [bool]$telIn.hazard
      parkLight       = [bool]$telIn.parkLight
      lowBeam         = [bool]$telIn.lowBeam
      highBeam        = [bool]$telIn.highBeam
      beacon          = [bool]$telIn.beacon
      wipers          = [bool]$telIn.wipers
      parkBrake       = [bool]$telIn.parkBrake
      motorBrake      = [bool]$telIn.motorBrake
      retarder        = [int]$telIn.retarder
      diffLock        = [bool]$telIn.diffLock
      liftAxle        = [bool]$telIn.liftAxle
      trailerLiftAxle = [bool]$telIn.trailerLiftAxle
      fuelWarn        = [bool]$telIn.fuelWarn
      airWarn         = [bool]$telIn.airWarn
      oilWarn         = [bool]$telIn.oilWarn
      waterWarn       = [bool]$telIn.waterWarn
      batteryWarn     = [bool]$telIn.batteryWarn
      wEngine         = [double]$telIn.wEngine
      wTrans          = [double]$telIn.wTrans
      wCabin          = [double]$telIn.wCabin
      wChassis        = [double]$telIn.wChassis
      wWheels         = [double]$telIn.wWheels
      wTrailer        = [double]$telIn.wTrailer
      cargoDmg        = [double]$telIn.cargoDmg
      jobDmg          = [double]$telIn.jobDmg
      trailer         = $telIn.trailer
      trailerAttached = [bool]$telIn.trailerAttached
      busSat          = $busSatRaw
      restStop        = $restStopRaw
      electric        = $electricRaw
      engine          = $engineRaw
      lastEvent       = $lastEventObj
    }

    $payload = [ordered]@{}
    foreach ($entry in $telOut.GetEnumerator()) {
      $payload[$entry.Key] = $entry.Value
    }
    $payload['ok']                 = $true
    $payload['connected']          = $true
    $payload['srv']                = $srvIn
    $payload['tel']                = $telOut
    $payload['trip']               = $tripObj
    $payload['cfg']                = $cfgIn
    $payload['truckBrand']         = $truckBrand
    $payload['truckName']          = $truckName
    $payload['licensePlate']       = $licensePlate
    $payload['cargo']              = $cargo
    $payload['sourceCity']         = $srcCity
    $payload['sourceCityId']       = $srcCityId
    $payload['sourceCompany']      = $srcComp
    $payload['sourceCompanyId']    = $srcCompId
    $payload['destinationCity']    = $dstCity
    $payload['destinationCityId']  = $dstCityId
    $payload['destinationCompany'] = $dstComp
    $payload['destinationCompanyId'] = $dstCompId
    $payload['jobMarket']          = $jobMarket
    $payload['cargoMassKg']        = $cargoMassKg
    $payload['plannedDistanceKm']  = $plannedDistKm
    $payload['income']             = $income
    $payload['hasJob']             = $hasJob
    $payload['isBusJob']           = $isBusJobRaw
    $payload['busJob']             = $isBusJobRaw
    $payload['jobType']            = if (-not $hasJob) { 'free_roam' } elseif ($isBusJobRaw) { 'bus_job' } else { 'freight' }
    $payload['marketType']         = if ($isBusJobRaw) { 'bus_job' } elseif (-not [string]::IsNullOrWhiteSpace($jobMarket)) { $jobMarket } else { 'freight' }
    $payload['busSat']             = if ($isBusJobRaw) { $busSatRaw } else { 0.0 }
    $payload['restStop']           = $restStopRaw
    $payload['electric']           = $electricRaw
    $payload['engine']             = $engineRaw
    $payload['sourceStop']         = $tripObj.sourceStop
    $payload['destinationStop']    = $tripObj.destinationStop
    $payload['driven']             = $tripStats.driven
    $payload['tripDriven']         = $tripStats.driven
    $payload['liters']             = $tripStats.liters
    $payload['tripLiters']         = $tripStats.liters
    $payload['avg']                = $tripStats.avg
    $payload['tripAvg']            = $tripStats.avg
    $payload['maxSpeed']           = $tripStats.maxSpeed
    $payload['tripMaxSpeed']       = $tripStats.maxSpeed
    $payload['lastEvent']          = $lastEventObj
    $payload['updatedAtMs']        = [long][Math]::Floor(([DateTime]::UtcNow - $EpochUtc).TotalMilliseconds)
    $payload['ageMs']              = $ageMs

    $jsonBody = ConvertTo-Json -InputObject $payload -Depth 12 -Compress
    return @{
      Status = 'online'
      AgeMs  = $ageMs
      Body   = $jsonBody
    }
  } catch {
    $script:TripTracker.Initialized = $false
    $script:LastTelemetryError = $_.Exception.ToString()
    return @{
      Status = 'offline'
      AgeMs  = [long]-1
      Body   = '{"ok":false,"connected":false,"lastEvent":{"seq":0,"type":"","amount":0,"offence":"","source":"","target":"","xp":0}}'
    }
  } finally {
    if ($null -ne $accessor) {
      try { $accessor.Dispose() } catch {}
    }
    if ($null -ne $mmf) {
      try { $mmf.Dispose() } catch {}
    }
  }
}

try {
  $epochUtc = [DateTime]::new(1970, 1, 1, 0, 0, 0, [DateTimeKind]::Utc)

  $listener = [System.Net.Sockets.TcpListener]::new($loopbackIp, $HttpPort)
  $listener.Start(32)

  Write-Host '=================================================================' -ForegroundColor DarkGray
  Write-Host 'ETS2 / ATS Cockpit Stream Overlay — Copyright (c) 2026 FooZzee. All Rights Reserved.' -ForegroundColor Yellow
  Write-Host $msg.Title -ForegroundColor Yellow
  Write-Host ($msg.SharedMem -f $effectiveStaleMs) -ForegroundColor Cyan
  Write-Host $msg.Telemetry -ForegroundColor Green
  Write-Host $msg.Health -ForegroundColor Green
  Write-Host $msg.StopHint -ForegroundColor Gray
  Write-Host '=================================================================' -ForegroundColor DarkGray

  $lastTelemetryStatus = 'init'
  $telemetryReqCount = 0

  while ($true) {
    $httpHandled = 0
    while ($listener.Pending() -and $httpHandled -lt 16) {
      $httpHandled += 1
      $client = $listener.AcceptTcpClient()
      try {
        $stream = $client.GetStream()
        $stream.ReadTimeout = 200
        $stream.WriteTimeout = 500

        $buffer = [byte[]]::new(4096)
        $bytesRead = 0
        try {
          $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
        } catch {
          $bytesRead = 0
        }

        if ($bytesRead -le 0) { continue }

        $reqText = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $bytesRead)
        $firstLine = ($reqText -split "`r?`n", 2)[0]
        $parts = $firstLine -split ' '
        $method = if ($parts.Length -ge 1) { $parts[0].ToUpperInvariant() } else { 'GET' }
        $rawTarget = if ($parts.Length -ge 2) { $parts[1] } else { '/' }
        $path = ($rawTarget -split '\?', 2)[0]

        if ($method -eq 'OPTIONS') {
          Send-HttpResponse -Stream $stream -StatusCode 204 -StatusText 'No Content' -AgeMs -1 -Encoding $utf8NoBom
          continue
        }

        if ($path -eq '/telemetry' -or $path -eq '/') {
          $upstreamResult = Read-SharedMemoryTelemetry `
            -MemoryName $SharedMemoryName `
            -StaleMs $effectiveStaleMs `
            -EpochUtc $epochUtc

          if ($upstreamResult.Status -eq 'online') {
            $telemetryReqCount += 1
          }

          if ($upstreamResult.Status -ne $lastTelemetryStatus) {
            $lastTelemetryStatus = $upstreamResult.Status
            if ($lastTelemetryStatus -eq 'online') {
              Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $($msg.Online)" -ForegroundColor Green
            } elseif ($lastTelemetryStatus -eq 'disconnected') {
              Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $($msg.Disconnected)" -ForegroundColor DarkYellow
            } else {
              Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $($msg.Offline)" -ForegroundColor DarkYellow
            }
          }

          Send-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -Body $upstreamResult.Body -AgeMs $upstreamResult.AgeMs -Encoding $utf8NoBom
        } elseif ($path -eq '/health') {
          $shmNameJson = ConvertTo-Json -InputObject $SharedMemoryName -Compress
          $telStateJson = ConvertTo-Json -InputObject $lastTelemetryStatus -Compress
          $lastErrJson = if ($script:LastTelemetryError) { ConvertTo-Json -InputObject $script:LastTelemetryError -Compress } else { '""' }
          $healthJson = "{`"status`":`"ok`",`"httpPort`":$HttpPort,`"upstreamMode`":`"shared_memory`",`"sharedMemoryName`":$shmNameJson,`"telemetryState`":$telStateJson,`"telemetryResponses`":$telemetryReqCount,`"lastError`":$lastErrJson}"
          Send-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -Body $healthJson -AgeMs -1 -Encoding $utf8NoBom
        } else {
          Send-HttpResponse -Stream $stream -StatusCode 404 -StatusText 'Not Found' -Body '{"error":"not_found"}' -AgeMs -1 -Encoding $utf8NoBom
        }
      } catch {
        # Игнорируем обрыв клиентского соединения со стороны браузера/OBS
      } finally {
        $client.Close()
      }
    }

    Start-Sleep -Milliseconds 10
  }
} catch [System.Net.Sockets.SocketException] {
  Write-Host ($msg.PortErr -f $_.Exception.Message) -ForegroundColor Red
  Write-Host $msg.PortHint -ForegroundColor Yellow
  exit 1
} finally {
  if ($null -ne $listener) {
    try { $listener.Stop() } catch {}
  }
}

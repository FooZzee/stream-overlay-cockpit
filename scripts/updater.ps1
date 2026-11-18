<#
.SYNOPSIS
  Pip-Boy 3000 Autonomous CRT Update Terminal for ETS2 / ATS Cockpit Stream Overlay.
  Автономный терминал обновлений Pip-Boy 3000 для оверлея ETS2 / ATS.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

# 1. Проверка режима STA (Single-Threaded Apartment) для корректной работы WPF
if ([System.Threading.Thread]::CurrentThread.GetApartmentState() -ne [System.Threading.ApartmentState]::STA) {
    $scriptPath = $MyInvocation.MyCommand.Definition
    if (-not $scriptPath) {
        $scriptPath = Join-Path $PSScriptRoot 'updater.ps1'
    }
    Start-Process -FilePath 'powershell.exe' -ArgumentList "-NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File `"$scriptPath`""
    exit
}

# 2. Инициализация современных протоколов TLS 1.2 для связи с GitHub API
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls11 -bor [System.Net.SecurityProtocolType]::Tls

# 3. Подключение библиотек WPF GUI
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

# 4. Надёжный расчёт путей к файлам проекта
$ScriptDir = if ($PSScriptRoot) {
    $PSScriptRoot
} elseif ($MyInvocation.MyCommand.Definition) {
    Split-Path -Parent $MyInvocation.MyCommand.Definition
} else {
    (Get-Location).Path
}

$ProjectRoot = Split-Path -Parent $ScriptDir
if (-not (Test-Path (Join-Path $ProjectRoot 'ets2-desktop.html'))) {
    if (Test-Path (Join-Path (Get-Location).Path 'ets2-desktop.html')) {
        $ProjectRoot = (Get-Location).Path
    }
}

# 5. Константы проекта и репозитория
$CurrentVersion = 'v0.0.2'
$RepoOwner = 'FooZzee'
$RepoName = 'stream-overlay-cockpit'
$ApiUrl = "https://api.github.com/repos/$RepoOwner/$RepoName/releases/latest"
$WebReleasesUrl = "https://github.com/$RepoOwner/$RepoName/releases/latest"
$WebAllReleasesUrl = "https://github.com/$RepoOwner/$RepoName/releases"

# 6. Определение языка интерфейса (RU / EN)
$IsRu = ([System.Globalization.CultureInfo]::CurrentUICulture.TwoLetterISOLanguageName -eq 'ru')

# 7. Локализованные тексты
$I18N = @{
    ru = @{
        WindowTitle     = "ROBCO INDUSTRIES // PIP-BOY 3000 UPDATE TERMINAL"
        HeaderSys       = "ROBCO INDUSTRIES (TM) // ТЕРМИНАЛ ОБНОВЛЕНИЯ"
        HeaderSub       = "ETS2 / ATS COCKPIT TELEMETRY STREAM OVERLAY"
        VerBadge        = "ТЕКУЩАЯ ВЕРСИЯ: $CurrentVersion"
        BtnCheck        = "🔍 ПРОВЕРИТЬ"
        BtnUpdate       = "🚀 ОБНОВИТЬ"
        BtnReleases     = "🌐 GITHUB"
        BtnClose        = "❌ ЗАКРЫТЬ"
        BtnLang         = "🇬🇧 EN"
        StatusConnected = "СИСТЕМА: В СЕТИ // ПРОТОКОЛ TLS 1.2 // VAULT-TEC OS"
        StatusChecking  = "СИСТЕМА: ПОДКЛЮЧЕНИЕ К СЕРВЕРУ GITHUB..."
        StatusDone      = "СИСТЕМА: ОПЕРАЦИЯ ЗАВЕРШЕНА"
        RateLimitWarn   = "[ВНИМАНИЕ 403] Превышен лимит запросов GitHub API (Rate Limit).`r`nGitHub временно ограничил неавторизованные запросы с вашего IP-адреса.`r`nНажмите кнопку 'GITHUB', чтобы просмотреть и скачать обновление в браузере."
        NetworkError    = "[ОШИБКА СЕТИ] Не удалось связаться с сервером обновлений:`r`n{0}`r`nПроверьте подключение к сети или откройте релизы вручную."
        UpdateFound     = "[ОБНАРУЖЕНО ОБНОВЛЕНИЕ СИСТЕМЫ!]`r`nДоступна новая версия: {0} (Установлена: {1})`r`n----------------------------------------------------------------------`r`nСПИСОК ИЗМЕНЕНИЙ:`r`n{2}`r`n----------------------------------------------------------------------`r`nНажмите 'ОБНОВИТЬ' для загрузки или 'GITHUB' для просмотра релиза."
        UpToDate        = "[СИСТЕМА В АКТУАЛЬНОМ СОСТОЯНИИ]`r`nУ вас уже установлена последняя доступная версия ({0}).`r`nОбновление файлов оверлея не требуется."
        StartingCheck   = "Инициализация протокола связи с сервером релизов...`r`nЗапрос: https://api.github.com/repos/{0}/{1}/releases/latest"
    }
    en = @{
        WindowTitle     = "ROBCO INDUSTRIES // PIP-BOY 3000 UPDATE TERMINAL"
        HeaderSys       = "ROBCO INDUSTRIES (TM) // UPDATE TERMINAL"
        HeaderSub       = "ETS2 / ATS COCKPIT TELEMETRY STREAM OVERLAY"
        VerBadge        = "INSTALLED: $CurrentVersion"
        BtnCheck        = "🔍 CHECK"
        BtnUpdate       = "🚀 UPDATE"
        BtnReleases     = "🌐 GITHUB"
        BtnClose        = "❌ CLOSE"
        BtnLang         = "🇷🇺 RU"
        StatusConnected = "STATUS: ONLINE // PROTOCOL TLS 1.2 // VAULT-TEC OS"
        StatusChecking  = "STATUS: CONNECTING TO GITHUB SERVER..."
        StatusDone      = "STATUS: OPERATION COMPLETE"
        RateLimitWarn   = "[WARNING 403] GitHub API rate limit exceeded.`r`nGitHub has temporarily rate-limited unauthorized requests from this IP.`r`nClick 'GITHUB' button to view and download the update in your browser."
        NetworkError    = "[NETWORK ERROR] Could not connect to update server:`r`n{0}`r`nPlease check internet connection or open GitHub releases directly."
        UpdateFound     = "[FIRMWARE UPDATE AVAILABLE!]`r`nLatest release: {0} (Current: {1})`r`n----------------------------------------------------------------------`r`nCHANGELOG SUMMARY:`r`n{2}`r`n----------------------------------------------------------------------`r`nClick 'UPDATE' to download or 'GITHUB' to view release details."
        UpToDate        = "[SYSTEM IS UP TO DATE]`r`nYou are running the latest version ({0}).`r`nNo firmware update is required."
        StartingCheck   = "Initializing communication protocol with update server...`r`nRequest: https://api.github.com/repos/{0}/{1}/releases/latest"
    }
}

function Get-LStr([string]$key) {
    $langKey = if ($script:IsRu) { 'ru' } else { 'en' }
    return $I18N[$langKey][$key]
}

# 8. Сравнение семантических версий
function Compare-Semver {
    param([string]$remote, [string]$local)
    $cleanR = ($remote -replace '^[vV]', '').Trim().Split('.')
    $cleanL = ($local -replace '^[vV]', '').Trim().Split('.')
    for ($i = 0; $i -lt 3; $i++) {
        $rNum = if ($i -lt $cleanR.Length) { [int]$cleanR[$i] } else { 0 }
        $lNum = if ($i -lt $cleanL.Length) { [int]$cleanL[$i] } else { 0 }
        if ($rNum -gt $lNum) { return 1 }
        if ($rNum -lt $lNum) { return -1 }
    }
    return 0
}

# 9. Запрос к GitHub API с защитой от HTTP 403 и таймаутом
function Get-ReleaseInfo {
    param([int]$TimeoutSec = 5)

    $res = @{
        Success       = $false
        TagName       = $null
        Body          = $null
        HtmlUrl       = $null
        ErrorMessage  = $null
        IsRateLimited = $false
    }

    try {
        $req = [System.Net.HttpWebRequest]::Create($ApiUrl)
        $req.Method = 'GET'
        $req.Timeout = $TimeoutSec * 1000
        $req.UserAgent = 'FooZzee-Cockpit-Overlay-Updater/0.0.2'
        $req.Accept = 'application/vnd.github.v3+json'

        $resp = $req.GetResponse()
        $stream = $resp.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
        $json = $reader.ReadToEnd()
        $reader.Close()
        $resp.Close()

        $data = $json | ConvertFrom-Json
        $res.Success = $true
        $res.TagName = $data.tag_name
        $res.Body = $data.body
        $res.HtmlUrl = $data.html_url
        if ($data.assets) {
            $matchingAsset = $data.assets | Where-Object { $_.name -like 'ETS2-ATS-Stream-Overlay-Cockpit-*.zip' } | Select-Object -First 1
            if ($matchingAsset) {
                $res.AssetUrl = $matchingAsset.browser_download_url
                $res.AssetName = $matchingAsset.name
            }
        }
        return $res
    } catch [System.Net.WebException] {
        $ex = $_.Exception
        if ($ex.Response) {
            $httpResp = [System.Net.HttpWebResponse]$ex.Response
            if ($httpResp.StatusCode -eq [System.Net.HttpStatusCode]::Forbidden) {
                $res.IsRateLimited = $true
                $res.ErrorMessage = Get-LStr 'RateLimitWarn'
                return $res
            }
        }
        $res.ErrorMessage = [string]::Format((Get-LStr 'NetworkError'), $ex.Message)
        return $res
    } catch {
        $res.ErrorMessage = [string]::Format((Get-LStr 'NetworkError'), $_.Exception.Message)
        return $res
    }
}

# 10. Форматирование текста лога релизов для терминала Pip-Boy
function Format-TerminalBody([string]$rawBody) {
    if (-not $rawBody) { return "No detailed changelog provided." }
    $lines = $rawBody -split "`r?`n"
    $cleanLines = @()
    foreach ($line in $lines) {
        $l = $line.Trim()
        if (-not $l) { continue }
        if ($l.StartsWith('---') -or $l.StartsWith('===')) { continue }
        if ($l -match '^\[!\[.*\]\(.*\)\]') { continue }
        # Удаляем markdown форматирование
        $l = $l -replace '<[^>]+>', ''
        $l = $l -replace '\[([^\]]+)\]\([^)]+\)', '$1'
        $l = $l -replace '!\[[^\]]*\]\([^)]+\)', ''
        $l = $l -replace '^#{1,6}\s*', ''
        $l = $l -replace '[\*\_~`]{1,3}', ''
        $l = $l.Trim()
        if ($l) {
            $cleanLines += "  * $l"
        }
        if ($cleanLines.Count -ge 12) { break }
    }
    return ($cleanLines -join "`r`n")
}

# 11. XAML Интерфейс в аутентичном стиле Pip-Boy 3000
$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="ROBCO INDUSTRIES // PIP-BOY 3000"
        Height="580" Width="760"
        MinHeight="500" MinWidth="680"
        Background="#070B09" Foreground="#22C55E"
        WindowStartupLocation="CenterScreen"
        FontFamily="Consolas, 'Courier New', monospace"
        ResizeMode="CanResizeWithGrip">
    <Window.Resources>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#0A180E"/>
            <Setter Property="Foreground" Value="#22C55E"/>
            <Setter Property="BorderBrush" Value="#15803D"/>
            <Setter Property="BorderThickness" Value="1.5"/>
            <Setter Property="FontWeight" Value="Bold"/>
            <Setter Property="FontSize" Value="12"/>
            <Setter Property="Padding" Value="14,8"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border x:Name="border" Background="{TemplateBinding Background}"
                                BorderBrush="{TemplateBinding BorderBrush}"
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="4" Padding="{TemplateBinding Padding}">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter TargetName="border" Property="Background" Value="#14532D"/>
                                <Setter TargetName="border" Property="BorderBrush" Value="#4ADE80"/>
                            </Trigger>
                            <Trigger Property="IsPressed" Value="True">
                                <Setter TargetName="border" Property="Background" Value="#166534"/>
                            </Trigger>
                            <Trigger Property="IsEnabled" Value="False">
                                <Setter Property="Opacity" Value="0.4"/>
                                <Setter Property="Cursor" Value="Arrow"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
    </Window.Resources>

    <Grid Margin="18">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <!-- Шапка Pip-Boy 3000 -->
        <Border Grid.Row="0" Background="#0A180E" BorderBrush="#15803D" BorderThickness="1.5" CornerRadius="6" Padding="14,10" Margin="0,0,0,12">
            <Grid>
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="Auto"/>
                </Grid.ColumnDefinitions>
                <StackPanel Grid.Column="0">
                    <TextBlock x:Name="txtSysTitle" Text="ROBCO INDUSTRIES (TM) // ТЕРМИНАЛ ОБНОВЛЕНИЯ" FontWeight="Bold" FontSize="14" Foreground="#4ADE80"/>
                    <TextBlock x:Name="txtSubTitle" Text="ETS2 / ATS COCKPIT TELEMETRY STREAM OVERLAY" FontSize="11" Foreground="#15803D" Margin="0,2,0,0"/>
                </StackPanel>
                <StackPanel Grid.Column="1" Orientation="Horizontal" VerticalAlignment="Center">
                    <Border Background="#052E16" BorderBrush="#22C55E" BorderThickness="1" CornerRadius="4" Padding="8,4" Margin="0,0,10,0">
                        <TextBlock x:Name="txtBadge" Text="ТЕКУЩАЯ: v0.0.2" FontSize="11" FontWeight="Bold" Foreground="#86EFAC"/>
                    </Border>
                    <Button x:Name="btnLang" Content="🇬🇧 EN" Padding="8,4" FontSize="11" Height="26"/>
                </StackPanel>
            </Grid>
        </Border>

        <!-- Терминальное окно ЭЛТ-монитора -->
        <Border Grid.Row="1" Background="#030704" BorderBrush="#15803D" BorderThickness="2" CornerRadius="6" Padding="4">
            <Grid>
                <TextBox x:Name="txtTerminal" Background="Transparent" Foreground="#22C55E"
                         BorderThickness="0" FontFamily="Consolas, 'Courier New', monospace"
                         FontSize="12.5" IsReadOnly="True" TextWrapping="Wrap"
                         VerticalScrollBarVisibility="Auto" Padding="10"
                         CaretBrush="#4ADE80"/>
            </Grid>
        </Border>

        <!-- Индикатор прогресса -->
        <ProgressBar x:Name="progBar" Grid.Row="2" Height="4" Margin="0,10,0,10"
                     Background="#030704" Foreground="#22C55E" BorderBrush="#15803D"
                     IsIndeterminate="False" Visibility="Collapsed"/>

        <!-- Панель управления и статусная строка -->
        <Grid Grid.Row="3" Margin="0,4,0,0">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="Auto"/>
            </Grid.ColumnDefinitions>

            <TextBlock x:Name="txtStatus" Grid.Column="0" Text="СИСТЕМА: В СЕТИ // ПРОТОКОЛ TLS 1.2 // VAULT-TEC OS"
                       FontSize="10.5" Foreground="#166534" VerticalAlignment="Center"/>

            <StackPanel Grid.Column="1" Orientation="Horizontal">
                <Button x:Name="btnCheck" Content="🔍 ПРОВЕРИТЬ" Margin="0,0,8,0"/>
                <Button x:Name="btnUpdate" Content="🚀 ОБНОВИТЬ" Margin="0,0,8,0" IsEnabled="False"/>
                <Button x:Name="btnReleases" Content="🌐 GITHUB" Margin="0,0,8,0"/>
                <Button x:Name="btnClose" Content="❌ ЗАКРЫТЬ"/>
            </StackPanel>
        </Grid>
    </Grid>
</Window>
"@

# 12. Сборка и инициализация окна WPF
try {
    $reader = New-Object System.Xml.XmlNodeReader ([xml]$xaml)
    $win = [System.Windows.Markup.XamlReader]::Load($reader)
} catch {
    Write-Error "WPF XAML Load Failed: $_"
    exit 1
}

# Поиск управляющих элементов
$txtSysTitle   = $win.FindName('txtSysTitle')
$txtSubTitle   = $win.FindName('txtSubTitle')
$txtBadge      = $win.FindName('txtBadge')
$txtTerminal   = $win.FindName('txtTerminal')
$txtStatus     = $win.FindName('txtStatus')
$progBar       = $win.FindName('progBar')
$btnCheck      = $win.FindName('btnCheck')
$btnUpdate     = $win.FindName('btnUpdate')
$btnReleases   = $win.FindName('btnReleases')
$btnClose      = $win.FindName('btnClose')
$btnLang       = $win.FindName('btnLang')

$script:LatestReleaseUrl = $WebReleasesUrl
$script:FoundNewVersion  = $null

function Update-UIStrings {
    $txtSysTitle.Text = Get-LStr 'HeaderSys'
    $txtSubTitle.Text = Get-LStr 'HeaderSub'
    $txtBadge.Text    = Get-LStr 'VerBadge'
    $btnCheck.Content = Get-LStr 'BtnCheck'
    $btnUpdate.Content = Get-LStr 'BtnUpdate'
    $btnReleases.Content = Get-LStr 'BtnReleases'
    $btnClose.Content  = Get-LStr 'BtnClose'
    $btnLang.Content   = Get-LStr 'BtnLang'
    $win.Title         = Get-LStr 'WindowTitle'
}

function Log-Terminal([string]$text) {
    if ($txtTerminal.Text) {
        $txtTerminal.AppendText("`r`n$text")
    } else {
        $txtTerminal.Text = $text
    }
    $txtTerminal.ScrollToEnd()
}

function Run-Check {
    $progBar.Visibility = [System.Windows.Visibility]::Visible
    $progBar.IsIndeterminate = $true
    $btnCheck.IsEnabled = $false
    $txtStatus.Text = Get-LStr 'StatusChecking'

    Log-Terminal ("======================================================================")
    Log-Terminal ([string]::Format((Get-LStr 'StartingCheck'), $RepoOwner, $RepoName))

    # Выполняем проверку
    $info = Get-ReleaseInfo -TimeoutSec 5

    $progBar.IsIndeterminate = $false
    $progBar.Visibility = [System.Windows.Visibility]::Collapsed
    $btnCheck.IsEnabled = $true
    $txtStatus.Text = Get-LStr 'StatusDone'

    if (-not $info.Success) {
        Log-Terminal "`r`n$($info.ErrorMessage)"
        return
    }

    $remoteTag = $info.TagName
    $script:LatestReleaseUrl = if ($info.HtmlUrl) { $info.HtmlUrl } else { $WebReleasesUrl }
    $script:LatestAssetUrl = $info.AssetUrl
    $script:LatestAssetName = $info.AssetName

    Log-Terminal "`r`nПодключение успешно. Ответ сервера: $remoteTag"

    $cmp = Compare-Semver $remoteTag $CurrentVersion
    if ($cmp -gt 0) {
        $script:FoundNewVersion = $remoteTag
        $btnUpdate.IsEnabled = $true
        $bodyFormatted = Format-TerminalBody $info.Body
        $msg = [string]::Format((Get-LStr 'UpdateFound'), $remoteTag, $CurrentVersion, $bodyFormatted)
        Log-Terminal "`r`n$msg"
    } else {
        $msg = [string]::Format((Get-LStr 'UpToDate'), $CurrentVersion)
        Log-Terminal "`r`n$msg"
    }
}

# Обработчики событий
$btnCheck.Add_Click({
    Run-Check
})

$btnUpdate.Add_Click({
    # Если найден прямой архив релиза ETS2-ATS-Stream-Overlay-Cockpit-*.zip
    if ($script:LatestAssetUrl) {
        try {
            $btnUpdate.IsEnabled = $false
            Log-Terminal "`r`n[ROBCO PROTOCOL] Начат процесс автоматического обновления..."
            Log-Terminal "Загрузка архива: $($script:LatestAssetName)..."

            $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "CockpitOverlayUpdate_$(Get-Random)"
            New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
            $zipPath = Join-Path $tempDir $script:LatestAssetName

            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
            $wc = New-Object System.Net.WebClient
            $wc.Headers.Add('User-Agent', 'FooZzee-Cockpit-Overlay-Updater/0.0.2')
            $wc.DownloadFile($script:LatestAssetUrl, $zipPath)

            Log-Terminal "Архив успешно загружен. Проверка целостности..."
            $extractDir = Join-Path $tempDir "extracted"
            [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $extractDir)

            # Определяем корень распакованных файлов
            $payloadDir = $extractDir
            $subFolders = Get-ChildItem -Path $extractDir -Directory
            if ($subFolders.Count -eq 1 -and (Test-Path (Join-Path $subFolders[0].FullName 'ets2-desktop.html'))) {
                $payloadDir = $subFolders[0].FullName
            }

            Log-Terminal "Сохранение пользовательской конфигурации config.js..."
            $currentAppDir = $PSScriptRoot
            if (Test-Path (Join-Path $currentAppDir 'scripts')) {
                # запущен из корня
            } else {
                # запущен из scripts/
                $currentAppDir = (Get-Item $currentAppDir).Parent.FullName
            }

            $userConfigPath = Join-Path $currentAppDir 'config.js'
            $backupConfigPath = Join-Path $tempDir 'config.user.bak'
            if (Test-Path $userConfigPath) {
                Copy-Item -LiteralPath $userConfigPath -Destination $backupConfigPath -Force
                Log-Terminal "Пользовательский config.js надёжно сохранён во временный бэкап."
            }

            Log-Terminal "Обновление файлов оверлея в $currentAppDir..."
            Get-ChildItem -Path $payloadDir -Recurse | ForEach-Object {
                $relPath = $_.FullName.Substring($payloadDir.Length).TrimStart('\')
                if ($relPath -ieq 'config.js') {
                    # Пропускаем config.js чтобы не затереть пользовательские токены
                    return
                }
                $targetPath = Join-Path $currentAppDir $relPath
                if ($_.PSIsContainer) {
                    if (-not (Test-Path $targetPath)) { New-Item -ItemType Directory -Force -Path $targetPath | Out-Null }
                } else {
                    $parentTarget = [System.IO.Path]::GetDirectoryName($targetPath)
                    if (-not (Test-Path $parentTarget)) { New-Item -ItemType Directory -Force -Path $parentTarget | Out-Null }
                    Copy-Item -LiteralPath $_.FullName -Destination $targetPath -Force
                }
            }

            if (Test-Path $backupConfigPath) {
                Copy-Item -LiteralPath $backupConfigPath -Destination $userConfigPath -Force
                Log-Terminal "Пользовательский config.js восстановлен и сохранён без изменений."
            }

            Log-Terminal "======================================================================"
            Log-Terminal "[УСПЕХ] ОБНОВЛЕНИЕ ДО ВЕРСИИ $($script:FoundNewVersion) УСПЕШНО ЗАВЕРШЕНО!"
            Log-Terminal "Перезапустите источник 'Браузер' в OBS Studio для применения."
            Log-Terminal "======================================================================"
            [System.Windows.MessageBox]::Show("Оверлей успешно обновлён до версии $($script:FoundNewVersion)!`r`n`r`nВаш файл config.js сохранён.`r`nПерезапустите источник в OBS Studio.", "RobCo Industries Pip-Boy", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Information) | Out-Null
            return
        } catch {
            Log-Terminal "[ОШИБКА АВТООБНОВЛЕНИЯ] $($_.Exception.Message)"
            Log-Terminal "Открытие страницы релиза в браузере..."
        }
    }

    if ($script:LatestReleaseUrl) {
        [System.Diagnostics.Process]::Start($script:LatestReleaseUrl)
    }
})

$btnReleases.Add_Click({
    [System.Diagnostics.Process]::Start($WebAllReleasesUrl)
})

$btnClose.Add_Click({
    $win.Close()
})

$btnLang.Add_Click({
    $script:IsRu = -not $script:IsRu
    Update-UIStrings
})

$win.Add_Loaded({
    Update-UIStrings
    Log-Terminal "======================================================================"
    Log-Terminal "ROBCO INDUSTRIES UNIFIED OPERATING SYSTEM (VAULT-TEC EDITION)"
    Log-Terminal "ETS2 / ATS COCKPIT TELEMETRY STREAM OVERLAY // PIP-BOY 3000"
    Log-Terminal "INSTALLED VERSION: $CurrentVersion"
    Log-Terminal "======================================================================"
    # Автоматический запуск проверки при загрузке
    Run-Check
})

# Запуск GUI приложения
$win.ShowDialog() | Out-Null

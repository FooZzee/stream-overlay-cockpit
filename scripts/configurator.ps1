<#
.SYNOPSIS
  WPF GUI Configurator for ETS2 / ATS Cockpit Telemetry Stream Overlay.
  Графический конфигуратор оверлея ETS2 / ATS в фирменном тёмном стиле приборной панели.
  © 2026 FooZzee · Proprietary Freeware License (All Rights Reserved)
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

# 1. Надёжное определение пути к скрипту и директории
$scriptPath = if ($MyInvocation.MyCommand.Path -and (Test-Path -LiteralPath $MyInvocation.MyCommand.Path)) {
    $MyInvocation.MyCommand.Path
} elseif ($PSScriptRoot) {
    Join-Path $PSScriptRoot 'configurator.ps1'
} else {
    Join-Path (Get-Location).Path 'scripts\configurator.ps1'
}

# 2. Проверка режима STA (Single-Threaded Apartment) для WPF
if ([System.Threading.Thread]::CurrentThread.GetApartmentState() -ne [System.Threading.ApartmentState]::STA) {
    Start-Process -FilePath 'powershell.exe' -ArgumentList "-NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File `"$scriptPath`""
    exit
}

# 3. Подключение сборок WPF
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

# 4. Пути к файлам проекта
$ScriptRoot = if ($MyInvocation.MyCommand.Path) {
    Split-Path -Parent $MyInvocation.MyCommand.Path
} elseif ($scriptPath -and (Test-Path -LiteralPath $scriptPath)) {
    Split-Path -Parent $scriptPath
} elseif ($PSScriptRoot) {
    $PSScriptRoot
} else {
    (Get-Location).Path
}

$SourceRoot = if (Test-Path (Join-Path $ScriptRoot 'ets2-desktop.html')) {
    $ScriptRoot
} elseif (Test-Path (Join-Path (Split-Path -Parent $ScriptRoot) 'ets2-desktop.html')) {
    Split-Path -Parent $ScriptRoot
} else {
    (Get-Location).Path
}

$ConfigPath = Join-Path $SourceRoot 'config.js'
$ExampleConfigPath = Join-Path $SourceRoot 'config.example.js'
$IconPath = Join-Path $SourceRoot 'assets\icons\configurator.ico'

# 4. Список поддерживаемых тем оформления оверлея (расширяемый реестр)
$Script:AvailableThemes = @(
    @{
        Id    = 'classic'
        Name  = 'Классическая (Classic)'
        Badge = '[ HUD // COMPACT ]'
        Desc  = 'Оригинальный классический кокпит. Компактный щиток приборов, совмещающий аналоговый спидометр, тахометр и бортовой инфо-компьютер.'
    },
    @{
        Id    = 'torpedo-pro'
        Name  = 'Торпеда Про (Torpedo Pro)'
        Badge = '[ HUD // TORPEDO PRO ]'
        Desc  = 'Премиальная полноразмерная автомобильная торпеда тягача. 10 аналоговых циферблатов (воздух, ОЖ, масло, АКБ, AdBlue), MFD и вертикальные педали.'
    },
    @{
        Id    = 'scania-touring'
        Name  = 'Scania Touring (Автобус)'
        Badge = '[ HUD // SCANIA TOURING ]'
        Desc  = 'Аутентичный приборный щиток автобуса Scania Touring. Скульптурный козырёк (1020 px), сатиновые безели, эко-зона тахометра (10-15) и дисплей Scania ICL.'
    },
    @{
        Id    = 'man-lions-coach'
        Name  = 'MAN Lion''s Coach (Автобус)'
        Badge = '[ HUD // MAN COACH ]'
        Desc  = 'Аутентичный приборный щиток автобуса MAN Lion''s Coach (1040 px). Гранёный козырёк с красной линией MAN, вертикальные LED-шкалы, D-образные приборы и TipMatic.'
    },
    @{
        Id    = 'volvo-9700-dd'
        Name  = 'Volvo 9700 DD (Автобус)'
        Badge = '[ HUD // VOLVO 9700 DD ]'
        Desc  = 'Скандинавская центр-доминантная приборная панель Volvo 9700 Double Decker (1024 px). Крупный цифровой спидометр Volvo Dynamic Cluster, дуга тахометра, I-Shift и плитки телеметрии.'
    }
)

# 5. Функции безопасного чтения и записи конфигурации
function Get-ConfigContent {
    if (Test-Path -LiteralPath $ConfigPath) {
        return [System.IO.File]::ReadAllText($ConfigPath, [System.Text.Encoding]::UTF8)
    } elseif (Test-Path -LiteralPath $ExampleConfigPath) {
        return [System.IO.File]::ReadAllText($ExampleConfigPath, [System.Text.Encoding]::UTF8)
    }
    return ''
}

function Get-ScopedProp {
    param([string]$Text, [string]$SectionRegex, [string]$PropName, [string]$DefaultVal = '')
    $pattern = "$SectionRegex[^}]*?\b$PropName\s*:\s*(?:'([^']*)'|`"([^`"]*)`"|(\[[^\]]*\])|([^\r\n]+))"
    if ($Text -match $pattern) {
        if ($null -ne $Matches[1]) { return $Matches[1] }
        if ($null -ne $Matches[2]) { return $Matches[2] }
        if ($null -ne $Matches[3]) { return $Matches[3] }
        if ($null -ne $Matches[4]) {
            $val = $Matches[4]
            $val = ($val -replace '//.*$', '').Trim().TrimEnd(',').Trim()
            return $val
        }
    }
    return $DefaultVal
}

function Get-TopProp {
    param([string]$Text, [string]$PropName, [string]$DefaultVal = '')
    $pattern = "(?m)^\s*$PropName\s*:\s*(?:'([^']*)'|`"([^`"]*)`"|(\[[^\]]*\])|([^\r\n]+))"
    if ($Text -match $pattern) {
        if ($null -ne $Matches[1]) { return $Matches[1] }
        if ($null -ne $Matches[2]) { return $Matches[2] }
        if ($null -ne $Matches[3]) { return $Matches[3] }
        if ($null -ne $Matches[4]) {
            $val = $Matches[4]
            $val = ($val -replace '//.*$', '').Trim().TrimEnd(',').Trim()
            return $val
        }
    }
    return $DefaultVal
}

function Set-ScopedProp {
    param(
        [string]$Text,
        [string]$SectionRegex,
        [string]$PropName,
        [string]$NewValue
    )
    $pattern = "($SectionRegex[^}]*?\b$PropName\s*:\s*)(?:'[^']*'|`"[^`"]*`"|\[[^\]]*\]|[^,\r\n]+)(,?[^\r\n]*)"
    if ($Text -match $pattern) {
        return [regex]::Replace($Text, $pattern, "`${1}$NewValue`${2}")
    }
    return $Text
}

function Set-TopProp {
    param(
        [string]$Text,
        [string]$PropName,
        [string]$NewValue
    )
    $pattern = "(?m)^(\s*$PropName\s*:\s*)(?:'[^']*'|`"[^`"]*`"|\[[^\]]*\]|[^,\r\n]+)(,?[^\r\n]*)"
    if ($Text -match $pattern) {
        return [regex]::Replace($Text, $pattern, "`${1}$NewValue`${2}")
    }
    # Если свойство отсутствует, аккуратно вставляем его в начало конфигурации
    if ($Text -match '(?m)^\s*theme\s*:\s*\{') {
        return [regex]::Replace($Text, '(?m)^\s*theme\s*:\s*\{', "  ${PropName}: $NewValue,`r`n  theme: {")
    }
    if ($Text -match '(?m)(window\.OVERLAY_CONFIG\s*=\s*\{)') {
        return [regex]::Replace($Text, '(?m)(window\.OVERLAY_CONFIG\s*=\s*\{)', "`$1`r`n  ${PropName}: $NewValue,")
    }
    return $Text
}

# 6. Описание XAML интерфейса конфигуратора
$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="ETS2 / ATS Stream Overlay Cockpit — Конфигуратор HUD"
        Width="980" Height="740"
        MinWidth="900" MinHeight="680"
        WindowStartupLocation="CenterScreen"
        Background="#070A0F"
        Foreground="#F8FAFC"
        FontFamily="Segoe UI, Tahoma, sans-serif">

    <Window.Resources>
        <!-- Базовые панели карточек -->
        <Style x:Key="CardPanel" TargetType="{x:Type Border}">
            <Setter Property="Background" Value="#0D131F"/>
            <Setter Property="BorderBrush" Value="#1E293B"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="CornerRadius" Value="10"/>
            <Setter Property="Padding" Value="16"/>
            <Setter Property="Margin" Value="0,0,0,12"/>
        </Style>

        <!-- Заголовки полей (Яркий контрастный белый) -->
        <Style x:Key="FieldLabel" TargetType="{x:Type TextBlock}">
            <Setter Property="Foreground" Value="#F8FAFC"/>
            <Setter Property="FontSize" Value="12"/>
            <Setter Property="FontWeight" Value="SemiBold"/>
            <Setter Property="Margin" Value="0,6,0,3"/>
        </Style>

        <!-- Описания под полями (Спокойный светло-серый с переносом строк) -->
        <Style x:Key="FieldHint" TargetType="{x:Type TextBlock}">
            <Setter Property="Foreground" Value="#94A3B8"/>
            <Setter Property="FontSize" Value="10.5"/>
            <Setter Property="Margin" Value="0,3,0,8"/>
            <Setter Property="TextWrapping" Value="Wrap"/>
        </Style>

        <!-- Кликабельные гиперссылки -->
        <Style TargetType="{x:Type Hyperlink}">
            <Setter Property="Foreground" Value="#38BDF8"/>
            <Setter Property="TextDecorations" Value="Underline"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Style.Triggers>
                <Trigger Property="IsMouseOver" Value="True">
                    <Setter Property="Foreground" Value="#7DD3FC"/>
                </Trigger>
            </Style.Triggers>
        </Style>

        <!-- Индивидуальные стили заголовков карточек под цвет активной вкладки -->
        <Style x:Key="CardHeaderCyan" TargetType="{x:Type TextBlock}">
            <Setter Property="Foreground" Value="#00E5FF"/>
            <Setter Property="FontSize" Value="13.5"/>
            <Setter Property="FontWeight" Value="Bold"/>
            <Setter Property="Margin" Value="0,0,0,10"/>
        </Style>

        <Style x:Key="CardHeaderViolet" TargetType="{x:Type TextBlock}">
            <Setter Property="Foreground" Value="#C084FC"/>
            <Setter Property="FontSize" Value="13.5"/>
            <Setter Property="FontWeight" Value="Bold"/>
            <Setter Property="Margin" Value="0,0,0,10"/>
        </Style>

        <Style x:Key="CardHeaderEmerald" TargetType="{x:Type TextBlock}">
            <Setter Property="Foreground" Value="#34D399"/>
            <Setter Property="FontSize" Value="13.5"/>
            <Setter Property="FontWeight" Value="Bold"/>
            <Setter Property="Margin" Value="0,0,0,10"/>
        </Style>

        <Style x:Key="CardHeaderAmber" TargetType="{x:Type TextBlock}">
            <Setter Property="Foreground" Value="#FBBF24"/>
            <Setter Property="FontSize" Value="13.5"/>
            <Setter Property="FontWeight" Value="Bold"/>
            <Setter Property="Margin" Value="0,0,0,10"/>
        </Style>

        <Style x:Key="CardHeaderRed" TargetType="{x:Type TextBlock}">
            <Setter Property="Foreground" Value="#F87171"/>
            <Setter Property="FontSize" Value="13.5"/>
            <Setter Property="FontWeight" Value="Bold"/>
            <Setter Property="Margin" Value="0,0,0,10"/>
        </Style>

        <!-- Стилизация текстовых полей ввода -->
        <Style TargetType="{x:Type TextBox}">
            <Setter Property="Background" Value="#080C14"/>
            <Setter Property="Foreground" Value="#F8FAFC"/>
            <Setter Property="BorderBrush" Value="#334155"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="10,6"/>
            <Setter Property="FontSize" Value="12"/>
            <Setter Property="Margin" Value="0,2,0,2"/>
        </Style>

        <!-- Стилизация PasswordBox -->
        <Style TargetType="{x:Type PasswordBox}">
            <Setter Property="Background" Value="#080C14"/>
            <Setter Property="Foreground" Value="#00E5FF"/>
            <Setter Property="BorderBrush" Value="#334155"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="10,6"/>
            <Setter Property="FontSize" Value="12"/>
            <Setter Property="Margin" Value="0,2,0,2"/>
        </Style>

        <!-- Стилизация ComboBox -->
        <Style TargetType="{x:Type ComboBox}">
            <Setter Property="Background" Value="#080C14"/>
            <Setter Property="Foreground" Value="#F8FAFC"/>
            <Setter Property="BorderBrush" Value="#334155"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="8,5"/>
            <Setter Property="FontSize" Value="12"/>
            <Setter Property="Margin" Value="0,2,0,2"/>
        </Style>

        <!-- Стилизация переключателя ToggleSwitch -->
        <Style x:Key="ToggleSwitchStyle" TargetType="{x:Type CheckBox}">
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="{x:Type CheckBox}">
                        <BulletDecorator Background="Transparent">
                            <BulletDecorator.Bullet>
                                <Border x:Name="Border" Width="40" Height="20" Background="#1E293B" CornerRadius="10">
                                    <Ellipse x:Name="Thumb" Width="14" Height="14" Fill="#94A3B8" HorizontalAlignment="Left" Margin="3,0,0,0"/>
                                </Border>
                            </BulletDecorator.Bullet>
                            <ContentPresenter Margin="8,0,0,0" VerticalAlignment="Center"/>
                        </BulletDecorator>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsChecked" Value="True">
                                <Setter TargetName="Border" Property="Background" Value="#00E5FF"/>
                                <Setter TargetName="Thumb" Property="Fill" Value="#04121F"/>
                                <Setter TargetName="Thumb" Property="HorizontalAlignment" Value="Right"/>
                                <Setter TargetName="Thumb" Property="Margin" Value="0,0,3,0"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>

        <!-- 5 ЦВЕТОВЫХ СТИЛЕЙ ДЛЯ ВКЛАДОК -->
        <!-- 1. Cyan (Внешний вид и HUD) -->
        <Style x:Key="TabItemCyan" TargetType="{x:Type TabItem}">
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="{x:Type TabItem}">
                        <Border x:Name="TabBorder" Background="#0A0E17" BorderBrush="#1E293B" BorderThickness="0,0,0,2" Padding="14,10" Margin="0,0,4,0" Cursor="Hand">
                            <ContentPresenter ContentSource="Header" TextBlock.FontSize="11.5" TextBlock.FontWeight="SemiBold" TextBlock.Foreground="#94A3B8"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsSelected" Value="True">
                                <Setter TargetName="TabBorder" Property="Background" Value="#0F172A"/>
                                <Setter TargetName="TabBorder" Property="BorderBrush" Value="#00E5FF"/>
                                <Setter TargetName="TabBorder" Property="BorderThickness" Value="0,0,0,3"/>
                                <Setter Property="TextBlock.Foreground" Value="#00E5FF"/>
                            </Trigger>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter TargetName="TabBorder" Property="Background" Value="#141E33"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>

        <!-- 2. Violet (Стрим-платформы и Чат) -->
        <Style x:Key="TabItemViolet" TargetType="{x:Type TabItem}">
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="{x:Type TabItem}">
                        <Border x:Name="TabBorder" Background="#0A0E17" BorderBrush="#1E293B" BorderThickness="0,0,0,2" Padding="14,10" Margin="0,0,4,0" Cursor="Hand">
                            <ContentPresenter ContentSource="Header" TextBlock.FontSize="11.5" TextBlock.FontWeight="SemiBold" TextBlock.Foreground="#94A3B8"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsSelected" Value="True">
                                <Setter TargetName="TabBorder" Property="Background" Value="#191026"/>
                                <Setter TargetName="TabBorder" Property="BorderBrush" Value="#A855F7"/>
                                <Setter TargetName="TabBorder" Property="BorderThickness" Value="0,0,0,3"/>
                                <Setter Property="TextBlock.Foreground" Value="#C084FC"/>
                            </Trigger>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter TargetName="TabBorder" Property="Background" Value="#221636"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>

        <!-- 3. Emerald (Чат-бот и Команды) -->
        <Style x:Key="TabItemEmerald" TargetType="{x:Type TabItem}">
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="{x:Type TabItem}">
                        <Border x:Name="TabBorder" Background="#0A0E17" BorderBrush="#1E293B" BorderThickness="0,0,0,2" Padding="14,10" Margin="0,0,4,0" Cursor="Hand">
                            <ContentPresenter ContentSource="Header" TextBlock.FontSize="11.5" TextBlock.FontWeight="SemiBold" TextBlock.Foreground="#94A3B8"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsSelected" Value="True">
                                <Setter TargetName="TabBorder" Property="Background" Value="#0A1E17"/>
                                <Setter TargetName="TabBorder" Property="BorderBrush" Value="#10B981"/>
                                <Setter TargetName="TabBorder" Property="BorderThickness" Value="0,0,0,3"/>
                                <Setter Property="TextBlock.Foreground" Value="#34D399"/>
                            </Trigger>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter TargetName="TabBorder" Property="Background" Value="#102920"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>

        <!-- 4. Amber (Донаты и Оповещения) -->
        <Style x:Key="TabItemAmber" TargetType="{x:Type TabItem}">
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="{x:Type TabItem}">
                        <Border x:Name="TabBorder" Background="#0A0E17" BorderBrush="#1E293B" BorderThickness="0,0,0,2" Padding="14,10" Margin="0,0,4,0" Cursor="Hand">
                            <ContentPresenter ContentSource="Header" TextBlock.FontSize="11.5" TextBlock.FontWeight="SemiBold" TextBlock.Foreground="#94A3B8"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsSelected" Value="True">
                                <Setter TargetName="TabBorder" Property="Background" Value="#24180A"/>
                                <Setter TargetName="TabBorder" Property="BorderBrush" Value="#F59E0B"/>
                                <Setter TargetName="TabBorder" Property="BorderThickness" Value="0,0,0,3"/>
                                <Setter Property="TextBlock.Foreground" Value="#FBBF24"/>
                            </Trigger>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter TargetName="TabBorder" Property="Background" Value="#2F200C"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>

        <!-- 5. Red (СИСТЕМА И SDK) -->
        <Style x:Key="TabItemRed" TargetType="{x:Type TabItem}">
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="{x:Type TabItem}">
                        <Border x:Name="TabBorder" Background="#0A0E17" BorderBrush="#1E293B" BorderThickness="0,0,0,2" Padding="14,10" Margin="0,0,4,0" Cursor="Hand">
                            <ContentPresenter ContentSource="Header" TextBlock.FontSize="11.5" TextBlock.FontWeight="SemiBold" TextBlock.Foreground="#94A3B8"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsSelected" Value="True">
                                <Setter TargetName="TabBorder" Property="Background" Value="#260C0F"/>
                                <Setter TargetName="TabBorder" Property="BorderBrush" Value="#EF4444"/>
                                <Setter TargetName="TabBorder" Property="BorderThickness" Value="0,0,0,3"/>
                                <Setter Property="TextBlock.Foreground" Value="#F87171"/>
                            </Trigger>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter TargetName="TabBorder" Property="Background" Value="#331015"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
    </Window.Resources>

    <Grid>
        <!-- Основной интерфейс -->
        <Grid Margin="0">
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="*"/>
                <RowDefinition Height="Auto"/>
            </Grid.RowDefinitions>

            <!-- 1. Верхняя панель заголовка -->
            <Border Grid.Row="0" Background="#090E17" BorderBrush="#1E293B" BorderThickness="0,0,0,1.5" Padding="20,14">
                <Grid>
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="Auto"/>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="Auto"/>
                    </Grid.ColumnDefinitions>

                    <Border Grid.Column="0" Width="44" Height="44" Background="#0F1B2B" BorderBrush="#00E5FF" BorderThickness="1.5" CornerRadius="8" Margin="0,0,14,0">
                        <TextBlock Text="⚙️" FontSize="22" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                    </Border>

                    <StackPanel Grid.Column="1" VerticalAlignment="Center">
                        <TextBlock Text="ETS2 / ATS STREAM OVERLAY COCKPIT" FontSize="16" FontWeight="Bold" Foreground="#F8FAFC"/>
                        <TextBlock Text="Центр управления конфигурацией оверлея (config.js)" FontSize="11" Foreground="#00E5FF" Margin="0,2,0,0"/>
                    </StackPanel>

                    <Border Grid.Column="2" Background="#0C1B2E" BorderBrush="#00E5FF" BorderThickness="1" CornerRadius="6" Padding="10,5" VerticalAlignment="Center">
                        <TextBlock Text="COCKPIT // v0.0.3" FontSize="11" FontWeight="Bold" Foreground="#00E5FF"/>
                    </Border>
                </Grid>
            </Border>

            <!-- 2. Вкладки конфигуратора -->
            <TabControl Grid.Row="1" Background="#070A0F" BorderThickness="0" Margin="14,10,14,0">

                <!-- Вкладка 1: Внешний вид и HUD (Cyan) -->
                <TabItem Header="🎨 ВНЕШНИЙ ВИД И HUD" Style="{StaticResource TabItemCyan}">
                    <ScrollViewer VerticalScrollBarVisibility="Auto" HorizontalScrollBarVisibility="Disabled" Padding="0,10,10,10">
                        <StackPanel>

                            <!-- Выбор темы оформления -->
                            <Border Style="{StaticResource CardPanel}">
                                <StackPanel>
                                    <TextBlock Text="ТЕМА ОФОРМЛЕНИЯ ПРИБОРНОЙ ПАНЕЛИ" Style="{StaticResource CardHeaderCyan}"/>

                                    <TextBlock Text="Активная тема кокпита (cockpitTheme):" Style="{StaticResource FieldLabel}"/>
                                    <ComboBox x:Name="cmbCockpitTheme">
                                        <ComboBoxItem Content="Классическая (Classic) — Щиток Scania / Volvo" Tag="classic"/>
                                        <ComboBoxItem Content="Торпеда Про (Torpedo Pro) — Полноразмерная торпеда тягача" Tag="torpedo-pro"/>
                                        <ComboBoxItem Content="Scania Touring — Автобусный щиток Scania ICL" Tag="scania-touring"/>
                                        <ComboBoxItem Content="MAN Lion's Coach — Немецкий туристический автобус" Tag="man-lions-coach"/>
                                        <ComboBoxItem Content="Volvo 9700 DD — Центр-доминантная панель Double Decker" Tag="volvo-9700-dd"/>
                                    </ComboBox>

                                    <!-- Динамическая плашка описания выбранной темы -->
                                    <Border Background="#09101C" BorderBrush="#00E5FF" BorderThickness="1" CornerRadius="8" Padding="12,10" Margin="0,8,0,4">
                                        <TextBlock x:Name="txtThemeDescription" Text="Загрузка описания темы..." FontSize="11" Foreground="#94A3B8" TextWrapping="Wrap" LineHeight="17"/>
                                    </Border>
                                    <TextBlock Text="Тема определяет визуальный стиль щитка приборов, стрелочные или цифровые циферблаты и компоновку MFD." Style="{StaticResource FieldHint}"/>
                                </StackPanel>
                            </Border>

                            <!-- Рамка веб-камеры -->
                            <Border Style="{StaticResource CardPanel}">
                                <StackPanel>
                                    <TextBlock Text="РАМКА ВЕБ-КАМЕРЫ (WEBCAM HUD)" Style="{StaticResource CardHeaderCyan}"/>

                                    <Grid Margin="0,0,0,8">
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="Auto"/>
                                            <ColumnDefinition Width="*"/>
                                        </Grid.ColumnDefinitions>
                                        <CheckBox x:Name="chkWebcamEnabled" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}"/>
                                        <TextBlock Grid.Column="1" Text="Отображать стилизованную рамку веб-камеры на стриме" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#F1F5F9" FontSize="12"/>
                                    </Grid>
                                    <TextBlock Text="При отключении рамка скрывается, освобождая левую часть экрана для игрового интерфейса или кастомной камеры." Style="{StaticResource FieldHint}"/>

                                    <TextBlock Text="Формат пропорций веб-камеры:" Style="{StaticResource FieldLabel}"/>
                                    <StackPanel Orientation="Horizontal" Margin="0,4,0,4">
                                        <RadioButton x:Name="rbCam4x3" GroupName="grpCamAspect" Content="4:3 (325×244 px — классический стрим)" Foreground="#F1F5F9" Margin="0,0,24,0"/>
                                        <RadioButton x:Name="rbCam16x9" GroupName="grpCamAspect" Content="16:9 (384×216 px — широкоформатный стрим)" Foreground="#F1F5F9"/>
                                    </StackPanel>
                                    <TextBlock Text="Задаёт геометрию выреза окна камеры. В свойствах устройства захвата видео в OBS задайте соответствующее разрешение." Style="{StaticResource FieldHint}"/>
                                </StackPanel>
                            </Border>

                            <!-- Стилизация и единицы измерения -->
                            <Border Style="{StaticResource CardPanel}">
                                <StackPanel>
                                    <TextBlock Text="СТИЛИЗАЦИЯ И ЕДИНИЦЫ ИЗМЕРЕНИЯ" Style="{StaticResource CardHeaderCyan}"/>

                                    <Grid>
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="*"/>
                                            <ColumnDefinition Width="14"/>
                                            <ColumnDefinition Width="*"/>
                                        </Grid.ColumnDefinitions>

                                        <StackPanel Grid.Column="0">
                                            <TextBlock Text="Язык интерфейса оверлея:" Style="{StaticResource FieldLabel}"/>
                                            <ComboBox x:Name="cmbLang">
                                                <ComboBoxItem Content="Русский (ru)" Tag="ru"/>
                                                <ComboBoxItem Content="English (en)" Tag="en"/>
                                            </ComboBox>
                                            <TextBlock Text="Язык подписей приборов, подсказок, системных уведомлений и названий городов." Style="{StaticResource FieldHint}"/>

                                            <TextBlock Text="Подсветка приборки тягача:" Style="{StaticResource FieldLabel}"/>
                                            <ComboBox x:Name="cmbCockpitPreset">
                                                <ComboBoxItem Content="Янтарная классика (amber)" Tag="amber"/>
                                                <ComboBoxItem Content="Ледяной неон (ice)" Tag="ice"/>
                                            </ComboBox>
                                            <TextBlock Text="Базовый цветовой пресет подсветки приборной панели." Style="{StaticResource FieldHint}"/>

                                            <TextBlock Text="Пользовательский цвет подсветки HEX:" Style="{StaticResource FieldLabel}"/>
                                            <TextBox x:Name="txtCockpitAccent"/>
                                            <TextBlock Text="Например #00E5FF (оставьте пустым для цвета из пресета выше)." Style="{StaticResource FieldHint}"/>
                                        </StackPanel>

                                        <StackPanel Grid.Column="2">
                                            <TextBlock Text="Шкала спидометра:" Style="{StaticResource FieldLabel}"/>
                                            <ComboBox x:Name="cmbDisplayUnit">
                                                <ComboBoxItem Content="Авто (ETS2=км/ч, ATS=mph)" Tag="auto"/>
                                                <ComboBoxItem Content="Только км/ч (kmh)" Tag="kmh"/>
                                                <ComboBoxItem Content="Только мили/ч (mph)" Tag="mph"/>
                                            </ComboBox>
                                            <TextBlock Text="Единицы измерения скорости (автоопределение в зависимости от запущенного симулятора)." Style="{StaticResource FieldHint}"/>

                                            <TextBlock Text="Дистанция навигатора:" Style="{StaticResource FieldLabel}"/>
                                            <ComboBox x:Name="cmbNavDist">
                                                <ComboBoxItem Content="Авто (км для ETS2, мили для ATS)" Tag="auto"/>
                                                <ComboBoxItem Content="Километры (km)" Tag="km"/>
                                                <ComboBoxItem Content="Мили (mi)" Tag="mi"/>
                                            </ComboBox>
                                            <TextBlock Text="Единицы расстояния в маршрутном компьютере и бегущей строке рейса." Style="{StaticResource FieldHint}"/>

                                            <TextBlock Text="Интервал смены соцсетей (мс):" Style="{StaticResource FieldLabel}"/>
                                            <TextBox x:Name="txtSocialsInterval"/>
                                            <TextBlock Text="Частота циклической смены плашек соцсетей (по умолчанию 9000 мс = 9 сек)." Style="{StaticResource FieldHint}"/>
                                        </StackPanel>
                                    </Grid>
                                </StackPanel>
                            </Border>

                        </StackPanel>
                    </ScrollViewer>
                </TabItem>

                <!-- Вкладка 2: Стрим-платформы и Чат (Violet) -->
                <TabItem Header="📡 СТРИМ-ПЛАТФОРМЫ И ЧАТ" Style="{StaticResource TabItemViolet}">
                    <ScrollViewer VerticalScrollBarVisibility="Auto" HorizontalScrollBarVisibility="Disabled" Padding="0,10,10,10">
                        <StackPanel>

                            <!-- Twitch -->
                            <Border Style="{StaticResource CardPanel}">
                                <StackPanel>
                                    <TextBlock Text="ИНТЕГРАЦИЯ С TWITCH" Style="{StaticResource CardHeaderViolet}"/>

                                    <Grid Margin="0,0,0,8">
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="Auto"/>
                                            <ColumnDefinition Width="*"/>
                                        </Grid.ColumnDefinitions>
                                        <CheckBox x:Name="chkTwitchEnabled" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}"/>
                                        <TextBlock Grid.Column="1" Text="Включить подключение к Twitch IRC чату" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#F1F5F9" FontSize="12"/>
                                    </Grid>
                                    <TextBlock Text="Обеспечивает вывод сообщений Twitch в виджет чата и обработку интерактивных команд зрителей." Style="{StaticResource FieldHint}"/>

                                    <TextBlock Text="Имя канала Twitch:" Style="{StaticResource FieldLabel}"/>
                                    <TextBox x:Name="txtTwitchChannel"/>
                                    <TextBlock Text="Имя вашего канала Twitch без символа @ (например foozzee)." Style="{StaticResource FieldHint}"/>

                                    <TextBlock Text="OAuth-токен чата Twitch:" Style="{StaticResource FieldLabel}"/>
                                    <Grid>
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="*"/>
                                            <ColumnDefinition Width="10"/>
                                            <ColumnDefinition Width="Auto"/>
                                        </Grid.ColumnDefinitions>
                                        <PasswordBox x:Name="pwdTwitchToken" Grid.Column="0"/>
                                        <TextBox x:Name="txtTwitchToken" Grid.Column="0" Visibility="Collapsed"/>
                                        <Button x:Name="btnToggleTwitchToken" Grid.Column="2" Content="👁 Показать" Background="#1E293B" Foreground="#C084FC" BorderBrush="#334155" Padding="12,4" Cursor="Hand"/>
                                    </Grid>
                                    <TextBlock Style="{StaticResource FieldHint}">
                                        Токен для авторизации бота в чате (oauth:xxxx). Защищён маскировкой. Сгенерируйте токен на сайте <Hyperlink NavigateUri="https://twitchtokengenerator.com/">Twitch Token Generator</Hyperlink> (выберите скоупы chat:read и chat:edit).
                                    </TextBlock>

                                    <TextBlock Text="Twitch Client ID (опционально):" Style="{StaticResource FieldLabel}"/>
                                    <TextBox x:Name="txtTwitchClientId"/>
                                    <TextBlock Style="{StaticResource FieldHint}">
                                        Идентификатор приложения Twitch API. Создайте приложение в <Hyperlink NavigateUri="https://dev.twitch.tv/console/apps">Twitch Developer Console</Hyperlink> и укажите Client ID для расширенной работы с API.
                                    </TextBlock>
                                </StackPanel>
                            </Border>

                            <!-- VK Video Live -->
                            <Border Style="{StaticResource CardPanel}" IsEnabled="False" Opacity="0.65">
                                <StackPanel>
                                    <StackPanel Orientation="Horizontal" Margin="0,0,0,10">
                                        <TextBlock Text="ИНТЕГРАЦИЯ С VK ВИДЕО LIVE" Style="{StaticResource CardHeaderViolet}" Margin="0"/>
                                        <Border Background="#3B0764" BorderBrush="#A855F7" BorderThickness="1" CornerRadius="4" Padding="6,2" Margin="10,0,0,0" VerticalAlignment="Center">
                                            <TextBlock Text="[ В РАЗРАБОТКЕ ]" Foreground="#E9D5FF" FontSize="10.5" FontWeight="Bold"/>
                                        </Border>
                                    </StackPanel>
                                    <TextBlock Text="Поддержка чата VK Видео Live появится в одном из следующих обновлений." Foreground="#F59E0B" FontWeight="SemiBold" FontSize="11" Margin="0,0,0,8" TextWrapping="Wrap"/>

                                    <Grid Margin="0,0,0,8">
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="Auto"/>
                                            <ColumnDefinition Width="*"/>
                                        </Grid.ColumnDefinitions>
                                        <CheckBox x:Name="chkVkEnabled" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}" IsEnabled="False"/>
                                        <TextBlock Grid.Column="1" Text="Включить интеграцию с трансляцией VK Видео Live" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#94A3B8" FontSize="12"/>
                                    </Grid>
                                    <TextBlock Text="Позволяет выводить сообщения и комментарии зрителей из трансляции VK Видео Live в игровой док чата." Style="{StaticResource FieldHint}"/>

                                    <TextBlock Text="URL канала VK Видео Live:" Style="{StaticResource FieldLabel}"/>
                                    <TextBox x:Name="txtVkUrl" IsEnabled="False"/>
                                    <TextBlock Style="{StaticResource FieldHint}">
                                        Полная веб-ссылка на ваш канал трансляции. Настроить трансляцию можно в <Hyperlink NavigateUri="https://live.vkvideo.ru/">Студии VK Видео Live</Hyperlink>.
                                    </TextBlock>

                                    <TextBlock Text="Токен доступа VK (опционально):" Style="{StaticResource FieldLabel}"/>
                                    <Grid>
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="*"/>
                                            <ColumnDefinition Width="10"/>
                                            <ColumnDefinition Width="Auto"/>
                                        </Grid.ColumnDefinitions>
                                        <PasswordBox x:Name="pwdVkToken" Grid.Column="0" IsEnabled="False"/>
                                        <TextBox x:Name="txtVkToken" Grid.Column="0" Visibility="Collapsed" IsEnabled="False"/>
                                        <Button x:Name="btnToggleVkToken" Grid.Column="2" Content="👁 Показать" Background="#1E293B" Foreground="#C084FC" BorderBrush="#334155" Padding="12,4" Cursor="Hand" IsEnabled="False"/>
                                    </Grid>
                                    <TextBlock Text="Служебный токен доступа к API чата VK. Маскируется точками для безопасной настройки на стриме." Style="{StaticResource FieldHint}"/>
                                </StackPanel>
                            </Border>

                            <!-- Настройки чата -->
                            <Border Style="{StaticResource CardPanel}">
                                <StackPanel>
                                    <TextBlock Text="ПАРАМЕТРЫ ЧАТА НА ОВЕРЛЕЕ" Style="{StaticResource CardHeaderViolet}"/>

                                    <Grid>
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="*"/>
                                            <ColumnDefinition Width="14"/>
                                            <ColumnDefinition Width="*"/>
                                        </Grid.ColumnDefinitions>

                                        <StackPanel Grid.Column="0">
                                            <TextBlock Text="Максимум сообщений на экране:" Style="{StaticResource FieldLabel}"/>
                                            <TextBox x:Name="txtChatMax"/>
                                            <TextBlock Text="Лимит видимых строк в окне чата (по умолчанию 30). Предотвращает утечки памяти OBS." Style="{StaticResource FieldHint}"/>

                                            <TextBlock Text="Автоудаление сообщений по таймеру (мс):" Style="{StaticResource FieldLabel}"/>
                                            <TextBox x:Name="txtChatLifetime"/>
                                            <TextBlock Text="Время отображения строки до плавного исчезновения (0 — не удалять сообщения по таймеру)." Style="{StaticResource FieldHint}"/>
                                        </StackPanel>

                                        <StackPanel Grid.Column="2">
                                            <TextBlock Text="Фильтрация команд чата:" Style="{StaticResource FieldLabel}"/>
                                            <Grid Margin="0,4,0,4">
                                                <Grid.ColumnDefinitions>
                                                    <ColumnDefinition Width="Auto"/>
                                                    <ColumnDefinition Width="*"/>
                                                </Grid.ColumnDefinitions>
                                                <CheckBox x:Name="chkChatHideCommands" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}"/>
                                                <TextBlock Grid.Column="1" Text="Скрывать сообщения команд с префиксом '!' (!гудок и т.д.)" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#F1F5F9" FontSize="11" TextWrapping="Wrap"/>
                                            </Grid>
                                            <TextBlock Text="Позволяет очистить чат от спама зрительских команд, оставляя только живой диалог." Style="{StaticResource FieldHint}"/>

                                            <TextBlock Text="Игнорируемые боты (через запятую):" Style="{StaticResource FieldLabel}"/>
                                            <TextBox x:Name="txtChatIgnored"/>
                                            <TextBlock Text="Ники ботов через запятую, чьи сообщения не выводятся в оверлей (по умолчанию: Nightbot, StreamElements, Moobot, FooZzee_Bot)." Style="{StaticResource FieldHint}"/>
                                        </StackPanel>
                                    </Grid>
                                </StackPanel>
                            </Border>

                        </StackPanel>
                    </ScrollViewer>
                </TabItem>

                <!-- Вкладка 3: Чат-бот и Команды (Emerald) -->
                <TabItem Header="🤖 ЧАТ-БОТ И КОМАНДЫ" Style="{StaticResource TabItemEmerald}">
                    <ScrollViewer VerticalScrollBarVisibility="Auto" HorizontalScrollBarVisibility="Disabled" Padding="0,10,10,10">
                        <StackPanel>

                            <!-- Интерактивные команды зрителей -->
                            <Border Style="{StaticResource CardPanel}">
                                <StackPanel>
                                    <TextBlock Text="ИНТЕРАКТИВНЫЕ КОМАНДЫ ЗРИТЕЛЕЙ TWITCH" Style="{StaticResource CardHeaderEmerald}"/>

                                    <Grid Margin="0,0,0,8">
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="Auto"/>
                                            <ColumnDefinition Width="*"/>
                                        </Grid.ColumnDefinitions>
                                        <CheckBox x:Name="chkCommandsEnabled" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}"/>
                                        <TextBlock Grid.Column="1" Text="Разрешить зрителям чата интерактивно запрашивать данные рейса и управлять сигналами" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#F1F5F9" FontSize="12"/>
                                    </Grid>
                                    <TextBlock Text="Активирует набор команд: !рейс, !стата, !тягач, !рация, !гудок, !водитель, !ставка." Style="{StaticResource FieldHint}"/>

                                    <Grid>
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="*"/>
                                            <ColumnDefinition Width="14"/>
                                            <ColumnDefinition Width="*"/>
                                        </Grid.ColumnDefinitions>

                                        <StackPanel Grid.Column="0">
                                            <TextBlock Text="Доступ к команде !рация (cbRadioMinRole):" Style="{StaticResource FieldLabel}"/>
                                            <ComboBox x:Name="cmbCbRole">
                                                <ComboBoxItem Content="Все зрители (all)" Tag="all"/>
                                                <ComboBoxItem Content="Только фолловеры (follower)" Tag="follower"/>
                                                <ComboBoxItem Content="Только сабскрайберы (subscriber)" Tag="subscriber"/>
                                                <ComboBoxItem Content="VIP и Модераторы (vip)" Tag="vip"/>
                                                <ComboBoxItem Content="Только модераторы (mod)" Tag="mod"/>
                                            </ComboBox>
                                            <TextBlock Text="Минимальная роль зрителя в чате для отправки сообщения в эфир рации CB оверлея." Style="{StaticResource FieldHint}"/>

                                            <TextBlock Text="Кулдаун инфо-команд !рейс / !стата (сек):" Style="{StaticResource FieldLabel}"/>
                                            <TextBox x:Name="txtInfoCooldown"/>
                                            <TextBlock Text="Общая пауза между запросами информации о рейсе и тягаче (по умолчанию 30 сек)." Style="{StaticResource FieldHint}"/>

                                            <TextBlock Text="Кулдаун команды !рация (сек):" Style="{StaticResource FieldLabel}"/>
                                            <TextBox x:Name="txtCbCooldown"/>
                                            <TextBlock Text="Пауза между отправкой реплик в радиоэфир кабины (по умолчанию 45 сек)." Style="{StaticResource FieldHint}"/>
                                        </StackPanel>

                                        <StackPanel Grid.Column="2">
                                            <TextBlock Text="Доступ к команде !гудок (honkMinRole):" Style="{StaticResource FieldLabel}"/>
                                            <ComboBox x:Name="cmbHonkRole">
                                                <ComboBoxItem Content="Только сабскрайберы (subscriber)" Tag="subscriber"/>
                                                <ComboBoxItem Content="VIP и Модераторы (vip)" Tag="vip"/>
                                                <ComboBoxItem Content="Только модераторы (mod)" Tag="mod"/>
                                                <ComboBoxItem Content="Только стример (broadcaster)" Tag="broadcaster"/>
                                            </ComboBox>
                                            <TextBlock Text="Минимальная роль зрителя для подачи пневматического звукового сигнала клаксона." Style="{StaticResource FieldHint}"/>

                                            <TextBlock Text="Кулдаун команды !гудок (сек):" Style="{StaticResource FieldLabel}"/>
                                            <TextBox x:Name="txtHonkCooldown"/>
                                            <TextBlock Text="Общая защита от спама звуковым сигналом клаксона (по умолчанию 60 сек)." Style="{StaticResource FieldHint}"/>

                                            <TextBlock Text="Индивидуальный кулдаун на одного зрителя (сек):" Style="{StaticResource FieldLabel}"/>
                                            <TextBox x:Name="txtUserCooldown"/>
                                            <TextBlock Text="Персональная задержка между любыми командами для отдельного зрителя (по умолчанию 120 сек)." Style="{StaticResource FieldHint}"/>
                                        </StackPanel>
                                    </Grid>
                                </StackPanel>
                            </Border>

                            <!-- Уведомления о событиях в игре -->
                            <Border Style="{StaticResource CardPanel}">
                                <StackPanel>
                                    <TextBlock Text="УВЕДОМЛЕНИЯ О СОБЫТИЯХ В ИГРЕ" Style="{StaticResource CardHeaderEmerald}"/>

                                    <Grid Margin="0,0,0,8">
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="Auto"/>
                                            <ColumnDefinition Width="*"/>
                                        </Grid.ColumnDefinitions>
                                        <CheckBox x:Name="chkEventsEnabled" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}"/>
                                        <TextBlock Grid.Column="1" Text="Всплывающие уведомления о событиях (штрафы, заправка, оплата дорог, сдача рейса)" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#F1F5F9" FontSize="12"/>
                                    </Grid>
                                    <TextBlock Text="Отображает стилизованные карточки в верхней зоне ветрового стекла при наступлении игровых событий." Style="{StaticResource FieldHint}"/>

                                    <Grid Margin="0,0,0,8">
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="Auto"/>
                                            <ColumnDefinition Width="*"/>
                                        </Grid.ColumnDefinitions>
                                        <CheckBox x:Name="chkEventSound" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}"/>
                                        <TextBlock Grid.Column="1" Text="Звуковые эффекты игровых событий симулятора" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#F1F5F9" FontSize="12"/>
                                    </Grid>
                                    <TextBlock Text="Воспроизведение коротких процедурных звуковых сигналов при штрафах, проезде пунктов оплаты и пароме." Style="{StaticResource FieldHint}"/>

                                    <TextBlock Text="Громкость звуков игровых событий (от 0.0 до 1.0):" Style="{StaticResource FieldLabel}"/>
                                    <TextBox x:Name="txtEventSoundVol"/>
                                    <TextBlock Text="Уровень громкости синтезатора событий (по умолчанию 0.65 = 65%)." Style="{StaticResource FieldHint}"/>
                                </StackPanel>
                            </Border>

                            <!-- Виджет текущего трека -->
                            <Border Style="{StaticResource CardPanel}">
                                <StackPanel>
                                    <TextBlock Text="ВИДЖЕТ ТЕКУЩЕГО ТРЕКА (MUSIC FM)" Style="{StaticResource CardHeaderEmerald}"/>

                                    <Grid Margin="0,0,0,8">
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="Auto"/>
                                            <ColumnDefinition Width="*"/>
                                        </Grid.ColumnDefinitions>
                                        <CheckBox x:Name="chkMusicEnabled" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}"/>
                                        <TextBlock Grid.Column="1" Text="Включить виджет музыки в нижней панели телеметрии" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#F1F5F9" FontSize="12"/>
                                    </Grid>
                                    <TextBlock Text="Выводит текущую радиостанцию или трек в информационную бегущую строку кокпита." Style="{StaticResource FieldHint}"/>

                                    <TextBlock Text="URL источника OBS Tuna JSON (опционально):" Style="{StaticResource FieldLabel}"/>
                                    <TextBox x:Name="txtMusicUrl"/>
                                    <TextBlock Text="Адрес плагина OBS Tuna (например http://127.0.0.1:1608/) для автозахвата играющего трека из Spotify или браузера." Style="{StaticResource FieldHint}"/>
                                </StackPanel>
                            </Border>

                        </StackPanel>
                    </ScrollViewer>
                </TabItem>

                <!-- Вкладка 4: Донаты и Оповещения (Amber) -->
                <TabItem Header="💰 ДОНАТЫ И ОПОВЕЩЕНИЯ" Style="{StaticResource TabItemAmber}">
                    <ScrollViewer VerticalScrollBarVisibility="Auto" HorizontalScrollBarVisibility="Disabled" Padding="0,10,10,10">
                        <StackPanel>

                            <!-- DonationAlerts -->
                            <Border Style="{StaticResource CardPanel}">
                                <StackPanel>
                                    <TextBlock Text="ПОДКЛЮЧЕНИЕ DONATIONALERTS" Style="{StaticResource CardHeaderAmber}"/>

                                    <Grid Margin="0,0,0,8">
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="Auto"/>
                                            <ColumnDefinition Width="*"/>
                                        </Grid.ColumnDefinitions>
                                        <CheckBox x:Name="chkDaEnabled" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}"/>
                                        <TextBlock Grid.Column="1" Text="Включить отображение донатов с DonationAlerts в HUD оверлея" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#F1F5F9" FontSize="12"/>
                                    </Grid>
                                    <TextBlock Text="Активирует приём оповещений о донатах, платных подписках и рейдах в едином стиле кокпита." Style="{StaticResource FieldHint}"/>

                                    <TextBlock Text="Socket-токен DonationAlerts:" Style="{StaticResource FieldLabel}"/>
                                    <Grid>
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="*"/>
                                            <ColumnDefinition Width="10"/>
                                            <ColumnDefinition Width="Auto"/>
                                        </Grid.ColumnDefinitions>
                                        <PasswordBox x:Name="pwdDaToken" Grid.Column="0"/>
                                        <TextBox x:Name="txtDaToken" Grid.Column="0" Visibility="Collapsed"/>
                                        <Button x:Name="btnToggleDaToken" Grid.Column="2" Content="👁 Показать" Background="#1E293B" Foreground="#FBBF24" BorderBrush="#334155" Padding="12,4" Cursor="Hand"/>
                                    </Grid>
                                    <TextBlock Style="{StaticResource FieldHint}">
                                        Секретный токен виджета для подключения к WebSocket. Скопируйте Socket-токен (DA Token) в разделе <Hyperlink NavigateUri="https://www.donationalerts.com/dashboard/general-settings/account">DonationAlerts — Основные настройки аккаунта</Hyperlink>.
                                    </TextBlock>
                                </StackPanel>
                            </Border>

                            <!-- Параметры алертов -->
                            <Border Style="{StaticResource CardPanel}">
                                <StackPanel>
                                    <TextBlock Text="ПАРАМЕТРЫ СИСТЕМЫ АЛЕРТОВ (FIFO-ОЧЕРЕДЬ)" Style="{StaticResource CardHeaderAmber}"/>

                                    <Grid>
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="*"/>
                                            <ColumnDefinition Width="14"/>
                                            <ColumnDefinition Width="*"/>
                                        </Grid.ColumnDefinitions>

                                        <StackPanel Grid.Column="0">
                                            <TextBlock Text="Общая громкость звуков (от 0.0 до 1.0):" Style="{StaticResource FieldLabel}"/>
                                            <TextBox x:Name="txtAlertsVol"/>
                                            <TextBlock Text="Громкость аудиосигналов оповещений (по умолчанию 0.65 = 65%)." Style="{StaticResource FieldHint}"/>

                                            <TextBlock Text="Длительность показа одного алерта (мс):" Style="{StaticResource FieldLabel}"/>
                                            <TextBox x:Name="txtAlertsDuration"/>
                                            <TextBlock Text="Время отображения карточки на экране (по умолчанию 5000 мс = 5 сек)." Style="{StaticResource FieldHint}"/>

                                            <TextBlock Text="Пауза между алертами в очереди (мс):" Style="{StaticResource FieldLabel}"/>
                                            <TextBox x:Name="txtAlertsPause"/>
                                            <TextBlock Text="Задержка перед показом следующего доната из очереди (по умолчанию 800 мс)." Style="{StaticResource FieldHint}"/>
                                        </StackPanel>

                                        <StackPanel Grid.Column="2">
                                            <TextBlock Text="Минимальная сумма доната для экрана (₽):" Style="{StaticResource FieldLabel}"/>
                                            <TextBox x:Name="txtMinDonate"/>
                                            <TextBlock Text="Донаты ниже этой суммы обрабатываются тихо без вывода карточки на экран стрима." Style="{StaticResource FieldHint}"/>

                                            <TextBlock Text="Озвучка текста доната (TTS):" Style="{StaticResource FieldLabel}"/>
                                            <Grid Margin="0,4,0,4">
                                                <Grid.ColumnDefinitions>
                                                    <ColumnDefinition Width="Auto"/>
                                                    <ColumnDefinition Width="*"/>
                                                </Grid.ColumnDefinitions>
                                                <CheckBox x:Name="chkAlertsTts" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}"/>
                                                <TextBlock Grid.Column="1" Text="Голосовое чтение сообщения доната синтезатором браузера" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#F1F5F9" FontSize="11"/>
                                            </Grid>
                                            <TextBlock Text="Встроенный в браузер синтез речи зачитывает имя зрителя и сумму пожертвования." Style="{StaticResource FieldHint}"/>

                                            <TextBlock Text="Резервный аудиосигнал приборки:" Style="{StaticResource FieldLabel}"/>
                                            <Grid Margin="0,4,0,4">
                                                <Grid.ColumnDefinitions>
                                                    <ColumnDefinition Width="Auto"/>
                                                    <ColumnDefinition Width="*"/>
                                                </Grid.ColumnDefinitions>
                                                <CheckBox x:Name="chkAlertsSynth" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}"/>
                                                <TextBlock Grid.Column="1" Text="Синтезировать сигнал WebAudio, если mp3 не найден" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#F1F5F9" FontSize="11" TextWrapping="Wrap"/>
                                            </Grid>
                                            <TextBlock Text="Гарантирует звуковое оповещение даже при отсутствии локальных аудиофайлов." Style="{StaticResource FieldHint}"/>
                                        </StackPanel>
                                    </Grid>
                                </StackPanel>
                            </Border>

                        </StackPanel>
                    </ScrollViewer>
                </TabItem>

                <!-- Вкладка 5: СИСТЕМА И SDK (Red) -->
                <TabItem Header="⚠️ СИСТЕМА И SDK" Style="{StaticResource TabItemRed}">
                    <ScrollViewer VerticalScrollBarVisibility="Auto" HorizontalScrollBarVisibility="Disabled" Padding="0,10,10,10">
                        <StackPanel>

                            <!-- Блок строгого предупреждения (Красная рамка и фон) -->
                            <Border Background="#260C0F" BorderBrush="#EF4444" BorderThickness="2" CornerRadius="10" Padding="16" Margin="0,0,0,14">
                                <Grid>
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="Auto"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <TextBlock Text="⚠️" FontSize="30" VerticalAlignment="Center" Margin="0,0,14,0"/>
                                    <StackPanel Grid.Column="1">
                                        <TextBlock Text="ВНИМАНИЕ: СИСТЕМНЫЕ И ТЕЛЕМЕТРИЧЕСКИЕ НАСТРОЙКИ" FontSize="13.5" FontWeight="Bold" Foreground="#FCA5A5"/>
                                        <TextBlock Text="Изменение этих параметров предназначено только для опытных пользователей. Неверные адреса портов или отключение моста нарушат получение данных телеметрии из ETS2 / ATS." FontSize="11" Foreground="#FECACA" TextWrapping="Wrap" Margin="0,4,0,8"/>
                                        <CheckBox x:Name="chkUnlockSystem" Content="Разблокировать редактирование критических системных параметров" FontWeight="Bold" Foreground="#F87171" Cursor="Hand"/>
                                    </StackPanel>
                                </Grid>
                            </Border>

                            <!-- Заблокированный контейнер настроек -->
                            <StackPanel x:Name="panelSystemSettings" IsEnabled="False">

                                <!-- Режим работы -->
                                <Border Style="{StaticResource CardPanel}">
                                    <StackPanel>
                                        <TextBlock Text="РЕЖИМЫ РАБОТЫ ОВЕРЛЕЯ" Style="{StaticResource CardHeaderRed}"/>

                                        <Grid Margin="0,0,0,8">
                                            <Grid.ColumnDefinitions>
                                                <ColumnDefinition Width="Auto"/>
                                                <ColumnDefinition Width="*"/>
                                            </Grid.ColumnDefinitions>
                                            <CheckBox x:Name="chkDebug" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}"/>
                                            <TextBlock Grid.Column="1" Text="Режим отладки (вывод подробных логов в консоль OBS и разрешение ?test=1)" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#F1F5F9" FontSize="12"/>
                                        </Grid>
                                        <TextBlock Text="Активирует расширенный вывод сетевых логов и позволяет тестировать приборку без запущенной игры." Style="{StaticResource FieldHint}"/>

                                        <Grid Margin="0,0,0,4">
                                            <Grid.ColumnDefinitions>
                                                <ColumnDefinition Width="Auto"/>
                                                <ColumnDefinition Width="*"/>
                                            </Grid.ColumnDefinitions>
                                            <CheckBox x:Name="chkCheckUpdates" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}"/>
                                            <TextBlock Grid.Column="1" Text="Проверка обновлений оверлея на GitHub при запуске" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#F1F5F9" FontSize="12"/>
                                        </Grid>
                                        <TextBlock Text="Безопасный фоновый запрос к GitHub API на наличие новых версий оверлея при старте сцены в OBS." Style="{StaticResource FieldHint}"/>
                                    </StackPanel>
                                </Border>

                                <!-- Телеметрия SCS SDK -->
                                <Border Style="{StaticResource CardPanel}">
                                    <StackPanel>
                                        <TextBlock Text="МОСТ ТЕЛЕМЕТРИИ SCS SDK 1.16 SHARED MEMORY" Style="{StaticResource CardHeaderRed}"/>

                                        <Grid Margin="0,0,0,8">
                                            <Grid.ColumnDefinitions>
                                                <ColumnDefinition Width="Auto"/>
                                                <ColumnDefinition Width="*"/>
                                            </Grid.ColumnDefinitions>
                                            <CheckBox x:Name="chkSdkEnabled" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}"/>
                                            <TextBlock Grid.Column="1" Text="Опрос локального HTTP-моста телеметрии ./scripts/udp-bridge.ps1" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#F1F5F9" FontSize="12"/>
                                        </Grid>
                                        <TextBlock Text="Основной канал получения скорости, передачи, оборотов, топлива и навигации из симулятора." Style="{StaticResource FieldHint}"/>

                                        <TextBlock Text="URL локального HTTP-моста телеметрии:" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtSdkUrl"/>
                                        <TextBlock Text="Сетевой адрес локального HTTP-сервера телеметрии (по умолчанию: http://127.0.0.1:30002/telemetry)." Style="{StaticResource FieldHint}"/>

                                        <Grid>
                                            <Grid.ColumnDefinitions>
                                                <ColumnDefinition Width="*"/>
                                                <ColumnDefinition Width="14"/>
                                                <ColumnDefinition Width="*"/>
                                            </Grid.ColumnDefinitions>

                                            <StackPanel Grid.Column="0">
                                                <TextBlock Text="Частота опроса моста при активной игре (мс):" Style="{StaticResource FieldLabel}"/>
                                                <TextBox x:Name="txtSdkPoll"/>
                                                <TextBlock Text="Интервал отправки пакетов телеметрии в миллисекундах (по умолчанию 300 мс = 3.3 опроса/сек)." Style="{StaticResource FieldHint}"/>

                                                <TextBlock Text="Таймаут неактивности моста (мс):" Style="{StaticResource FieldLabel}"/>
                                                <TextBox x:Name="txtSdkStale"/>
                                                <TextBlock Text="Время отсутствия данных, после которого статус симулятора помечается как 'Offline' (по умолчанию 9000 мс)." Style="{StaticResource FieldHint}"/>
                                            </StackPanel>

                                            <StackPanel Grid.Column="2">
                                                <TextBlock Text="Пауза ожидания при отсутствии моста (мс):" Style="{StaticResource FieldLabel}"/>
                                                <TextBox x:Name="txtSdkBackoff"/>
                                                <TextBlock Text="Замедленный интервал опроса при закрытой игре для экономии системных ресурсов CPU (по умолчанию 15000 мс)." Style="{StaticResource FieldHint}"/>
                                            </StackPanel>
                                        </Grid>
                                    </StackPanel>
                                </Border>

                                <!-- OBS WebSocket -->
                                <Border Style="{StaticResource CardPanel}">
                                    <StackPanel>
                                        <TextBlock Text="ИНТЕГРАЦИЯ С OBS WEBSOCKET" Style="{StaticResource CardHeaderRed}"/>

                                        <Grid Margin="0,0,0,8">
                                            <Grid.ColumnDefinitions>
                                                <ColumnDefinition Width="Auto"/>
                                                <ColumnDefinition Width="*"/>
                                            </Grid.ColumnDefinitions>
                                            <CheckBox x:Name="chkObsWsEnabled" Grid.Column="0" Style="{StaticResource ToggleSwitchStyle}"/>
                                            <TextBlock Grid.Column="1" Text="Включить управление сценами и источниками через obs-websocket v5" VerticalAlignment="Center" Margin="10,0,0,0" Foreground="#F1F5F9" FontSize="12"/>
                                        </Grid>
                                        <TextBlock Text="Позволяет оверлею отправлять сигналы переключения сцен и управления источниками в OBS Studio." Style="{StaticResource FieldHint}"/>

                                        <TextBlock Text="URL OBS WebSocket сервера:" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtObsWsUrl"/>
                                        <TextBlock Text="Адрес подключения WebSocket в OBS Studio (по умолчанию ws://127.0.0.1:4455)." Style="{StaticResource FieldHint}"/>

                                        <TextBlock Text="Пароль подключения OBS WebSocket:" Style="{StaticResource FieldLabel}"/>
                                        <Grid>
                                            <Grid.ColumnDefinitions>
                                                <ColumnDefinition Width="*"/>
                                                <ColumnDefinition Width="10"/>
                                                <ColumnDefinition Width="Auto"/>
                                            </Grid.ColumnDefinitions>
                                            <PasswordBox x:Name="pwdObsWsPass" Grid.Column="0"/>
                                            <TextBox x:Name="txtObsWsPass" Grid.Column="0" Visibility="Collapsed"/>
                                            <Button x:Name="btnToggleObsWsPass" Grid.Column="2" Content="👁 Показать" Background="#1E293B" Foreground="#F87171" BorderBrush="#334155" Padding="12,4" Cursor="Hand"/>
                                        </Grid>
                                        <TextBlock Text="Пароль настраивается в OBS Studio: меню «Инструменты» ➔ «Настройки сервера obs-websocket». Защищён маскировкой." Style="{StaticResource FieldHint}"/>
                                    </StackPanel>
                                </Border>

                            </StackPanel>

                        </StackPanel>
                    </ScrollViewer>
                </TabItem>

            </TabControl>

            <!-- 3. Нижняя статусная панель и кнопки управления -->
            <Border Grid.Row="2" Background="#090E17" BorderBrush="#1E293B" BorderThickness="0,1.5,0,0" Padding="20,12">
                <Grid>
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="Auto"/>
                    </Grid.ColumnDefinitions>

                    <!-- Статусное сообщение -->
                    <StackPanel Grid.Column="0" VerticalAlignment="Center">
                        <TextBlock x:Name="txtStatus" Text="Готово к работе. Загружен файл конфигурации." FontSize="12" Foreground="#94A3B8"/>
                        <TextBlock Text="© 2026 FooZzee · Proprietary Freeware License (All Rights Reserved)" FontSize="10.5" Foreground="#64748B" Margin="0,3,0,0"/>
                    </StackPanel>

                    <!-- Кнопки -->
                    <StackPanel Grid.Column="1" Orientation="Horizontal">
                        <Button x:Name="btnCancel" Content="Отмена" Background="#1E293B" Foreground="#E2E8F0" BorderBrush="#334155" BorderThickness="1.5" Padding="20,8" Margin="0,0,12,0" Cursor="Hand" FontSize="13" FontWeight="SemiBold"/>
                        <Button x:Name="btnSave" Content="💾 Сохранить изменения" Background="#00E5FF" Foreground="#04121F" BorderBrush="#00E5FF" BorderThickness="1.5" Padding="24,8" Cursor="Hand" FontSize="13" FontWeight="Bold"/>
                    </StackPanel>
                </Grid>
            </Border>
        </Grid>

        <!-- 4. Модальное окно подтверждения сохранения -->
        <Border x:Name="modalOverlay" Visibility="Collapsed" Background="#D505080E" HorizontalAlignment="Stretch" VerticalAlignment="Stretch">
            <Border Background="#0E141F" BorderBrush="#00E5FF" BorderThickness="2" CornerRadius="12" Padding="28" Width="520" HorizontalAlignment="Center" VerticalAlignment="Center">
                <StackPanel>
                    <!-- Иконка и заголовок -->
                    <StackPanel Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,0,0,14">
                        <TextBlock Text="⚙️" FontSize="26" VerticalAlignment="Center" Margin="0,0,10,0"/>
                        <TextBlock Text="Подтверждение сохранения" FontSize="18" FontWeight="Bold" Foreground="#F8FAFC" VerticalAlignment="Center"/>
                    </StackPanel>

                    <TextBlock Text="Вы уверены, что хотите сохранить изменения?" FontSize="14" FontWeight="SemiBold" Foreground="#00E5FF" HorizontalAlignment="Center" Margin="0,0,0,10"/>
                    <TextBlock Text="Текущий файл конфигурации будет скопирован в config.js.bak для безопасности, а все новые параметры будут аккуратно записаны в config.js." FontSize="12" Foreground="#94A3B8" TextWrapping="Wrap" TextAlignment="Center" Margin="0,0,0,24"/>

                    <!-- Две кнопки выбора -->
                    <Grid>
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width="*"/>
                            <ColumnDefinition Width="16"/>
                            <ColumnDefinition Width="*"/>
                        </Grid.ColumnDefinitions>

                        <Button x:Name="btnModalNo" Grid.Column="0" Content="Ой! Нет!" Background="#1E293B" Foreground="#E2E8F0" BorderBrush="#475569" BorderThickness="1.5" Padding="14,10" FontSize="13" FontWeight="Bold" Cursor="Hand"/>
                        <Button x:Name="btnModalYes" Grid.Column="2" Content="Конечно, да" Background="#00E5FF" Foreground="#04121F" BorderBrush="#00E5FF" BorderThickness="1.5" Padding="14,10" FontSize="13" FontWeight="Bold" Cursor="Hand"/>
                    </Grid>
                </StackPanel>
            </Border>
        </Border>

    </Grid>
</Window>
"@

# 7. Загрузка и инициализация окна WPF
try {
    $stringReader = New-Object System.IO.StringReader($xaml)
    $xmlReader = [System.Xml.XmlReader]::Create($stringReader)
    $window = [System.Windows.Markup.XamlReader]::Load($xmlReader)
} catch {
    $errMsg = "Критическая ошибка загрузки интерфейса XAML:`n`n$($_.Exception.Message)"
    if ($_.Exception.InnerException) {
        $errMsg += "`n`n$($_.Exception.InnerException.Message)"
    }
    [System.Windows.MessageBox]::Show($errMsg, "Ошибка запуска конфигуратора", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Error)
    exit 1
}

# Установка иконки окна, если файл иконки найден
if (Test-Path -LiteralPath $IconPath) {
    try {
        $iconUri = New-Object System.Uri($IconPath, [System.UriKind]::Absolute)
        $window.Icon = [System.Windows.Media.Imaging.BitmapFrame]::Create($iconUri)
    } catch {
        Write-Warning "Could not load window icon: $_"
    }
}

# 8. Регистрация универсального обработчика кликов по гиперссылкам
$window.AddHandler(
    [System.Windows.Documents.Hyperlink]::RequestNavigateEvent,
    [System.Windows.Navigation.RequestNavigateEventHandler]{
        param($sender, $e)
        try {
            [System.Diagnostics.Process]::Start((New-Object System.Diagnostics.ProcessStartInfo($e.Uri.AbsoluteUri)))
        } catch {
            Start-Process $e.Uri.AbsoluteUri
        }
        $e.Handled = $true
    }
)

# 9. Поиск элементов интерфейса
$cmbCockpitTheme    = $window.FindName('cmbCockpitTheme')
$txtThemeDescription = $window.FindName('txtThemeDescription')

$chkWebcamEnabled = $window.FindName('chkWebcamEnabled')
$rbCam4x3 = $window.FindName('rbCam4x3')
$rbCam16x9 = $window.FindName('rbCam16x9')

$cmbLang = $window.FindName('cmbLang')
$cmbCockpitPreset = $window.FindName('cmbCockpitPreset')
$txtCockpitAccent = $window.FindName('txtCockpitAccent')
$cmbDisplayUnit = $window.FindName('cmbDisplayUnit')
$cmbNavDist = $window.FindName('cmbNavDist')
$txtSocialsInterval = $window.FindName('txtSocialsInterval')

$chkTwitchEnabled = $window.FindName('chkTwitchEnabled')
$txtTwitchChannel = $window.FindName('txtTwitchChannel')
$pwdTwitchToken = $window.FindName('pwdTwitchToken')
$txtTwitchToken = $window.FindName('txtTwitchToken')
$btnToggleTwitchToken = $window.FindName('btnToggleTwitchToken')
$txtTwitchClientId = $window.FindName('txtTwitchClientId')

$chkVkEnabled = $window.FindName('chkVkEnabled')
$txtVkUrl = $window.FindName('txtVkUrl')
$pwdVkToken = $window.FindName('pwdVkToken')
$txtVkToken = $window.FindName('txtVkToken')
$btnToggleVkToken = $window.FindName('btnToggleVkToken')

$txtChatMax = $window.FindName('txtChatMax')
$txtChatLifetime = $window.FindName('txtChatLifetime')
$chkChatHideCommands = $window.FindName('chkChatHideCommands')
$txtChatIgnored = $window.FindName('txtChatIgnored')

$chkCommandsEnabled = $window.FindName('chkCommandsEnabled')
$cmbCbRole = $window.FindName('cmbCbRole')
$cmbHonkRole = $window.FindName('cmbHonkRole')
$txtCbCooldown = $window.FindName('txtCbCooldown')
$txtHonkCooldown = $window.FindName('txtHonkCooldown')
$txtInfoCooldown = $window.FindName('txtInfoCooldown')
$txtUserCooldown = $window.FindName('txtUserCooldown')

$chkEventsEnabled = $window.FindName('chkEventsEnabled')
$chkEventSound = $window.FindName('chkEventSound')
$txtEventSoundVol = $window.FindName('txtEventSoundVol')

$chkMusicEnabled = $window.FindName('chkMusicEnabled')
$txtMusicUrl = $window.FindName('txtMusicUrl')

$chkDaEnabled = $window.FindName('chkDaEnabled')
$pwdDaToken = $window.FindName('pwdDaToken')
$txtDaToken = $window.FindName('txtDaToken')
$btnToggleDaToken = $window.FindName('btnToggleDaToken')

$txtAlertsVol = $window.FindName('txtAlertsVol')
$txtAlertsDuration = $window.FindName('txtAlertsDuration')
$txtAlertsPause = $window.FindName('txtAlertsPause')
$txtMinDonate = $window.FindName('txtMinDonate')
$chkAlertsTts = $window.FindName('chkAlertsTts')
$chkAlertsSynth = $window.FindName('chkAlertsSynth')

$chkUnlockSystem = $window.FindName('chkUnlockSystem')
$panelSystemSettings = $window.FindName('panelSystemSettings')
$chkDebug = $window.FindName('chkDebug')
$chkCheckUpdates = $window.FindName('chkCheckUpdates')

$chkSdkEnabled = $window.FindName('chkSdkEnabled')
$txtSdkUrl = $window.FindName('txtSdkUrl')
$txtSdkPoll = $window.FindName('txtSdkPoll')
$txtSdkStale = $window.FindName('txtSdkStale')
$txtSdkBackoff = $window.FindName('txtSdkBackoff')

$chkObsWsEnabled = $window.FindName('chkObsWsEnabled')
$txtObsWsUrl = $window.FindName('txtObsWsUrl')
$pwdObsWsPass = $window.FindName('pwdObsWsPass')
$txtObsWsPass = $window.FindName('txtObsWsPass')
$btnToggleObsWsPass = $window.FindName('btnToggleObsWsPass')

$txtStatus = $window.FindName('txtStatus')
$btnCancel = $window.FindName('btnCancel')
$btnSave = $window.FindName('btnSave')

$modalOverlay = $window.FindName('modalOverlay')
$btnModalYes = $window.FindName('btnModalYes')
$btnModalNo = $window.FindName('btnModalNo')

# 10. Хелперы выбора ComboBox
function Set-ComboSelectedTag([System.Windows.Controls.ComboBox]$cmb, [string]$tagVal) {
    if (-not $cmb) { return }
    for ($i = 0; $i -lt $cmb.Items.Count; $i++) {
        $item = $cmb.Items[$i]
        if ($item.Tag -eq $tagVal) {
            $cmb.SelectedIndex = $i
            return
        }
    }
    $cmb.SelectedIndex = 0
}

function Get-ComboSelectedTag([System.Windows.Controls.ComboBox]$cmb, [string]$defaultVal = '') {
    if (-not $cmb -or $cmb.SelectedIndex -lt 0) { return $defaultVal }
    $item = $cmb.SelectedItem
    if ($item -and $item.Tag) { return $item.Tag.ToString() }
    return $defaultVal
}

# 11. Загрузка значений из config.js
$rawConfig = Get-ConfigContent

# Тема оформления
$themeVal = Get-TopProp $rawConfig 'cockpitTheme' 'classic'
Set-ComboSelectedTag $cmbCockpitTheme $themeVal

# Рамка веб-камеры
$camAspect = Get-TopProp $rawConfig 'webcamAspect' '4:3'
if ($camAspect -eq '16:9') {
    $rbCam16x9.IsChecked = $true
} else {
    $rbCam4x3.IsChecked = $true
}
$chkWebcamEnabled.IsChecked = ((Get-ScopedProp $rawConfig 'webcam\s*:\s*\{' 'enabled' 'true') -eq 'true')

# Локализация и стилизация
Set-ComboSelectedTag $cmbLang (Get-TopProp $rawConfig 'lang' 'ru')
Set-ComboSelectedTag $cmbCockpitPreset (Get-ScopedProp $rawConfig 'theme\s*:\s*\{' 'cockpitPreset' 'amber')
$txtCockpitAccent.Text = Get-ScopedProp $rawConfig 'theme\s*:\s*\{' 'cockpitAccentColor' ''
Set-ComboSelectedTag $cmbDisplayUnit (Get-ScopedProp $rawConfig 'telemetryApi\s*:\s*\{' 'displayUnit' 'auto')
Set-ComboSelectedTag $cmbNavDist (Get-ScopedProp $rawConfig 'telemetryApi\s*:\s*\{' 'navDistUnit' 'auto')
$txtSocialsInterval.Text = Get-ScopedProp $rawConfig 'socials\s*:\s*\{' 'switchIntervalMs' '9000'

# Twitch
$chkTwitchEnabled.IsChecked = ((Get-ScopedProp $rawConfig 'twitch\s*:\s*\{' 'enabled' 'true') -eq 'true')
$txtTwitchChannel.Text = Get-ScopedProp $rawConfig 'twitch\s*:\s*\{' 'channelName' ''
$pwdTwitchToken.Password = Get-ScopedProp $rawConfig 'twitch\s*:\s*\{' 'oauthToken' ''
$txtTwitchToken.Text = $pwdTwitchToken.Password
$txtTwitchClientId.Text = Get-ScopedProp $rawConfig 'twitch\s*:\s*\{' 'clientId' ''

# VK
$chkVkEnabled.IsChecked = ((Get-ScopedProp $rawConfig 'vk\s*:\s*\{' 'enabled' 'false') -eq 'true')
$txtVkUrl.Text = Get-ScopedProp $rawConfig 'vk\s*:\s*\{' 'channelUrl' ''
$pwdVkToken.Password = Get-ScopedProp $rawConfig 'vk\s*:\s*\{' 'token' ''
$txtVkToken.Text = $pwdVkToken.Password

# Чат
$txtChatMax.Text = Get-ScopedProp $rawConfig 'chat\s*:\s*\{' 'maxMessages' '30'
$txtChatLifetime.Text = Get-ScopedProp $rawConfig 'chat\s*:\s*\{' 'messageLifetimeMs' '0'
$chkChatHideCommands.IsChecked = ((Get-ScopedProp $rawConfig 'chat\s*:\s*\{' 'hideCommands' 'true') -eq 'true')

# Игнорируемые боты (по умолчанию FooZzee_Bot включён)
$loadedBots = Get-ScopedProp $rawConfig 'chat\s*:\s*\{' 'ignoredUsers' ''
if ($loadedBots -match '\[(.*)\]') {
    $cleanBots = $Matches[1] -replace "['`"]", ""
    $txtChatIgnored.Text = $cleanBots.Trim()
} else {
    $txtChatIgnored.Text = 'Nightbot, StreamElements, Moobot, FooZzee_Bot'
}

# Чат-бот и команды
$chkCommandsEnabled.IsChecked = ((Get-ScopedProp $rawConfig 'chatCommands\s*:\s*\{' 'enabled' 'true') -eq 'true')
Set-ComboSelectedTag $cmbCbRole (Get-ScopedProp $rawConfig 'chatCommands\s*:\s*\{' 'cbRadioMinRole' 'follower')
Set-ComboSelectedTag $cmbHonkRole (Get-ScopedProp $rawConfig 'chatCommands\s*:\s*\{' 'honkMinRole' 'vip')
$txtInfoCooldown.Text = Get-ScopedProp $rawConfig 'chatCommands\s*:\s*\{' 'infoCooldownSec' '30'
$txtCbCooldown.Text = Get-ScopedProp $rawConfig 'chatCommands\s*:\s*\{' 'cbCooldownSec' '45'
$txtHonkCooldown.Text = Get-ScopedProp $rawConfig 'chatCommands\s*:\s*\{' 'honkCooldownSec' '60'
$txtUserCooldown.Text = Get-ScopedProp $rawConfig 'chatCommands\s*:\s*\{' 'perUserCooldownSec' '120'

# Водитель и события
$chkEventsEnabled.IsChecked = ((Get-ScopedProp $rawConfig 'ets2\s*:\s*\{' 'eventsEnabled' 'true') -eq 'true')
$chkEventSound.IsChecked = ((Get-ScopedProp $rawConfig 'ets2\s*:\s*\{' 'eventSoundEnabled' 'true') -eq 'true')
$txtEventSoundVol.Text = Get-ScopedProp $rawConfig 'ets2\s*:\s*\{' 'eventSoundVolume' '0.65'

# Music
$chkMusicEnabled.IsChecked = ((Get-ScopedProp $rawConfig 'music\s*:\s*\{' 'enabled' 'true') -eq 'true')
$txtMusicUrl.Text = Get-ScopedProp $rawConfig 'music\s*:\s*\{' 'sourceUrl' ''

# DonationAlerts
$chkDaEnabled.IsChecked = ((Get-ScopedProp $rawConfig 'donationAlerts\s*:\s*\{' 'enabled' 'true') -eq 'true')
$pwdDaToken.Password = Get-ScopedProp $rawConfig 'donationAlerts\s*:\s*\{' 'socketToken' ''
$txtDaToken.Text = $pwdDaToken.Password

# Параметры алертов
$txtAlertsVol.Text = Get-ScopedProp $rawConfig 'alerts\s*:\s*\{' 'volume' '0.65'
$txtAlertsDuration.Text = Get-ScopedProp $rawConfig 'alerts\s*:\s*\{' 'displayDurationMs' '5000'
$txtAlertsPause.Text = Get-ScopedProp $rawConfig 'alerts\s*:\s*\{' 'pauseBetweenMs' '800'
$txtMinDonate.Text = Get-ScopedProp $rawConfig 'alerts\s*:\s*\{' 'minDonateAmount' '50'
$chkAlertsTts.IsChecked = ((Get-ScopedProp $rawConfig 'alerts\s*:\s*\{' 'ttsEnabled' 'true') -eq 'true')
$chkAlertsSynth.IsChecked = ((Get-ScopedProp $rawConfig 'alerts\s*:\s*\{' 'synthFallback' 'true') -eq 'true')

# Системные параметры
$chkDebug.IsChecked = ((Get-TopProp $rawConfig 'debug' 'false') -eq 'true')
$chkCheckUpdates.IsChecked = ((Get-TopProp $rawConfig 'checkUpdates' 'false') -eq 'true')

$chkSdkEnabled.IsChecked = ((Get-ScopedProp $rawConfig 'telemetryApi\s*:\s*\{' 'enabled' 'true') -eq 'true')
$txtSdkUrl.Text = Get-ScopedProp $rawConfig 'telemetryApi\s*:\s*\{' 'url' 'http://127.0.0.1:30002/telemetry'
$txtSdkPoll.Text = Get-ScopedProp $rawConfig 'telemetryApi\s*:\s*\{' 'pollIntervalMs' '300'
$txtSdkStale.Text = Get-ScopedProp $rawConfig 'telemetryApi\s*:\s*\{' 'staleAfterMs' '9000'
$txtSdkBackoff.Text = Get-ScopedProp $rawConfig 'telemetryApi\s*:\s*\{' 'offlineBackoffMaxMs' '15000'

$chkObsWsEnabled.IsChecked = ((Get-ScopedProp $rawConfig 'obsWebSocket\s*:\s*\{' 'enabled' 'false') -eq 'true')
$txtObsWsUrl.Text = Get-ScopedProp $rawConfig 'obsWebSocket\s*:\s*\{' 'url' 'ws://127.0.0.1:4455'
$pwdObsWsPass.Password = Get-ScopedProp $rawConfig 'obsWebSocket\s*:\s*\{' 'password' ''
$txtObsWsPass.Text = $pwdObsWsPass.Password

# 12. Настройка обработчиков ComboBox выбора темы
function Update-ThemeDescription {
    $selTag = Get-ComboSelectedTag $cmbCockpitTheme 'classic'
    $item = $Script:AvailableThemes | Where-Object { $_.Id -eq $selTag } | Select-Object -First 1
    if ($item -and $txtThemeDescription) {
        $txtThemeDescription.Text = "$($item.Desc)"
    }
}

if ($cmbCockpitTheme) {
    $cmbCockpitTheme.Add_SelectionChanged({
        Update-ThemeDescription
    })
    Update-ThemeDescription
}

# Разблокировка системных настроек
$chkUnlockSystem.Add_Checked({
    $panelSystemSettings.IsEnabled = $true
    $txtStatus.Text = '⚠️ Внимание: Редактирование системных параметров разблокировано!'
    $txtStatus.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString('#F87171')
})
$chkUnlockSystem.Add_Unchecked({
    $panelSystemSettings.IsEnabled = $false
    $txtStatus.Text = 'Системные параметры защищены от случайных изменений.'
    $txtStatus.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString('#94A3B8')
})

# Обработчики переключения видимости токенов (кнопки-глазки)
function Setup-PasswordToggle(
    [System.Windows.Controls.PasswordBox]$pwd,
    [System.Windows.Controls.TextBox]$txt,
    [System.Windows.Controls.Button]$btn
) {
    if (-not $pwd -or -not $txt -or -not $btn) { return }

    $pwd.Add_PasswordChanged(({
        try {
            if ($pwd.Visibility -eq [System.Windows.Visibility]::Visible) {
                $txt.Text = $pwd.Password
            }
        } catch {}
    }).GetNewClosure())

    $txt.Add_TextChanged(({
        try {
            if ($txt.Visibility -eq [System.Windows.Visibility]::Visible) {
                $pwd.Password = $txt.Text
            }
        } catch {}
    }).GetNewClosure())

    $btn.Add_Click(({
        try {
            if ($pwd.Visibility -eq [System.Windows.Visibility]::Visible) {
                $txt.Text = $pwd.Password
                $pwd.Visibility = [System.Windows.Visibility]::Collapsed
                $txt.Visibility = [System.Windows.Visibility]::Visible
                $btn.Content = '🙈 Скрыть'
                [void]$txt.Focus()
                $txt.CaretIndex = $txt.Text.Length
            } else {
                $pwd.Password = $txt.Text
                $txt.Visibility = [System.Windows.Visibility]::Collapsed
                $pwd.Visibility = [System.Windows.Visibility]::Visible
                $btn.Content = '👁 Показать'
                [void]$pwd.Focus()
            }
        } catch {
            Write-Warning "Password toggle error: $_"
        }
    }).GetNewClosure())
}

Setup-PasswordToggle $pwdTwitchToken $txtTwitchToken $btnToggleTwitchToken
Setup-PasswordToggle $pwdVkToken $txtVkToken $btnToggleVkToken
Setup-PasswordToggle $pwdDaToken $txtDaToken $btnToggleDaToken
Setup-PasswordToggle $pwdObsWsPass $txtObsWsPass $btnToggleObsWsPass

# 13. Обработчики кнопок Сохранения и Отмены
$btnSave.Add_Click({
    $modalOverlay.Visibility = [System.Windows.Visibility]::Visible
})

$btnModalNo.Add_Click({
    $modalOverlay.Visibility = [System.Windows.Visibility]::Collapsed
})

$btnCancel.Add_Click({
    $window.Close()
})

$btnModalYes.Add_Click({
    try {
        # Синхронизация полей паролей перед сохранением
        if ($txtTwitchToken.Visibility -eq [System.Windows.Visibility]::Visible) { $pwdTwitchToken.Password = $txtTwitchToken.Text }
        if ($txtVkToken.Visibility -eq [System.Windows.Visibility]::Visible) { $pwdVkToken.Password = $txtVkToken.Text }
        if ($txtDaToken.Visibility -eq [System.Windows.Visibility]::Visible) { $pwdDaToken.Password = $txtDaToken.Text }
        if ($txtObsWsPass.Visibility -eq [System.Windows.Visibility]::Visible) { $pwdObsWsPass.Password = $txtObsWsPass.Text }

        # Создание резервной копии config.js.bak
        if (Test-Path -LiteralPath $ConfigPath) {
            $bakPath = $ConfigPath + '.bak'
            Copy-Item -LiteralPath $ConfigPath -Destination $bakPath -Force
        }

        # Базовый текст для обновления
        $content = Get-ConfigContent
        if (-not $content) {
            throw 'Исходный шаблон конфигурации не найден.'
        }

        # 1. Топовые свойства
        $selectedTheme = Get-ComboSelectedTag $cmbCockpitTheme 'classic'
        $content = Set-TopProp $content 'cockpitTheme' "'$selectedTheme'"
        $content = Set-TopProp $content 'lang' "'$(Get-ComboSelectedTag $cmbLang 'ru')'"
        $content = Set-TopProp $content 'debug' $(if ($chkDebug.IsChecked) { 'true' } else { 'false' })
        $content = Set-TopProp $content 'checkUpdates' $(if ($chkCheckUpdates.IsChecked) { 'true' } else { 'false' })

        $selectedAspect = if ($rbCam16x9.IsChecked) { '16:9' } else { '4:3' }
        $content = Set-TopProp $content 'webcamAspect' "'$selectedAspect'"

        # 2. Каналы
        $content = Set-ScopedProp $content 'twitch\s*:\s*\{' 'enabled' $(if ($chkTwitchEnabled.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'twitch\s*:\s*\{' 'channelName' "'$($txtTwitchChannel.Text.Trim())'"
        $content = Set-ScopedProp $content 'twitch\s*:\s*\{' 'oauthToken' "'$($pwdTwitchToken.Password.Trim())'"
        $content = Set-ScopedProp $content 'twitch\s*:\s*\{' 'clientId' "'$($txtTwitchClientId.Text.Trim())'"

        $content = Set-ScopedProp $content 'vk\s*:\s*\{' 'enabled' $(if ($chkVkEnabled.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'vk\s*:\s*\{' 'channelUrl' "'$($txtVkUrl.Text.Trim())'"
        $content = Set-ScopedProp $content 'vk\s*:\s*\{' 'token' "'$($pwdVkToken.Password.Trim())'"

        $content = Set-ScopedProp $content 'donationAlerts\s*:\s*\{' 'enabled' $(if ($chkDaEnabled.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'donationAlerts\s*:\s*\{' 'socketToken' "'$($pwdDaToken.Password.Trim())'"

        $content = Set-ScopedProp $content 'obsWebSocket\s*:\s*\{' 'enabled' $(if ($chkObsWsEnabled.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'obsWebSocket\s*:\s*\{' 'url' "'$($txtObsWsUrl.Text.Trim())'"
        $content = Set-ScopedProp $content 'obsWebSocket\s*:\s*\{' 'password' "'$($pwdObsWsPass.Password.Trim())'"

        # 3. Алерты
        $content = Set-ScopedProp $content 'alerts\s*:\s*\{' 'volume' "$($txtAlertsVol.Text.Trim())"
        $content = Set-ScopedProp $content 'alerts\s*:\s*\{' 'displayDurationMs' "$($txtAlertsDuration.Text.Trim())"
        $content = Set-ScopedProp $content 'alerts\s*:\s*\{' 'pauseBetweenMs' "$($txtAlertsPause.Text.Trim())"
        $content = Set-ScopedProp $content 'alerts\s*:\s*\{' 'minDonateAmount' "$($txtMinDonate.Text.Trim())"
        $content = Set-ScopedProp $content 'alerts\s*:\s*\{' 'ttsEnabled' $(if ($chkAlertsTts.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'alerts\s*:\s*\{' 'synthFallback' $(if ($chkAlertsSynth.IsChecked) { 'true' } else { 'false' })

        # 4. Чат
        $content = Set-ScopedProp $content 'chat\s*:\s*\{' 'maxMessages' "$($txtChatMax.Text.Trim())"
        $content = Set-ScopedProp $content 'chat\s*:\s*\{' 'messageLifetimeMs' "$($txtChatLifetime.Text.Trim())"
        $content = Set-ScopedProp $content 'chat\s*:\s*\{' 'hideCommands' $(if ($chkChatHideCommands.IsChecked) { 'true' } else { 'false' })

        # Игнорируемые боты
        if ($txtChatIgnored -and $txtChatIgnored.Text) {
            $rawBots = $txtChatIgnored.Text -split ','
            $botList = @()
            foreach ($b in $rawBots) {
                $trimmed = $b.Trim()
                if ($trimmed) { $botList += "'$trimmed'" }
            }
            if ($botList.Count -gt 0) {
                $content = Set-ScopedProp $content 'chat\s*:\s*\{' 'ignoredUsers' "[ $($botList -join ', ') ]"
            }
        }

        # 5. Команды чата
        $content = Set-ScopedProp $content 'chatCommands\s*:\s*\{' 'enabled' $(if ($chkCommandsEnabled.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'chatCommands\s*:\s*\{' 'cbRadioMinRole' "'$(Get-ComboSelectedTag $cmbCbRole 'follower')'"
        $content = Set-ScopedProp $content 'chatCommands\s*:\s*\{' 'honkMinRole' "'$(Get-ComboSelectedTag $cmbHonkRole 'vip')'"
        $content = Set-ScopedProp $content 'chatCommands\s*:\s*\{' 'infoCooldownSec' "$($txtInfoCooldown.Text.Trim())"
        $content = Set-ScopedProp $content 'chatCommands\s*:\s*\{' 'cbCooldownSec' "$($txtCbCooldown.Text.Trim())"
        $content = Set-ScopedProp $content 'chatCommands\s*:\s*\{' 'honkCooldownSec' "$($txtHonkCooldown.Text.Trim())"
        $content = Set-ScopedProp $content 'chatCommands\s*:\s*\{' 'perUserCooldownSec' "$($txtUserCooldown.Text.Trim())"

        # 6. Тема и веб-камера
        $content = Set-ScopedProp $content 'theme\s*:\s*\{' 'cockpitPreset' "'$(Get-ComboSelectedTag $cmbCockpitPreset 'amber')'"
        $content = Set-ScopedProp $content 'theme\s*:\s*\{' 'cockpitAccentColor' "'$($txtCockpitAccent.Text.Trim())'"

        $content = Set-ScopedProp $content 'webcam\s*:\s*\{' 'enabled' $(if ($chkWebcamEnabled.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'webcam\s*:\s*\{' 'aspect' "'$selectedAspect'"

        # 7. ETS2 / ATS параметры
        $content = Set-ScopedProp $content 'ets2\s*:\s*\{' 'eventsEnabled' $(if ($chkEventsEnabled.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'ets2\s*:\s*\{' 'eventSoundEnabled' $(if ($chkEventSound.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'ets2\s*:\s*\{' 'eventSoundVolume' "$($txtEventSoundVol.Text.Trim())"

        # 8. Телеметрия SDK
        $content = Set-ScopedProp $content 'telemetryApi\s*:\s*\{' 'enabled' $(if ($chkSdkEnabled.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'telemetryApi\s*:\s*\{' 'url' "'$($txtSdkUrl.Text.Trim())'"
        $content = Set-ScopedProp $content 'telemetryApi\s*:\s*\{' 'pollIntervalMs' "$($txtSdkPoll.Text.Trim())"
        $content = Set-ScopedProp $content 'telemetryApi\s*:\s*\{' 'staleAfterMs' "$($txtSdkStale.Text.Trim())"
        $content = Set-ScopedProp $content 'telemetryApi\s*:\s*\{' 'offlineBackoffMaxMs' "$($txtSdkBackoff.Text.Trim())"
        $content = Set-ScopedProp $content 'telemetryApi\s*:\s*\{' 'displayUnit' "'$(Get-ComboSelectedTag $cmbDisplayUnit 'auto')'"
        $content = Set-ScopedProp $content 'telemetryApi\s*:\s*\{' 'navDistUnit' "'$(Get-ComboSelectedTag $cmbNavDist 'auto')'"

        # 9. Музыка и соцсети
        $content = Set-ScopedProp $content 'music\s*:\s*\{' 'enabled' $(if ($chkMusicEnabled.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'music\s*:\s*\{' 'sourceUrl' "'$($txtMusicUrl.Text.Trim())'"

        $content = Set-ScopedProp $content 'socials\s*:\s*\{' 'switchIntervalMs' "$($txtSocialsInterval.Text.Trim())"

        # Запись в UTF-8
        $utf8Encoding = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($ConfigPath, $content, $utf8Encoding)

        $modalOverlay.Visibility = [System.Windows.Visibility]::Collapsed
        $txtStatus.Text = "✅ Конфигурация успешно сохранена в config.js! Создана копия config.js.bak (Тема: $selectedTheme)"
        $txtStatus.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString('#22C55E')

    } catch {
        $modalOverlay.Visibility = [System.Windows.Visibility]::Collapsed
        $txtStatus.Text = "❌ Ошибка сохранения конфигурации: $_"
        $txtStatus.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString('#EF4444')
    }
})

# 14. Запуск окна
try {
    $window.ShowDialog() | Out-Null
} catch {
    [System.Windows.MessageBox]::Show("Ошибка работы конфигуратора:`n`n$($_.Exception.ToString())", "Ошибка конфигуратора", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Error)
    exit 1
}

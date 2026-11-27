<#
.SYNOPSIS
  WPF Configurator for ETS2 / ATS Stream Overlay Cockpit v0.0.4.
  Copyright (c) 2026 FooZzee. All Rights Reserved. Licensed under Proprietary Freeware License.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

# 1. Надёжное определение пути к скрипту и корню проекта
$ScriptPath = if ($MyInvocation.MyCommand.Path -and (Test-Path -LiteralPath $MyInvocation.MyCommand.Path)) {
    $MyInvocation.MyCommand.Path
} elseif ($PSScriptRoot) {
    Join-Path $PSScriptRoot 'configurator.ps1'
} else {
    Join-Path (Get-Location).Path 'scripts\configurator.ps1'
}

if ([System.Threading.Thread]::CurrentThread.GetApartmentState() -ne [System.Threading.ApartmentState]::STA) {
    Start-Process -FilePath 'powershell.exe' -ArgumentList "-NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File `"$ScriptPath`""
    exit
}

$ScriptDir = Split-Path -Parent $ScriptPath
$ProjectRoot = if (Test-Path (Join-Path $ScriptDir 'ets2-desktop.html')) {
    $ScriptDir
} else {
    Split-Path -Parent $ScriptDir
}

$ConfigPath = Join-Path $ProjectRoot 'config.js'
$ExampleConfigPath = Join-Path $ProjectRoot 'config.example.js'
$IconPath = Join-Path $ProjectRoot 'assets\icons\cockpit-configurator.ico'
$LauncherVbsPath = Join-Path $ProjectRoot 'Configure-Overlay.vbs'
$LauncherBatPath = Join-Path $ProjectRoot 'Configure-Overlay.bat'
$ShortcutName = 'ETS2-ATS Overlay Configurator.lnk'

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

# 2. Функции чтения и безопасной записи config.js
function Get-ConfigContent {
    if (Test-Path -LiteralPath $ConfigPath) {
        return [System.IO.File]::ReadAllText($ConfigPath, [System.Text.Encoding]::UTF8)
    }
    if (Test-Path -LiteralPath $ExampleConfigPath) {
        return [System.IO.File]::ReadAllText($ExampleConfigPath, [System.Text.Encoding]::UTF8)
    }
    return ''
}

function Get-ScopedProp {
    param([string]$Text, [string]$SectionRegex, [string]$PropName, [string]$DefaultVal = '')
    $pattern = "$SectionRegex[^}]*?\b$PropName\s*:\s*(?:'([^']*)'|`"([^`"]*)`"|(\[[^\]]*\])|([^\r\n,}]+))"
    if ($Text -match $pattern) {
        if ($null -ne $Matches[1]) { return $Matches[1] }
        if ($null -ne $Matches[2]) { return $Matches[2] }
        if ($null -ne $Matches[3]) { return $Matches[3] }
        if ($null -ne $Matches[4]) {
            $val = ($Matches[4] -replace '//.*$', '').Trim().TrimEnd(',').Trim()
            return $val
        }
    }
    return $DefaultVal
}

function Get-TopProp {
    param([string]$Text, [string]$PropName, [string]$DefaultVal = '')
    $pattern = "(?m)^\s*$PropName\s*:\s*(?:'([^']*)'|`"([^`"]*)`"|(\[[^\]]*\])|([^\r\n,}]+))"
    if ($Text -match $pattern) {
        if ($null -ne $Matches[1]) { return $Matches[1] }
        if ($null -ne $Matches[2]) { return $Matches[2] }
        if ($null -ne $Matches[3]) { return $Matches[3] }
        if ($null -ne $Matches[4]) {
            $val = ($Matches[4] -replace '//.*$', '').Trim().TrimEnd(',').Trim()
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
    $pattern = "($SectionRegex[^}]*?\b$PropName\s*:\s*)(?:'[^']*'|`"[^`"]*`"|\[[^\]]*\]|[^,\r\n}]+)(,?[^\r\n}]*)"
    if ($Text -match $pattern) {
        return [regex]::Replace($Text, $pattern, "`${1}$NewValue`${2}")
    }
    $insertPattern = "($SectionRegex)(\r?\n)([ \t]*)"
    if ($Text -match $insertPattern) {
        return [regex]::Replace($Text, $insertPattern, "`${1}`${2}`${3}${PropName}: $NewValue,`${2}`${3}", 1)
    }
    $inlineInsertPattern = "($SectionRegex)(\s*)"
    if ($Text -match $inlineInsertPattern) {
        return [regex]::Replace($Text, $inlineInsertPattern, "`${1} ${PropName}: $NewValue, ", 1)
    }
    return $Text
}

function Set-TopProp {
    param([string]$Text, [string]$PropName, [string]$NewValue)
    $pattern = "(?m)^(\s*$PropName\s*:\s*)(?:'[^']*'|`"[^`"]*`"|\[[^\]]*\]|[^,\r\n}]+)(,?[^\r\n}]*)"
    if ($Text -match $pattern) {
        return [regex]::Replace($Text, $pattern, "`${1}$NewValue`${2}")
    }
    if ($Text -match '(?m)(window\.OVERLAY_CONFIG\s*=\s*\{)') {
        return [regex]::Replace($Text, '(?m)(window\.OVERLAY_CONFIG\s*=\s*\{)', "`$1`r`n  ${PropName}: $NewValue,")
    }
    return $Text
}

function Ensure-CommandsSubSection {
    param([string]$Text)
    if ($Text -match 'chatCommands\s*:\s*\{[^}]*?\bcommands\s*:\s*\{') {
        return $Text
    }
    $insertPattern = '(chatCommands\s*:\s*\{)(\r?\n)([ \t]*)'
    if ($Text -match $insertPattern) {
        return [regex]::Replace($Text, $insertPattern, "`${1}`${2}`${3}commands: { honk: true, cb: true, route: true, stats: true, truck: true, driver: true, bet: true },`${2}`${3}", 1)
    }
    $inlinePattern = '(chatCommands\s*:\s*\{)(\s*)'
    if ($Text -match $inlinePattern) {
        return [regex]::Replace($Text, $inlinePattern, "`${1} commands: { honk: true, cb: true, route: true, stats: true, truck: true, driver: true, bet: true }, ", 1)
    }
    return $Text
}

function Set-ConfiguratorDesktopShortcut {
    param(
        [bool]$Create,
        [string]$DesktopDir = [Environment]::GetFolderPath([Environment+SpecialFolder]::DesktopDirectory)
    )
    $lnkPath = Join-Path $DesktopDir $ShortcutName
    if (-not $Create) {
        if (Test-Path -LiteralPath $lnkPath) {
            Remove-Item -LiteralPath $lnkPath -Force -ErrorAction SilentlyContinue
        }
        return $false
    }
    $target = if (Test-Path -LiteralPath $LauncherVbsPath) { $LauncherVbsPath } else { $LauncherBatPath }
    $wsh = New-Object -ComObject WScript.Shell
    $sc = $wsh.CreateShortcut($lnkPath)
    $sc.TargetPath = $target
    $sc.WorkingDirectory = $ProjectRoot
    $sc.Description = 'ETS2 / ATS Stream Overlay Cockpit Configurator'
    if (Test-Path -LiteralPath $IconPath) {
        $sc.IconLocation = "$IconPath,0"
    }
    $sc.Save()
    return (Test-Path -LiteralPath $lnkPath)
}

# 3. XAML-интерфейс с тёмным ControlTemplate для ComboBox
$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="ETS2 / ATS Stream Overlay Cockpit — Конфигуратор v0.0.4"
        Width="880" Height="680"
        MinWidth="820" MinHeight="620"
        WindowStartupLocation="CenterScreen"
        Background="#070A0F"
        Foreground="#F8FAFC"
        FontFamily="Segoe UI">
    <Window.Resources>
        <Style x:Key="CardPanel" TargetType="{x:Type Border}">
            <Setter Property="Background" Value="#0E131B"/>
            <Setter Property="BorderBrush" Value="#1E293B"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="CornerRadius" Value="10"/>
            <Setter Property="Padding" Value="16"/>
            <Setter Property="Margin" Value="0,0,0,12"/>
        </Style>

        <Style x:Key="CardHeader" TargetType="{x:Type TextBlock}">
            <Setter Property="FontSize" Value="12"/>
            <Setter Property="FontWeight" Value="Bold"/>
            <Setter Property="Foreground" Value="#00E5FF"/>
            <Setter Property="Margin" Value="0,0,0,10"/>
        </Style>

        <Style x:Key="FieldLabel" TargetType="{x:Type TextBlock}">
            <Setter Property="FontSize" Value="11.5"/>
            <Setter Property="FontWeight" Value="SemiBold"/>
            <Setter Property="Foreground" Value="#CBD5E1"/>
            <Setter Property="Margin" Value="0,6,0,4"/>
        </Style>

        <Style x:Key="FieldHint" TargetType="{x:Type TextBlock}">
            <Setter Property="FontSize" Value="10.5"/>
            <Setter Property="Foreground" Value="#64748B"/>
            <Setter Property="TextWrapping" Value="Wrap"/>
            <Setter Property="Margin" Value="0,2,0,4"/>
        </Style>

        <Style TargetType="{x:Type TextBox}">
            <Setter Property="Background" Value="#080C14"/>
            <Setter Property="Foreground" Value="#F8FAFC"/>
            <Setter Property="CaretBrush" Value="#00E5FF"/>
            <Setter Property="BorderBrush" Value="#334155"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="8,6"/>
            <Setter Property="FontSize" Value="12"/>
        </Style>

        <Style TargetType="{x:Type PasswordBox}">
            <Setter Property="Background" Value="#080C14"/>
            <Setter Property="Foreground" Value="#F8FAFC"/>
            <Setter Property="CaretBrush" Value="#00E5FF"/>
            <Setter Property="BorderBrush" Value="#334155"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="8,6"/>
            <Setter Property="FontSize" Value="12"/>
        </Style>

        <ControlTemplate x:Key="ComboBoxToggleButton" TargetType="{x:Type ToggleButton}">
            <Grid>
                <Grid.ColumnDefinitions>
                    <ColumnDefinition/>
                    <ColumnDefinition Width="24"/>
                </Grid.ColumnDefinitions>
                <Border x:Name="Border" Grid.ColumnSpan="2" CornerRadius="4" Background="#080C14" BorderBrush="#334155" BorderThickness="1"/>
                <Path x:Name="Arrow" Grid.Column="1" Fill="#94A3B8" HorizontalAlignment="Center" VerticalAlignment="Center" Data="M 0 0 L 4 4 L 8 0 Z"/>
            </Grid>
            <ControlTemplate.Triggers>
                <Trigger Property="IsMouseOver" Value="True">
                    <Setter TargetName="Border" Property="BorderBrush" Value="#00E5FF"/>
                </Trigger>
                <Trigger Property="IsChecked" Value="True">
                    <Setter TargetName="Border" Property="BorderBrush" Value="#00E5FF"/>
                </Trigger>
            </ControlTemplate.Triggers>
        </ControlTemplate>

        <Style TargetType="{x:Type ComboBoxItem}">
            <Setter Property="Background" Value="#0E131B"/>
            <Setter Property="Foreground" Value="#F8FAFC"/>
            <Setter Property="Padding" Value="8,6"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="{x:Type ComboBoxItem}">
                        <Border x:Name="Bd" Background="{TemplateBinding Background}" Padding="{TemplateBinding Padding}">
                            <ContentPresenter/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsHighlighted" Value="True">
                                <Setter TargetName="Bd" Property="Background" Value="#1E293B"/>
                            </Trigger>
                            <Trigger Property="IsSelected" Value="True">
                                <Setter TargetName="Bd" Property="Background" Value="#0C4A6E"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>

        <Style TargetType="{x:Type ComboBox}">
            <Setter Property="Foreground" Value="#F8FAFC"/>
            <Setter Property="Background" Value="#080C14"/>
            <Setter Property="BorderBrush" Value="#334155"/>
            <Setter Property="Padding" Value="8,6"/>
            <Setter Property="FontSize" Value="12"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="{x:Type ComboBox}">
                        <Grid>
                            <ToggleButton Name="ToggleButton" Template="{StaticResource ComboBoxToggleButton}" Grid.Column="2" Focusable="false" IsChecked="{Binding Path=IsDropDownOpen,Mode=TwoWay,RelativeSource={RelativeSource TemplatedParent}}" ClickMode="Press"/>
                            <ContentPresenter Name="ContentSite" IsHitTestVisible="False" Content="{TemplateBinding SelectionBoxItem}" ContentTemplate="{TemplateBinding SelectionBoxItemTemplate}" ContentTemplateSelector="{TemplateBinding ItemTemplateSelector}" Margin="8,6,28,6" VerticalAlignment="Center" HorizontalAlignment="Left"/>
                            <Popup Name="Popup" Placement="Bottom" IsOpen="{TemplateBinding IsDropDownOpen}" AllowsTransparency="True" Focusable="False" PopupAnimation="Slide">
                                <Grid Name="DropDown" SnapsToDevicePixels="True" MinWidth="{TemplateBinding ActualWidth}" MaxHeight="{TemplateBinding MaxDropDownHeight}">
                                    <Border x:Name="DropDownBorder" Background="#0E131B" BorderThickness="1" BorderBrush="#334155" CornerRadius="4"/>
                                    <ScrollViewer Margin="2" SnapsToDevicePixels="True">
                                        <StackPanel IsItemsHost="True" KeyboardNavigation.DirectionalNavigation="Contained"/>
                                    </ScrollViewer>
                                </Grid>
                            </Popup>
                        </Grid>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>

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
    </Window.Resources>

    <Grid Margin="16">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <Border Grid.Row="0" Background="#0E131B" BorderBrush="#1E293B" BorderThickness="1" CornerRadius="10" Padding="14,10" Margin="0,0,0,12">
            <Grid>
                <StackPanel>
                    <TextBlock Text="ETS2 / ATS STREAM OVERLAY COCKPIT" FontSize="16" FontWeight="Bold" Foreground="#F8FAFC"/>
                    <TextBlock Text="Конфигуратор Twitch, DonationAlerts, 3D-чата и команд • Copyright (c) 2026 FooZzee" FontSize="11" Foreground="#94A3B8"/>
                </StackPanel>
                <TextBlock Text="v0.0.4" HorizontalAlignment="Right" VerticalAlignment="Center" FontSize="12" FontWeight="Bold" Foreground="#00E5FF"/>
            </Grid>
        </Border>

        <TabControl Grid.Row="1" Background="Transparent" BorderThickness="0">
            <TabControl.Resources>
                <Style TargetType="{x:Type TabItem}">
                    <Setter Property="Foreground" Value="#94A3B8"/>
                    <Setter Property="FontWeight" Value="Bold"/>
                    <Setter Property="FontSize" Value="12"/>
                    <Setter Property="Template">
                        <Setter.Value>
                            <ControlTemplate TargetType="{x:Type TabItem}">
                                <Border x:Name="Bd" Background="#0E131B" BorderBrush="#1E293B" BorderThickness="1,1,1,0" CornerRadius="6,6,0,0" Padding="14,8" Margin="0,0,4,0">
                                    <ContentPresenter ContentSource="Header"/>
                                </Border>
                                <ControlTemplate.Triggers>
                                    <Trigger Property="IsSelected" Value="True">
                                        <Setter TargetName="Bd" Property="Background" Value="#162032"/>
                                        <Setter TargetName="Bd" Property="BorderBrush" Value="#00E5FF"/>
                                        <Setter Property="Foreground" Value="#00E5FF"/>
                                    </Trigger>
                                </ControlTemplate.Triggers>
                            </ControlTemplate>
                        </Setter.Value>
                    </Setter>
                </Style>
            </TabControl.Resources>

            <!-- Вкладка 1: Twitch, DonationAlerts и HUD -->
            <TabItem Header="TWITCH И DONATIONALERTS">
                <ScrollViewer VerticalScrollBarVisibility="Auto" Padding="0,10,8,0">
                    <StackPanel>
                        <Border Style="{StaticResource CardPanel}">
                            <StackPanel>
                                <TextBlock Text="TWITCH КАНАЛ" Style="{StaticResource CardHeader}"/>
                                <CheckBox x:Name="chkTwitchEnabled" Content="Подключить чат и события Twitch" Style="{StaticResource ToggleSwitchStyle}" Foreground="#F1F5F9" Margin="0,0,0,8"/>
                                <Grid>
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="12"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <StackPanel Grid.Column="0">
                                        <TextBlock Text="Имя канала Twitch:" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtTwitchChannel"/>
                                    </StackPanel>
                                    <StackPanel Grid.Column="2">
                                        <TextBlock Text="Client ID (опционально):" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtTwitchClientId"/>
                                    </StackPanel>
                                </Grid>
                                <TextBlock Text="OAuth-токен Twitch (необязательно для чтения чата):" Style="{StaticResource FieldLabel}"/>
                                <Grid>
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="8"/>
                                        <ColumnDefinition Width="Auto"/>
                                    </Grid.ColumnDefinitions>
                                    <PasswordBox x:Name="pwdTwitchToken" Grid.Column="0"/>
                                    <TextBox x:Name="txtTwitchToken" Grid.Column="0" Visibility="Collapsed"/>
                                    <Button x:Name="btnToggleTwitchToken" Grid.Column="2" Content="Показать" Padding="10,4" Background="#1E293B" Foreground="#E2E8F0" BorderThickness="0"/>
                                </Grid>
                            </StackPanel>
                        </Border>

                        <Border Style="{StaticResource CardPanel}">
                            <StackPanel>
                                <TextBlock Text="DONATIONALERTS" Style="{StaticResource CardHeader}"/>
                                <CheckBox x:Name="chkDaEnabled" Content="Включить оповещения DonationAlerts" Style="{StaticResource ToggleSwitchStyle}" Foreground="#F1F5F9" Margin="0,0,0,8"/>
                                <TextBlock Text="Socket-токен DonationAlerts:" Style="{StaticResource FieldLabel}"/>
                                <Grid>
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="8"/>
                                        <ColumnDefinition Width="Auto"/>
                                    </Grid.ColumnDefinitions>
                                    <PasswordBox x:Name="pwdDaToken" Grid.Column="0"/>
                                    <TextBox x:Name="txtDaToken" Grid.Column="0" Visibility="Collapsed"/>
                                    <Button x:Name="btnToggleDaToken" Grid.Column="2" Content="Показать" Padding="10,4" Background="#1E293B" Foreground="#E2E8F0" BorderThickness="0"/>
                                </Grid>
                                <Grid Margin="0,6,0,0">
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="12"/>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="12"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <StackPanel Grid.Column="0">
                                        <TextBlock Text="Мин. сумма доната (₽):" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtMinDonate"/>
                                    </StackPanel>
                                    <StackPanel Grid.Column="2">
                                        <TextBlock Text="Громкость (0.0–1.0):" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtAlertsVol"/>
                                    </StackPanel>
                                    <StackPanel Grid.Column="4" VerticalAlignment="Bottom" Margin="0,0,0,4">
                                        <CheckBox x:Name="chkAlertsTts" Content="Озвучка TTS" Style="{StaticResource ToggleSwitchStyle}" Foreground="#F1F5F9"/>
                                    </StackPanel>
                                </Grid>
                            </StackPanel>
                        </Border>

                        <Border Style="{StaticResource CardPanel}">
                            <StackPanel>
                                <TextBlock Text="ОСНОВНЫЕ ПАРАМЕТРЫ HUD" Style="{StaticResource CardHeader}"/>
                                <Grid>
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="12"/>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="12"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <StackPanel Grid.Column="0">
                                        <TextBlock Text="Язык оверлея:" Style="{StaticResource FieldLabel}"/>
                                        <ComboBox x:Name="cmbLang">
                                            <ComboBoxItem Content="Русский (ru)" Tag="ru"/>
                                            <ComboBoxItem Content="English (en)" Tag="en"/>
                                        </ComboBox>
                                    </StackPanel>
                                    <StackPanel Grid.Column="2">
                                        <TextBlock Text="Подсветка приборки:" Style="{StaticResource FieldLabel}"/>
                                        <ComboBox x:Name="cmbCockpitPreset">
                                            <ComboBoxItem Content="Янтарная (amber)" Tag="amber"/>
                                            <ComboBoxItem Content="Ледяная (ice)" Tag="ice"/>
                                        </ComboBox>
                                    </StackPanel>
                                    <StackPanel Grid.Column="4">
                                        <TextBlock Text="Формат веб-камеры:" Style="{StaticResource FieldLabel}"/>
                                        <StackPanel Orientation="Horizontal" Margin="0,6,0,0">
                                            <RadioButton x:Name="rbCam4x3" GroupName="grpCam" Content="4:3" Foreground="#F1F5F9" Margin="0,0,16,0"/>
                                            <RadioButton x:Name="rbCam16x9" GroupName="grpCam" Content="16:9" Foreground="#F1F5F9"/>
                                        </StackPanel>
                                    </StackPanel>
                                </Grid>
                            </StackPanel>
                        </Border>
                    </StackPanel>
                </ScrollViewer>
            </TabItem>

            <!-- Вкладка 2: Новый 3D-блок чата, опросник и соцсети -->
            <TabItem Header="3D-БЛОК ЧАТА И ОПРОСНИК">
                <ScrollViewer VerticalScrollBarVisibility="Auto" Padding="0,10,8,0">
                    <StackPanel>
                        <Border Style="{StaticResource CardPanel}">
                            <StackPanel>
                                <TextBlock Text="3D-КАРУСЕЛЬ И ОПРОСНИК «ОЦЕНИТЕ ИГРУ» (!0–!5)" Style="{StaticResource CardHeader}"/>
                                <Grid Margin="0,0,0,8">
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <CheckBox x:Name="chkChatEnabled" Grid.Column="0" Content="Показывать 3D-виджет чата" Style="{StaticResource ToggleSwitchStyle}" Foreground="#F1F5F9"/>
                                    <CheckBox x:Name="chkChatPollEnabled" Grid.Column="1" Content="Включить опросник «ОЦЕНИТЕ ИГРУ»" Style="{StaticResource ToggleSwitchStyle}" Foreground="#F1F5F9"/>
                                </Grid>

                                <TextBlock Text="Название игры для опросника (или 'auto'):" Style="{StaticResource FieldLabel}"/>
                                <TextBox x:Name="txtChatGameTitle"/>
                                <TextBlock Text="Укажите конкретное название игры (имеет приоритет) или 'auto' для автоопределения по ETS2/ATS и Twitch." Style="{StaticResource FieldHint}"/>

                                <Grid Margin="0,4,0,0">
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="12"/>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="12"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <StackPanel Grid.Column="0">
                                        <TextBlock Text="Показ чата (сек):" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtCarouselChatSec"/>
                                    </StackPanel>
                                    <StackPanel Grid.Column="2">
                                        <TextBlock Text="Показ карточки (сек):" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtCarouselCardSec"/>
                                    </StackPanel>
                                    <StackPanel Grid.Column="4">
                                        <TextBlock Text="Лимит строк в DOM:" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtChatMax"/>
                                    </StackPanel>
                                </Grid>

                                <CheckBox x:Name="chkChatHideCommands" Content="Скрывать сообщения-команды с префиксом '!' (голоса !0–!5 всё равно учитываются)" Style="{StaticResource ToggleSwitchStyle}" Foreground="#F1F5F9" Margin="0,10,0,6"/>
                                <TextBlock Text="Игнорируемые боты (через запятую):" Style="{StaticResource FieldLabel}"/>
                                <TextBox x:Name="txtChatIgnored"/>
                            </StackPanel>
                        </Border>

                        <Border Style="{StaticResource CardPanel}">
                            <StackPanel>
                                <TextBlock Text="КАРТОЧКА «НЕ ЗАБУДЬ ПОДПИСАТЬСЯ:»" Style="{StaticResource CardHeader}"/>
                                <Grid>
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="12"/>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="12"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <StackPanel Grid.Column="0">
                                        <TextBlock Text="Telegram:" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtSocialTg"/>
                                    </StackPanel>
                                    <StackPanel Grid.Column="2">
                                        <TextBlock Text="VK:" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtSocialVk"/>
                                    </StackPanel>
                                    <StackPanel Grid.Column="4">
                                        <TextBlock Text="YouTube:" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtSocialYt"/>
                                    </StackPanel>
                                </Grid>
                                <TextBlock Text="Если поля пустые, используются ссылки автора или socials.items из config.js." Style="{StaticResource FieldHint}"/>
                            </StackPanel>
                        </Border>
                    </StackPanel>
                </ScrollViewer>
            </TabItem>

            <!-- Вкладка 3: 7 Команд чата и ярлык -->
            <TabItem Header="7 КОМАНД ЧАТА И ЯРЛЫК">
                <ScrollViewer VerticalScrollBarVisibility="Auto" Padding="0,10,8,0">
                    <StackPanel>
                        <Border Style="{StaticResource CardPanel}">
                            <StackPanel>
                                <TextBlock Text="ИНТЕРАКТИВНЫЕ КОМАНДЫ ЧАТА (7 КОМАНД)" Style="{StaticResource CardHeader}"/>
                                <CheckBox x:Name="chkCommandsEnabled" Content="Включить обработку интерактивных команд чата" Style="{StaticResource ToggleSwitchStyle}" Foreground="#F1F5F9" Margin="0,0,0,10"/>

                                <Grid Margin="0,0,0,10">
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <StackPanel Grid.Column="0">
                                        <CheckBox x:Name="chkCmdHonk" Content="!гудок — Пневмосигнал" Style="{StaticResource ToggleSwitchStyle}" Foreground="#E2E8F0" Margin="0,0,0,6"/>
                                        <CheckBox x:Name="chkCmdCb" Content="!рация — Сообщение в CB-рацию" Style="{StaticResource ToggleSwitchStyle}" Foreground="#E2E8F0" Margin="0,0,0,6"/>
                                        <CheckBox x:Name="chkCmdRoute" Content="!рейс — Текущий маршрут" Style="{StaticResource ToggleSwitchStyle}" Foreground="#E2E8F0" Margin="0,0,0,6"/>
                                        <CheckBox x:Name="chkCmdStats" Content="!стата — Статистика стрима" Style="{StaticResource ToggleSwitchStyle}" Foreground="#E2E8F0"/>
                                    </StackPanel>
                                    <StackPanel Grid.Column="1">
                                        <CheckBox x:Name="chkCmdTruck" Content="!тягач — Параметры тягача" Style="{StaticResource ToggleSwitchStyle}" Foreground="#E2E8F0" Margin="0,0,0,6"/>
                                        <CheckBox x:Name="chkCmdDriver" Content="!водитель — Карточка водителя" Style="{StaticResource ToggleSwitchStyle}" Foreground="#E2E8F0" Margin="0,0,0,6"/>
                                        <CheckBox x:Name="chkCmdBet" Content="!ставка — Ставка на рейс" Style="{StaticResource ToggleSwitchStyle}" Foreground="#E2E8F0"/>
                                    </StackPanel>
                                </Grid>

                                <Grid>
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="12"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <StackPanel Grid.Column="0">
                                        <TextBlock Text="Доступ к !рация:" Style="{StaticResource FieldLabel}"/>
                                        <ComboBox x:Name="cmbCbRole">
                                            <ComboBoxItem Content="Все зрители (all)" Tag="all"/>
                                            <ComboBoxItem Content="Фолловеры (follower)" Tag="follower"/>
                                            <ComboBoxItem Content="Сабскрайберы (subscriber)" Tag="subscriber"/>
                                            <ComboBoxItem Content="VIP и Модераторы (vip)" Tag="vip"/>
                                            <ComboBoxItem Content="Только модераторы (mod)" Tag="mod"/>
                                        </ComboBox>
                                    </StackPanel>
                                    <StackPanel Grid.Column="2">
                                        <TextBlock Text="Доступ к !гудок:" Style="{StaticResource FieldLabel}"/>
                                        <ComboBox x:Name="cmbHonkRole">
                                            <ComboBoxItem Content="Сабскрайберы (subscriber)" Tag="subscriber"/>
                                            <ComboBoxItem Content="VIP и Модераторы (vip)" Tag="vip"/>
                                            <ComboBoxItem Content="Только модераторы (mod)" Tag="mod"/>
                                            <ComboBoxItem Content="Только стример (broadcaster)" Tag="broadcaster"/>
                                        </ComboBox>
                                    </StackPanel>
                                </Grid>

                                <Grid Margin="0,6,0,0">
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="10"/>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="10"/>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="10"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <StackPanel Grid.Column="0">
                                        <TextBlock Text="Инфо (сек):" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtInfoCooldown"/>
                                    </StackPanel>
                                    <StackPanel Grid.Column="2">
                                        <TextBlock Text="!рация (сек):" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtCbCooldown"/>
                                    </StackPanel>
                                    <StackPanel Grid.Column="4">
                                        <TextBlock Text="!гудок (сек):" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtHonkCooldown"/>
                                    </StackPanel>
                                    <StackPanel Grid.Column="6">
                                        <TextBlock Text="На зрителя (сек):" Style="{StaticResource FieldLabel}"/>
                                        <TextBox x:Name="txtUserCooldown"/>
                                    </StackPanel>
                                </Grid>
                            </StackPanel>
                        </Border>

                        <Border Style="{StaticResource CardPanel}">
                            <StackPanel>
                                <TextBlock Text="ЯРЛЫК НА РАБОЧЕМ СТОЛЕ" Style="{StaticResource CardHeader}"/>
                                <CheckBox x:Name="chkDesktopShortcut" Content="Создать / сохранять ярлык «ETS2-ATS Overlay Configurator» на Рабочем столе (с фирменной иконкой)" Style="{StaticResource ToggleSwitchStyle}" Foreground="#F1F5F9"/>
                                <TextBlock Text="При снятии галочки ярлык удаляется с Рабочего стола при сохранении." Style="{StaticResource FieldHint}"/>
                            </StackPanel>
                        </Border>
                    </StackPanel>
                </ScrollViewer>
            </TabItem>
        </TabControl>

        <Grid Grid.Row="2" Margin="0,12,0,0">
            <TextBlock x:Name="txtStatus" Text="Готово к настройке." VerticalAlignment="Center" Foreground="#94A3B8" FontSize="12"/>
            <StackPanel Orientation="Horizontal" HorizontalAlignment="Right">
                <Button x:Name="btnCancel" Content="Закрыть" Padding="18,8" Margin="0,0,10,0" Background="#1E293B" Foreground="#F8FAFC" BorderThickness="0"/>
                <Button x:Name="btnSave" Content="Сохранить в config.js" Padding="20,8" Background="#00E5FF" Foreground="#04121F" FontWeight="Bold" BorderThickness="0"/>
            </StackPanel>
        </Grid>
    </Grid>
</Window>
"@

try {
    $reader = New-Object System.Xml.XmlNodeReader ([xml]$xaml)
    $window = [Windows.Markup.XamlReader]::Load($reader)
} catch {
    [System.Windows.MessageBox]::Show("Ошибка загрузки XAML конфигуратора:`n`n$($_.Exception.ToString())", "Ошибка XAML", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Error)
    exit 1
}

# 4. Привязка контролов
$chkTwitchEnabled = $window.FindName('chkTwitchEnabled')
$txtTwitchChannel = $window.FindName('txtTwitchChannel')
$txtTwitchClientId = $window.FindName('txtTwitchClientId')
$pwdTwitchToken = $window.FindName('pwdTwitchToken')
$txtTwitchToken = $window.FindName('txtTwitchToken')
$btnToggleTwitchToken = $window.FindName('btnToggleTwitchToken')

$chkDaEnabled = $window.FindName('chkDaEnabled')
$pwdDaToken = $window.FindName('pwdDaToken')
$txtDaToken = $window.FindName('txtDaToken')
$btnToggleDaToken = $window.FindName('btnToggleDaToken')
$txtMinDonate = $window.FindName('txtMinDonate')
$txtAlertsVol = $window.FindName('txtAlertsVol')
$chkAlertsTts = $window.FindName('chkAlertsTts')

$cmbLang = $window.FindName('cmbLang')
$cmbCockpitPreset = $window.FindName('cmbCockpitPreset')
$rbCam4x3 = $window.FindName('rbCam4x3')
$rbCam16x9 = $window.FindName('rbCam16x9')

$chkChatEnabled = $window.FindName('chkChatEnabled')
$chkChatPollEnabled = $window.FindName('chkChatPollEnabled')
$txtChatGameTitle = $window.FindName('txtChatGameTitle')
$txtCarouselChatSec = $window.FindName('txtCarouselChatSec')
$txtCarouselCardSec = $window.FindName('txtCarouselCardSec')
$txtChatMax = $window.FindName('txtChatMax')
$chkChatHideCommands = $window.FindName('chkChatHideCommands')
$txtChatIgnored = $window.FindName('txtChatIgnored')
$txtSocialTg = $window.FindName('txtSocialTg')
$txtSocialVk = $window.FindName('txtSocialVk')
$txtSocialYt = $window.FindName('txtSocialYt')

$chkCommandsEnabled = $window.FindName('chkCommandsEnabled')
$chkCmdHonk = $window.FindName('chkCmdHonk')
$chkCmdCb = $window.FindName('chkCmdCb')
$chkCmdRoute = $window.FindName('chkCmdRoute')
$chkCmdStats = $window.FindName('chkCmdStats')
$chkCmdTruck = $window.FindName('chkCmdTruck')
$chkCmdDriver = $window.FindName('chkCmdDriver')
$chkCmdBet = $window.FindName('chkCmdBet')
$cmbCbRole = $window.FindName('cmbCbRole')
$cmbHonkRole = $window.FindName('cmbHonkRole')
$txtInfoCooldown = $window.FindName('txtInfoCooldown')
$txtCbCooldown = $window.FindName('txtCbCooldown')
$txtHonkCooldown = $window.FindName('txtHonkCooldown')
$txtUserCooldown = $window.FindName('txtUserCooldown')
$chkDesktopShortcut = $window.FindName('chkDesktopShortcut')

$txtStatus = $window.FindName('txtStatus')
$btnCancel = $window.FindName('btnCancel')
$btnSave = $window.FindName('btnSave')

function Set-ComboSelectedTag([System.Windows.Controls.ComboBox]$cmb, [string]$tagVal) {
    if (-not $cmb) { return }
    for ($i = 0; $i -lt $cmb.Items.Count; $i++) {
        if ($cmb.Items[$i].Tag -eq $tagVal) { $cmb.SelectedIndex = $i; return }
    }
    $cmb.SelectedIndex = 0
}

function Get-ComboSelectedTag([System.Windows.Controls.ComboBox]$cmb, [string]$defaultVal = '') {
    if (-not $cmb -or $cmb.SelectedIndex -lt 0) { return $defaultVal }
    if ($cmb.SelectedItem -and $cmb.SelectedItem.Tag) { return $cmb.SelectedItem.Tag.ToString() }
    return $defaultVal
}

# 5. Загрузка значений из config.js
$rawConfig = Get-ConfigContent

$chkTwitchEnabled.IsChecked = ((Get-ScopedProp $rawConfig 'twitch\s*:\s*\{' 'enabled' 'true') -eq 'true')
$txtTwitchChannel.Text = Get-ScopedProp $rawConfig 'twitch\s*:\s*\{' 'channelName' ''
$txtTwitchClientId.Text = Get-ScopedProp $rawConfig 'twitch\s*:\s*\{' 'clientId' ''
$pwdTwitchToken.Password = Get-ScopedProp $rawConfig 'twitch\s*:\s*\{' 'oauthToken' ''
$txtTwitchToken.Text = $pwdTwitchToken.Password

$chkDaEnabled.IsChecked = ((Get-ScopedProp $rawConfig 'donationAlerts\s*:\s*\{' 'enabled' 'true') -eq 'true')
$pwdDaToken.Password = Get-ScopedProp $rawConfig 'donationAlerts\s*:\s*\{' 'socketToken' ''
$txtDaToken.Text = $pwdDaToken.Password
$txtMinDonate.Text = Get-ScopedProp $rawConfig 'alerts\s*:\s*\{' 'minDonateAmount' '50'
$txtAlertsVol.Text = Get-ScopedProp $rawConfig 'alerts\s*:\s*\{' 'volume' '0.65'
$chkAlertsTts.IsChecked = ((Get-ScopedProp $rawConfig 'alerts\s*:\s*\{' 'ttsEnabled' 'true') -eq 'true')

Set-ComboSelectedTag $cmbLang (Get-TopProp $rawConfig 'lang' 'ru')
Set-ComboSelectedTag $cmbCockpitPreset (Get-ScopedProp $rawConfig 'theme\s*:\s*\{' 'cockpitPreset' 'amber')
$camAspect = Get-TopProp $rawConfig 'webcamAspect' '4:3'
if ($camAspect -eq '16:9') { $rbCam16x9.IsChecked = $true } else { $rbCam4x3.IsChecked = $true }

$chkChatEnabled.IsChecked = ((Get-ScopedProp $rawConfig 'chat\s*:\s*\{' 'enabled' 'true') -ne 'false')
$chkChatPollEnabled.IsChecked = ((Get-ScopedProp $rawConfig 'chat\s*:\s*\{' 'pollEnabled' 'true') -ne 'false')
$txtChatGameTitle.Text = Get-ScopedProp $rawConfig 'chat\s*:\s*\{' 'gameTitle' 'auto'
$txtCarouselChatSec.Text = Get-ScopedProp $rawConfig 'chat\s*:\s*\{' 'carouselChatSec' '300'
$txtCarouselCardSec.Text = Get-ScopedProp $rawConfig 'chat\s*:\s*\{' 'carouselCardSec' '60'
$txtChatMax.Text = Get-ScopedProp $rawConfig 'chat\s*:\s*\{' 'maxMessages' '30'
$chkChatHideCommands.IsChecked = ((Get-ScopedProp $rawConfig 'chat\s*:\s*\{' 'hideCommands' 'true') -eq 'true')

$loadedBots = Get-ScopedProp $rawConfig 'chat\s*:\s*\{' 'ignoredUsers' ''
if ($loadedBots -match '\[(.*)\]') {
    $txtChatIgnored.Text = ($Matches[1] -replace "['`"]", '').Trim()
} else {
    $txtChatIgnored.Text = 'Nightbot, StreamElements, Moobot'
}

$txtSocialTg.Text = Get-ScopedProp $rawConfig 'socials\s*:\s*\{' 'telegram' ''
$txtSocialVk.Text = Get-ScopedProp $rawConfig 'socials\s*:\s*\{' 'vk' ''
$txtSocialYt.Text = Get-ScopedProp $rawConfig 'socials\s*:\s*\{' 'youtube' ''

$chkCommandsEnabled.IsChecked = ((Get-ScopedProp $rawConfig 'chatCommands\s*:\s*\{' 'enabled' 'true') -ne 'false')
$chkCmdHonk.IsChecked = ((Get-ScopedProp $rawConfig '\bcommands\s*:\s*\{' 'honk' 'true') -ne 'false')
$chkCmdCb.IsChecked = ((Get-ScopedProp $rawConfig '\bcommands\s*:\s*\{' 'cb' 'true') -ne 'false')
$chkCmdRoute.IsChecked = ((Get-ScopedProp $rawConfig '\bcommands\s*:\s*\{' 'route' 'true') -ne 'false')
$chkCmdStats.IsChecked = ((Get-ScopedProp $rawConfig '\bcommands\s*:\s*\{' 'stats' 'true') -ne 'false')
$chkCmdTruck.IsChecked = ((Get-ScopedProp $rawConfig '\bcommands\s*:\s*\{' 'truck' 'true') -ne 'false')
$chkCmdDriver.IsChecked = ((Get-ScopedProp $rawConfig '\bcommands\s*:\s*\{' 'driver' 'true') -ne 'false')
$chkCmdBet.IsChecked = ((Get-ScopedProp $rawConfig '\bcommands\s*:\s*\{' 'bet' 'true') -ne 'false')

Set-ComboSelectedTag $cmbCbRole (Get-ScopedProp $rawConfig 'chatCommands\s*:\s*\{' 'cbRadioMinRole' 'follower')
Set-ComboSelectedTag $cmbHonkRole (Get-ScopedProp $rawConfig 'chatCommands\s*:\s*\{' 'honkMinRole' 'vip')
$txtInfoCooldown.Text = Get-ScopedProp $rawConfig 'chatCommands\s*:\s*\{' 'infoCooldownSec' '30'
$txtCbCooldown.Text = Get-ScopedProp $rawConfig 'chatCommands\s*:\s*\{' 'cbCooldownSec' '45'
$txtHonkCooldown.Text = Get-ScopedProp $rawConfig 'chatCommands\s*:\s*\{' 'honkCooldownSec' '60'
$txtUserCooldown.Text = Get-ScopedProp $rawConfig 'chatCommands\s*:\s*\{' 'perUserCooldownSec' '120'

$desktopLnk = Join-Path ([Environment]::GetFolderPath([Environment+SpecialFolder]::DesktopDirectory)) $ShortcutName
$chkDesktopShortcut.IsChecked = (Test-Path -LiteralPath $desktopLnk)

# 6. Кнопки показа секретов
function Wire-SecretToggle($pwdBox, $txtBox, $btn) {
    $btn.Add_Click({
        if ($pwdBox.Visibility -eq [System.Windows.Visibility]::Visible) {
            $txtBox.Text = $pwdBox.Password
            $pwdBox.Visibility = [System.Windows.Visibility]::Collapsed
            $txtBox.Visibility = [System.Windows.Visibility]::Visible
            $btn.Content = 'Скрыть'
        } else {
            $pwdBox.Password = $txtBox.Text
            $txtBox.Visibility = [System.Windows.Visibility]::Collapsed
            $pwdBox.Visibility = [System.Windows.Visibility]::Visible
            $btn.Content = 'Показать'
        }
    })
}
Wire-SecretToggle $pwdTwitchToken $txtTwitchToken $btnToggleTwitchToken
Wire-SecretToggle $pwdDaToken $txtDaToken $btnToggleDaToken

$btnCancel.Add_Click({ $window.Close() })

# 7. Сохранение в config.js
$btnSave.Add_Click({
    try {
        $content = Get-ConfigContent
        if (-not $content) { throw 'Не найден config.js или config.example.js' }

        if ($txtTwitchToken.Visibility -eq [System.Windows.Visibility]::Visible) { $pwdTwitchToken.Password = $txtTwitchToken.Text }
        if ($txtDaToken.Visibility -eq [System.Windows.Visibility]::Visible) { $pwdDaToken.Password = $txtDaToken.Text }

        $selectedAspect = if ($rbCam16x9.IsChecked) { '16:9' } else { '4:3' }
        $content = Set-TopProp $content 'lang' "'$(Get-ComboSelectedTag $cmbLang 'ru')'"
        $content = Set-TopProp $content 'webcamAspect' "'$selectedAspect'"
        $content = Set-ScopedProp $content 'webcam\s*:\s*\{' 'aspect' "'$selectedAspect'"
        $content = Set-ScopedProp $content 'theme\s*:\s*\{' 'cockpitPreset' "'$(Get-ComboSelectedTag $cmbCockpitPreset 'amber')'"

        $content = Set-ScopedProp $content 'twitch\s*:\s*\{' 'enabled' $(if ($chkTwitchEnabled.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'twitch\s*:\s*\{' 'channelName' "'$($txtTwitchChannel.Text.Trim().Replace("'", "\'"))'"
        $content = Set-ScopedProp $content 'twitch\s*:\s*\{' 'oauthToken' "'$($pwdTwitchToken.Password.Trim().Replace("'", "\'"))'"
        $content = Set-ScopedProp $content 'twitch\s*:\s*\{' 'clientId' "'$($txtTwitchClientId.Text.Trim().Replace("'", "\'"))'"

        $content = Set-ScopedProp $content 'donationAlerts\s*:\s*\{' 'enabled' $(if ($chkDaEnabled.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'donationAlerts\s*:\s*\{' 'socketToken' "'$($pwdDaToken.Password.Trim().Replace("'", "\'"))'"
        $content = Set-ScopedProp $content 'alerts\s*:\s*\{' 'minDonateAmount' "$($txtMinDonate.Text.Trim())"
        $content = Set-ScopedProp $content 'alerts\s*:\s*\{' 'volume' "$($txtAlertsVol.Text.Trim())"
        $content = Set-ScopedProp $content 'alerts\s*:\s*\{' 'ttsEnabled' $(if ($chkAlertsTts.IsChecked) { 'true' } else { 'false' })

        $safeGameTitle = $txtChatGameTitle.Text.Trim().Replace("'", "\'")
        if (-not $safeGameTitle) { $safeGameTitle = 'auto' }
        $chatSec = 300; [void][int]::TryParse($txtCarouselChatSec.Text.Trim(), [ref]$chatSec); if ($chatSec -lt 5) { $chatSec = 300 }
        $cardSec = 60; [void][int]::TryParse($txtCarouselCardSec.Text.Trim(), [ref]$cardSec); if ($cardSec -lt 5) { $cardSec = 60 }

        $content = Set-ScopedProp $content 'chat\s*:\s*\{' 'enabled' $(if ($chkChatEnabled.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'chat\s*:\s*\{' 'pollEnabled' $(if ($chkChatPollEnabled.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content 'chat\s*:\s*\{' 'gameTitle' "'$safeGameTitle'"
        $content = Set-ScopedProp $content 'chat\s*:\s*\{' 'carouselChatSec' "$chatSec"
        $content = Set-ScopedProp $content 'chat\s*:\s*\{' 'carouselCardSec' "$cardSec"
        $content = Set-ScopedProp $content 'chat\s*:\s*\{' 'maxMessages' "$($txtChatMax.Text.Trim())"
        $content = Set-ScopedProp $content 'chat\s*:\s*\{' 'hideCommands' $(if ($chkChatHideCommands.IsChecked) { 'true' } else { 'false' })

        $botList = @()
        foreach ($b in ($txtChatIgnored.Text -split ',')) {
            $t = $b.Trim().Replace("'", "\'")
            if ($t) { $botList += "'$t'" }
        }
        if ($botList.Count -gt 0) {
            $content = Set-ScopedProp $content 'chat\s*:\s*\{' 'ignoredUsers' "[ $($botList -join ', ') ]"
        }

        $content = Set-ScopedProp $content 'socials\s*:\s*\{' 'telegram' "'$($txtSocialTg.Text.Trim().Replace("'", "\'"))'"
        $content = Set-ScopedProp $content 'socials\s*:\s*\{' 'vk' "'$($txtSocialVk.Text.Trim().Replace("'", "\'"))'"
        $content = Set-ScopedProp $content 'socials\s*:\s*\{' 'youtube' "'$($txtSocialYt.Text.Trim().Replace("'", "\'"))'"

        $content = Ensure-CommandsSubSection $content
        $content = Set-ScopedProp $content 'chatCommands\s*:\s*\{' 'enabled' $(if ($chkCommandsEnabled.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content '\bcommands\s*:\s*\{' 'honk' $(if ($chkCmdHonk.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content '\bcommands\s*:\s*\{' 'cb' $(if ($chkCmdCb.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content '\bcommands\s*:\s*\{' 'route' $(if ($chkCmdRoute.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content '\bcommands\s*:\s*\{' 'stats' $(if ($chkCmdStats.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content '\bcommands\s*:\s*\{' 'truck' $(if ($chkCmdTruck.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content '\bcommands\s*:\s*\{' 'driver' $(if ($chkCmdDriver.IsChecked) { 'true' } else { 'false' })
        $content = Set-ScopedProp $content '\bcommands\s*:\s*\{' 'bet' $(if ($chkCmdBet.IsChecked) { 'true' } else { 'false' })

        $content = Set-ScopedProp $content 'chatCommands\s*:\s*\{' 'cbRadioMinRole' "'$(Get-ComboSelectedTag $cmbCbRole 'follower')'"
        $content = Set-ScopedProp $content 'chatCommands\s*:\s*\{' 'honkMinRole' "'$(Get-ComboSelectedTag $cmbHonkRole 'vip')'"
        $content = Set-ScopedProp $content 'chatCommands\s*:\s*\{' 'infoCooldownSec' "$($txtInfoCooldown.Text.Trim())"
        $content = Set-ScopedProp $content 'chatCommands\s*:\s*\{' 'cbCooldownSec' "$($txtCbCooldown.Text.Trim())"
        $content = Set-ScopedProp $content 'chatCommands\s*:\s*\{' 'honkCooldownSec' "$($txtHonkCooldown.Text.Trim())"
        $content = Set-ScopedProp $content 'chatCommands\s*:\s*\{' 'perUserCooldownSec' "$($txtUserCooldown.Text.Trim())"

        [System.IO.File]::WriteAllText($ConfigPath, $content, (New-Object System.Text.UTF8Encoding($false)))
        [void](Set-ConfiguratorDesktopShortcut -Create ([bool]$chkDesktopShortcut.IsChecked))

        $txtStatus.Text = 'Конфигурация успешно сохранена в config.js!'
        $txtStatus.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString('#22C55E')
    } catch {
        $txtStatus.Text = "Ошибка сохранения: $_"
        $txtStatus.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString('#EF4444')
    }
})

try {
    $window.ShowDialog() | Out-Null
} catch {
    [System.Windows.MessageBox]::Show("Ошибка работы конфигуратора:`n`n$($_.Exception.ToString())", "Ошибка конфигуратора", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Error)
    exit 1
}

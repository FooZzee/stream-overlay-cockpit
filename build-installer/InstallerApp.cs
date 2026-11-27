// Copyright (c) 2026 FooZzee. All Rights Reserved. Licensed under Proprietary Freeware License.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Microsoft.Win32;

[assembly: AssemblyTitle("ETS2 / ATS Stream Overlay Cockpit Setup")]
[assembly: AssemblyProduct("ETS2 / ATS Stream Overlay Cockpit")]
[assembly: AssemblyCopyright("Copyright (c) 2026 FooZzee. All Rights Reserved.")]
[assembly: AssemblyVersion("0.0.4.0")]
[assembly: AssemblyFileVersion("0.0.4.0")]

namespace StreamOverlayCockpit.Setup
{
    public static class Program
    {
        internal const string APP_VER = "0.0.4";
        internal const string UNINSTALL_REG_KEY = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\StreamOverlayCockpit";
        private const string SELF_TEST_REG_KEY = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\StreamOverlayCockpit_SelfTest";

        [STAThread]
        public static int Main(string[] args)
        {
            if (args != null && args.Length >= 2 && args[0].Equals("--self-test", StringComparison.OrdinalIgnoreCase))
            {
                string testLang = (args.Length >= 3) ? args[2] : null;
                return RunSelfTest(args[1], testLang);
            }
            if (args != null && args.Length >= 2 && args[0].Equals("--self-test-uninstall", StringComparison.OrdinalIgnoreCase))
            {
                return RunSelfTestUninstall(args[1]);
            }

            bool isUninstallMode = args != null && args.Length >= 1 && args[0].Equals("--uninstall", StringComparison.OrdinalIgnoreCase);
            string initialDir = (isUninstallMode && args.Length >= 2) ? args[1] : null;

            try
            {
                var app = new Application();
                var controller = new SetupController();
                controller.Initialize(isSelfTest: false, targetDir: initialDir, isUninstallMode: isUninstallMode);
                app.Run(controller.Window);
                return 0;
            }
            catch (Exception ex)
            {
                MessageBox.Show("Installer startup error:\n\n" + ex.ToString(), "Installer Error", MessageBoxButton.OK, MessageBoxImage.Error);
                return 1;
            }
        }

        private static int RunSelfTest(string targetDir, string langOverride)
        {
            try
            {
                string fullDir = Path.GetFullPath(targetDir);
                if (Directory.Exists(fullDir)) Directory.Delete(fullDir, true);
                Directory.CreateDirectory(fullDir);
                Console.WriteLine("[" + DateTime.Now.ToString("HH:mm:ss.fff") + "] Starting installer self-test into: " + fullDir);

                var controller = new SetupController();
                controller.Initialize(isSelfTest: true, targetDir: fullDir, isUninstallMode: false, langOverride: langOverride);
                controller.Window.Show();
                controller.Window.UpdateLayout();

                BitmapImage logoBmp = controller.LoadedLogo;
                if (logoBmp == null || logoBmp.PixelWidth <= 0 || logoBmp.PixelHeight <= 0)
                {
                    throw new InvalidOperationException("Embedded resource 'InstallerLogo.png' failed to decode.");
                }
                Console.WriteLine("[" + DateTime.Now.ToString("HH:mm:ss.fff") + "] Embedded logo verified: " + logoBmp.PixelWidth + "x" + logoBmp.PixelHeight);

                int clipped = controller.CountClippedControls();
                Console.WriteLine("[" + DateTime.Now.ToString("HH:mm:ss.fff") + "] CLIPPED_CONTROLS=" + clipped);
                if (clipped > 0)
                {
                    throw new InvalidOperationException("Detected clipped controls in setup window: " + clipped);
                }

                string scDir = Path.Combine(fullDir, "_test_desktop");
                Directory.CreateDirectory(scDir);
                controller.PerformInstallation(
                    fullDir, null, null,
                    createBridgeShortcut: true,
                    createConfigShortcut: true,
                    createUpdateShortcut: true,
                    selectedLang: controller.CurrentLang,
                    shortcutDirOverride: scDir,
                    regSubKey: SELF_TEST_REG_KEY);

                string[] expectedLnks = {
                    "ETS2-ATS Overlay Bridge.lnk",
                    "ETS2-ATS Overlay Configurator.lnk",
                    "ETS2-ATS Overlay Update.lnk"
                };
                foreach (string lnk in expectedLnks)
                {
                    if (!File.Exists(Path.Combine(scDir, lnk)))
                    {
                        throw new InvalidOperationException("Missing shortcut after install: " + lnk);
                    }
                }
                if (!File.Exists(Path.Combine(fullDir, "Uninstall.exe")) || !File.Exists(Path.Combine(fullDir, "config.js")))
                {
                    throw new InvalidOperationException("Missing Uninstall.exe or config.js after self-test install.");
                }

                try { Registry.CurrentUser.DeleteSubKeyTree(SELF_TEST_REG_KEY, false); } catch { }
                controller.Window.Close();

                Console.WriteLine("[" + DateTime.Now.ToString("HH:mm:ss.fff") + "] SELF_TEST=SUCCESS LANG=" + controller.CurrentLang);
                return 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("SELF_TEST_ERROR: " + ex.ToString());
                return 1;
            }
        }

        private static int RunSelfTestUninstall(string targetDir)
        {
            try
            {
                string fullDir = Path.GetFullPath(targetDir);
                if (Directory.Exists(fullDir)) Directory.Delete(fullDir, true);
                Directory.CreateDirectory(fullDir);

                string scDir = Path.Combine(Path.GetDirectoryName(fullDir), "_test_desktop_uninst");
                if (Directory.Exists(scDir)) Directory.Delete(scDir, true);
                Directory.CreateDirectory(scDir);

                var controller = new SetupController();
                controller.Initialize(isSelfTest: true, targetDir: fullDir, isUninstallMode: false, langOverride: "en");
                controller.PerformInstallation(
                    fullDir, null, null,
                    createBridgeShortcut: true,
                    createConfigShortcut: true,
                    createUpdateShortcut: true,
                    selectedLang: "en",
                    shortcutDirOverride: scDir,
                    regSubKey: SELF_TEST_REG_KEY);

                // Проверяем чтение InstallLanguage из реестра
                using (RegistryKey rk = Registry.CurrentUser.OpenSubKey(SELF_TEST_REG_KEY))
                {
                    string savedLang = rk != null ? (rk.GetValue("InstallLanguage") as string) : null;
                    if (!string.Equals(savedLang, "en", StringComparison.OrdinalIgnoreCase))
                    {
                        throw new InvalidOperationException("InstallLanguage not persisted in registry: " + savedLang);
                    }
                }

                // Создаём маркер в config.js и проверяем сохранность при removeConfig: false
                string userCfg = Path.Combine(fullDir, "config.js");
                File.WriteAllText(userCfg, "window.OVERLAY_CONFIG = { lang: 'en' };", Encoding.UTF8);

                controller.PerformUninstall(fullDir, null, null, removeConfig: false, removeShortcuts: true, shortcutDirOverride: scDir, regSubKey: SELF_TEST_REG_KEY);
                if (!File.Exists(userCfg))
                {
                    throw new InvalidOperationException("User config.js was deleted even when removeConfig=false!");
                }
                foreach (string lnk in new[] { "ETS2-ATS Overlay Bridge.lnk", "ETS2-ATS Overlay Configurator.lnk", "ETS2-ATS Overlay Update.lnk" })
                {
                    if (File.Exists(Path.Combine(scDir, lnk)))
                    {
                        throw new InvalidOperationException("Shortcut still exists after uninstall: " + lnk);
                    }
                }

                // Полное удаление с removeConfig: true
                controller.PerformUninstall(fullDir, null, null, removeConfig: true, removeShortcuts: true, shortcutDirOverride: scDir, regSubKey: SELF_TEST_REG_KEY);
                string uninstExe = Path.Combine(fullDir, "Uninstall.exe");
                if (File.Exists(uninstExe)) File.Delete(uninstExe);
                if (Directory.Exists(fullDir) && Directory.GetFileSystemEntries(fullDir).Length == 0)
                {
                    Directory.Delete(fullDir, false);
                }
                if (Directory.Exists(fullDir))
                {
                    throw new InvalidOperationException("Target directory still exists after full uninstall: " + fullDir);
                }
                if (Directory.Exists(scDir)) Directory.Delete(scDir, true);

                Console.WriteLine("SELF_TEST_UNINSTALL=SUCCESS");
                return 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("SELF_TEST_UNINSTALL_ERROR: " + ex.ToString());
                return 1;
            }
        }
    }

    public class SetupController
    {
        public Window Window { get; private set; }
        public TextBox txtInstallDir { get; private set; }
        public CheckBox chkEts2 { get; private set; }
        public TextBox txtEts2Path { get; private set; }
        public CheckBox chkAts { get; private set; }
        public TextBox txtAtsPath { get; private set; }
        public CheckBox chkScBridge { get; private set; }
        public CheckBox chkScConfig { get; private set; }
        public CheckBox chkScUpdate { get; private set; }
        public CheckBox chkRemoveConfig { get; private set; }
        public ProgressBar progressBar { get; private set; }
        public TextBlock txtStatus { get; private set; }
        public Button btnInstall { get; private set; }
        public Button btnUninstall { get; private set; }
        public Button btnCancel { get; private set; }
        public Button btnLangRu { get; private set; }
        public Button btnLangEn { get; private set; }
        public BitmapImage LoadedLogo { get; private set; }
        public string CurrentLang { get; private set; }

        private TextBlock lblSecDir;
        private TextBlock lblSecPlugins;
        private TextBlock lblSecShortcuts;
        private Button btnBrowseDir;
        private bool _isUninstallMode;

        private static readonly Dictionary<string, Dictionary<string, string>> I18n = new Dictionary<string, Dictionary<string, string>>
        {
            {
                "ru", new Dictionary<string, string>
                {
                    { "WindowTitle", "ETS2 / ATS Stream Overlay Cockpit — Установка v" + Program.APP_VER },
                    { "HeaderSub", "Copyright (c) 2026 FooZzee. All Rights Reserved. Proprietary Freeware License." },
                    { "SecDir", "1. ПАПКА УСТАНОВКИ" },
                    { "Browse", "Обзор..." },
                    { "SecPlugins", "2. ПЛАГИН ТЕЛЕМЕТРИИ SCS SDK 1.16 (overlayobs_foozzee_telemetry.dll)" },
                    { "ChkEts2", "Установить плагин в Euro Truck Simulator 2" },
                    { "ChkAts", "Установить плагин в American Truck Simulator" },
                    { "SecShortcuts", "3. ЯРЛЫКИ НА РАБОЧЕМ СТОЛЕ И УДАЛЕНИЕ" },
                    { "ScBridge", "Ярлык «Overlay Bridge» (телеметрия)" },
                    { "ScConfig", "Ярлык «Overlay Configurator» (настройки)" },
                    { "ScUpdate", "Ярлык «Overlay Update» (обновление)" },
                    { "RemoveCfg", "При удалении также удалить пользовательский config.js" },
                    { "ReadyInstall", "Готово к установке (язык оверлея: Русский)." },
                    { "ReadyUninstall", "Режим удаления оверлея. Нажмите «Удалить оверлей» для деинсталляции." },
                    { "BtnUninstall", "Удалить оверлей" },
                    { "BtnCancel", "Закрыть" },
                    { "BtnInstall", "Установить" },
                    { "MsgDoneTitle", "Установка завершена" },
                    { "MsgDoneBody", "Установка ETS2 / ATS Stream Overlay Cockpit v" + Program.APP_VER + " завершена!\n\nЯзык: Русский\nПуть: " },
                    { "MsgErrTitle", "Ошибка" },
                    { "MsgUninstConfirmTitle", "Подтверждение удаления" },
                    { "MsgUninstConfirmBody", "Удалить ETS2 / ATS Stream Overlay Cockpit из:\n" },
                    { "MsgUninstDoneTitle", "Удаление завершено" },
                    { "MsgUninstDoneBody", "Оверлей успешно удалён." },
                    { "ProgUnpack", "Распаковка файлов оверлея..." },
                    { "ProgConfig", "Настройка языка и config.js..." },
                    { "ProgPlugin", "Установка плагина телеметрии..." },
                    { "ProgShortcuts", "Создание ярлыков на Рабочем столе..." },
                    { "ProgRegister", "Регистрация деинсталлятора..." },
                    { "ProgDone", "Установка завершена!" },
                    { "ProgUninstFiles", "Удаление файлов оверлея..." },
                    { "ProgUninstDone", "Удаление завершено." }
                }
            },
            {
                "en", new Dictionary<string, string>
                {
                    { "WindowTitle", "ETS2 / ATS Stream Overlay Cockpit — Setup v" + Program.APP_VER },
                    { "HeaderSub", "Copyright (c) 2026 FooZzee. All Rights Reserved. Proprietary Freeware License." },
                    { "SecDir", "1. INSTALLATION FOLDER" },
                    { "Browse", "Browse..." },
                    { "SecPlugins", "2. NATIVE SCS SDK 1.16 TELEMETRY PLUGIN (overlayobs_foozzee_telemetry.dll)" },
                    { "ChkEts2", "Install plugin for Euro Truck Simulator 2" },
                    { "ChkAts", "Install plugin for American Truck Simulator" },
                    { "SecShortcuts", "3. DESKTOP SHORTCUTS & UNINSTALL" },
                    { "ScBridge", "Shortcut «Overlay Bridge» (telemetry)" },
                    { "ScConfig", "Shortcut «Overlay Configurator» (settings)" },
                    { "ScUpdate", "Shortcut «Overlay Update» (updater)" },
                    { "RemoveCfg", "Also remove user config.js during uninstall" },
                    { "ReadyInstall", "Ready to install (overlay language: English)." },
                    { "ReadyUninstall", "Uninstall mode. Click «Uninstall Overlay» to remove files." },
                    { "BtnUninstall", "Uninstall Overlay" },
                    { "BtnCancel", "Close" },
                    { "BtnInstall", "Install" },
                    { "MsgDoneTitle", "Installation Complete" },
                    { "MsgDoneBody", "ETS2 / ATS Stream Overlay Cockpit v" + Program.APP_VER + " installed successfully!\n\nLanguage: English\nPath: " },
                    { "MsgErrTitle", "Error" },
                    { "MsgUninstConfirmTitle", "Confirm Uninstall" },
                    { "MsgUninstConfirmBody", "Uninstall ETS2 / ATS Stream Overlay Cockpit from:\n" },
                    { "MsgUninstDoneTitle", "Uninstall Complete" },
                    { "MsgUninstDoneBody", "Overlay has been removed." },
                    { "ProgUnpack", "Extracting overlay files..." },
                    { "ProgConfig", "Configuring language and config.js..." },
                    { "ProgPlugin", "Installing telemetry plugin..." },
                    { "ProgShortcuts", "Creating desktop shortcuts..." },
                    { "ProgRegister", "Registering uninstaller..." },
                    { "ProgDone", "Installation complete!" },
                    { "ProgUninstFiles", "Removing overlay files..." },
                    { "ProgUninstDone", "Uninstall complete." }
                }
            }
        };

        private string T(string key)
        {
            Dictionary<string, string> dict;
            if (I18n.TryGetValue(CurrentLang ?? "ru", out dict) && dict.ContainsKey(key)) return dict[key];
            return I18n["ru"][key];
        }

        private static BitmapImage LoadEmbeddedLogo()
        {
            try
            {
                Assembly asm = Assembly.GetExecutingAssembly();
                using (Stream s = asm.GetManifestResourceStream("InstallerLogo.png"))
                {
                    if (s == null) return null;
                    var bmp = new BitmapImage();
                    bmp.BeginInit();
                    bmp.CacheOption = BitmapCacheOption.OnLoad;
                    bmp.StreamSource = s;
                    bmp.EndInit();
                    bmp.Freeze();
                    return bmp;
                }
            }
            catch
            {
                return null;
            }
        }

        public int CountClippedControls()
        {
            if (Window == null) return 0;
            var root = Window.Content as FrameworkElement;
            if (root == null) return 0;
            int clipped = 0;
            double maxW = root.ActualWidth;
            double maxH = root.ActualHeight;
            var queue = new Queue<DependencyObject>();
            queue.Enqueue(root);
            while (queue.Count > 0)
            {
                var cur = queue.Dequeue();
                int count = VisualTreeHelper.GetChildrenCount(cur);
                for (int i = 0; i < count; i++)
                {
                    var child = VisualTreeHelper.GetChild(cur, i);
                    queue.Enqueue(child);
                    var fe = child as FrameworkElement;
                    if (fe != null && fe.Visibility == Visibility.Visible && fe.ActualWidth > 0 && fe.ActualHeight > 0)
                    {
                        Point pt = fe.TransformToAncestor(root).Transform(new Point(0, 0));
                        if (pt.X < -1 || pt.Y < -1 || pt.X + fe.ActualWidth > maxW + 2 || pt.Y + fe.ActualHeight > maxH + 2)
                        {
                            clipped++;
                        }
                    }
                }
            }
            return clipped;
        }

        private static string DetectInitialLanguage(bool isUninstallMode, string langOverride)
        {
            if (!string.IsNullOrEmpty(langOverride))
            {
                return langOverride.Trim().ToLowerInvariant() == "en" ? "en" : "ru";
            }
            if (isUninstallMode)
            {
                try
                {
                    using (RegistryKey rk = Registry.CurrentUser.OpenSubKey(Program.UNINSTALL_REG_KEY))
                    {
                        string regLang = rk != null ? (rk.GetValue("InstallLanguage") as string) : null;
                        if (!string.IsNullOrEmpty(regLang))
                        {
                            return regLang.Trim().ToLowerInvariant() == "en" ? "en" : "ru";
                        }
                    }
                }
                catch { }
            }
            return CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.Equals("ru", StringComparison.OrdinalIgnoreCase) ? "ru" : "en";
        }

        public void ApplyLanguage(string lang)
        {
            CurrentLang = (lang == "en") ? "en" : "ru";
            if (Window == null) return;

            Window.Title = T("WindowTitle");
            if (lblSecDir != null) lblSecDir.Text = T("SecDir");
            if (btnBrowseDir != null) btnBrowseDir.Content = T("Browse");
            if (lblSecPlugins != null) lblSecPlugins.Text = T("SecPlugins");
            if (chkEts2 != null) chkEts2.Content = T("ChkEts2");
            if (chkAts != null) chkAts.Content = T("ChkAts");
            if (lblSecShortcuts != null) lblSecShortcuts.Text = T("SecShortcuts");
            if (chkScBridge != null) chkScBridge.Content = T("ScBridge");
            if (chkScConfig != null) chkScConfig.Content = T("ScConfig");
            if (chkScUpdate != null) chkScUpdate.Content = T("ScUpdate");
            if (chkRemoveConfig != null) chkRemoveConfig.Content = T("RemoveCfg");
            if (btnUninstall != null) btnUninstall.Content = T("BtnUninstall");
            if (btnCancel != null) btnCancel.Content = T("BtnCancel");
            if (btnInstall != null) btnInstall.Content = T("BtnInstall");
            if (txtStatus != null) txtStatus.Text = _isUninstallMode ? T("ReadyUninstall") : T("ReadyInstall");

            var activeBg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#00E5FF"));
            var activeFg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#04121F"));
            var inactiveBg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B"));
            var inactiveFg = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#94A3B8"));

            if (btnLangRu != null && btnLangEn != null)
            {
                bool isRu = (CurrentLang == "ru");
                btnLangRu.Background = isRu ? activeBg : inactiveBg;
                btnLangRu.Foreground = isRu ? activeFg : inactiveFg;
                btnLangEn.Background = !isRu ? activeBg : inactiveBg;
                btnLangEn.Foreground = !isRu ? activeFg : inactiveFg;
            }
        }

        public void Initialize(bool isSelfTest, string targetDir, bool isUninstallMode, string langOverride = null)
        {
            _isUninstallMode = isUninstallMode;
            CurrentLang = DetectInitialLanguage(isUninstallMode, langOverride);

            string xaml = @"
<Window xmlns='http://schemas.microsoft.com/winfx/2006/xaml/presentation'
        xmlns:x='http://schemas.microsoft.com/winfx/2006/xaml'
        Title='ETS2 / ATS Stream Overlay Cockpit — Setup v" + Program.APP_VER + @"'
        Width='690' SizeToContent='Height'
        WindowStartupLocation='CenterScreen'
        ResizeMode='CanMinimize'
        Background='#070A0F'
        Foreground='#F8FAFC'
        FontFamily='Segoe UI'>
    <Grid Margin='18'>
        <Grid.RowDefinitions>
            <RowDefinition Height='Auto'/>
            <RowDefinition Height='Auto'/>
            <RowDefinition Height='Auto'/>
            <RowDefinition Height='Auto'/>
        </Grid.RowDefinitions>

        <Border Grid.Row='0' Background='#0E131B' BorderBrush='#1E293B' BorderThickness='1' CornerRadius='10' Padding='14,12' Margin='0,0,0,12'>
            <Grid>
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width='Auto'/>
                    <ColumnDefinition Width='*'/>
                    <ColumnDefinition Width='Auto'/>
                </Grid.ColumnDefinitions>
                <Image x:Name='imgHeaderLogo' Grid.Column='0' Width='48' Height='48' Stretch='Uniform' VerticalAlignment='Center' Margin='0,0,14,0' SnapsToDevicePixels='True' Visibility='Collapsed'/>
                <StackPanel Grid.Column='1' VerticalAlignment='Center'>
                    <TextBlock Text='ETS2 / ATS STREAM OVERLAY COCKPIT' FontSize='16' FontWeight='Bold' Foreground='#F8FAFC'/>
                    <TextBlock Text='Copyright (c) 2026 FooZzee. All Rights Reserved. Proprietary Freeware License.' FontSize='11' Foreground='#94A3B8'/>
                </StackPanel>
                <StackPanel Grid.Column='2' Orientation='Horizontal' VerticalAlignment='Center' Margin='10,0,0,0'>
                    <Button x:Name='btnLangRu' Content='Русский' Padding='8,4' Margin='0,0,4,0' FontSize='11' FontWeight='Bold' BorderThickness='0' Cursor='Hand'/>
                    <Button x:Name='btnLangEn' Content='English' Padding='8,4' Margin='0,0,10,0' FontSize='11' FontWeight='Bold' BorderThickness='0' Cursor='Hand'/>
                    <TextBlock Text='v" + Program.APP_VER + @"' VerticalAlignment='Center' FontSize='12' FontWeight='Bold' Foreground='#00E5FF'/>
                </StackPanel>
            </Grid>
        </Border>

        <StackPanel Grid.Row='1'>
            <Border Background='#0E131B' BorderBrush='#1E293B' BorderThickness='1' CornerRadius='10' Padding='14' Margin='0,0,0,10'>
                <StackPanel>
                    <TextBlock x:Name='lblSecDir' Text='1. ПАПКА УСТАНОВКИ' FontSize='11.5' FontWeight='Bold' Foreground='#00E5FF' Margin='0,0,0,6'/>
                    <Grid>
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width='*'/>
                            <ColumnDefinition Width='8'/>
                            <ColumnDefinition Width='Auto'/>
                        </Grid.ColumnDefinitions>
                        <TextBox x:Name='txtInstallDir' Grid.Column='0' Background='#080C14' Foreground='#F8FAFC' BorderBrush='#334155' Padding='8,6'/>
                        <Button x:Name='btnBrowseDir' Grid.Column='2' Content='Обзор...' Padding='12,6' Background='#1E293B' Foreground='#F8FAFC' BorderThickness='0'/>
                    </Grid>
                </StackPanel>
            </Border>

            <Border Background='#0E131B' BorderBrush='#1E293B' BorderThickness='1' CornerRadius='10' Padding='14' Margin='0,0,0,10'>
                <StackPanel>
                    <TextBlock x:Name='lblSecPlugins' Text='2. ПЛАГИН ТЕЛЕМЕТРИИ SCS SDK 1.16 (overlayobs_foozzee_telemetry.dll)' FontSize='11.5' FontWeight='Bold' Foreground='#00E5FF' Margin='0,0,0,6'/>
                    <CheckBox x:Name='chkEts2' Content='Установить плагин в Euro Truck Simulator 2' Foreground='#F1F5F9' Margin='0,0,0,4'/>
                    <TextBox x:Name='txtEts2Path' Background='#080C14' Foreground='#CBD5E1' BorderBrush='#334155' Padding='6,4' Margin='0,0,0,8'/>
                    <CheckBox x:Name='chkAts' Content='Установить плагин в American Truck Simulator' Foreground='#F1F5F9' Margin='0,0,0,4'/>
                    <TextBox x:Name='txtAtsPath' Background='#080C14' Foreground='#CBD5E1' BorderBrush='#334155' Padding='6,4'/>
                </StackPanel>
            </Border>

            <Border Background='#0E131B' BorderBrush='#1E293B' BorderThickness='1' CornerRadius='10' Padding='14'>
                <StackPanel>
                    <TextBlock x:Name='lblSecShortcuts' Text='3. ЯРЛЫКИ НА РАБОЧЕМ СТОЛЕ И УДАЛЕНИЕ' FontSize='11.5' FontWeight='Bold' Foreground='#00E5FF' Margin='0,0,0,6'/>
                    <CheckBox x:Name='chkScBridge' Content='Ярлык «Overlay Bridge» (телеметрия)' Foreground='#F1F5F9' IsChecked='True' Margin='0,0,0,4'/>
                    <CheckBox x:Name='chkScConfig' Content='Ярлык «Overlay Configurator» (настройки)' Foreground='#F1F5F9' IsChecked='True' Margin='0,0,0,4'/>
                    <CheckBox x:Name='chkScUpdate' Content='Ярлык «Overlay Update» (обновление)' Foreground='#F1F5F9' IsChecked='True' Margin='0,0,0,8'/>
                    <CheckBox x:Name='chkRemoveConfig' Content='При удалении также удалить пользовательский config.js' Foreground='#94A3B8' IsChecked='False'/>
                </StackPanel>
            </Border>
        </StackPanel>

        <StackPanel Grid.Row='2' Margin='0,10,0,10'>
            <ProgressBar x:Name='progressBar' Height='8' Minimum='0' Maximum='100' Value='0' Background='#0E131B' Foreground='#00E5FF' BorderThickness='0'/>
            <TextBlock x:Name='txtStatus' Text='Готово к установке.' FontSize='11.5' Foreground='#94A3B8' Margin='0,6,0,0'/>
        </StackPanel>

        <Grid Grid.Row='3'>
            <Button x:Name='btnUninstall' Content='Удалить оверлей' HorizontalAlignment='Left' Padding='14,8' Background='#3B0D12' Foreground='#FCA5A5' BorderThickness='0'/>
            <StackPanel Orientation='Horizontal' HorizontalAlignment='Right'>
                <Button x:Name='btnCancel' Content='Закрыть' Padding='16,8' Margin='0,0,8,0' Background='#1E293B' Foreground='#F8FAFC' BorderThickness='0'/>
                <Button x:Name='btnInstall' Content='Установить' Padding='20,8' Background='#00E5FF' Foreground='#04121F' FontWeight='Bold' BorderThickness='0'/>
            </StackPanel>
        </Grid>
    </Grid>
</Window>";

            Window = (Window)XamlReader.Parse(xaml);
            var imgHeaderLogo = (Image)Window.FindName("imgHeaderLogo");
            LoadedLogo = LoadEmbeddedLogo();
            if (imgHeaderLogo != null && LoadedLogo != null)
            {
                imgHeaderLogo.Source = LoadedLogo;
                imgHeaderLogo.Visibility = Visibility.Visible;
                RenderOptions.SetBitmapScalingMode(imgHeaderLogo, BitmapScalingMode.HighQuality);
            }

            lblSecDir = (TextBlock)Window.FindName("lblSecDir");
            lblSecPlugins = (TextBlock)Window.FindName("lblSecPlugins");
            lblSecShortcuts = (TextBlock)Window.FindName("lblSecShortcuts");
            txtInstallDir = (TextBox)Window.FindName("txtInstallDir");
            btnBrowseDir = (Button)Window.FindName("btnBrowseDir");
            chkEts2 = (CheckBox)Window.FindName("chkEts2");
            txtEts2Path = (TextBox)Window.FindName("txtEts2Path");
            chkAts = (CheckBox)Window.FindName("chkAts");
            txtAtsPath = (TextBox)Window.FindName("txtAtsPath");
            chkScBridge = (CheckBox)Window.FindName("chkScBridge");
            chkScConfig = (CheckBox)Window.FindName("chkScConfig");
            chkScUpdate = (CheckBox)Window.FindName("chkScUpdate");
            chkRemoveConfig = (CheckBox)Window.FindName("chkRemoveConfig");
            progressBar = (ProgressBar)Window.FindName("progressBar");
            txtStatus = (TextBlock)Window.FindName("txtStatus");
            btnInstall = (Button)Window.FindName("btnInstall");
            btnUninstall = (Button)Window.FindName("btnUninstall");
            btnCancel = (Button)Window.FindName("btnCancel");
            btnLangRu = (Button)Window.FindName("btnLangRu");
            btnLangEn = (Button)Window.FindName("btnLangEn");

            txtInstallDir.Text = string.IsNullOrEmpty(targetDir) ? @"C:\Stream_Overlay_Cockpit" : targetDir;
            string ets2Detected = DetectGamePath("Euro Truck Simulator 2");
            string atsDetected = DetectGamePath("American Truck Simulator");
            txtEts2Path.Text = ets2Detected ?? "";
            chkEts2.IsChecked = !string.IsNullOrEmpty(ets2Detected);
            txtAtsPath.Text = atsDetected ?? "";
            chkAts.IsChecked = !string.IsNullOrEmpty(atsDetected);

            ApplyLanguage(CurrentLang);

            btnLangRu.Click += (s, e) => ApplyLanguage("ru");
            btnLangEn.Click += (s, e) => ApplyLanguage("en");

            btnBrowseDir.Click += (s, e) =>
            {
                using (var dlg = new System.Windows.Forms.FolderBrowserDialog())
                {
                    dlg.SelectedPath = txtInstallDir.Text;
                    if (dlg.ShowDialog() == System.Windows.Forms.DialogResult.OK)
                    {
                        txtInstallDir.Text = dlg.SelectedPath;
                    }
                }
            };

            btnCancel.Click += (s, e) => Window.Close();

            btnInstall.Click += (s, e) =>
            {
                try
                {
                    btnInstall.IsEnabled = false;
                    string dir = txtInstallDir.Text.Trim();
                    PerformInstallation(
                        dir,
                        chkEts2.IsChecked == true ? txtEts2Path.Text.Trim() : null,
                        chkAts.IsChecked == true ? txtAtsPath.Text.Trim() : null,
                        chkScBridge.IsChecked == true,
                        chkScConfig.IsChecked == true,
                        chkScUpdate.IsChecked == true,
                        CurrentLang);
                    MessageBox.Show(T("MsgDoneBody") + dir, T("MsgDoneTitle"), MessageBoxButton.OK, MessageBoxImage.Information);
                    Window.Close();
                }
                catch (Exception ex)
                {
                    btnInstall.IsEnabled = true;
                    MessageBox.Show(ex.ToString(), T("MsgErrTitle"), MessageBoxButton.OK, MessageBoxImage.Error);
                }
            };

            btnUninstall.Click += (s, e) =>
            {
                try
                {
                    string dir = txtInstallDir.Text.Trim();
                    if (MessageBox.Show(T("MsgUninstConfirmBody") + dir + "?", T("MsgUninstConfirmTitle"), MessageBoxButton.YesNo, MessageBoxImage.Question) != MessageBoxResult.Yes)
                    {
                        return;
                    }
                    PerformUninstall(
                        dir,
                        txtEts2Path.Text.Trim(),
                        txtAtsPath.Text.Trim(),
                        chkRemoveConfig.IsChecked == true,
                        removeShortcuts: true);

                    string uninstExe = Path.Combine(dir, "Uninstall.exe");
                    string selfExe = Assembly.GetExecutingAssembly().Location;
                    if (!string.IsNullOrEmpty(selfExe) && string.Equals(Path.GetFullPath(selfExe), Path.GetFullPath(uninstExe), StringComparison.OrdinalIgnoreCase))
                    {
                        var psi = new ProcessStartInfo("cmd.exe", "/c ping 127.0.0.1 -n 2 > nul & del /f /q \"" + uninstExe + "\" & rmdir \"" + dir + "\"")
                        {
                            CreateNoWindow = true,
                            UseShellExecute = false
                        };
                        Process.Start(psi);
                    }
                    else
                    {
                        if (File.Exists(uninstExe)) File.Delete(uninstExe);
                        if (Directory.Exists(dir) && Directory.GetFileSystemEntries(dir).Length == 0) Directory.Delete(dir, false);
                    }
                    MessageBox.Show(T("MsgUninstDoneBody"), T("MsgUninstDoneTitle"), MessageBoxButton.OK, MessageBoxImage.Information);
                    Window.Close();
                }
                catch (Exception ex)
                {
                    MessageBox.Show(ex.ToString(), T("MsgErrTitle"), MessageBoxButton.OK, MessageBoxImage.Error);
                }
            };
        }

        private void UpdateProgress(int val, string msg)
        {
            if (progressBar != null) progressBar.Value = val;
            if (txtStatus != null) txtStatus.Text = msg;
        }

        private static string DetectGamePath(string gameFolder)
        {
            string[] candidates = {
                @"C:\Program Files (x86)\Steam\steamapps\common\" + gameFolder,
                @"D:\SteamLibrary\steamapps\common\" + gameFolder,
                @"E:\SteamLibrary\steamapps\common\" + gameFolder
            };
            foreach (string c in candidates)
            {
                if (Directory.Exists(c)) return c;
            }
            return null;
        }

        private static void ApplyLanguageToConfigJs(string installDir, string selectedLang)
        {
            string safeLang = (selectedLang == "en") ? "en" : "ru";
            string cfgPath = Path.Combine(installDir, "config.js");
            string examplePath = Path.Combine(installDir, "config.example.js");

            if (!File.Exists(cfgPath))
            {
                if (!File.Exists(examplePath)) return;
                string txt = File.ReadAllText(examplePath, Encoding.UTF8);
                txt = Regex.Replace(txt, @"(?m)^(\s*lang\s*:\s*)(?:'[^']*'|""[^""]*"")", "${1}'" + safeLang + "'");
                if (safeLang == "en")
                {
                    txt = Regex.Replace(txt, @"(?m)^(\s*routeText\s*:\s*)'[^']*'", "${1}'IN TRANSIT // LIVE'");
                    txt = Regex.Replace(txt, @"(?m)^(\s*cbChannel\s*:\s*)'[^']*'", "${1}'CB 19'");
                }
                else
                {
                    txt = Regex.Replace(txt, @"(?m)^(\s*routeText\s*:\s*)'[^']*'", "${1}'В РЕЙСЕ // ОНЛАЙН'");
                    txt = Regex.Replace(txt, @"(?m)^(\s*cbChannel\s*:\s*)'[^']*'", "${1}'РАЦИЯ 19'");
                }
                File.WriteAllText(cfgPath, txt, new UTF8Encoding(false));
            }
            else
            {
                string existing = File.ReadAllText(cfgPath, Encoding.UTF8);
                if (Regex.IsMatch(existing, @"(?m)^\s*lang\s*:\s*(?:'[^']*'|""[^""]*"")"))
                {
                    existing = Regex.Replace(existing, @"(?m)^(\s*lang\s*:\s*)(?:'[^']*'|""[^""]*"")", "${1}'" + safeLang + "'");
                }
                else if (Regex.IsMatch(existing, @"window\.OVERLAY_CONFIG\s*=\s*\{"))
                {
                    existing = Regex.Replace(existing, @"(window\.OVERLAY_CONFIG\s*=\s*\{)", "$1\r\n  lang: '" + safeLang + "',");
                }
                File.WriteAllText(cfgPath, existing, new UTF8Encoding(false));
            }
        }

        public void PerformInstallation(
            string installDir,
            string ets2Path,
            string atsPath,
            bool createBridgeShortcut,
            bool createConfigShortcut,
            bool createUpdateShortcut,
            string selectedLang = "ru",
            string shortcutDirOverride = null,
            string regSubKey = Program.UNINSTALL_REG_KEY)
        {
            string safeLang = (selectedLang == "en") ? "en" : "ru";
            UpdateProgress(15, T("ProgUnpack"));
            if (!Directory.Exists(installDir)) Directory.CreateDirectory(installDir);

            Assembly asm = Assembly.GetExecutingAssembly();
            using (Stream stream = asm.GetManifestResourceStream("OverlayPackage.zip"))
            {
                if (stream == null) throw new InvalidOperationException("Embedded OverlayPackage.zip not found.");
                using (var archive = new ZipArchive(stream, ZipArchiveMode.Read))
                {
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        if (string.IsNullOrEmpty(entry.Name)) continue;
                        string dest = Path.Combine(installDir, entry.FullName.Replace('/', '\\'));
                        string parent = Path.GetDirectoryName(dest);
                        if (!Directory.Exists(parent)) Directory.CreateDirectory(parent);
                        entry.ExtractToFile(dest, true);
                    }
                }
            }

            UpdateProgress(40, T("ProgConfig"));
            ApplyLanguageToConfigJs(installDir, safeLang);

            UpdateProgress(60, T("ProgPlugin"));
            string dllSrc = Path.Combine(installDir, "redist", "overlayobs_foozzee_telemetry.dll");
            if (File.Exists(dllSrc))
            {
                foreach (string g in new[] { ets2Path, atsPath })
                {
                    if (string.IsNullOrEmpty(g) || !Directory.Exists(g)) continue;
                    string pDir = Path.Combine(g, "bin", "win_x64", "plugins");
                    if (!Directory.Exists(pDir)) Directory.CreateDirectory(pDir);
                    File.Copy(dllSrc, Path.Combine(pDir, "overlayobs_foozzee_telemetry.dll"), true);
                }
            }

            UpdateProgress(78, T("ProgShortcuts"));
            string desk = string.IsNullOrEmpty(shortcutDirOverride)
                ? Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory)
                : shortcutDirOverride;

            if (createBridgeShortcut)
            {
                string target = File.Exists(Path.Combine(installDir, "start-telemetry.bat"))
                    ? Path.Combine(installDir, "start-telemetry.bat")
                    : Path.Combine(installDir, "Start-Overlay.bat");
                CreateShortcut(
                    Path.Combine(desk, "ETS2-ATS Overlay Bridge.lnk"),
                    target,
                    installDir,
                    Path.Combine(installDir, "assets", "icons", "cockpit-bridge.ico"),
                    safeLang == "en" ? "ETS2 / ATS Telemetry Bridge" : "Мост телеметрии ETS2 / ATS");
            }
            if (createConfigShortcut)
            {
                string vbs = Path.Combine(installDir, "Configure-Overlay.vbs");
                string bat = Path.Combine(installDir, "Configure-Overlay.bat");
                CreateShortcut(
                    Path.Combine(desk, "ETS2-ATS Overlay Configurator.lnk"),
                    File.Exists(vbs) ? vbs : bat,
                    installDir,
                    Path.Combine(installDir, "assets", "icons", "cockpit-configurator.ico"),
                    safeLang == "en" ? "ETS2 / ATS Overlay Configurator" : "Конфигуратор оверлея ETS2 / ATS");
            }
            if (createUpdateShortcut)
            {
                CreateShortcut(
                    Path.Combine(desk, "ETS2-ATS Overlay Update.lnk"),
                    Path.Combine(installDir, "Update-Overlay.bat"),
                    installDir,
                    Path.Combine(installDir, "assets", "icons", "cockpit-updater.ico"),
                    safeLang == "en" ? "ETS2 / ATS Overlay Updater" : "Обновление оверлея ETS2 / ATS");
            }

            UpdateProgress(92, T("ProgRegister"));
            string uninstExe = Path.Combine(installDir, "Uninstall.exe");
            string selfExe = asm.Location;
            if (!string.IsNullOrEmpty(selfExe) && File.Exists(selfExe))
            {
                File.Copy(selfExe, uninstExe, true);
            }
            File.WriteAllText(Path.Combine(installDir, "Uninstall-Overlay.bat"), "@echo off\r\n\"%~dp0Uninstall.exe\" --uninstall \"%~dp0\"\r\n", Encoding.ASCII);

            using (RegistryKey rk = Registry.CurrentUser.CreateSubKey(regSubKey))
            {
                if (rk != null)
                {
                    rk.SetValue("DisplayName", "ETS2 / ATS Stream Overlay Cockpit");
                    rk.SetValue("DisplayVersion", Program.APP_VER);
                    rk.SetValue("Publisher", "FooZzee");
                    rk.SetValue("InstallLocation", installDir);
                    rk.SetValue("InstallLanguage", safeLang);
                    rk.SetValue("UninstallString", "\"" + uninstExe + "\" --uninstall \"" + installDir + "\"");
                    rk.SetValue("NoModify", 1, RegistryValueKind.DWord);
                    rk.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                }
            }

            UpdateProgress(100, T("ProgDone"));
        }

        public void PerformUninstall(string installDir, string ets2Path, string atsPath, bool removeConfig, bool removeShortcuts, string shortcutDirOverride = null, string regSubKey = Program.UNINSTALL_REG_KEY)
        {
            UpdateProgress(20, T("ProgUninstFiles"));
            string[] overlayDirs = { "assets", "scripts", "redist" };
            foreach (string d in overlayDirs)
            {
                string dp = Path.Combine(installDir, d);
                if (Directory.Exists(dp)) Directory.Delete(dp, true);
            }

            string[] overlayFiles = {
                "ets2-desktop.html", "config.example.js", "Configure-Overlay.bat", "Configure-Overlay.vbs",
                "build-and-install-plugin.bat", "Install-Overlay.bat", "Start-Overlay.bat", "start-telemetry.bat",
                "Update-Overlay.bat", "Uninstall-Overlay.bat", "README.md", "README.en.md", "README.ru.md",
                "CHANGELOG.md", "CHANGELOG.en.md", "CHANGELOG.ru.md", "commands.md", "commands.en.md",
                "commands.ru.md", "RELEASE_NOTES_v0.0.4.md", "LICENSE", ".gitignore"
            };
            foreach (string f in overlayFiles)
            {
                string fp = Path.Combine(installDir, f);
                if (File.Exists(fp)) File.Delete(fp);
            }

            if (removeConfig)
            {
                string cfg = Path.Combine(installDir, "config.js");
                if (File.Exists(cfg)) File.Delete(cfg);
            }

            if (removeShortcuts)
            {
                string desk = string.IsNullOrEmpty(shortcutDirOverride)
                    ? Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory)
                    : shortcutDirOverride;
                foreach (string lnkName in new[] { "ETS2-ATS Overlay Bridge.lnk", "ETS2-ATS Overlay Configurator.lnk", "ETS2-ATS Overlay Update.lnk" })
                {
                    string lnk = Path.Combine(desk, lnkName);
                    if (File.Exists(lnk)) File.Delete(lnk);
                }
            }

            foreach (string g in new[] { ets2Path, atsPath })
            {
                if (string.IsNullOrEmpty(g) || !Directory.Exists(g)) continue;
                string dll = Path.Combine(g, "bin", "win_x64", "plugins", "overlayobs_foozzee_telemetry.dll");
                if (File.Exists(dll)) File.Delete(dll);
            }

            try { Registry.CurrentUser.DeleteSubKeyTree(regSubKey, false); } catch { }
            UpdateProgress(100, T("ProgUninstDone"));
        }

        private static void CreateShortcut(string lnkPath, string targetPath, string workDir, string iconPath, string description)
        {
            Type shellType = Type.GetTypeFromProgID("WScript.Shell");
            object shell = Activator.CreateInstance(shellType);
            object sc = shellType.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shell, new object[] { lnkPath });
            Type scType = sc.GetType();
            scType.InvokeMember("TargetPath", BindingFlags.SetProperty, null, sc, new object[] { targetPath });
            scType.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, sc, new object[] { workDir });
            scType.InvokeMember("Description", BindingFlags.SetProperty, null, sc, new object[] { description });
            if (!string.IsNullOrEmpty(iconPath) && File.Exists(iconPath))
            {
                scType.InvokeMember("IconLocation", BindingFlags.SetProperty, null, sc, new object[] { iconPath + ",0" });
            }
            scType.InvokeMember("Save", BindingFlags.InvokeMethod, null, sc, null);
            Marshal.FinalReleaseComObject(sc);
            Marshal.FinalReleaseComObject(shell);
        }
    }
}

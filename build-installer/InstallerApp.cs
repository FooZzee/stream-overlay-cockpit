// Copyright (c) 2026 FooZzee. All Rights Reserved. Licensed under Proprietary Freeware License.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
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
                return RunSelfTest(args[1]);
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
                MessageBox.Show("Ошибка запуска установщика:\n\n" + ex.ToString(), "Ошибка установщика", MessageBoxButton.OK, MessageBoxImage.Error);
                return 1;
            }
        }

        private static int RunSelfTest(string targetDir)
        {
            var logLines = new List<string>();
            Action<string> log = (msg) =>
            {
                string line = "[" + DateTime.Now.ToString("HH:mm:ss.fff") + "] " + msg;
                logLines.Add(line);
                Console.WriteLine(line);
            };

            try
            {
                string fullDir = Path.GetFullPath(targetDir);
                if (!Directory.Exists(fullDir)) Directory.CreateDirectory(fullDir);
                log("Starting installer self-test into: " + fullDir);

                var controller = new SetupController();
                controller.Initialize(isSelfTest: true, targetDir: fullDir, isUninstallMode: false);
                controller.Window.Show();
                controller.Window.UpdateLayout();

                BitmapImage logoBmp = controller.LoadedLogo;
                if (logoBmp == null || logoBmp.PixelWidth <= 0 || logoBmp.PixelHeight <= 0)
                {
                    throw new InvalidOperationException("Embedded resource 'InstallerLogo.png' failed to decode.");
                }
                log("Embedded logo verified: " + logoBmp.PixelWidth + "x" + logoBmp.PixelHeight);

                int clipped = controller.CountClippedControls();
                log("CLIPPED_CONTROLS=" + clipped);
                if (clipped > 0)
                {
                    throw new InvalidOperationException("Detected clipped controls in setup window: " + clipped);
                }

                string scDir = Path.Combine(fullDir, "_test_desktop");
                Directory.CreateDirectory(scDir);
                controller.PerformInstallation(fullDir, null, null, createConfigShortcut: true, shortcutDirOverride: scDir, regSubKey: SELF_TEST_REG_KEY);

                string lnk = Path.Combine(scDir, "ETS2-ATS Overlay Configurator.lnk");
                if (!File.Exists(Path.Combine(fullDir, "Uninstall.exe")) || !File.Exists(lnk))
                {
                    throw new InvalidOperationException("Missing Uninstall.exe or configurator shortcut after self-test install.");
                }

                // Очистка тестового ключа реестра
                try { Registry.CurrentUser.DeleteSubKeyTree(SELF_TEST_REG_KEY, false); } catch { }
                controller.Window.Close();

                log("SELF_TEST=SUCCESS");
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
                controller.Initialize(isSelfTest: true, targetDir: fullDir, isUninstallMode: false);
                controller.PerformInstallation(fullDir, null, null, createConfigShortcut: true, shortcutDirOverride: scDir, regSubKey: SELF_TEST_REG_KEY);

                // Создаём пользовательский config.js и проверяем, что при removeConfig: false он СОХРАНЯЕТСЯ
                string userCfg = Path.Combine(fullDir, "config.js");
                File.WriteAllText(userCfg, "window.OVERLAY_CONFIG = { lang: 'ru' };", Encoding.UTF8);

                controller.PerformUninstall(fullDir, null, null, removeConfig: false, removeShortcut: true, shortcutDirOverride: scDir, regSubKey: SELF_TEST_REG_KEY);
                if (!File.Exists(userCfg))
                {
                    throw new InvalidOperationException("User config.js was deleted even when removeConfig=false!");
                }
                if (File.Exists(Path.Combine(scDir, "ETS2-ATS Overlay Configurator.lnk")))
                {
                    throw new InvalidOperationException("Configurator shortcut still exists after uninstall!");
                }

                // Теперь удаляем с removeConfig: true и проверяем полное очищение
                controller.PerformUninstall(fullDir, null, null, removeConfig: true, removeShortcut: true, shortcutDirOverride: scDir, regSubKey: SELF_TEST_REG_KEY);
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
        public CheckBox chkConfigShortcut { get; private set; }
        public CheckBox chkRemoveConfig { get; private set; }
        public ProgressBar progressBar { get; private set; }
        public TextBlock txtStatus { get; private set; }
        public Button btnInstall { get; private set; }
        public Button btnUninstall { get; private set; }
        public Button btnCancel { get; private set; }
        public BitmapImage LoadedLogo { get; private set; }

        private bool _isUninstallMode;

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

        public void Initialize(bool isSelfTest, string targetDir, bool isUninstallMode)
        {
            _isUninstallMode = isUninstallMode;

            string xaml = @"
<Window xmlns='http://schemas.microsoft.com/winfx/2006/xaml/presentation'
        xmlns:x='http://schemas.microsoft.com/winfx/2006/xaml'
        Title='ETS2 / ATS Stream Overlay Cockpit — Setup v" + Program.APP_VER + @"'
        Width='660' SizeToContent='Height'
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
                <TextBlock Grid.Column='2' Text='v" + Program.APP_VER + @"' VerticalAlignment='Center' Margin='12,0,0,0' FontSize='12' FontWeight='Bold' Foreground='#00E5FF'/>
            </Grid>
        </Border>

        <StackPanel Grid.Row='1'>
            <Border Background='#0E131B' BorderBrush='#1E293B' BorderThickness='1' CornerRadius='10' Padding='14' Margin='0,0,0,10'>
                <StackPanel>
                    <TextBlock Text='1. ПАПКА УСТАНОВКИ' FontSize='11.5' FontWeight='Bold' Foreground='#00E5FF' Margin='0,0,0,6'/>
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
                    <TextBlock Text='2. ПЛАГИН ТЕЛЕМЕТРИИ SCS SDK 1.16 (overlayobs_foozzee_telemetry.dll)' FontSize='11.5' FontWeight='Bold' Foreground='#00E5FF' Margin='0,0,0,6'/>
                    <CheckBox x:Name='chkEts2' Content='Установить плагин в Euro Truck Simulator 2' Foreground='#F1F5F9' Margin='0,0,0,4'/>
                    <TextBox x:Name='txtEts2Path' Background='#080C14' Foreground='#CBD5E1' BorderBrush='#334155' Padding='6,4' Margin='0,0,0,8'/>
                    <CheckBox x:Name='chkAts' Content='Установить плагин в American Truck Simulator' Foreground='#F1F5F9' Margin='0,0,0,4'/>
                    <TextBox x:Name='txtAtsPath' Background='#080C14' Foreground='#CBD5E1' BorderBrush='#334155' Padding='6,4'/>
                </StackPanel>
            </Border>

            <Border Background='#0E131B' BorderBrush='#1E293B' BorderThickness='1' CornerRadius='10' Padding='14'>
                <StackPanel>
                    <CheckBox x:Name='chkConfigShortcut' Content='Создать ярлык конфигуратора на Рабочем столе (с фирменной иконкой)' Foreground='#F1F5F9' IsChecked='True' Margin='0,0,0,6'/>
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
            txtInstallDir = (TextBox)Window.FindName("txtInstallDir");
            var btnBrowseDir = (Button)Window.FindName("btnBrowseDir");
            chkEts2 = (CheckBox)Window.FindName("chkEts2");
            txtEts2Path = (TextBox)Window.FindName("txtEts2Path");
            chkAts = (CheckBox)Window.FindName("chkAts");
            txtAtsPath = (TextBox)Window.FindName("txtAtsPath");
            chkConfigShortcut = (CheckBox)Window.FindName("chkConfigShortcut");
            chkRemoveConfig = (CheckBox)Window.FindName("chkRemoveConfig");
            progressBar = (ProgressBar)Window.FindName("progressBar");
            txtStatus = (TextBlock)Window.FindName("txtStatus");
            btnInstall = (Button)Window.FindName("btnInstall");
            btnUninstall = (Button)Window.FindName("btnUninstall");
            btnCancel = (Button)Window.FindName("btnCancel");

            txtInstallDir.Text = string.IsNullOrEmpty(targetDir) ? @"C:\Stream_Overlay_Cockpit" : targetDir;
            string ets2Detected = DetectGamePath("Euro Truck Simulator 2");
            string atsDetected = DetectGamePath("American Truck Simulator");
            txtEts2Path.Text = ets2Detected ?? "";
            chkEts2.IsChecked = !string.IsNullOrEmpty(ets2Detected);
            txtAtsPath.Text = atsDetected ?? "";
            chkAts.IsChecked = !string.IsNullOrEmpty(atsDetected);

            if (isUninstallMode)
            {
                txtStatus.Text = "Режим удаления оверлея. Нажмите «Удалить оверлей» для деинсталляции.";
            }

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
                        chkConfigShortcut.IsChecked == true);
                    MessageBox.Show("Установка ETS2 / ATS Stream Overlay Cockpit v" + Program.APP_VER + " завершена!\n\nПуть: " + dir, "Установка завершена", MessageBoxButton.OK, MessageBoxImage.Information);
                    Window.Close();
                }
                catch (Exception ex)
                {
                    btnInstall.IsEnabled = true;
                    MessageBox.Show("Ошибка установки:\n\n" + ex.ToString(), "Ошибка", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            };

            btnUninstall.Click += (s, e) =>
            {
                try
                {
                    string dir = txtInstallDir.Text.Trim();
                    if (MessageBox.Show("Удалить ETS2 / ATS Stream Overlay Cockpit из:\n" + dir + "?", "Подтверждение удаления", MessageBoxButton.YesNo, MessageBoxImage.Question) != MessageBoxResult.Yes)
                    {
                        return;
                    }
                    PerformUninstall(
                        dir,
                        txtEts2Path.Text.Trim(),
                        txtAtsPath.Text.Trim(),
                        chkRemoveConfig.IsChecked == true,
                        removeShortcut: true);

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
                    MessageBox.Show("Оверлей успешно удалён.", "Удаление завершено", MessageBoxButton.OK, MessageBoxImage.Information);
                    Window.Close();
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Ошибка удаления:\n\n" + ex.ToString(), "Ошибка", MessageBoxButton.OK, MessageBoxImage.Error);
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

        public void PerformInstallation(string installDir, string ets2Path, string atsPath, bool createConfigShortcut, string shortcutDirOverride = null, string regSubKey = Program.UNINSTALL_REG_KEY)
        {
            UpdateProgress(15, "Распаковка файлов оверлея...");
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

            UpdateProgress(55, "Установка плагина телеметрии...");
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

            if (createConfigShortcut)
            {
                UpdateProgress(75, "Создание ярлыка конфигуратора...");
                string desk = string.IsNullOrEmpty(shortcutDirOverride)
                    ? Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory)
                    : shortcutDirOverride;
                string vbs = Path.Combine(installDir, "Configure-Overlay.vbs");
                string bat = Path.Combine(installDir, "Configure-Overlay.bat");
                string target = File.Exists(vbs) ? vbs : bat;
                string ico = Path.Combine(installDir, "assets", "icons", "cockpit-configurator.ico");
                CreateShortcut(Path.Combine(desk, "ETS2-ATS Overlay Configurator.lnk"), target, installDir, ico);
            }

            UpdateProgress(90, "Регистрация деинсталлятора...");
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
                    rk.SetValue("UninstallString", "\"" + uninstExe + "\" --uninstall \"" + installDir + "\"");
                    rk.SetValue("NoModify", 1, RegistryValueKind.DWord);
                    rk.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                }
            }

            UpdateProgress(100, "Установка завершена!");
        }

        public void PerformUninstall(string installDir, string ets2Path, string atsPath, bool removeConfig, bool removeShortcut, string shortcutDirOverride = null, string regSubKey = Program.UNINSTALL_REG_KEY)
        {
            UpdateProgress(20, "Удаление файлов оверлея...");
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

            if (removeShortcut)
            {
                string desk = string.IsNullOrEmpty(shortcutDirOverride)
                    ? Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory)
                    : shortcutDirOverride;
                string lnk = Path.Combine(desk, "ETS2-ATS Overlay Configurator.lnk");
                if (File.Exists(lnk)) File.Delete(lnk);
            }

            foreach (string g in new[] { ets2Path, atsPath })
            {
                if (string.IsNullOrEmpty(g) || !Directory.Exists(g)) continue;
                string dll = Path.Combine(g, "bin", "win_x64", "plugins", "overlayobs_foozzee_telemetry.dll");
                if (File.Exists(dll)) File.Delete(dll);
            }

            try { Registry.CurrentUser.DeleteSubKeyTree(regSubKey, false); } catch { }
            UpdateProgress(100, "Удаление завершено.");
        }

        private static void CreateShortcut(string lnkPath, string targetPath, string workDir, string iconPath)
        {
            Type shellType = Type.GetTypeFromProgID("WScript.Shell");
            object shell = Activator.CreateInstance(shellType);
            object sc = shellType.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shell, new object[] { lnkPath });
            Type scType = sc.GetType();
            scType.InvokeMember("TargetPath", BindingFlags.SetProperty, null, sc, new object[] { targetPath });
            scType.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, sc, new object[] { workDir });
            scType.InvokeMember("Description", BindingFlags.SetProperty, null, sc, new object[] { "ETS2 / ATS Stream Overlay Cockpit Configurator" });
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

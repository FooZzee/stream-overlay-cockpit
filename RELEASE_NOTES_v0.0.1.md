# 🚛 ETS2 / ATS Stream Overlay Cockpit v0.0.1

[![Release](https://img.shields.io/badge/Release-v0.0.1-brightgreen?style=flat)](https://github.com/FooZzee/stream-overlay-cockpit/releases/tag/v0.0.1)
[![Platform](https://img.shields.io/badge/Platform-Windows_x64-blue?style=flat)](https://www.microsoft.com/windows)
[![SCS SDK](https://img.shields.io/badge/SCS_SDK-v1.16-orange?style=flat)](https://modding.scssoft.com/wiki/Documentation/Engine/SDK/Telemetry)
[![OBS Studio](https://img.shields.io/badge/OBS_Studio-28%2B-5c5cf0?style=flat)](https://obsproject.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](./LICENSE)

---

### 🌐 Quick Language Jump / Выбор языка (🇬🇧 English / 🇷🇺 Русский)

* [🇬🇧 English Release Notes](#-english-release-notes)
* [🇷🇺 Русское описание релиза v0.0.1](#-русское-описание-релиза-v001)

---

<a id="-english-release-notes"></a>
## 🇬🇧 English Release Notes

> [!IMPORTANT]
> **Standalone Architecture:** This release introduces the independent **ETS2 / ATS Stream Overlay Cockpit** series. Run **`Install-Overlay.bat`** to install the overlay and telemetry plugin to `C:\Stream_Overlay_Cockpit` without administrative privileges.

### 🚀 What's New & Key Highlights

1. **Lower Cockpit Dashboard Console («Torpedo»):**
   * High-contrast 100% opaque dark backdrop (`#0B0F17`) engineered for OBS Browser Source to eliminate road bleed-through.
   * Full analog and digital cluster: speedometer (0–160 km/h or mph), colored tachometer, gear display, air brake pressure, fuel levels, engine coolant/oil temperatures, and live throttle/brake/clutch/steering input meters.
   * Bottom route ticker with departure/destination cities, remaining kilometers, real-world ETA, and contract payout.

2. **Universal Webcam Frame (4:3 & 16:9 Standards):**
   * Standard square `4:3` (325×244 px @ 1080p | 397×298 px @ 1440p) aligned to dashboard height.
   * Widescreen `16:9` (384×216 px @ 1080p | 464×261 px @ 1440p) aligned to top cluster height.
   * Built-in trip duration clock with recording blinker and smooth `10px` rounded corner radii.
   * Switchable via installer selector, URL query parameter (`?cam=4x3` / `?cam=16x9`), or `window.setWebcamAspect()`.

3. **High-Performance Gaming Chat Dock:**
   * Positioned symmetrically to the right of the dashboard with identical baseline and height alignment.
   * Dense 85% opacity dark backdrop without GPU-costly `backdrop-filter: blur`, ensuring rock-solid 60 fps streaming.
   * Compatible with Twitch, YouTube, VK Play Live, Kick, and Trovo chat widgets.

4. **Modern Slide-Up Animated Stream Alerts:**
   * Dynamic donation, subscriber, and raid cards that slide up smoothly from behind the dashboard (+10 px peak).
   * Realistic particle shatter physics explosion on alert dismissal.
   * Developer console test API via `window.testStreamAlert()`.

5. **Native SCS Telemetry SDK 1.16 Plugin & Bridge:**
   * High-speed `overlayobs_foozzee_telemetry.dll` with NULL DACL Win32 Shared Memory architecture (`Local\FooZzeeSCSTelemetry`).
   * Ultra-low-latency local HTTP telemetry bridge (`udp-bridge.ps1`) streaming packets on port `30002` at up to 60 fps.

6. **WPF Setup Wizard & Custom Desktop Shortcuts:**
   * Modern dark-themed GUI installer (`Install-Overlay.bat`) with webcam ratio selection and automatic Steam path detection.
   * Multi-resolution `.ico` shortcuts (`cockpit-bridge.ico` and `cockpit-updater.ico`) created directly on the streamer's Desktop.

---

### 📦 Asset Verification & Checksums

| File Name | Size (Bytes) | MD5 Checksum | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| **`ETS2-ATS-Stream-Overlay-Cockpit-v0.0.1.zip`** | `1,941,614` bytes | `257b8c8ec089d2ae88f0e73ac06186ff` | `a3f2954a84c60a55e7d76ae67377834c25f420a72aa655725304252f629654d8` |

---

### ⚡ Quick Start Guide

1. Download **`ETS2-ATS-Stream-Overlay-Cockpit-v0.0.1.zip`** and extract its contents.
2. Launch **`Install-Overlay.bat`**, choose your preferred webcam aspect ratio (`4:3` or `16:9`), and click **«INSTALL OVERLAY»**.
3. Launch the **«ETS2-ATS Overlay Bridge»** shortcut on your Desktop before starting the game.
4. In OBS Studio, add a **«Browser»** source with **1920×1080**. In the source properties, **DO NOT** check "Local file" (otherwise webcam aspect ratio query parameters will not work). Paste the file path directly into the standard **URL** field: `C:\Stream_Overlay_Cockpit\ets2-desktop.html` (or with `?cam=4x3` / `?cam=16x9`).

---

<a id="-русское-описание-релиза-v001"></a>
## 🇷🇺 Русское описание релиза v0.0.1

> [!IMPORTANT]
> **Автономная архитектура:** Релиз открывает независимую флагманскую серию **ETS2 / ATS Stream Overlay Cockpit**. Запустите **`Install-Overlay.bat`** для быстрой установки оверлея и плагина телеметрии в `C:\Stream_Overlay_Cockpit` без прав администратора.

### 🚀 Главные нововведения релиза

1. **Нижняя симметричная консоль Cockpit HUD («Торпеда»):**
   * Плотная 100% непрозрачная подложка `#0B0F17`, исключающая просвечивание текстур асфальта и капота в OBS Studio.
   * Полный приборный кластер: стрелочный и цифровой спидометр (0–160 км/ч или mph), тахометр с цветными зонами, индикатор передачи КПП, манометр пневмосистемы, уровень топлива, температуры охлаждающей жидкости и масла, а также шкалы педалей газа, тормоза, сцепления и угла поворота руля.
   * Нижняя бегущая строка рейса с названиями городов отправления и прибытия, остатком километров, расчётным временем прибытия (ETA) и ставкой за доставку.

2. **Универсальная рамка веб-камеры (форматы 4:3 и 16:9):**
   * Классический формат `4:3` (325×244 px @ 1080p | 397×298 px @ 1440p) по высоте приборной панели.
   * Широкоформатный `16:9` (384×216 px @ 1080p | 464×261 px @ 1440p) по высоте верхнего кластера.
   * Интегрированный таймер времени в пути с индикатором записи и мягким скруглением углов `10px`.
   * Мгновенное переключение через установщик, URL-параметры `?cam=4x3` / `?cam=16x9` или метод `window.setWebcamAspect()`.

3. **Игровой док чата справа от приборной панели:**
   * Симметричное расположение относительно приборной панели с идентичным выравниванием базовой линии.
   * Плотная тёмная подложка 85% непрозрачности без тяжёлого размытия `backdrop-filter: blur`, что гарантирует стабильные 60 fps без просадок.
   * Поддержка интеграции чатов Twitch, YouTube, VK Play Live, Kick и Trovo.

4. **Анимированные стрим-оповещения с выездом из-под приборки:**
   * Плавный выезд уведомлений о донатах, подписках и рейдах из-под приборной панели на +10 px выше её верхнего края.
   * Эффектный разлёт карточки на осколки и физические частицы при завершении показа.
   * Тестовый метод `window.testStreamAlert()` для мгновенной проверки анимаций в браузере.

5. **Нативный плагин SCS SDK 1.16 и локальный мост телеметрии:**
   * Высокоскоростной C++ модуль `overlayobs_foozzee_telemetry.dll` на базе SCS Telemetry SDK 1.16 с архитектурой разделяемой памяти Win32 (`Local\FooZzeeSCSTelemetry`).
   * Локальный HTTP-мост (`udp-bridge.ps1`) на порту `30002` с частотой передачи до 60 кадров/сек.

6. **WPF-Установщик и ярлыки на Рабочем столе:**
   * Тёмный графический интерфейс установщика (`Install-Overlay.bat`) с выбором формата веб-камеры и автоматическим поиском игр Steam.
   * Фирменные многослойные ярлыки с иконками `cockpit-bridge.ico` и `cockpit-updater.ico` на Рабочем столе.

---

### 📦 Контрольные суммы архива релиза

| Имя файла | Размер (в байтах) | Контрольная сумма MD5 | Контрольная сумма SHA-256 |
| :--- | :--- | :--- | :--- |
| **`ETS2-ATS-Stream-Overlay-Cockpit-v0.0.1.zip`** | `1,941,614` байт | `257b8c8ec089d2ae88f0e73ac06186ff` | `a3f2954a84c60a55e7d76ae67377834c25f420a72aa655725304252f629654d8` |

---

### ⚡ Быстрая установка

1. Скачайте архив **`ETS2-ATS-Stream-Overlay-Cockpit-v0.0.1.zip`** и распакуйте его в любую удобную папку.
2. Запустите файл **`Install-Overlay.bat`**, выберите нужный формат веб-камеры (`4:3` или `16:9`) и нажмите кнопку **«УСТАНОВИТЬ ОВЕРЛЕЙ»**.
3. Перед запуском игры откройте ярлык **«ETS2-ATS Overlay Bridge»** на Рабочем столе.
4. В OBS Studio добавьте источник **«Браузер»** с разрешением **1920×1080**. В настройках источника «Браузер» **НЕ ставьте** галочку «Локальный файл» (иначе не будут работать URL-параметры пропорций камеры). Вставьте путь к файлу прямо в обычное поле **URL**: `C:\Stream_Overlay_Cockpit\ets2-desktop.html` (или с параметром `?cam=4x3` / `?cam=16x9`).

---

### 👤 Автор проекта — FooZzee

* **Официальный сайт:** https://foozzee.ru
* **Twitch:** https://twitch.tv/foozzee
* **YouTube:** https://youtube.com/@foozzee
* **Telegram канал:** https://t.me/foozzee_stream
* **Сообщество VK:** https://vk.com/foozzee
* **Поддержать разработку:** [DonationAlerts (https://www.donationalerts.com/r/foozzee)](https://www.donationalerts.com/r/foozzee)

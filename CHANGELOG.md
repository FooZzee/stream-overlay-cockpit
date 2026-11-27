# Version History (Changelog) — ETS2 / ATS Stream Overlay Cockpit

> **ETS2 / ATS Stream Overlay Cockpit v0.0.4**  
> Dual-language release documentation (English / Русский).

---

## [EN] English Release Notes

### [0.0.4] - 2026-11-27

#### Added & Changed
* **Zero-Blur 60 FPS Compositor:** Eliminated GPU-heavy `backdrop-filter: blur` passes in favor of dense matte surfaces (`rgba(14, 16, 20, 0.70)`), maintaining locked 60 FPS rendering in OBS Studio (`1080p` and `1440p`).
* **Matte 3D-Carousel Chat Dock (`ets2-chat-3d.css`, `ets2-chat-carousel.js`, `ets2-emotes.js`):** Borderless floating message pills without shadows or outlines, height-aware dynamic DOM pruning, native Twitch IRC emotes (`Array.from` Unicode code points) + **7TV / BTTV / FFZ**, real **Twitch GQL** `broadcastBadges` with text fallbacks, and an infinite 3D flip cycle (**Chat 5m -> `!0–!5` Poll 1m -> Chat 5m -> Socials Card 1m**).
* **`!0–!5` Game Rating Poll:** Captures raw votes before `hideCommands` filtering, computes an accurate `1–5` rating average without `!0` distortion, and prioritizes manual `chat.gameTitle` over `auto` detection (telemetry / Twitch GQL).
* **Focused WPF Configurator (`Overlay Configurator`):** Streamlined UI for Twitch, DonationAlerts, 3D-block timings, `gameTitle`, social links (`Telegram`, `VK`, `YouTube`), and individual flags/cooldowns for all 7 chat commands (`!гудок`, `!рация`, `!рейс`, `!стата`, `!тягач`, `!водитель`, `!ставка`), plus fixed `PasswordBox`/`TextBox` token visibility toggling.
* **Bilingual WPF Installer & Uninstaller (`Русский / English`):** Auto-sized window (`SizeToContent.Height`), embedded `logo.png` header, live `RU / EN` language switch persisted to `config.js` and `InstallLanguage` registry value, automatic `overlayobs_foozzee_telemetry.dll` deployment, multi-layer `16/32/48/256` `.ico` desktop shortcuts (**`Overlay Bridge`**, **`Overlay Configurator`**, **`Overlay Update`**), and safe `Uninstall.exe` preserving `config.js`.

### [0.0.3] - 2026-11-23

#### Added & Changed
* **Extended SCS SDK 1.16 Telemetry (`127.0.0.1:30002`):** Live ETA calculation, pneumatic air brake pressure, fuel volume, coolant/oil temperatures, pedal deflection bars, steering wheel angle, and truck/trailer/cargo wear indicators.
* **Cockpit Customization & Command Cooldowns:** Instrument backlight presets (`?theme=amber` / `?theme=ice`), instant webcam aspect toggle (`4:3` / `16:9`), integrated trip clock, and the base 7-command chat engine with role gates and per-user cooldowns.

### [0.0.2] - 2026-11-19

#### 🚀 Key Improvements & Highlights
* **Corrected OBS Studio Browser Source Setup (Uncheck 'Local file'):** Path is entered directly into the URL field without checking 'Local file' to preserve query parameters.
* **Automatic Update Checking Enabled by Default (`checkUpdates: true`):** Background query against `FooZzee/stream-overlay-cockpit` GitHub API on startup, failing silently if network is unavailable or returns 404.
* **Smart Pip-Boy 3000 Updater:** SemVer evaluation (`v0.0.2` vs `latest`), in-app extraction of `ETS2-ATS-Stream-Overlay-Cockpit-*.zip` with safe preservation of `config.js`.
* **Repository Defaults:** Official GitHub repo pointers preset across configs and GUI installer.
* **Version 0.0.2 Synchronization:** Unified version bump across all scripts, telemetry, and docs.

### [0.0.1] - 2026-11-19

#### 🚀 Initial Release & Highlights

First stable release of the flagship **ETS2 / ATS Stream Overlay Cockpit** series, bringing together a lower cockpit dashboard console, symmetrical webcam and live chat docks, dynamic stream alert cards, and the native SCS SDK 1.16 telemetry plugin into a single unified OBS Studio browser scene.

* **Lower Symmetrical Cockpit HUD Console:** High-contrast digital and analog instrument dashboard with a 100% opaque dark backdrop (`#0B0F17`), speed 0–160 km/h / mph, RPM gauge, gear indicator, air pressure, fuel volume, coolant/oil temperatures, live pedal deflection bars, steering wheel angle, and odometer distance counter.
* **Universal Webcam Frame (4:3 and 16:9):** Support for `4:3` (325×244 px @ 1080p | 397×298 px @ 1440p) and `16:9` (384×216 px @ 1080p | 464×261 px @ 1440p) with integrated "Trip Duration" timer and smooth `10px` rounded corners.
* **Gaming Chat Dock:** Dense, high-contrast dark backdrop at 85% opacity without expensive GPU blur shaders (`backdrop-filter: blur`), matching the central gauge cluster in height and baseline elevation.
* **Modern Animated Stream Alerts:** Smooth slide-up reveal from behind the dashboard (+10 px peak) and explosive particle shatter on dismissal.
* **Native SCS Telemetry SDK 1.16 Plugin:** Direct data capture via `overlayobs_foozzee_telemetry.dll` for ETS2 and ATS with zero FPS overhead.
* **WPF Setup Wizard:** Bilingual installer with standalone webcam aspect selector, automatic game detection, default path `C:\Stream_Overlay_Cockpit`, multi-layer `.ico` desktop icons, and native FlowDocument viewer.

---

## [RU] Русское описание релиза

### [0.0.4] - 2026-11-27

#### Добавлено и изменено
* **Zero-Blur 60 FPS композитинг:** полный отказ от GPU-тяжёлого `backdrop-filter: blur` в пользу плотных матовых подложек (`rgba(14, 16, 20, 0.70)`), стабильные 60 FPS в OBS Studio (`1080p` и `1440p`).
* **Матовый 3D-чат с каруселью (`ets2-chat-3d.css`, `ets2-chat-carousel.js`, `ets2-emotes.js`):** плашки сообщений без обводок и теней, динамическая очистка DOM по высоте слота, нативные смайлы Twitch (`Array.from` по Unicode code points) + **7TV / BTTV / FFZ**, реальные значки **Twitch GQL** с текстовым фолбэком и бесконечный 3D-цикл (**Чат 5 мин -> Опросник `!0–!5` 1 мин -> Чат 5 мин -> Карточка соцсетей 1 мин**).
* **Опросник игры `!0–!5`:** перехват голосов до фильтра `hideCommands`, честный расчёт среднего балла по шкале `1–5` без искажения от `!0` и приоритет ручного `chat.gameTitle` над автоопределением (`auto`).
* **Сфокусированный WPF-конфигуратор (`Overlay Configurator`):** обновлённый интерфейс настройки Twitch, DonationAlerts, таймингов 3D-блока, `gameTitle`, соцсетей (`Telegram`, `VK`, `YouTube`), флагов и кулдаунов всех 7 команд чата (`!гудок`, `!рация`, `!рейс`, `!стата`, `!тягач`, `!водитель`, `!ставка`), а также исправление переключения видимости токенов (`PasswordBox` / `TextBox`).
* **Двуязычный WPF-установщик и деинсталлятор (`Русский / English`):** автоподбор высоты окна (`SizeToContent.Height`), встроенный логотип `logo.png`, переключатель языка `RU / EN` с записью в `config.js` и реестр (`InstallLanguage`), автоустановка `overlayobs_foozzee_telemetry.dll`, многослойные `.ico` (`16/32/48/256`) ярлыки **`Overlay Bridge`**, **`Overlay Configurator`**, **`Overlay Update`** и безопасный `Uninstall.exe` с сохранением `config.js`.

### [0.0.3] - 2026-11-23

#### Добавлено и изменено
* **Расширение телеметрии SCS SDK 1.16 (`127.0.0.1:30002`):** живой расчёт ETA, индикаторы давления пневмосистемы, топлива, температур, педалей, угла руля и износа тягача/прицепа/груза.
* **Настройка приборки и команд:** пресеты подсветки приборной панели (`?theme=amber` / `?theme=ice`), мгновенное переключение рамки камеры (`4:3` / `16:9`), встроенный таймер рейса и базовая система 7 чат-команд с ролями и индивидуальными кулдаунами.

### [0.0.2] - 2026-11-19

#### 🚀 Главные нововведения и улучшения
* **Исправление подключения в OBS Studio (без галочки «Локальный файл»):** Путь вводится напрямую в поле URL для гарантированной работы URL-параметров камеры.
* **Автоматическая проверка обновлений (`checkUpdates: true`):** Проверка релизов GitHub при запуске оверлея с бесшумным выходом при 404 или отсутствии сети.
* **Интеллектуальный Pip-Boy 3000 Updater:** Автоматическая загрузка архива `ETS2-ATS-Stream-Overlay-Cockpit-*.zip` с надёжным сохранением `config.js`.
* **Параметры репозитория по умолчанию:** Привязка к `FooZzee/stream-overlay-cockpit` в шаблоне конфига и установщике.
* **Версия v0.0.2:** Синхронное поднятие версии во всех модулях и документации проекта.

### [0.0.1] - 2026-11-19

#### 🚀 Главные нововведения и стартовый релиз

Первый стабильный релиз флагманской серии **ETS2 / ATS Stream Overlay Cockpit**, объединяющий нижнюю консоль приборной панели («торпеду»), симметричные боковые модули веб-камеры и игрового чата, динамические стрим-оповещения и нативный плагин телеметрии SCS SDK 1.16 в единую сцену OBS Studio.

* **Нижняя симметричная консоль Cockpit HUD:** Цифровая и аналоговая приборная панель со 100% непрозрачной тёмной подложкой `#0B0F17`, спидометр 0–160 км/ч / mph, тахометр, передача КПП, давление воздуха, уровень топлива, температуры, педали, руль, одометр и нижняя бегущая строка рейса.
* **Универсальная рамка веб-камеры (4:3 и 16:9):** Поддержка форматов `4:3` (325×244 px @ 1080p | 397×298 px @ 1440p) и `16:9` (384×216 px @ 1080p | 464×261 px @ 1440p), таймер реального времени в пути и скругление углов `10px`.
* **Игровой док чата:** Плотная подложка 85% без использования тяжёлого размытия (`backdrop-filter: blur`), выравнивание по высоте приборной панели и поддержка мультичат платформ.
* **Современные стрим-оповещения:** Плавный выезд из-под приборки (+10 px) и эффектный разлёт карточки на осколки при завершении показа.
* **Нативный плагин телеметрии SCS SDK 1.16:** Прямой захват данных через `overlayobs_foozzee_telemetry.dll` без сторонних серверов и без потери FPS.
* **Графический WPF-Установщик:** Двуязычный мастер установки, выбор формата камеры, путь по умолчанию `C:\Stream_Overlay_Cockpit`, фирменные `.ico` иконки и встроенный просмотрщик документации.

---

Copyright (c) 2026 FooZzee. All Rights Reserved.

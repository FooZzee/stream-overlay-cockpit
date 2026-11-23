# 🚛 ETS2 / ATS Stream Overlay Cockpit v0.0.3

[![Release](https://img.shields.io/badge/Release-v0.0.3-brightgreen?style=flat)](https://github.com/FooZzee/stream-overlay-cockpit/releases/tag/v0.0.3)
[![Platform](https://img.shields.io/badge/Platform-Windows_x64-blue?style=flat)](https://www.microsoft.com/windows)
[![SCS SDK](https://img.shields.io/badge/SCS_SDK-v1.16-orange?style=flat)](https://modding.scssoft.com/wiki/Documentation/Engine/SDK/Telemetry)
[![OBS Studio](https://img.shields.io/badge/OBS_Studio-28%2B-5c5cf0?style=flat)](https://obsproject.com/)
[![License](https://img.shields.io/badge/License-All_Rights_Reserved-ef4444?style=flat)](./LICENSE)

[![Support Project](https://img.shields.io/badge/Support_Project-FF5E5B?style=for-the-badge&logo=heart&logoColor=white)](https://www.donationalerts.com/r/foozzee)
[![Поддержать проект](https://img.shields.io/badge/Поддержать_проект-FF5E5B?style=for-the-badge&logo=heart&logoColor=white)](https://www.donationalerts.com/r/foozzee)

---

### 🌐 Quick Language Jump / Выбор языка

[🇬🇧 English Release Notes](#-english-release-notes) • [🇷🇺 Русское описание релиза v0.0.3](#-русское-описание-релиза-v003) • [Changelog](./CHANGELOG.md) • [Commands](./commands.md)

---

<a id="-english-release-notes"></a>
## 🇬🇧 English Release Notes

> [!IMPORTANT]
> **Primary Setup Notice:** Close Euro Truck Simulator 2 and American Truck Simulator before installing. In OBS Studio, add a **Browser Source**, paste the local URL `file:///C:/Stream_Overlay_Cockpit/ets2-desktop.html` directly into the URL field, and **uncheck** 'Local file' to ensure proper telemetry and camera parameter processing.

### 🌟 What's New in v0.0.3

#### 1. 🛡️ Proprietary Freeware License & Legal Attribution
* **Full Transition to Proprietary Freeware License (All Rights Reserved):** The project is licensed under a proprietary freeware model granting free personal use for streaming and video creation, while strictly prohibiting commercial resale, misattribution, and public redistribution of modified builds without prior written permission.
* **Removal of Open-Source References:** All legacy references to permissive open-source licenses have been thoroughly purged across all files, build scripts, and documentation.
* **Standardized Legal Notices:** Added standardized copyright headers `Copyright (c) 2026 FooZzee. All Rights Reserved.` across all source files (`.html`, `.js`, `.css`, `.ps1`), manifests, and config templates.

#### 2. 🔒 Credential Security Audit
* **Socket Token Sanitization:** Cleaned pre-filled placeholder tokens in `assets/js/ets2-config.js` (`donationAlerts.socketToken = ''`), eliminating any risk of exposing streamer credentials during repository cloning or distribution.
* **Safe Configuration Workflow:** User streaming credentials reside safely in `config.js` (untracked by Git), while `config.example.js` provides clean templates.

#### 3. ⚙️ PowerShell Automation Quality Standard
* **Strict UTF-8 with BOM Standard:** Standardized all PowerShell scripts (`scripts/installer.ps1`, `scripts/updater.ps1`, `scripts/configurator.ps1`, `scripts/udp-bridge.ps1`, `scripts/build-plugin.ps1`) to UTF-8 with BOM, resolving potential PowerShell parse anomalies on localized Windows systems.
* **Verified AST Syntax Integrity:** All automation scripts pass abstract syntax tree validation with `AST_ERRORS = 0`.
* **Reliable Path Resolution:** Standardized script execution path calculation via `$MyInvocation.MyCommand.Path` and `$PSScriptRoot`.

#### 4. 🔄 Synchronized Repository & Update Endpoints
* **Unified Repository Endpoints:** All update checks (`assets/js/ets2-updater.js`, `scripts/updater.ps1`, `scripts/installer.ps1`) are synchronized to point directly to `https://github.com/FooZzee/stream-overlay-cockpit`.
* **Automated Package Versioning:** Package version `v0.0.3` is dynamically reflected in installer headers, badges, and CRT updater terminals.

---

### 📦 Release Checksums / Контрольные суммы архива релиза

| File / Component | Size | SHA-256 Checksum | MD5 Checksum |
| :--- | :--- | :--- | :--- |
| `stream-overlay-cockpit-v0.0.3.zip` | 3.57 MB (3,748,499 B) | `454952445D2457657847F40FE2F56A7FE668E0BD339313302A40F47F654F14EA` | `8D20FA9470F34F331495D6129F33D107` |
| `overlayobs_foozzee_telemetry.dll` | 211 KB (216 064 B) | `2226F63B289AB4B3C79A30421C256B00415CDB42C5EFCC80AA7E61FABCCB9C60` | `AC18CB3EA72EBDB00526C7253CD93A79` |

---

### ⚡ Quick Start Guide (EN)

1. **Extract Archive:** Extract `stream-overlay-cockpit-v0.0.3.zip` into your desired folder (e.g., `C:\Stream_Overlay_Cockpit` or `D:\html\Overlay`).
2. **Run Setup Wizard:** Execute `Install-Overlay.bat` to configure streamer nickname, Twitch channel, camera frame (`4:3` or `16:9`), and auto-deploy the native SCS telemetry plugin into ETS2/ATS.
3. **Add OBS Browser Source:** In OBS Studio, add a new **Browser Source**, set URL to `file:///C:/Stream_Overlay_Cockpit/ets2-desktop.html`, Width: `1920`, Height: `1080`, FPS: `60`. **Uncheck** 'Local file'.
4. **Launch Telemetry Bridge:** Run `start-telemetry.bat` (or desktop shortcut `ETS2-ATS Overlay Bridge`) before launching the game.

---

<a id="-русское-описание-релиза-v003"></a>
## 🇷🇺 Русское описание релиза v0.0.3

> [!IMPORTANT]
> **Главное требование при установке:** Обязательно закройте Euro Truck Simulator 2 и American Truck Simulator перед установкой. В OBS Studio в источнике «Браузер» укажите локальный путь `file:///C:/Stream_Overlay_Cockpit/ets2-desktop.html` в поле URL и **снимите галочку** «Локальный файл».

### 🌟 Главные нововведения v0.0.3

#### 1. 🛡️ Проприетарная лицензия (Proprietary Freeware License)
* **Переход на Proprietary Freeware License (All Rights Reserved):** Проект переведён на проприетарную лицензию бесплатного личного использования на стримах и трансляциях. Коммерческая перепродажа, включение в платные сборки, выдача за свой продукт и публичное распространение модифицированных сборок без письменного согласия автора строго запрещены.
* **Исключение упоминаний открытых лицензий:** Из всех файлов проекта, скриптов и документации удалены устаревшие упоминания сторонних лицензий.
* **Единый копирайт:** В исходный код, документацию и графические интерфейсы интегрирован обязательный копирайт: `Copyright (c) 2026 FooZzee. All Rights Reserved.`

#### 2. 🔒 Аудит безопасности конфигурации
* **Очистка ключей сервисов:** В файле `assets/js/ets2-config.js` очищен токен подключения DonationAlerts (`donationAlerts.socketToken = ''`), исключающий утечку личных ключей стримера при клонировании репозитория.
* **Безопасность config.js:** Реальные ключи пользователя хранятся исключительно в локальном `config.js` (исключённом из Git), а файл `config.example.js` содержит безопасные шаблоны.

#### 3. ⚙️ Инженерный стандарт скриптов PowerShell
* **Стандартизация UTF-8 with BOM:** Все сценарии (`scripts/installer.ps1`, `scripts/updater.ps1`, `scripts/configurator.ps1`, `scripts/udp-bridge.ps1`, `scripts/build-plugin.ps1`) сохранены в кодировке UTF-8 с BOM, что исключает ошибки синтаксиса на любых локализациях Windows.
* **100% верификация AST:** Все сценарии проходят валидацию синтаксического дерева с результатом `AST_ERRORS = 0`.
* **Надёжная адресация путей:** Использованы безопасные конструкции определения путей `$MyInvocation.MyCommand.Path` и `$PSScriptRoot`.

#### 4. 🔄 Синхронизация репозитория и системы автообновления
* **Единый адрес репозитория:** Во всех модулях проверки обновлений (`assets/js/ets2-updater.js`, `scripts/updater.ps1`, `scripts/installer.ps1`) зафиксирован репозиторий `https://github.com/FooZzee/stream-overlay-cockpit`.
* **Автоматическое версионирование:** Актуальная версия `v0.0.3` отображается в шапке установщика, заголовках окон и ретро-терминале обновлений Pip-Boy 3000.

---

### 📦 Контрольные суммы архива релиза

| Файл / Компонент | Размер | Контрольная сумма SHA-256 | Контрольная сумма MD5 |
| :--- | :--- | :--- | :--- |
| `stream-overlay-cockpit-v0.0.3.zip` | 3.57 MB (3,748,499 B) | `454952445D2457657847F40FE2F56A7FE668E0BD339313302A40F47F654F14EA` | `8D20FA9470F34F331495D6129F33D107` |
| `overlayobs_foozzee_telemetry.dll` | 211 KB (216 064 B) | `2226F63B289AB4B3C79A30421C256B00415CDB42C5EFCC80AA7E61FABCCB9C60` | `AC18CB3EA72EBDB00526C7253CD93A79` |

---

### ⚡ Быстрая установка (RU)

1. **Распаковка:** Распакуйте архив `stream-overlay-cockpit-v0.0.3.zip` в рабочую папку (например, `C:\Stream_Overlay_Cockpit` или `D:\html\Overlay`).
2. **Мастер установки:** Запустите `Install-Overlay.bat` для выбора соотношения сторон камеры (`4:3` или `16:9`), ввода никнейма стримера, канала Twitch и автоустановки нативного плагина телеметрии в ETS2 и ATS.
3. **Настройка OBS Studio:** Добавьте источник «Браузер», укажите локальный URL `file:///C:/Stream_Overlay_Cockpit/ets2-desktop.html`, разрешение `1920x1080`, FPS `60`. **Снимите галочку** «Локальный файл».
4. **Запуск моста телеметрии:** Запустите `start-telemetry.bat` (или созданный ярлык `ETS2-ATS Overlay Bridge` на Рабочем столе) перед запуском игры.

---

### 👤 Автор проекта — FooZzee (стример и разработчик)

* 🌐 **Официальный сайт:** [foozzee.ru](https://foozzee.ru)
* 📺 **Twitch:** [twitch.tv/foozzee](https://twitch.tv/foozzee)
* 🎥 **YouTube:** [youtube.com/@foozzee](https://youtube.com/@foozzee)
* 📢 **Telegram:** [t.me/foozzeestream](https://t.me/foozzeestream)
* 👥 **VK:** [vk.ru/gtfun](https://vk.ru/gtfun)
* 📹 **VK Видео Live:** *(в разработке / in development)*
* 💖 **DonationAlerts:** [donationalerts.com/r/foozzee](https://www.donationalerts.com/r/foozzee)

[![Поддержать проект](https://img.shields.io/badge/Поддержать_проект-FF5E5B?style=for-the-badge&logo=heart&logoColor=white)](https://www.donationalerts.com/r/foozzee)

---

Copyright (c) 2026 FooZzee. All Rights Reserved.

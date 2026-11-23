# 🚛 ETS2 / ATS Stream Overlay Cockpit v0.0.2

[![Release](https://img.shields.io/badge/Release-v0.0.2-brightgreen?style=flat)](https://github.com/FooZzee/stream-overlay-cockpit/releases/tag/v0.0.2)
[![Platform](https://img.shields.io/badge/Platform-Windows_x64-blue?style=flat)](https://www.microsoft.com/windows)
[![SCS SDK](https://img.shields.io/badge/SCS_SDK-v1.16-orange?style=flat)](https://modding.scssoft.com/wiki/Documentation/Engine/SDK/Telemetry)
[![OBS Studio](https://img.shields.io/badge/OBS_Studio-28%2B-5c5cf0?style=flat)](https://obsproject.com/)
[![License](https://img.shields.io/badge/License-All_Rights_Reserved-ef4444?style=flat)](./LICENSE)

---

### 🌐 Quick Language Jump / Выбор языка (🇬🇧 English / 🇷🇺 Русский)

* [🇬🇧 English Release Notes](#-english-release-notes)
* [🇷🇺 Русское описание релиза v0.0.2](#-русское-описание-релиза-v002)

---

<a id="-english-release-notes"></a>
## 🇬🇧 English Release Notes

> [!IMPORTANT]
> **Corrected OBS Studio Setup & Automatic Updates:** Version v0.0.2 updates the OBS Studio connection guide (DO NOT check "Local file" so query parameters work), enables default background update checks via GitHub Releases API, and adds automated in-place package updates through the Pip-Boy 3000 updater with 100% preservation of your personal `config.js`.

### 🚀 What's New & Key Highlights

1. **Corrected OBS Studio Browser Source Setup (Uncheck 'Local file'):**
   * Updated instructions across all documentation and the Setup Wizard: in the OBS "Browser" source properties, **DO NOT** check "Local file" (which prevents OBS from passing URL query parameters).
   * Paste the path directly into the standard **URL** field: `C:\Stream_Overlay_Cockpit\ets2-desktop.html` (or with `?cam=4x3` / `?cam=16x9`).

2. **Automatic Update Checks Enabled by Default (`checkUpdates: true`):**
   * The overlay now automatically checks for new releases on startup using the official GitHub Releases API (`FooZzee/stream-overlay-cockpit`).
   * Fail-safe offline operation: if the stream host is offline or GitHub returns HTTP 404, the check exits completely silently without cluttering the OBS log console.

3. **Smart Pip-Boy 3000 Auto-Updater:**
   * SemVer-compliant version comparison (`v0.0.2` vs `latest` with 'v' prefix normalization).
   * Direct download and in-place extraction of `ETS2-ATS-Stream-Overlay-Cockpit-*.zip` release packages.
   * **Guaranteed `config.js` Protection:** Personal tokens, Twitch channel names, and custom settings are automatically backed up and restored during update.

4. **Repository Endpoint Synchronization:**
   * Centralized GitHub API endpoints preset in `config.example.js` and `scripts/installer.ps1`:
     * `githubRepo: 'FooZzee/stream-overlay-cockpit'`
     * `githubUrl: 'https://github.com/FooZzee/stream-overlay-cockpit'`
     * `releasesApiUrl: 'https://api.github.com/repos/FooZzee/stream-overlay-cockpit/releases/latest'`

5. **Synchronized v0.0.2 Versioning:**
   * All dashboard components, HTML headers, telemetry scripts, WPF setup wizard, and updater UI reflect the unified version `v0.0.2`.

---

### 📦 Asset Verification & Checksums

| File Name | Size (Bytes) | MD5 Checksum | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| **`ETS2-ATS-Stream-Overlay-Cockpit-v0.0.2.zip`** | `1,946,089` bytes | `f0e799e14173c48e2b26025debeea022` | `35f2cba1e050c37d9deb87c99048a3e2c69a14261e02a0c461edc6b297e9ca6f` |

---

### ⚡ Quick Start Guide

1. Download **`ETS2-ATS-Stream-Overlay-Cockpit-v0.0.2.zip`** and extract its contents.
2. Launch **`Install-Overlay.bat`**, choose your preferred webcam aspect ratio (`4:3` or `16:9`), and click **«INSTALL OVERLAY»**.
3. Launch the **«ETS2-ATS Overlay Bridge»** shortcut on your Desktop before starting the game.
4. In OBS Studio, add a **«Browser»** source with **1920×1080**. In source properties, **DO NOT** check "Local file" (otherwise webcam aspect ratio query parameters will not work). Paste the file path directly into the standard **URL** field: `C:\Stream_Overlay_Cockpit\ets2-desktop.html` (or with `?cam=4x3` / `?cam=16x9`).

---

<a id="-русское-описание-релиза-v002"></a>
## 🇷🇺 Русское описание релиза v0.0.2

> [!IMPORTANT]
> **Исправление настройки в OBS Studio и включение автообновлений:** В версии v0.0.2 исправлена инструкция подключения в OBS Studio (запрет установки галочки «Локальный файл» для работы URL-параметров камеры), активирована фоновая проверка обновлений через GitHub Releases API и автоматическое бесшовное обновление через интерфейс Pip-Boy 3000 со 100% сохранением пользовательского файла `config.js`.

### 🚀 Главные нововведения релиза

1. **Исправление настройки источника в OBS Studio (без галочки «Локальный файл»):**
   * В документации и мастере установки обновлена инструкция: в свойствах источника «Браузер» категорически **НЕ ставьте** галочку «Локальный файл» (иначе OBS не передаёт URL-параметры оверлею).
   * Вставьте путь к файлу прямо в обычное поле **URL**: `C:\Stream_Overlay_Cockpit\ets2-desktop.html` (или с параметром `?cam=4x3` / `?cam=16x9`).

2. **Автоматическая проверка обновлений по умолчанию (`checkUpdates: true`):**
   * При старте оверлея в OBS Studio выполняется фоновый запрос к официальному GitHub API репозитория `FooZzee/stream-overlay-cockpit`.
   * Бесшумный отказоустойчивый режим: при отсутствии интернета или ответе HTTP 404 оверлей тихо завершает проверку без предупреждений и ошибок в консоли OBS.

3. **Интеллектуальный автоапдейтер Pip-Boy 3000:**
   * Корректная оценка SemVer-версий (`v0.0.2` vs `latest` с нормализацией префикса `v`).
   * Прямая загрузка и распаковка чистого архива `ETS2-ATS-Stream-Overlay-Cockpit-*.zip`.
   * **Гарантия сохранности `config.js`:** Личные токены DonationAlerts, имя канала Twitch и индивидуальные настройки автоматически архивируются и восстанавливаются при обновлении.

4. **Синхронизация параметров репозитория:**
   * В шаблоне `config.example.js` и мастере установки `Install-Overlay.bat` по умолчанию настроены официальные эндпоинты:
     * `githubRepo: 'FooZzee/stream-overlay-cockpit'`
     * `githubUrl: 'https://github.com/FooZzee/stream-overlay-cockpit'`
     * `releasesApiUrl: 'https://api.github.com/repos/FooZzee/stream-overlay-cockpit/releases/latest'`

5. **Синхронизация версий v0.0.2:**
   * Полное обновление версионных тегов во всех модулях оверлея, HTML-разметке, скриптах телеметрии, графическом установщике и окне автообновления.

---

### 📦 Контрольные суммы архива релиза

| Имя файла | Размер (в байтах) | Контрольная сумма MD5 | Контрольная сумма SHA-256 |
| :--- | :--- | :--- | :--- |
| **`ETS2-ATS-Stream-Overlay-Cockpit-v0.0.2.zip`** | `1,946,089` байт | `f0e799e14173c48e2b26025debeea022` | `35f2cba1e050c37d9deb87c99048a3e2c69a14261e02a0c461edc6b297e9ca6f` |

---

### ⚡ Быстрая установка

1. Скачайте архив **`ETS2-ATS-Stream-Overlay-Cockpit-v0.0.2.zip`** и распакуйте его в любую удобную папку.
2. Запустите файл **`Install-Overlay.bat`**, выберите нужный формат веб-камеры (`4:3` или `16:9`) и нажмите кнопку **«УСТАНОВИТЬ ОВЕРЛЕЙ»**.
3. Перед запуском игры откройте ярлык **«ETS2-ATS Overlay Bridge»** на Рабочем столе.
4. В OBS Studio добавьте источник **«Браузер»** с разрешением **1920×1080**. В настройках источника «Браузер» **НЕ ставьте** галочку «Локальный файл» (иначе не будут работать URL-параметры пропорций камеры). Вставьте путь к файлу прямо в обычное поле **URL**: `C:\Stream_Overlay_Cockpit\ets2-desktop.html` (или с параметром `?cam=4x3` / `?cam=16x9`).

---

### 👤 Автор проекта — FooZzee

* **Официальный сайт:** https://foozzee.ru
* **Twitch:** https://twitch.tv/foozzee
* **YouTube:** https://youtube.com/@foozzee
* **Telegram канал:** https://t.me/foozzeestream
* **Сообщество VK:** https://vk.ru/gtfun
* **Поддержать разработку:** [DonationAlerts (https://www.donationalerts.com/r/foozzee)](https://www.donationalerts.com/r/foozzee)

---

Copyright (c) 2026 FooZzee. All Rights Reserved.

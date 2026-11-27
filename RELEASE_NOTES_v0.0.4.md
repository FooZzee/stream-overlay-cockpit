# 🚛 ETS2 / ATS Stream Overlay Cockpit v0.0.4

[![Release](https://img.shields.io/badge/Release-v0.0.4-00e5ff?style=flat)](https://github.com/FooZzee/stream-overlay-cockpit/releases/tag/v0.0.4)
[![Platform](https://img.shields.io/badge/Platform-Windows_x64-0078d4?style=flat)](https://github.com/FooZzee/stream-overlay-cockpit)
[![SCS SDK](https://img.shields.io/badge/SCS_SDK-1.16-f59e0b?style=flat)](https://modding.scssoft.com/wiki/Documentation/Engine/SDK/Telemetry)
[![OBS Studio](https://img.shields.io/badge/OBS_Studio-Browser_Source-302e31?style=flat)](https://obsproject.com/)
[![License: All Rights Reserved](https://img.shields.io/badge/License-All_Rights_Reserved-ef4444?style=flat)](./LICENSE)

[🇬🇧 English](#english) • [🇷🇺 Русский](#russian)

---

<a id="english"></a>
## 🇬🇧 English

> [!IMPORTANT]
> **v0.0.4** introduces the **matte 3D-carousel chat** (70% opacity, borderless, zero `backdrop-filter`) with **Twitch + 7TV/BTTV/FFZ** emotes, real **Twitch GQL** badges, an interactive **«ОЦЕНИТЕ ИГРУ» (`!0`–`!5`)** poll, a **«Не забудь подписаться:»** socials card, a focused **WPF Configurator** with desktop shortcut support, and a standalone **EXE Setup Wizard** with built-in Uninstaller.

### What's New
- **Matte 3D-Carousel Chat (`rgba(14, 16, 20, 0.70)`):** Borderless floating message pills with height-based dynamic pruning, native Twitch IRC emotes (`Array.from` Unicode code points) + 7TV/BTTV/FFZ, and real Twitch GQL `broadcastBadges` with text fallbacks.
- **3D Flip Poll (`!0`–`!5`) & Socials Card:** Infinite cycle (**Chat 5m → Poll 1m → Chat 5m → Socials 1m**), 3-block poll card (`2px` gap), 1–5 rating average without `!0` distortion, raw vote capture before `hideCommands`, and priority manual `chat.gameTitle` or `auto` detection.
- **Focused Configurator & Desktop Shortcut:** Dedicated Twitch, DonationAlerts, 3D-block, and 7-command controls (`!гудок`, `!рация`, `!рейс`, `!стата`, `!тягач`, `!водитель`, `!ставка`), dark `ComboBox` templates, and a desktop shortcut toggle with `assets/icons/cockpit-configurator.ico`.
- **Standalone EXE Installer & Safe Uninstaller:** Self-contained `.exe` setup wizard with embedded release archive and safe `Uninstall.exe` preservation of `config.js`.

### Quick Start Guide
1. Download and run `Stream_Overlay_Cockpit_Setup_v0.0.4.exe` (or extract `Stream_Overlay_Cockpit-v0.0.4.zip`).
2. Launch `Configure-Overlay.bat` (or desktop shortcut) to set Twitch, DonationAlerts, poll `gameTitle` / `auto`, socials, and 7 chat commands.
3. Add `ets2-desktop.html` as an OBS Browser Source (`1920×1080`, uncheck 'Local file').

[![Support Project](https://img.shields.io/badge/Support_Project-FF5E5B?style=for-the-badge&logo=heart&logoColor=white)](https://www.donationalerts.com/r/foozzee)

---

<a id="russian"></a>
## 🇷🇺 Русский

> [!IMPORTANT]
> **Релиз v0.0.4** добавляет **матовый 3D-чат** (непрозрачность 70%, без обводок и `backdrop-filter`) со смайлами **Twitch + 7TV/BTTV/FFZ**, реальными бейджами **Twitch GQL**, интерактивным опросником **«ОЦЕНИТЕ ИГРУ» (`!0`–`!5`)**, карточкой **«Не забудь подписаться:»**, сфокусированным **WPF-конфигуратором** с ярлыком и автономным **EXE-установщиком** со встроенным деинсталлятором.

### Главные нововведения
- **Матовый 3D-чат (`rgba(14, 16, 20, 0.70)`):** плашки сообщений без обводок и теней с динамическим лимитом по высоте слота, нативные смайлы Twitch (`Array.from` по Unicode code points) + 7TV/BTTV/FFZ и реальные бейджи Twitch GQL с текстовым фолбэком.
- **3D-карусель, опросник (`!0`–`!5`) и карточка соцсетей:** бесконечный цикл (**Чат 5 мин → Опросник 1 мин → Чат 5 мин → «Не забудь подписаться:» 1 мин**), 3 матовых блока опросника с зазором `2px`, расчёт среднего только по `1–5`, перехват голосов до `hideCommands` и приоритет ручного `chat.gameTitle` над `auto`.
- **Обновлённый конфигуратор и ярлык:** секции Twitch, DonationAlerts, 3D-блока, 7 команд чата (`!гудок`, `!рация`, `!рейс`, `!стата`, `!тягач`, `!водитель`, `!ставка`), тёмный `ComboBox` и переключатель ярлыка с иконкой `assets/icons/cockpit-configurator.ico`.
- **Автономный EXE-установщик и безопасное удаление:** единый `.exe` со встроенным архивом и `Uninstall.exe`, сохраняющий `config.js` при снятой галочке удаления.

### Быстрая установка
1. Скачайте и запустите `Stream_Overlay_Cockpit_Setup_v0.0.4.exe` (или распакуйте `Stream_Overlay_Cockpit-v0.0.4.zip`).
2. Откройте `Configure-Overlay.bat` (или ярлык на Рабочем столе) для настройки Twitch, DonationAlerts, `gameTitle` (`auto` или своё), соцсетей и 7 команд чата.
3. Добавьте `ets2-desktop.html` в OBS как Browser Source (`1920×1080`, снимите галочку «Локальный файл»).

[![Поддержать проект](https://img.shields.io/badge/Поддержать_проект-FF5E5B?style=for-the-badge&logo=heart&logoColor=white)](https://www.donationalerts.com/r/foozzee)

---

### Автор проекта — FooZzee
- **GitHub:** https://github.com/FooZzee/stream-overlay-cockpit
- **Сайт:** https://foozzee.ru
- **Twitch:** https://twitch.tv/foozzee
- **YouTube:** https://youtube.com/@foozzee
- **Telegram:** https://t.me/foozzeestream
- **VK:** https://vk.ru/gtfun
- **DonationAlerts:** https://www.donationalerts.com/r/foozzee

Copyright (c) 2026 FooZzee. All Rights Reserved.

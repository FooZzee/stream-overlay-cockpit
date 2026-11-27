<div align="center">
  <img src="./assets/img/logo.png" alt="ETS2 / ATS Stream Overlay Cockpit Logo" width="112" />
  <h1>ETS2 / ATS Stream Overlay Cockpit v0.0.4</h1>
  <p><strong>60 FPS Telemetry Broadcast HUD for Euro Truck Simulator 2 &amp; American Truck Simulator</strong></p>

  [![Release](https://img.shields.io/badge/Release-v0.0.4-00e5ff?style=flat)](https://github.com/FooZzee/stream-overlay-cockpit/releases/tag/v0.0.4)
  [![Platform](https://img.shields.io/badge/Platform-Windows_x64-0078d4?style=flat)](https://www.microsoft.com/windows)
  [![SCS SDK](https://img.shields.io/badge/SCS_SDK-1.16-f59e0b?style=flat)](https://modding.scssoft.com/wiki/Documentation/Engine/SDK/Telemetry)
  [![OBS Studio](https://img.shields.io/badge/OBS_Studio-28%2B-5c5cf0?style=flat)](https://obsproject.com/)
  [![License](https://img.shields.io/badge/License-All_Rights_Reserved-ef4444?style=flat)](./LICENSE)

  <br />

  [![Поддержать проект](https://img.shields.io/badge/Поддержать_проект-FF5E5B?style=for-the-badge&logo=heart&logoColor=white)](https://www.donationalerts.com/r/foozzee)
  [![Support Project](https://img.shields.io/badge/Support_Project-FF5E5B?style=for-the-badge&logo=heart&logoColor=white)](https://www.donationalerts.com/r/foozzee)

  <p>
    <a href="./README.ru.md">Русский (README.ru.md)</a> ·
    <a href="./README.en.md">English (README.en.md)</a> ·
    <a href="./CHANGELOG.md">Changelog</a> ·
    <a href="./commands.md">Commands</a> ·
    <a href="./RELEASE_NOTES_v0.0.4.md">Release Notes v0.0.4</a>
  </p>
</div>

---

## Русский · [Полная версия](./README.ru.md)

**Stream Overlay Cockpit** спроектирован под реальный стрим в OBS Studio (`1920×1080` / `2560×1440`) со стабильными **60 FPS** без тяжёлых GPU-шейдеров `backdrop-filter: blur`:

- **Нативный плагин SCS SDK 1.16 (`overlayobs_foozzee_telemetry.dll`):** прямой захват скорости, оборотов, передачи КПП, давления воздуха, топлива, температур, педалей, угла руля, груза и реального ETA через локальный мост `127.0.0.1:30002` без потери FPS в игре.
- **Матовый 3D-чат (`rgba(14, 16, 20, 0.70)`):** отдельные плашки без обводок и размытия, очистка по высоте слота, нативные смайлы Twitch + **7TV / BTTV / FFZ**, реальные бейджи **Twitch GQL** и бесконечная 3D-карусель (**Чат 5 мин → Опросник `!0–!5` 1 мин → Чат 5 мин → Карточка «Не забудь подписаться:» 1 мин**).
- **7 интерактивных команд и конфигуратор:** команды `!гудок`, `!рация`, `!рейс`, `!стата`, `!тягач`, `!водитель`, `!ставка` с индивидуальными флагами, плюс WPF-конфигуратор и установщик с выбором языка (`Русский / English`) и ярлыками `Overlay Bridge`, `Overlay Configurator`, `Overlay Update`.

### Быстрый старт (RU)
1. Запустите `Stream_Overlay_Cockpit_Setup_v0.0.4.exe`, выберите **Русский** и подтвердите пути ETS2/ATS для установки плагина.
2. Откройте **`Overlay Configurator`** на Рабочем столе (укажите канал Twitch, токен DonationAlerts, `gameTitle` для опросника и ссылки соцсетей).
3. В OBS добавьте **«Браузер»**, снимите галочку **«Локальный файл»**, укажите `file:///C:/Stream_Overlay_Cockpit/ets2-desktop.html` (`1920×1080`, `60 FPS`) и запустите **`Overlay Bridge`** перед игрой.

---

## English · [Full Documentation](./README.en.md)

**Stream Overlay Cockpit** is built for live OBS Studio broadcasts (`1920×1080` / `2560×1440`) at a locked **60 FPS** with zero `backdrop-filter: blur` overhead:

- **Native SCS SDK 1.16 Telemetry (`overlayobs_foozzee_telemetry.dll`):** Captures speed, RPM, gear, air pressure, fuel, temperatures, pedal travel, steering angle, cargo, and real-time ETA from Shared Memory via a local `127.0.0.1:30002` bridge.
- **Matte 3D-Carousel Chat (`rgba(14, 16, 20, 0.70)`):** Borderless dark-matte message pills, height-aware DOM pruning, native Twitch IRC emotes + **7TV / BTTV / FFZ**, real **Twitch GQL** badges, and an infinite 3D flip cycle (**Chat 5m → `!0–!5` Game Poll 1m → Chat 5m → Socials Card 1m**).
- **7 Chat Commands & Bilingual Setup:** Toggleable commands (`!honk`, `!cb`, `!route`, `!stats`, `!truck`, `!driver`, `!bet`), focused WPF configurator, and standalone `.exe` setup with **Русский / English** switcher and `Overlay Bridge`, `Overlay Configurator`, `Overlay Update` shortcuts.

### Quick Start (EN)
1. Run `Stream_Overlay_Cockpit_Setup_v0.0.4.exe`, select **English**, and confirm ETS2/ATS paths for automatic plugin deployment.
2. Launch **`Overlay Configurator`** from your Desktop to configure Twitch, DonationAlerts, poll `gameTitle`, social links, and chat commands.
3. In OBS Studio, add a **Browser Source**, uncheck **Local file**, set URL to `file:///C:/Stream_Overlay_Cockpit/ets2-desktop.html` (`1920×1080`, `60 FPS`), and start **`Overlay Bridge`** before launching the game.

---

## Visual Previews / Превью интерфейса

### Cockpit HUD — 4:3 Webcam Frame (Default / по умолчанию)
![ETS2 / ATS Stream Overlay Cockpit 4:3](./assets/previews/preview-cockpit-4x3.png)

### Cockpit HUD — 16:9 Widescreen Webcam Frame (`?cam=16x9`)
![ETS2 / ATS Stream Overlay Cockpit 16:9](./assets/previews/preview-cockpit-16x9.png)

### Matte 3D-Flip Game Rating Poll (`!0–!5`) / Матовый 3D-опросник
![Matte 3D Game Rating Poll](./assets/previews/preview-poll-3d.png)

---

## Author & Links / Автор проекта — FooZzee

- **GitHub:** https://github.com/FooZzee/stream-overlay-cockpit
- **Website / Сайт:** https://foozzee.ru
- **Twitch:** https://twitch.tv/foozzee
- **YouTube:** https://youtube.com/@foozzee
- **Telegram:** https://t.me/foozzeestream
- **VK:** https://vk.ru/gtfun
- **DonationAlerts:** https://www.donationalerts.com/r/foozzee

> Proprietary Freeware License (All Rights Reserved). See [LICENSE](./LICENSE).

Copyright (c) 2026 FooZzee. All Rights Reserved.

<div align="center">
  <img src="./assets/img/logo.png" alt="ETS2 / ATS Stream Overlay Cockpit Logo" width="124" />
  <h1>ETS2 / ATS Stream Overlay Cockpit</h1>
  <p><strong>60 FPS Zero-Blur Telemetry HUD &amp; Matte 3D Chat for Euro Truck Simulator 2 and American Truck Simulator</strong></p>

  [![Release](https://img.shields.io/badge/Release-v0.0.4-00e5ff?style=flat)](https://github.com/FooZzee/stream-overlay-cockpit/releases/tag/v0.0.4)
  [![Platform](https://img.shields.io/badge/Platform-Windows_x64-0078d4?style=flat)](https://www.microsoft.com/windows)
  [![SCS SDK](https://img.shields.io/badge/SCS_SDK-1.16-f59e0b?style=flat)](https://modding.scssoft.com/wiki/Documentation/Engine/SDK/Telemetry)
  [![OBS Studio](https://img.shields.io/badge/OBS_Studio-28%2B-5c5cf0?style=flat)](https://obsproject.com/)
  [![FPS](https://img.shields.io/badge/60_FPS-Zero_Blur-22c55e?style=flat)](#architecture)
  [![License](https://img.shields.io/badge/License-All_Rights_Reserved-ef4444?style=flat)](./LICENSE)

  <br />

  [![Support Project](https://img.shields.io/badge/Support_Project_%2F_Поддержать_проект-FF5E5B?style=for-the-badge&logo=heart&logoColor=white)](https://www.donationalerts.com/r/foozzee)

  <p>
    <a href="#russian">Русский</a> ·
    <a href="#english">English</a> ·
    <a href="./README.ru.md">README.ru.md</a> ·
    <a href="./README.en.md">README.en.md</a> ·
    <a href="./CHANGELOG.md">CHANGELOG</a> ·
    <a href="./commands.md">Commands &amp; API</a> ·
    <a href="./RELEASE_NOTES_v0.0.4.md">Release v0.0.4</a>
  </p>
</div>

---

## Live Interface Showcase / Посмотрите в деле

<div align="center">
  <p><strong>16:9 Widescreen Cockpit HUD — 1920×1080 / 2560×1440 @ 60 FPS</strong></p>
  <img src="./assets/previews/preview-cockpit-16x9.png" alt="ETS2 / ATS Stream Overlay Cockpit 16:9" width="100%" />
</div>

<table>
  <tr>
    <td width="50%" align="center" valign="top">
      <strong>4:3 Webcam Frame / Рамка 4:3</strong><br />
      <img src="./assets/previews/preview-cockpit-4x3.png" alt="Cockpit 4:3 Webcam Frame" width="100%" />
      <p>Cluster-height aligned frame (<code>325×244 px @ 1080p</code> | <code>397×298 px @ 1440p</code>) with live trip clock, <code>10px</code> corner radius, and opaque <code>#0B0F17</code> gauges.</p>
    </td>
    <td width="50%" align="center" valign="top">
      <strong>Matte 3D Poll (<code>!0–!5</code>) / 3D-опросник</strong><br />
      <img src="./assets/previews/preview-poll-3d.png" alt="Matte 3D Game Rating Poll" width="100%" />
      <p>Borderless <code>rgba(14, 16, 20, 0.70)</code> 3D-carousel face: captures votes before <code>hideCommands</code>, computes <code>1–5</code> rating excluding <code>!0</code>, and respects manual <code>gameTitle</code>.</p>
    </td>
  </tr>
</table>

---

## Desktop Suite & Custom Icons / Десктопный пакет и иконки

<table>
  <tr>
    <td width="33.3%" align="center" valign="top">
      <img src="./assets/previews/icon-bridge.png" alt="Overlay Bridge Icon" width="72" /><br />
      <strong><code>Overlay Bridge</code></strong><br />
      <sub>Local HTTP telemetry bridge (<code>127.0.0.1:30002</code>) reading SCS SDK 1.16 Shared Memory at minimal CPU cost.</sub>
    </td>
    <td width="33.3%" align="center" valign="top">
      <img src="./assets/previews/icon-configurator.png" alt="Overlay Configurator Icon" width="72" /><br />
      <strong><code>Overlay Configurator</code></strong><br />
      <sub>Focused WPF GUI for Twitch, DonationAlerts, 3D-poll <code>gameTitle</code>, socials, and all 7 chat commands.</sub>
    </td>
    <td width="33.3%" align="center" valign="top">
      <img src="./assets/previews/icon-updater.png" alt="Overlay Update Icon" width="72" /><br />
      <strong><code>Overlay Update</code></strong><br />
      <sub>GitHub release updater syncing new builds while preserving your local <code>config.js</code> tokens and settings.</sub>
    </td>
  </tr>
</table>

---

<a id="architecture"></a>
## Architecture Pipeline / Архитектура (60 FPS Zero-Blur)

```text
ETS2 / ATS Shared Memory ─▶ overlayobs_foozzee_telemetry.dll ─▶ Local HTTP Bridge (127.0.0.1:30002) ─▶ OBS Browser Source @ 60 FPS (Zero Blur)
```

---

<a id="russian"></a>
## Русский · [Полная документация (README.ru.md)](./README.ru.md)

<table>
  <tr>
    <td width="240" align="center" valign="middle">
      <a href="https://rtrucksim.fr/" target="_blank" rel="noopener noreferrer">
        <img src="./assets/img/rTruckSim.png" alt="rTruckSim" width="220" />
      </a>
    </td>
    <td valign="middle">
      <p><strong>Stream Overlay Cockpit</strong> — автономный HUD для прямых трансляций ETS2 и ATS в OBS Studio (<code>1920×1080</code> и <code>2560×1440</code>) на стабильных <strong>60 FPS</strong> без <code>backdrop-filter: blur</code>. Автор вдохновился проектом <a href="https://rtrucksim.fr/" target="_blank" rel="noopener noreferrer"><strong>rTruckSim</strong></a> и создал собственный независимый оверлей с матовым 3D-чатом и нативным десктопным пакетом.</p>
      <ul>
        <li><strong>Спецификация:</strong> Формат данных телеметрии основан на rTruckSim (https://rtrucksim.fr/) / Telemetry data format based on rTruckSim (https://rtrucksim.fr/).</li>
        <li><strong>Совместимость:</strong> <code>overlayobs_foozzee_telemetry.dll</code> работает изолированно без конфликта с <code>rtrucksim_telemetry.dll</code>.</li>
      </ul>
    </td>
  </tr>
</table>

### Модули и возможности

| Модуль | Инженерная реализация |
| :--- | :--- |
| **Приборная панель** | Спидометр `0–160` (`km/h` / `mph`), тахометр с зонами, передача КПП, пневмосистема, топливо, температуры ОЖ и масла, педали, угол руля, износ и живой ETA |
| **Рамка веб-камеры** | `4:3` (`325×244 px @ 1080p` \| `397×298 px @ 1440p`) и `16:9` (`384×216 px @ 1080p` \| `464×261 px @ 1440p`), таймер рейса, скругление `10px`, плотный фон `#0B0F17` |
| **Матовый 3D-чат и опросник** | Плашки `rgba(14, 16, 20, 0.70)` без blur, очистка DOM по высоте слота, смайлы Twitch (`Array.from`) + **7TV/BTTV/FFZ**, бейджи **Twitch GQL**, цикл `5m Chat -> 1m Poll (!0–!5) -> 5m Chat -> 1m Socials` |
| **Алерты и установщик `RU / EN`** | Донаты/подписки/рейды с разлётом на частицы, WPF-мастер (`SizeToContent.Height`), запись языка в `config.js` и реестр, автоустановка DLL и безопасный `Uninstall.exe` |

### 7 команд чата

| Команда | Алиасы | Действие |
| :--- | :--- | :--- |
| `!гудок` | `!фафа`, `!клаксон`, `!honk` | Пневмосигнал тягача и отклик на приборке |
| `!рация` | `!сиби`, `!cb` | Вывод сообщения зрителя на CB-экран рации |
| `!рейс` | `!маршрут`, `!груз`, `!job`, `!route` | Город отправления/назначения, груз, дистанция и оплата |
| `!стата` | `!статистика`, `!стрим`, `!stats` | Пробег, выполненные заказы и доход за стрим |
| `!тягач` | `!автобус`, `!машина`, `!truck` | Марка/модель, передача, круиз-контроль и износ |
| `!водитель` | `!права`, `!рейтинг`, `!driver` | Карточка пилота и ключевая статистика |
| `!ставка` | `!bet` | Прогноз зрителей по исходу/времени рейса |

### Быстрый старт в OBS Studio

> [!IMPORTANT]
> В источнике «Браузер» **обязательно снимите галочку «Локальный файл»**, иначе OBS игнорирует URL-параметры (`?cam=16x9`, `?theme=ice`).

1. Запустите `Stream_Overlay_Cockpit_Setup_v0.0.4.exe`, выберите **Русский** и подтвердите пути к ETS2/ATS.
2. Откройте **`Overlay Configurator`** на Рабочем столе: укажите Twitch, DonationAlerts, `gameTitle` (`auto` или вручную), соцсети и кулдауны команд.
3. В OBS Studio добавьте **«Браузер»**, снимите галочку **«Локальный файл»**, укажите `file:///C:/Stream_Overlay_Cockpit/ets2-desktop.html` (или `?cam=16x9`), `1920×1080`, `60 FPS`.
4. Запустите **`Overlay Bridge`** перед стартом игры.

**URL-параметры:** `?cam=4x3|16x9` · `?theme=amber|ice` · `?view=chat|poll|socials` · `?fast=1` · `?test=1` · `?demo=1` · `?lang=ru|en` · `?units=kmh|mph`

---

<a id="english"></a>
## English · [Full Documentation (README.en.md)](./README.en.md)

<table>
  <tr>
    <td width="240" align="center" valign="middle">
      <a href="https://rtrucksim.fr/" target="_blank" rel="noopener noreferrer">
        <img src="./assets/img/rTruckSim.png" alt="rTruckSim" width="220" />
      </a>
    </td>
    <td valign="middle">
      <p><strong>Stream Overlay Cockpit</strong> is a standalone broadcast-grade HUD for ETS2 and ATS engineered to stay locked at <strong>60 FPS</strong> in OBS Studio (<code>1920×1080</code> and <code>2560×1440</code>) with zero <code>backdrop-filter: blur</code>. Inspired by <a href="https://rtrucksim.fr/" target="_blank" rel="noopener noreferrer"><strong>rTruckSim</strong></a>, this project was built as a custom zero-blur 60 FPS overlay with a matte 3D chat carousel and native desktop suite.</p>
      <ul>
        <li><strong>Specification:</strong> Telemetry data format based on rTruckSim (https://rtrucksim.fr/).</li>
        <li><strong>Isolation:</strong> <code>overlayobs_foozzee_telemetry.dll</code> runs in isolation without conflicting with <code>rtrucksim_telemetry.dll</code>.</li>
      </ul>
    </td>
  </tr>
</table>

### Subsystems & Capabilities

| Subsystem | Implementation Details |
| :--- | :--- |
| **Cockpit Telemetry** | Speedometer `0–160` (`km/h` / `mph`), zone-colored tachometer, gear indicator, pneumatic air pressure, fuel, coolant/oil temps, pedals, steering angle, wear, and live ETA |
| **Webcam Frame** | `4:3` (`325×244 px @ 1080p` \| `397×298 px @ 1440p`) and `16:9` (`384×216 px @ 1080p` \| `464×261 px @ 1440p`), integrated trip clock, `10px` radius, opaque `#0B0F17` |
| **Matte 3D Chat & Poll** | Borderless `rgba(14, 16, 20, 0.70)` pills with zero blur, height-aware DOM pruning, Twitch emotes (`Array.from`) + **7TV/BTTV/FFZ**, real **Twitch GQL** badges, `5m Chat -> 1m Poll (!0–!5) -> 5m Chat -> 1m Socials` |
| **Alerts & Setup (`RU / EN`)** | Slide-out shatter alerts, auto-sized WPF wizard (`SizeToContent.Height`), `config.js` & registry persistence, auto DLL deployment, and safe `Uninstall.exe` |

### 7 Chat Commands

| Command | Aliases | Action |
| :--- | :--- | :--- |
| `!honk` | `!гудок`, `!фафа`, `!клаксон` | Air horn sound and visual cluster feedback |
| `!cb` | `!рация`, `!сиби` | Displays viewer text on the CB radio screen |
| `!route` | `!job`, `!рейс`, `!маршрут`, `!груз` | Origin, destination, cargo, mass, remaining distance, and payout |
| `!stats` | `!стата`, `!статистика`, `!стрим` | Session mileage, completed jobs, and total revenue |
| `!truck` | `!тягач`, `!автобус`, `!машина` | Truck make/model, gear, cruise control, and wear |
| `!driver` | `!водитель`, `!права`, `!рейтинг` | Driver profile card and session highlights |
| `!bet` | `!ставка` | Viewer trip outcome / ETA prediction command |

### Quick Start in OBS Studio

> [!IMPORTANT]
> Always **uncheck "Local file"** in OBS Browser Source properties — otherwise OBS ignores URL parameters (`?cam=16x9`, `?theme=ice`).

1. Run `Stream_Overlay_Cockpit_Setup_v0.0.4.exe`, select **English**, and verify ETS2/ATS paths.
2. Open **`Overlay Configurator`** from your Desktop to configure Twitch, DonationAlerts, poll `gameTitle` (`auto` or custom), social links, and command cooldowns.
3. In OBS Studio, add a **Browser Source**, **uncheck "Local file"**, set URL to `file:///C:/Stream_Overlay_Cockpit/ets2-desktop.html` (or `?cam=16x9`), `1920×1080`, `60 FPS`.
4. Launch **`Overlay Bridge`** before starting the simulator.

**URL Parameters:** `?cam=4x3|16x9` · `?theme=amber|ice` · `?view=chat|poll|socials` · `?fast=1` · `?test=1` · `?demo=1` · `?lang=en|ru` · `?units=kmh|mph`

---

## Author — FooZzee

<p align="left">
  <a href="https://github.com/FooZzee/stream-overlay-cockpit"><img src="https://img.shields.io/badge/GitHub-FooZzee-181717?style=flat&logo=github" alt="GitHub" /></a>
  <a href="https://foozzee.ru"><img src="https://img.shields.io/badge/Website-foozzee.ru-00e5ff?style=flat" alt="Website" /></a>
  <a href="https://twitch.tv/foozzee"><img src="https://img.shields.io/badge/Twitch-foozzee-9146FF?style=flat&logo=twitch&logoColor=white" alt="Twitch" /></a>
  <a href="https://youtube.com/@foozzee"><img src="https://img.shields.io/badge/YouTube-@foozzee-FF0000?style=flat&logo=youtube&logoColor=white" alt="YouTube" /></a>
  <a href="https://t.me/foozzeestream"><img src="https://img.shields.io/badge/Telegram-foozzeestream-26A5E4?style=flat&logo=telegram&logoColor=white" alt="Telegram" /></a>
  <a href="https://vk.ru/gtfun"><img src="https://img.shields.io/badge/VK-gtfun-0077FF?style=flat&logo=vk&logoColor=white" alt="VK" /></a>
  <a href="https://www.donationalerts.com/r/foozzee"><img src="https://img.shields.io/badge/DonationAlerts-foozzee-F57C00?style=flat" alt="DonationAlerts" /></a>
</p>

> Proprietary Freeware License (All Rights Reserved). See [LICENSE](./LICENSE).  
> Copyright (c) 2026 FooZzee. All Rights Reserved.

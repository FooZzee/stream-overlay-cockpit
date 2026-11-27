<div align="center">
  <img src="./assets/img/logo.png" alt="ETS2 / ATS Stream Overlay Cockpit Logo" width="124" />
  <h1>ETS2 / ATS Stream Overlay Cockpit</h1>
  <p><strong>Zero-Blur 60 FPS Telemetry HUD &amp; Matte 3D Chat for Euro Truck Simulator 2 and American Truck Simulator</strong></p>

  [![Release](https://img.shields.io/badge/Release-v0.0.4-00e5ff?style=flat)](https://github.com/FooZzee/stream-overlay-cockpit/releases/tag/v0.0.4)
  [![Platform](https://img.shields.io/badge/Platform-Windows_x64-0078d4?style=flat)](https://www.microsoft.com/windows)
  [![SCS SDK](https://img.shields.io/badge/SCS_SDK-1.16-f59e0b?style=flat)](https://modding.scssoft.com/wiki/Documentation/Engine/SDK/Telemetry)
  [![OBS Studio](https://img.shields.io/badge/OBS_Studio-28%2B-5c5cf0?style=flat)](https://obsproject.com/)
  [![FPS](https://img.shields.io/badge/60_FPS-Zero_Blur-22c55e?style=flat)](#architecture-en)
  [![License](https://img.shields.io/badge/License-All_Rights_Reserved-ef4444?style=flat)](./LICENSE)

  <br />

  [![Support Project](https://img.shields.io/badge/Support_Project-FF5E5B?style=for-the-badge&logo=heart&logoColor=white)](https://www.donationalerts.com/r/foozzee)

  <p>
    <a href="./README.md">README.md</a> ·
    <a href="./README.ru.md">Русский (README.ru.md)</a> ·
    <a href="./CHANGELOG.en.md">Changelog</a> ·
    <a href="./commands.en.md">Chat Commands</a> ·
    <a href="./RELEASE_NOTES_v0.0.4.md">Release v0.0.4</a>
  </p>
</div>

---

## Engineering Overview

**ETS2 / ATS Stream Overlay Cockpit** is a standalone broadcast HUD locked at **60 FPS** with zero `backdrop-filter: blur`. Inspired by [rTruckSim](https://rtrucksim.fr/), this project was built as the author's own zero-blur 60 FPS telemetry overlay, matte 3D chat carousel, and desktop toolkit for ETS2 / ATS live streams.

## Live Interface Showcase

<div align="center">
  <p><strong>16:9 Widescreen Cockpit HUD — 1920×1080 / 2560×1440 @ 60 FPS</strong></p>
  <img src="./assets/previews/preview-cockpit-16x9.png" alt="ETS2 / ATS Stream Overlay Cockpit 16:9" width="100%" />
</div>

<table>
  <tr>
    <td width="50%" align="center" valign="top">
      <strong>4:3 Standard Webcam Frame</strong><br />
      <img src="./assets/previews/preview-cockpit-4x3.png" alt="4:3 Standard Webcam Frame" width="100%" />
      <p>Cluster-height aligned camera frame (<code>325×244 px @ 1080p</code> | <code>397×298 px @ 1440p</code>) with an integrated live trip clock and 100% opaque <code>#0B0F17</code> gauges.</p>
    </td>
    <td width="50%" align="center" valign="top">
      <strong>Matte 3D Game Rating Poll (<code>!0–!5</code>)</strong><br />
      <img src="./assets/previews/preview-poll-3d.png" alt="Matte 3D Game Rating Poll" width="100%" />
      <p>Borderless <code>rgba(14, 16, 20, 0.70)</code> 3D-carousel face: captures votes before <code>hideCommands</code>, computes the <code>1–5</code> rating without <code>!0</code> distortion, and respects manual <code>gameTitle</code>.</p>
    </td>
  </tr>
</table>

---

## Desktop Suite & Custom Icons

<table>
  <tr>
    <td width="33.3%" align="center" valign="top">
      <img src="./assets/previews/icon-bridge.png" alt="Overlay Bridge Icon" width="72" /><br />
      <strong><code>Overlay Bridge</code></strong><br />
      <sub>Local HTTP telemetry bridge (<code>127.0.0.1:30002</code>) streaming SCS SDK 1.16 Shared Memory packets with near-zero CPU overhead.</sub>
    </td>
    <td width="33.3%" align="center" valign="top">
      <img src="./assets/previews/icon-configurator.png" alt="Overlay Configurator Icon" width="72" /><br />
      <strong><code>Overlay Configurator</code></strong><br />
      <sub>Focused WPF tool for Twitch, DonationAlerts, poll <code>gameTitle</code> &amp; 3D timings, social links, and all 7 chat commands.</sub>
    </td>
    <td width="33.3%" align="center" valign="top">
      <img src="./assets/previews/icon-updater.png" alt="Overlay Update Icon" width="72" /><br />
      <strong><code>Overlay Update</code></strong><br />
      <sub>GitHub release updater syncing new builds while safely preserving your local <code>config.js</code> credentials.</sub>
    </td>
  </tr>
</table>

---

<a id="architecture-en"></a>
## Architecture Pipeline & Key Capabilities

```text
ETS2 / ATS Shared Memory ─▶ overlayobs_foozzee_telemetry.dll ─▶ Local HTTP Bridge (127.0.0.1:30002) ─▶ OBS Browser Source @ 60 FPS (Zero Blur)
```

| Subsystem | Engineering Details |
| :--- | :--- |
| **Cockpit Telemetry Cluster** | Speedometer `0–160` (`km/h` / `mph`), tachometer, active gear, pneumatic air pressure, fuel level, coolant/oil temps, pedal travel, steering angle, wear, and live ETA |
| **Matte 3D Chat (`70%`)** | Borderless `rgba(14, 16, 20, 0.70)` pills with zero `backdrop-filter`, height-aware DOM pruning, native Twitch emotes (`Array.from`) + **7TV / BTTV / FFZ**, real **Twitch GQL** badges |
| **Infinite 3D Carousel** | `5m Chat -> 1m Poll (!0–!5) -> 5m Chat -> 1m Socials` flip cycle (`rotateY(180deg)`) with hidden inactive face (`opacity: 0; pointer-events: none;`) |
| **7 Chat Commands** | `!honk` (air horn), `!cb` (CB radio card), `!route` (job & cargo), `!stats` (session summary), `!truck` (truck & wear), `!driver` (driver card), `!bet` (trip prediction) |
| **Bilingual Setup (`RU / EN`)** | Auto-sized WPF wizard (`SizeToContent.Height`), live `Русский / English` toggle persisted to `config.js` & `InstallLanguage`, auto DLL install, and safe `Uninstall.exe` |

---

## Quick Start (3 Steps)

1. **Install:** Run `Stream_Overlay_Cockpit_Setup_v0.0.4.exe`, pick **English**, choose your folder (default `C:\Stream_Overlay_Cockpit`), and verify ETS2/ATS paths for automatic `overlayobs_foozzee_telemetry.dll` installation.
2. **Configure:** Open **`Overlay Configurator`** from your Desktop (or `Configure-Overlay.bat`) to set your Twitch channel, DonationAlerts socket token, poll `gameTitle` (`auto` or custom), social links, and command toggles.
3. **Add to OBS Studio:** Create a **Browser Source**, **uncheck Local file**, enter `file:///C:/Stream_Overlay_Cockpit/ets2-desktop.html` (`1920×1080`, `60 FPS`). Launch **`Overlay Bridge`** before starting ETS2/ATS.

---

## URL Query Parameters

| Parameter | Description |
| :--- | :--- |
| `?cam=16x9` / `?cam=4x3` | Force webcam frame aspect ratio |
| `?theme=amber` / `?theme=ice` | Switch cockpit cluster backlight preset |
| `?view=chat` / `?view=poll` / `?view=socials` | Pin a specific 3D-carousel face |
| `?fast=1` | Accelerated 3D flip cycle (6s / 4s) for testing |
| `?test=1` / `?demo=1` | Enable telemetry demo mode and sample `!0–!5` votes |

---

## Credits & Telemetry Compatibility

- **Inspiration:** [rTruckSim](https://rtrucksim.fr/) (`https://rtrucksim.fr/`).
- **Telemetry Specification:** Telemetry data format based on rTruckSim (https://rtrucksim.fr/).
- **Plugin Isolation:** `overlayobs_foozzee_telemetry.dll` operates in an isolated Shared Memory segment and stays fully compatible without conflicting with `rtrucksim_telemetry.dll`.

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

> Proprietary Freeware License (All Rights Reserved). Free personal use for live streams and video broadcasts; commercial resale, rebranding, or public redistribution of modified builds without written permission is prohibited. See [LICENSE](./LICENSE).  
> Copyright (c) 2026 FooZzee. All Rights Reserved.

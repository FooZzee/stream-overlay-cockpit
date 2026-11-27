# Version History — ETS2 / ATS Stream Overlay Cockpit

> **ETS2 / ATS Stream Overlay Cockpit v0.0.4**  
> Official release log and engineering history for the standalone cockpit telemetry HUD stream overlay for Euro Truck Simulator 2 and American Truck Simulator.

## [0.0.4] - 2026-11-27

### Key Improvements & Architecture

* **Zero-Blur 60 FPS Compositor:** Eliminated GPU-heavy `backdrop-filter: blur` passes in favor of dense matte surfaces (`rgba(14, 16, 20, 0.70)`), delivering locked 60 FPS rendering in OBS Studio (`1080p` and `1440p`).
* **Matte 3D-Carousel Chat Dock (`ets2-chat-3d.css`, `ets2-chat-carousel.js`, `ets2-emotes.js`):** Borderless floating message pills without shadows or outlines, height-aware dynamic DOM pruning, native Twitch IRC emotes (`Array.from` Unicode code points) + **7TV / BTTV / FFZ**, real **Twitch GQL** `broadcastBadges` with text fallbacks, and an infinite 3D flip cycle (**Chat 5m -> `!0–!5` Poll 1m -> Chat 5m -> Socials Card 1m**).
* **`!0–!5` Game Rating Poll:** Intercepts raw votes before `hideCommands` filtering, computes a `1–5` rating average without `!0` distortion, and prioritizes manual `chat.gameTitle` over `auto` detection (ETS2/ATS telemetry & Twitch GQL).
* **Focused WPF Configurator (`Overlay Configurator`):** Streamlined UI for Twitch, DonationAlerts, 3D-carousel timings, `gameTitle`, social links (`Telegram`, `VK`, `YouTube`), and individual flags/cooldowns for all 7 chat commands (`!honk`, `!cb`, `!route`, `!stats`, `!truck`, `!driver`, `!bet`), plus fixed `PasswordBox`/`TextBox` token visibility toggle.
* **Bilingual WPF Installer & Uninstaller (`Русский / English`):** Auto-sized layout (`SizeToContent.Height`), embedded `logo.png` header, live `RU / EN` language switch persisted to `config.js` and `InstallLanguage` registry value, automatic `overlayobs_foozzee_telemetry.dll` deployment, multi-layer `16/32/48/256` `.ico` desktop shortcuts (**`Overlay Bridge`**, **`Overlay Configurator`**, **`Overlay Update`**), and safe `Uninstall.exe` preserving `config.js`.

## [0.0.3] - 2026-11-23

### Engineering Enhancements

* **Extended SCS SDK 1.16 Telemetry (`127.0.0.1:30002`):** Live ETA calculation, pneumatic air brake pressure, fuel volume, engine coolant/oil temperatures, pedal deflection bars, steering wheel angle, and truck/trailer/cargo wear tracking.
* **Cockpit Presets & Chat Commands:** Dashboard backlight presets (`?theme=amber` / `?theme=ice`), instant webcam aspect switching (`4:3` / `16:9`), integrated trip timer, and the base 7-command chat engine with role gates and per-user cooldowns.

## [0.0.2] - 2026-11-19

### 🚀 Key Improvements & Highlights

* **Corrected OBS Studio Browser Source Setup (Uncheck 'Local file'):** Updated docs and Setup Wizard — users must NOT check "Local file" in OBS Studio so webcam aspect ratio query parameters (`?cam=4x3` / `?cam=16x9`) pass through correctly. The path is pasted directly into the standard **URL** field.
* **Automatic Update Checking Enabled by Default (`checkUpdates: true`):** Background check against the official GitHub Releases API (`FooZzee/stream-overlay-cockpit`) when the overlay starts in OBS Studio. Fails silently without console errors if offline or encountering HTTP 404.
* **Smart Pip-Boy 3000 Auto-Updater:** Robust SemVer version comparison (`v0.0.2` vs `latest`), automatic download and extraction of `ETS2-ATS-Stream-Overlay-Cockpit-*.zip` release archives with **zero-risk preservation of user's personal `config.js`**.
* **Repository Endpoint Synchronization:** Defaults configured in `config.example.js` and `Install-Overlay.bat` targeting `FooZzee/stream-overlay-cockpit`.
* **Complete Project Version Alignment:** Comprehensive version alignment to `v0.0.2` across HTML tags, telemetry scripts, setup wizard, and updater UI.

## [0.0.1] - 2026-11-19

### 🚀 Initial Release & Highlights

First stable release of the flagship **ETS2 / ATS Stream Overlay Cockpit** series, bringing together a lower cockpit dashboard console, symmetrical webcam and live chat docks, dynamic stream alert cards, and the native SCS SDK 1.16 telemetry plugin into a single unified OBS Studio browser scene.

### 🎛️ 1. Lower Symmetrical Cockpit HUD Console

* **Central Gauge Cluster:** High-contrast digital and analog instrument dashboard with a 100% opaque dark backdrop (`#0B0F17`) engineered for both daytime glare and night hauls.
* **Speedometer & Tachometer:** Graduated dial scale supporting 0–160 km/h (or mph with automatic metric-to-imperial conversion), colored RPM band tachometer, and active transmission gear indicator.
* **On-Board Diagnostics:** Gauges for pneumatic air brake pressure, fuel capacity and remaining volume, engine coolant temperature, and oil temperature.
* **Live Control Inputs:** Real-time visual pedal deflection bars for accelerator, brake, and clutch, along with a live steering wheel angle readout.
* **Odometer & Damage Tracking:** Trip distance counter and independent percentage wear bars for truck chassis/engine, semi-trailer, and transported cargo.
* **Bottom Route Ticker:** Live status ticker displaying departure and destination cities, remaining navigation distance, estimated time of arrival (ETA), and contract payout.

### 📹 2. Universal Webcam Frame (4:3 and 16:9 Aspect Ratios)

* **Dual Geometry Standards:** Full support for both standard square `4:3` (325×244 px @ 1080p | 397×298 px @ 1440p) and widescreen `16:9` (384×216 px @ 1080p | 464×261 px @ 1440p).
* **Optical Symmetrical Centering:** The outer frame contour is balanced against the left edge of the overlay canvas with mathematically equal margins to the display edge and the central cluster.
* **Integrated Trip Clock:** The top frame bar features a digital real-time trip duration timer with an animated recording status indicator.
* **Soft Corner Radii:** The outer frame and inner camera viewport mask feature smooth `10px` rounded corners, eliminating harsh edges over your stream canvas.
* **Instant Switching:** Toggle aspect ratio via GUI Setup Wizard, URL query parameters (`?cam=4x3` / `?cam=16x9`), or the `window.setWebcamAspect()` console API.

### 💬 3. Gaming Chat Dock (Right Side)

* **OBS Browser Source Optimization:** Dense, high-contrast dark backdrop at 85% opacity without expensive GPU blur shaders (`backdrop-filter: blur`), ensuring smooth 60 fps rendering.
* **Seamless Dashboard Alignment:** The chat dock matches the central gauge cluster in height and baseline elevation.
* **Multi-Platform Support:** Ready for chat widgets from Twitch, YouTube, VK Play Live, Kick, and Trovo.

### 🔔 4. Modern Animated Stream Alerts

* **Slide-Up Reveal:** Donation, subscription, and raid notification cards emerge smoothly from behind the dashboard, peaking +10 px above its top edge.
* **Shatter Particle Explosion:** Upon completion of the display cycle, the alert card dynamically shatters into dispersing fragments with an organic particle explosion.
* **Developer Test API:** Built-in `window.testStreamAlert()` method allows immediate preview of all alert variants and physics in browser DevTools.

### ⚡ 5. Native SCS Telemetry SDK 1.16 Plugin

* **Direct Data Capture:** High-performance `overlayobs_foozzee_telemetry.dll` built upon the official SCS Telemetry SDK 1.16 for Euro Truck Simulator 2 and American Truck Simulator (x64).
* **Ultra-Low Latency:** Direct packet streaming via local UDP/HTTP bridge without intermediate web servers or relay services.
* **Mod Isolation:** Safe installation into the game's `plugins` folder without conflicting with third-party libraries (e.g. `rtrucksim_telemetry.dll`).

### 🛠️ 6. Modern WPF Setup Wizard & Desktop Shortcuts

* **Dedicated Camera Aspect Section:** Clear interactive cards to select between `4:3` and `16:9` with OBS source sizing hints.
* **Clean Default Path:** Default installation directory set to `C:\Stream_Overlay_Cockpit` with automatic Steam, ETS2, and ATS path resolution.
* **Multi-Layer Designer Icons:** Includes high-res `.ico` icon files (`cockpit-bridge.ico` and `cockpit-updater.ico`) containing 6 discrete layers (16 to 256 px).
* **Native FlowDocument Viewer:** In-app documentation and changelog reader with rich formatting, syntax highlighting, and zero dependency on Windows Notepad.

> [!NOTE]
> **ETS2 / ATS Stream Overlay Cockpit** is licensed under the Proprietary Freeware License (All Rights Reserved). Consider starring the repository on GitHub or supporting the developer FooZzee!

---

Copyright (c) 2026 FooZzee. All Rights Reserved.

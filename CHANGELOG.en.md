# 📜 Version History — ETS2 / ATS Stream Overlay Cockpit

> **ETS2 / ATS Stream Overlay Cockpit v0.0.1**  
> Official release log and development history for the standalone truck cockpit HUD stream overlay designed for Euro Truck Simulator 2 and American Truck Simulator.

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
> **ETS2 / ATS Stream Overlay Cockpit** is open-source software licensed under the MIT License. Consider starring the repository on GitHub or supporting the developer FooZzee!

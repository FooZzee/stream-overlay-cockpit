# 🎮 Interactive Commands & Developer API Reference

> **ETS2 / ATS Stream Overlay Cockpit v0.0.2**  
> Complete technical reference for interactive chat commands, telemetry triggers, and developer console methods.

## 1. Interactive Chat Commands

Chat command processing is handled by the `assets/js/ets2-chat.js` module. Access permissions, spam filters, and cooldown intervals are configured in the `chatCommands` block within `config.js`.

| Command | Alias | Description & Telemetry Returned |
| :--- | :--- | :--- |
| `!cargo` | `!грузик` | Cargo name, weight in metric tons, and special cargo categories (fragile, ADR hazardous). |
| `!job` | `!рейс` | Active route: departure city, destination city, distance remaining, and delivery payout. |
| `!truck` | `!тягач` | Truck make, model, current transmission gear, and cruise control state. |
| `!damage` | `!урон` | Detailed wear and tear breakdown for truck chassis/engine, semi-trailer, and cargo. |
| `!fuel` | `!топливо` | Fuel volume in liters or gallons, tank capacity percentage, and estimated driving range. |
| `!speed` | `!скорость` | Current vehicle speed and the active road speed limit. |
| `!weather` | `!погода` | In-game time of day and atmospheric conditions (clear, overcast, rain). |
| `!help` | `!помощь` | Prints the list of available interactive chat commands. |

> [!NOTE]
> Commands are responsive to both English (`!job`) and Russian (`!рейс`) triggers. To prevent chat flooding, a default 5-second per-user cooldown is applied.

## 2. Developer Console API (Browser DevTools / F12)

To test animations, frame geometry, and telemetry without launching the game simulator, open DevTools (F12) in your browser and use the global `window` object methods:

| JavaScript Method | Description & Effect |
| :--- | :--- |
| `window.setWebcamAspect('4:3')` | Instantly switches the webcam frame to the standard `4:3` aspect ratio (325×244 px). |
| `window.setWebcamAspect('16:9')` | Instantly switches the webcam frame to the widescreen `16:9` aspect ratio (384×216 px). |
| `window.testStreamAlert('donate', 50, 'Alex', 'Have a great haul!')` | Triggers a test donation alert card followed by the particle shatter explosion. |
| `window.testStreamAlert('sub', null, 'Dmitry', 'Tier 1 Sub (6 months)')` | Triggers a test channel subscription alert. |
| `window.testStreamAlert('follow', null, 'Sergey')` | Triggers a test new follower alert. |
| `window.testStreamAlert('raid', 45, 'TruckerPro')` | Triggers a test channel raid alert. |

```javascript
// Example: Switch webcam frame aspect ratio
window.setWebcamAspect('16:9');

// Example: Trigger donation alert card with shatter explosion
window.testStreamAlert('donate', 25, 'RoadCaptain', 'Safe travels on the virtual highways!');
```

## 3. OBS Studio URL Parameters

When adding the overlay as a Browser Source in OBS Studio, you can pass runtime configuration flags directly through the URL query string:

| URL Parameter | Usage Example | Behavior & Description |
| :--- | :--- | :--- |
| `?cam=4x3` | `ets2-desktop.html?cam=4x3` | Forces webcam frame into standard `4:3` aspect ratio. |
| `?cam=16x9` | `ets2-desktop.html?cam=16x9` | Forces webcam frame into widescreen `16:9` aspect ratio. |
| `?test=1` | `ets2-desktop.html?test=1` | Activates autonomous demo mode with simulated telemetry data streams. |
| `?lang=en` | `ets2-desktop.html?lang=en` | Forces overlay interface language to English. |
| `?lang=ru` | `ets2-desktop.html?lang=ru` | Forces overlay interface language to Russian. |

> [!TIP]
> **OBS Studio Browser Source Best Practices:**
> * **Canvas Dimensions:** Set width and height to exactly `1920` × `1080` (for Full HD) or `2560` × `1440` (for 2K QHD).
> * **Frame Rate:** Set to `60 fps` for fluid speedometer needle movement and alert particle dispersion.
> * **Memory Management:** Uncheck "Shutdown source when not visible" so trip statistics and mileage remain continuous across scene transitions.

---

Copyright (c) 2026 FooZzee. All Rights Reserved.

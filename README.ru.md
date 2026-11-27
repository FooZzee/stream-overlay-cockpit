<div align="center">
  <img src="./assets/img/logo.png" alt="Логотип ETS2 / ATS Stream Overlay Cockpit" width="124" />
  <h1>ETS2 / ATS Stream Overlay Cockpit</h1>
  <p><strong>Телеметрический HUD-оверлей для Euro Truck Simulator 2 и American Truck Simulator (60 FPS без blur)</strong></p>

  [![Версия](https://img.shields.io/badge/Версия-v0.0.4-00e5ff?style=flat)](https://github.com/FooZzee/stream-overlay-cockpit/releases/tag/v0.0.4)
  [![Платформа](https://img.shields.io/badge/Платформа-Windows_x64-0078d4?style=flat)](https://www.microsoft.com/windows)
  [![SCS SDK](https://img.shields.io/badge/SCS_SDK-1.16-f59e0b?style=flat)](https://modding.scssoft.com/wiki/Documentation/Engine/SDK/Telemetry)
  [![OBS Studio](https://img.shields.io/badge/OBS_Studio-28%2B-5c5cf0?style=flat)](https://obsproject.com/)
  [![FPS](https://img.shields.io/badge/60_FPS-Zero_Blur-22c55e?style=flat)](#architecture-ru)
  [![Лицензия](https://img.shields.io/badge/Лицензия-All_Rights_Reserved-ef4444?style=flat)](./LICENSE)

  <br />

  [![Поддержать проект](https://img.shields.io/badge/Поддержать_проект-FF5E5B?style=for-the-badge&logo=heart&logoColor=white)](https://www.donationalerts.com/r/foozzee)

  <p>
    <a href="./README.md">README.md</a> ·
    <a href="./README.en.md">English (README.en.md)</a> ·
    <a href="./CHANGELOG.ru.md">История изменений</a> ·
    <a href="./commands.ru.md">Команды чата</a> ·
    <a href="./RELEASE_NOTES_v0.0.4.md">Релиз v0.0.4</a>
  </p>
</div>

---

## Посмотрите в деле

<div align="center">
  <p><strong>Широкоформатный режим 16:9 — 1920×1080 / 2560×1440 @ 60 FPS</strong></p>
  <img src="./assets/previews/preview-cockpit-16x9.png" alt="ETS2 / ATS Stream Overlay Cockpit 16:9" width="100%" />
</div>

<table>
  <tr>
    <td width="50%" align="center" valign="top">
      <strong>Классическая рамка веб-камеры 4:3</strong><br />
      <img src="./assets/previews/preview-cockpit-4x3.png" alt="Рамка веб-камеры 4:3" width="100%" />
      <p>Симметричная геометрия по высоте приборки (<code>325×244 px @ 1080p</code> | <code>397×298 px @ 1440p</code>), встроенный таймер рейса и плотная подложка <code>#0B0F17</code>.</p>
    </td>
    <td width="50%" align="center" valign="top">
      <strong>Матовый 3D-опросник игры (<code>!0–!5</code>)</strong><br />
      <img src="./assets/previews/preview-poll-3d.png" alt="Матовый 3D-опросник игры" width="100%" />
      <p>Карточка <code>rgba(14, 16, 20, 0.70)</code> без обводок и теней: учёт голосов до фильтра команд, расчёт среднего по <code>1–5</code> без искажения от <code>!0</code> и приоритет ручного <code>gameTitle</code>.</p>
    </td>
  </tr>
</table>

---

## Десктопный пакет и фирменные иконки

<table>
  <tr>
    <td width="33.3%" align="center" valign="top">
      <img src="./assets/previews/icon-bridge.png" alt="Иконка Overlay Bridge" width="72" /><br />
      <strong><code>Overlay Bridge</code></strong><br />
      <sub>Локальный HTTP-мост (<code>127.0.0.1:30002</code>), передающий пакеты SCS SDK 1.16 Shared Memory в OBS с минимальной задержкой.</sub>
    </td>
    <td width="33.3%" align="center" valign="top">
      <img src="./assets/previews/icon-configurator.png" alt="Иконка Overlay Configurator" width="72" /><br />
      <strong><code>Overlay Configurator</code></strong><br />
      <sub>WPF-конфигуратор: Twitch, DonationAlerts, <code>gameTitle</code> и тайминги 3D-карусели, соцсети и все 7 команд чата.</sub>
    </td>
    <td width="33.3%" align="center" valign="top">
      <img src="./assets/previews/icon-updater.png" alt="Иконка Overlay Update" width="72" /><br />
      <strong><code>Overlay Update</code></strong><br />
      <sub>Обновление сборок с GitHub с сохранением пользовательского <code>config.js</code> и личных токенов.</sub>
    </td>
  </tr>
</table>

---

<a id="architecture-ru"></a>
## Архитектурный пайплайн и возможности

```text
ETS2 / ATS Shared Memory ─▶ overlayobs_foozzee_telemetry.dll ─▶ Local HTTP Bridge (127.0.0.1:30002) ─▶ OBS Browser Source @ 60 FPS (Zero Blur)
```

| Подсистема | Что реализовано под капотом |
| :--- | :--- |
| **Приборная панель и телеметрия** | Спидометр `0–160` (`km/h` / `mph`), тахометр, передача КПП, пневмосистема, топливо, температуры ОЖ и масла, отклонение педалей, угол руля, износ и живой ETA |
| **Матовый 3D-чат (`70%`)** | Отдельные плашки `rgba(14, 16, 20, 0.70)` без обводок и `backdrop-filter`, динамическая очистка DOM по высоте слота, нативные смайлы Twitch (`Array.from`) + **7TV / BTTV / FFZ**, реальные значки **Twitch GQL** |
| **Бесконечная 3D-карусель** | Цикл `Чат 5 мин -> Опросник !0–!5 1 мин -> Чат 5 мин -> Карточка соцсетей 1 мин` с плавным переворотом `rotateY(180deg)` и скрытием неактивной грани |
| **7 интерактивных команд** | `!гудок` (пневмосигнал), `!рация` (сообщение на CB-экран), `!рейс` (маршрут и груз), `!стата` (сводка стрима), `!тягач` (модель и износ), `!водитель` (профиль), `!ставка` (прогноз рейса) |
| **WPF-установщик (`RU / EN`)** | Автоподбор высоты окна (`SizeToContent.Height`), переключение `Русский / English` с записью в `config.js` и `InstallLanguage`, автоустановка DLL в ETS2/ATS и безопасный `Uninstall.exe` без `/s /q` |

---

## Быстрый старт (3 шага)

1. **Установите пакет:** запустите `Stream_Overlay_Cockpit_Setup_v0.0.4.exe`, выберите **Русский**, укажите папку (по умолчанию `C:\Stream_Overlay_Cockpit`) и подтвердите пути к ETS2/ATS для установки `overlayobs_foozzee_telemetry.dll`.
2. **Настройте параметры:** откройте ярлык **`Overlay Configurator`** на Рабочем столе (или `Configure-Overlay.bat`), впишите канал Twitch, токен DonationAlerts, `gameTitle` (`auto` или название игры), ссылки Telegram/VK/YouTube и флаги 7 команд.
3. **Подключите в OBS Studio:** добавьте источник **«Браузер» (Browser Source)**, **снимите галочку «Локальный файл»**, вставьте `file:///C:/Stream_Overlay_Cockpit/ets2-desktop.html` (`1920×1080`, `60 FPS`). Перед запуском симулятора запустите **`Overlay Bridge`**.

---

## Параметры URL для отладки и сцен OBS

| Параметр | Назначение |
| :--- | :--- |
| `?cam=16x9` / `?cam=4x3` | Принудительный выбор пропорций рамки веб-камеры |
| `?theme=amber` / `?theme=ice` | Янтарная или ледяная подсветка приборной панели |
| `?view=chat` / `?view=poll` / `?view=socials` | Закрепить конкретную грань 3D-карусели |
| `?fast=1` | Ускоренный цикл переворотов (6с / 4с) для проверки |
| `?test=1` / `?demo=1` | Тестовый режим телеметрии и демонстрационные голоса `!0–!5` |

---

## Автор проекта — FooZzee

<p align="left">
  <a href="https://github.com/FooZzee/stream-overlay-cockpit"><img src="https://img.shields.io/badge/GitHub-FooZzee-181717?style=flat&logo=github" alt="GitHub" /></a>
  <a href="https://foozzee.ru"><img src="https://img.shields.io/badge/Сайт-foozzee.ru-00e5ff?style=flat" alt="Сайт" /></a>
  <a href="https://twitch.tv/foozzee"><img src="https://img.shields.io/badge/Twitch-foozzee-9146FF?style=flat&logo=twitch&logoColor=white" alt="Twitch" /></a>
  <a href="https://youtube.com/@foozzee"><img src="https://img.shields.io/badge/YouTube-@foozzee-FF0000?style=flat&logo=youtube&logoColor=white" alt="YouTube" /></a>
  <a href="https://t.me/foozzeestream"><img src="https://img.shields.io/badge/Telegram-foozzeestream-26A5E4?style=flat&logo=telegram&logoColor=white" alt="Telegram" /></a>
  <a href="https://vk.ru/gtfun"><img src="https://img.shields.io/badge/VK-gtfun-0077FF?style=flat&logo=vk&logoColor=white" alt="VK" /></a>
  <a href="https://www.donationalerts.com/r/foozzee"><img src="https://img.shields.io/badge/DonationAlerts-foozzee-F57C00?style=flat" alt="DonationAlerts" /></a>
</p>

> Лицензия: Proprietary Freeware License (All Rights Reserved). Бесплатное личное использование на стримах и в видеороликах разрешено; коммерческая перепродажа, выдача за свой продукт и публикация модифицированных сборок без письменного разрешения автора запрещены. Подробнее: [LICENSE](./LICENSE).  
> Copyright (c) 2026 FooZzee. All Rights Reserved.

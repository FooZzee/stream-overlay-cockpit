<div align="center">
  <img src="./assets/img/logo.png" alt="Логотип ETS2 / ATS Stream Overlay Cockpit" width="112" />
  <h1>ETS2 / ATS Stream Overlay Cockpit v0.0.4</h1>
  <p><strong>Телеметрический HUD-оверлей для Euro Truck Simulator 2 и American Truck Simulator (60 FPS без blur)</strong></p>

  [![Версия](https://img.shields.io/badge/Версия-v0.0.4-00e5ff?style=flat)](https://github.com/FooZzee/stream-overlay-cockpit/releases/tag/v0.0.4)
  [![Платформа](https://img.shields.io/badge/Платформа-Windows_x64-0078d4?style=flat)](https://www.microsoft.com/windows)
  [![SCS SDK](https://img.shields.io/badge/SCS_SDK-1.16-f59e0b?style=flat)](https://modding.scssoft.com/wiki/Documentation/Engine/SDK/Telemetry)
  [![OBS Studio](https://img.shields.io/badge/OBS_Studio-28%2B-5c5cf0?style=flat)](https://obsproject.com/)
  [![Лицензия](https://img.shields.io/badge/Лицензия-All_Rights_Reserved-ef4444?style=flat)](./LICENSE)

  <br />

  [![Поддержать проект](https://img.shields.io/badge/Поддержать_проект-FF5E5B?style=for-the-badge&logo=heart&logoColor=white)](https://www.donationalerts.com/r/foozzee)

  <p>
    <a href="./README.md">[Главный README]</a> •
    <a href="./README.en.md">[EN] English Version</a> •
    <a href="./CHANGELOG.ru.md">История изменений</a> •
    <a href="./commands.ru.md">Команды чата</a> •
    <a href="./RELEASE_NOTES_v0.0.4.md">Релиз v0.0.4</a>
  </p>
</div>

---

## Зачем этот оверлей и какие задачи он решает

Большинство веб-оверлеев в OBS Studio нагружают GPU тяжёлым `backdrop-filter: blur`, теряют FPS при потоке сообщений в чате и требуют сторонних серверов. **Stream Overlay Cockpit** спроектирован под реальный стрим в `1920×1080` и `2560×1440` со стабильными **60 FPS**:

- **Нативный плагин SCS SDK 1.16 (`overlayobs_foozzee_telemetry.dll`):** прямой захват скорости, оборотов, передачи КПП, давления воздуха, топлива, температур, отклонения педалей, угла руля, груза и реального ETA из Shared Memory игры через локальный мост (`127.0.0.1:30002`) с нулевой нагрузкой на игру.
- **Матовый 3D-чат (`rgba(14, 16, 20, 0.70)`):** отдельные тёмные плашки сообщений без обводок и размытия, динамическая очистка по высоте слота, нативные смайлы Twitch (`Array.from` по Unicode code points) + **7TV / BTTV / FFZ**, реальные иконки бейджей **Twitch GQL** и 3D-карусель (**Чат 5 мин → Опросник `!0–!5` 1 мин → Чат 5 мин → Карточка «Не забудь подписаться:» 1 мин**).
- **Опросник игры и 7 команд чата:** перехват голосов `!0–!5` до фильтра `hideCommands`, честный расчёт среднего по `1–5` без искажения от `!0`, приоритет ручного названия игры в `config.js` (или режим `auto`), плюс команды `!гудок`, `!рация`, `!рейс`, `!стата`, `!тягач`, `!водитель`, `!ставка` с индивидуальным включением и кулдаунами.
- **Установщик `RU / EN` и сфокусированный WPF-конфигуратор:** выбор языка при установке (запись в `config.js` и реестр для `Uninstall.exe`), автоустановка DLL в ETS2/ATS, ярлыки `Overlay Bridge`, `Overlay Configurator` и `Overlay Update`, безопасное удаление с сохранением `config.js`.

---

## Превью интерфейса

### Приборная панель и рамка веб-камеры 4:3 (по умолчанию)
![ETS2 / ATS Stream Overlay Cockpit 4:3](./assets/previews/preview-cockpit-4x3.png)

### Широкоформатная рамка веб-камеры 16:9 (`?cam=16x9`)
![ETS2 / ATS Stream Overlay Cockpit 16:9](./assets/previews/preview-cockpit-16x9.png)

### Матовый 3D-опросник «ОЦЕНИТЕ ИГРУ» (`!0–!5`)
![Матовый 3D-опросник игры](./assets/previews/preview-poll-3d.png)

---

## Быстрый старт (3 шага)

1. **Установка:** запустите `Stream_Overlay_Cockpit_Setup_v0.0.4.exe`, выберите язык **Русский**, папку (по умолчанию `C:\Stream_Overlay_Cockpit`) и пути к ETS2/ATS для автоматической установки `overlayobs_foozzee_telemetry.dll`.
2. **Настройка:** откройте ярлык **`Overlay Configurator`** на Рабочем столе (или `Configure-Overlay.bat`), укажите канал Twitch, токен DonationAlerts, название игры для опросника (`auto` или своё), ссылки соцсетей и флаги 7 команд.
3. **Подключение в OBS Studio:** добавьте источник **«Браузер» (Browser Source)**, **снимите галочку «Локальный файл»**, вставьте URL `file:///C:/Stream_Overlay_Cockpit/ets2-desktop.html` (или с `?cam=16x9`), укажите `1920×1080`, `60 FPS`. Перед запуском игры запустите **`Overlay Bridge`**.

---

## Параметры URL для быстрой проверки в OBS / браузере

| Параметр | Назначение |
| :--- | :--- |
| `?cam=16x9` / `?cam=4x3` | Принудительный формат рамки веб-камеры |
| `?theme=amber` / `?theme=ice` | Янтарная или ледяная подсветка приборки |
| `?view=chat` / `?view=poll` / `?view=socials` | Закрепить выбранную грань 3D-карусели |
| `?fast=1` | Ускоренный цикл 3D-переворотов (6с / 4с) для теста |
| `?test=1` / `?demo=1` | Демо-режим телеметрии и тестовых голосов `!0–!5` |

---

## Автор проекта — FooZzee

- **GitHub:** https://github.com/FooZzee/stream-overlay-cockpit
- **Сайт:** https://foozzee.ru
- **Twitch:** https://twitch.tv/foozzee
- **YouTube:** https://youtube.com/@foozzee
- **Telegram:** https://t.me/foozzeestream
- **VK:** https://vk.ru/gtfun
- **DonationAlerts:** https://www.donationalerts.com/r/foozzee

> Лицензия: Proprietary Freeware License (All Rights Reserved). Бесплатное личное использование на стримах и в видеороликах разрешено; коммерческая перепродажа, выдача за свой продукт и публикация модифицированных сборок без письменного разрешения автора запрещены. Подробнее: [LICENSE](./LICENSE).

Copyright (c) 2026 FooZzee. All Rights Reserved.

# 🎮 Commands & Developer API — ETS2 / ATS Stream Overlay Cockpit

> **ETS2 / ATS Stream Overlay Cockpit v0.0.1**  
> Dual-language technical manual (English / Русский).

---

## 🇬🇧 English Reference

### 1. Interactive Chat Commands

| Command | Alias | Description |
| :--- | :--- | :--- |
| `!cargo` | `!грузик` | Cargo name, weight in metric tons, and fragile/ADR flags. |
| `!job` | `!рейс` | Route info: origin, destination, distance, and payout. |
| `!truck` | `!тягач` | Truck make, model, gear, and cruise control state. |
| `!damage` | `!урон` | Percentage wear breakdown for truck, trailer, and cargo. |
| `!fuel` | `!топливо` | Fuel volume, percentage, and estimated driving range. |
| `!speed` | `!скорость` | Current vehicle speed and active road speed limit. |
| `!weather` | `!погода` | Game time of day and atmospheric conditions. |
| `!help` | `!помощь` | Prints list of available interactive chat commands. |

### 2. Developer Console API

* `window.setWebcamAspect('4:3')` / `window.setWebcamAspect('16:9')` — Instant webcam frame aspect ratio switch.
* `window.testStreamAlert('donate', 50, 'Alex', 'Have a great haul!')` — Test donation alert card with shatter explosion.
* `window.testStreamAlert('sub', null, 'Dmitry')` — Test channel subscription alert.
* `window.testStreamAlert('follow', null, 'Sergey')` — Test new follower alert.
* `window.testStreamAlert('raid', 45, 'TruckerPro')` — Test channel raid alert.

### 3. OBS Studio URL Parameters

* `?cam=4x3` — Forces webcam frame into standard `4:3` mode.
* `?cam=16x9` — Forces webcam frame into widescreen `16:9` mode.
* `?test=1` — Activates autonomous simulated telemetry demo mode.
* `?lang=en` / `?lang=ru` — Overrides UI language.

---

## 🇷🇺 Справочник на русском языке

### 1. Интерактивные команды чата

| Команда | Алиас | Описание |
| :--- | :--- | :--- |
| `!грузик` | `!cargo` | Название перевозимого груза, масса в тоннах и особые категории (хрупкий, ADR). |
| `!рейс` | `!job` | Маршрут: город отправления, город назначения, дистанция и плата. |
| `!тягач` | `!truck` | Марка и модель тягача, передача КПП и круиз-контроль. |
| `!урон` | `!damage` | Детальный износ тягача, прицепа и груза в процентах. |
| `!топливо` | `!fuel` | Объём топлива в баке, процент и запас хода. |
| `!скорость` | `!speed` | Текущая скорость тягача и ограничение на участке дороги. |
| `!погода` | `!weather` | Игровое время суток и погодные условия. |
| `!помощь` | `!help` | Список доступных команд в чат. |

### 2. Консольные команды разработчика

* `window.setWebcamAspect('4:3')` / `window.setWebcamAspect('16:9')` — Мгновенное переключение формата рамки камеры.
* `window.testStreamAlert('donate', 500, 'Alex', 'Счастливого пути!')` — Тест доната с эффектом разлёта на осколки.
* `window.testStreamAlert('sub', null, 'Dmitry')` — Тестовое уведомление о подписке.
* `window.testStreamAlert('follow', null, 'Sergey')` — Тестовое уведомление о фоллове.
* `window.testStreamAlert('raid', 45, 'TruckerPro')` — Тестовое уведомление о рейде.

### 3. URL-параметры оверлея для OBS Studio

* `?cam=4x3` — Запуск в стандартном формате `4:3`.
* `?cam=16x9` — Запуск в широкоформатном режиме `16:9`.
* `?test=1` — Включение демонстрационного режима с тестовыми данными.
* `?lang=ru` / `?lang=en` — Принудительное переключение языка.

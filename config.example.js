/* Copyright (c) 2026 FooZzee. All Rights Reserved. Licensed under Proprietary Freeware License. */
/**
 * Шаблон конфигурации ETS2 / ATS Stream Overlay Cockpit v0.0.3.0.2.
 * Скопируйте этот файл в config.js и заполните своими данными.
 */
window.OVERLAY_CONFIG = {
  // Метка сборки оверлея
  version: 'v0.0.3',

  // Язык интерфейса оверлея ('ru' | 'en')
  lang: 'ru',

  // Режим отладки (true — выводит подробные логи в консоль OBS и разрешает ?test=1)
  debug: false,

  // Проверка обновлений оверлея на GitHub при запуске (отключено в экспериментальной сборке test_v0.0.1)
  checkUpdates: true,
  githubRepo: 'FooZzee/stream-overlay-cockpit',
  githubUrl: 'https://github.com/FooZzee/stream-overlay-cockpit',
  releasesApiUrl: 'https://api.github.com/repos/FooZzee/stream-overlay-cockpit/releases/latest',

  // Настройки каналов и подключений
  channels: {
    twitch: {
      enabled: true,
      channelName: 'YOUR_TWITCH_CHANNEL',
      oauthToken: 'oauth:YOUR_TWITCH_TOKEN', // Без реального ключа в шаблоне
      clientId: 'YOUR_TWITCH_CLIENT_ID'
    },
    vk: {
      enabled: false,
      channelUrl: 'https://live.vkvideo.ru/YOUR_CHANNEL',
      token: 'YOUR_VK_TOKEN'
    },
    donationAlerts: {
      enabled: true,
      socketToken: 'YOUR_DONATIONALERTS_TOKEN'
    },
    obsWebSocket: {
      enabled: false,
      url: 'ws://127.0.0.1:4455',
      password: 'YOUR_OBS_WS_PASSWORD'
    }
  },

  // Настройки системы алертов (FIFO-очередь)
  alerts: {
    volume: 0.65,               // Общая громкость звуков (от 0.0 до 1.0)
    displayDurationMs: 5000,    // Длительность показа одного алерта (мс)
    pauseBetweenMs: 800,        // Пауза между алертами в очереди (мс)
    fallbackTimeoutMs: 10000,   // Страховочный таймер принудительной разблокировки очереди
    minDonateAmount: 50,        // Минимальная сумма доната для показа на экране (₽)
    ttsEnabled: true,           // Озвучка текста доната
    synthFallback: true,        // Мягкий WebAudio-сигнал приборки, если аудиофайл не найден
    sounds: {
      follow: './assets/sounds/follow.mp3',
      sub: './assets/sounds/sub.mp3',
      donate: './assets/sounds/donate.mp3',
      raid: './assets/sounds/raid.mp3'
    }
  },

  // Настройки чата
  chat: {
    maxMessages: 30,            // Максимум сообщений в DOM (защита от утечки памяти)
    messageLifetimeMs: 0,       // Автоудаление сообщения через N мс (0 — не удалять по таймеру)
    hideCommands: true,         // Скрывать сообщения, начинающиеся с '!'
    ignoredUsers: ['Nightbot', 'StreamElements', 'Moobot']
  },

  // Интерактивные команды Twitch-чата в оверлее (!гудок, !рация, !рейс, !стата, !тягач, !водитель, !ставка)
  chatCommands: {
    enabled: true,              // Включить интерактивные команды чата
    cbRadioMinRole: 'follower', // Минимальная роль для !рация ('all' | 'follower' | 'subscriber' | 'vip' | 'mod')
    honkMinRole: 'vip',         // Минимальная роль для !гудок ('subscriber' | 'vip' | 'mod' | 'broadcaster')
    infoCooldownSec: 30,        // Глобальный кулдаун инфо-команд (!рейс, !стата, !тягач, !водитель)
    cbCooldownSec: 45,          // Глобальный кулдаун !рация
    honkCooldownSec: 60,        // Глобальный кулдаун !гудок
    perUserCooldownSec: 120     // Персональный кулдаун команд на зрителя
  },

  // Визуальные параметры (переопределяют CSS-переменные :root при загрузке)
  theme: {
    fontMain: "'Inter', sans-serif",
    fontAccent: "'Tektur', sans-serif",
    accentColor: '#9146FF',
    cockpitPreset: 'amber',     // Подсветка приборки ETS2/ATS: 'amber' (янтарная) | 'ice' (ледяная)
    cockpitAccentColor: '',     // Опциональный hex-акцент (например '#ff9e1b'), пусто — из cockpitPreset
    safeZoneVertical: {
      topPx: 140,
      bottomPx: 370,
      rightPx: 110
    }
  },

  // Рамка веб-камеры (ETS2 / ATS)
  webcamAspect: '4:3',          // Формат рамки веб-камеры: '4:3' (325×244 px, по умолчанию) | '16:9' (384×216 px)
  webcam: {
    enabled: true,              // false — полностью скрывает рамку камеры
    aspect: '4:3',              // '4:3' | '16:9'
    cbChannel: 'CB 19'
  },

  // Настройки бортового компьютера ETS2 / ATS
  ets2: {
    driverName: 'YOUR_DRIVER_TAG',
    routeTag: 'ETS2 // ATS',
    routeText: 'В РЕЙСЕ // ОНЛАЙН',
    routeMeta: 'CRUISE',
    eventsEnabled: true,        // Всплывающие уведомления о событиях (штрафы, оплата дорог, паром, заправка, сдача рейса)
    eventSoundEnabled: true,    // Звуковые эффекты событий
    eventSoundVolume: 0.65,     // Громкость звуковых эффектов событий (0.0 - 1.0)
    telemetryApi: {
      enabled: true,            // true — опрос локального HTTP-моста ./scripts/udp-bridge.ps1 (SCS SDK 1.16 Shared Memory)
      url: 'http://127.0.0.1:30002/telemetry',
      pollIntervalMs: 300,      // Частота опроса при активном подключении (мс)
      staleAfterMs: 9000,       // Таймаут неактивности моста (8–10 с), после которого статус переходит в offline
      offlineBackoffMaxMs: 15000, // Максимальная пауза ожидания, если мост ещё не запущен
      speedUnit: 'auto',        // 'auto' | 'ms' | 'kmh'
      displayUnit: 'auto',      // Шкала спидометра: 'auto' (ETS2=km/h, ATS=mph) | 'kmh' | 'mph'
      navDistUnit: 'auto',      // 'auto' | 'm' | 'km'
      navTimeUnit: 'auto',      // 'auto' | 's' | 'min'
      cargoDmgUnit: 'auto',     // 'auto' | 'ratio' | 'percent'
      maxRpm: 2500
    }
  },

  // Виджет текущего трека (опционально можно подключить локальный JSON от OBS Tuna)
  music: {
    enabled: true,
    title: 'TRUCK CABIN FM',
    artist: 'LIVE STREAM',
    sourceUrl: '',              // Например 'http://127.0.0.1:1608/' (пусто — статический текст)
    pollIntervalMs: 3000
  },

  // Ротатор соцсетей в нижней панели телеметрии (оставьте пустым, чтобы скрыть полосу)
  socials: {
    switchIntervalMs: 9000,
    items: [
      // { label: 'TG', value: 't.me/YOUR_CHANNEL' },
      // { label: 'TWITCH', value: 'twitch.tv/YOUR_CHANNEL' }
    ]
  }
};
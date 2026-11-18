/**
 * Инициализация и безопасное слияние конфигурации для ETS2 / ATS оверлеев.
 * Читает window.OVERLAY_CONFIG из ./config.js без хардкода секретов и каналов.
 */
(function initETS2Config(global) {
  'use strict';

  const DEFAULT_CONFIG = {
    lang: 'ru',
    debug: true,
    checkUpdates: false,
    channels: {
      twitch: { enabled: true, channelName: 'foozzee', oauthToken: '', clientId: '' },
      vk: { enabled: true, channelUrl: 'https://live.vkvideo.ru/foozzee', token: '' },
      donationAlerts: { enabled: true, socketToken: 'CsNPR4wulOmEgXoMT4OT' },
      obsWebSocket: { enabled: false, url: 'ws://127.0.0.1:4455', password: '' }
    },
    alerts: {
      volume: 0.65,
      displayDurationMs: 5000,
      pauseBetweenMs: 800,
      fallbackTimeoutMs: 10000,
      minDonateAmount: 50,
      ttsEnabled: false,
      synthFallback: true,
      sounds: {
        follow: './assets/sounds/follow.mp3',
        sub: './assets/sounds/sub.mp3',
        donate: './assets/sounds/donate.mp3',
        raid: './assets/sounds/raid.mp3'
      }
    },
    chat: {
      maxMessages: 30,
      messageLifetimeMs: 0,
      hideCommands: true,
      ignoredUsers: ['Nightbot', 'StreamElements', 'Moobot', 'FooZzee_Bot']
    },
    theme: {
      cockpitPreset: 'amber', // 'amber' | 'ice'
      cockpitAccentColor: '', // опциональный override hex-цвета, например '#ff9e1b'
      fontMain: '',
      fontAccent: '',
      safeZoneVertical: {
        topPx: 140,
        bottomPx: 370,
        rightPx: 110
      }
    },
    webcamAspect: '4:3',
    webcam: {
      enabled: true,
      aspect: '4:3',
      showClock: true,
      cbChannel: 'CB 19'
    },
    ets2: {
      driverName: 'FooZzee',
      routeTag: 'ETS2 // ATS',
      routeText: 'В РЕЙСЕ // ОНЛАЙН',
      routeMeta: 'CRUISE',
      telemetryApi: {
        enabled: true,
        url: 'http://127.0.0.1:30002/telemetry',
        pollIntervalMs: 300,
        staleAfterMs: 9000,
        offlineBackoffMaxMs: 15000,
        speedUnit: 'auto',      // 'auto' | 'ms' | 'kmh'
        navDistUnit: 'auto',    // 'auto' | 'm' | 'km'
        navTimeUnit: 'auto',    // 'auto' | 's' | 'min'
        cargoDmgUnit: 'auto',   // 'auto' | 'ratio' | 'percent'
        maxRpm: 2500
      }
    },
    music: {
      enabled: true,
      title: 'TRUCK CABIN FM',
      artist: 'LIVE STREAM',
      sourceUrl: '',
      pollIntervalMs: 3000
    },
    socials: {
      switchIntervalMs: 9000,
      items: []
    }
  };

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function deepMerge(target, source) {
    const out = { ...target };
    if (!isPlainObject(source)) return out;
    Object.keys(source).forEach((key) => {
      const srcVal = source[key];
      const tgtVal = target[key];
      if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
        out[key] = deepMerge(tgtVal, srcVal);
      } else if (srcVal !== undefined) {
        out[key] = srcVal;
      }
    });
    return out;
  }

  function isPlaceholder(value) {
    if (value === null || value === undefined) return true;
    const str = String(value).trim();
    if (!str) return true;
    return /^(YOUR_|oauth:YOUR_|https:\/\/live\.vkvideo\.ru\/YOUR_)/i.test(str);
  }

  function hexToRgb(hex) {
    if (typeof hex !== 'string') return null;
    const clean = hex.trim().replace('#', '');
    if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(clean)) return null;
    const full = clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean;
    const num = parseInt(full, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resolveOverlayLanguage(urlParams, mergedCfg, rawCfg) {
    const candidates = [
      urlParams ? urlParams.get('lang') : null,
      rawCfg ? (rawCfg.lang ?? rawCfg.language ?? rawCfg.locale) : null,
      rawCfg && rawCfg.ets2 ? rawCfg.ets2.lang : null,
      mergedCfg ? (mergedCfg.lang ?? mergedCfg.language ?? mergedCfg.locale) : null
    ];
    for (let i = 0; i < candidates.length; i += 1) {
      const val = candidates[i];
      if (typeof val !== 'string') continue;
      const clean = val.trim().toLowerCase();
      if (!clean) continue;
      if (clean === 'en' || clean.startsWith('en-') || clean.startsWith('en_')) return 'en';
      if (clean === 'ru' || clean.startsWith('ru-') || clean.startsWith('ru_')) return 'ru';
    }
    return 'ru';
  }

  const params = new URLSearchParams(global.location.search);
  const rawConfig = isPlainObject(global.OVERLAY_CONFIG) ? global.OVERLAY_CONFIG : {};
  const config = deepMerge(DEFAULT_CONFIG, rawConfig);
  const lang = resolveOverlayLanguage(params, config, rawConfig);
  config.lang = lang;
  global.document.documentElement.setAttribute('lang', lang);

  if (lang === 'en') {
    if (!rawConfig.webcam || !rawConfig.webcam.cbChannel) {
      config.webcam.cbChannel = 'CB 19';
    }
    if (!rawConfig.ets2 || !rawConfig.ets2.routeText) {
      config.ets2.routeText = 'IN TRANSIT // LIVE';
    }
  } else {
    if (!rawConfig.webcam || !rawConfig.webcam.cbChannel) {
      config.webcam.cbChannel = 'РАЦИЯ 19';
    }
    if (!rawConfig.ets2 || !rawConfig.ets2.routeText) {
      config.ets2.routeText = 'В РЕЙСЕ // В ЭФИРЕ';
    }
  }

  const isTestMode = params.get('test') === '1' || params.get('test') === 'true';
  const isDebug = Boolean(config.debug) || params.get('debug') === '1' || isTestMode;
  const showGuides = params.get('guides') === '1';

  if (params.get('preview') === '1' || params.get('bg') === '1' || params.get('bg') === 'cockpit') {
    global.document.body.classList.add('preview-backdrop');
  }

  const themeParam = params.get('theme');
  if (themeParam === 'amber' || themeParam === 'ice') {
    config.theme.cockpitPreset = themeParam;
  }

  const camParam = params.get('cam');
  if (camParam === '0' || camParam === 'false') {
    config.webcam.enabled = false;
  } else if (camParam === '1' || camParam === 'true') {
    config.webcam.enabled = true;
  }

  // Разрешение формата рамки веб-камеры ('4:3' по умолчанию или '16:9')
  // Приоритет: URL-параметр (?cam=16x9 | ?cam=16:9 | ?aspect=16x9 | ?cam=4x3 ...) > config.webcamAspect > config.webcam.aspect > '4:3'
  function normalizeCamAspect(val) {
    if (!val) return null;
    const str = String(val).trim().toLowerCase().replace('/', ':').replace('x', ':');
    if (str === '16:9' || str === 'wide') return '16:9';
    if (str === '4:3' || str === 'standard') return '4:3';
    return null;
  }

  const aspectParam = params.get('aspect') || params.get('camAspect') || params.get('webcamAspect');
  const urlAspect = normalizeCamAspect(camParam) || normalizeCamAspect(aspectParam);
  let resolvedCamAspect = '4:3';

  if (urlAspect) {
    resolvedCamAspect = urlAspect;
  } else if (rawConfig.webcamAspect) {
    resolvedCamAspect = normalizeCamAspect(rawConfig.webcamAspect) || '4:3';
  } else if (rawConfig.webcam && rawConfig.webcam.aspect) {
    resolvedCamAspect = normalizeCamAspect(rawConfig.webcam.aspect) || '4:3';
  }

  config.webcamAspect = resolvedCamAspect;
  if (!config.webcam) config.webcam = {};
  config.webcam.aspect = resolvedCamAspect;

  function applyWebcamAspect(aspect) {
    const target = normalizeCamAspect(aspect) || '4:3';
    const removeCls = target === '16:9' ? 'cam-aspect-4x3' : 'cam-aspect-16x9';
    const addCls = target === '16:9' ? 'cam-aspect-16x9' : 'cam-aspect-4x3';

    if (global.document && global.document.body) {
      global.document.body.classList.remove(removeCls);
      global.document.body.classList.add(addCls);
    }
    const camBox = global.document ? global.document.getElementById('cam-box') : null;
    if (camBox) {
      camBox.classList.remove(removeCls);
      camBox.classList.add(addCls);
    }
  }

  // Применяем класс сразу при наличии body и на событии DOMContentLoaded
  if (global.document && global.document.body) {
    applyWebcamAspect(resolvedCamAspect);
  }
  if (global.document) {
    global.document.addEventListener('DOMContentLoaded', () => {
      applyWebcamAspect(config.webcamAspect || '4:3');
    });
  }

  // Глобальная консольная функция для мгновенного переключения формата веб-камеры
  global.setWebcamAspect = function(aspect) {
    const target = normalizeCamAspect(aspect) || '4:3';
    config.webcamAspect = target;
    if (config.webcam) config.webcam.aspect = target;
    applyWebcamAspect(target);
    log(`Формат веб-камеры установлен: ${target} (.cam-aspect-${target === '16:9' ? '16x9' : '4x3'})`);
    return target;
  };

  function applyThemeVariables(presetOverride) {
    const root = global.document.documentElement;
    const preset = presetOverride || config.theme.cockpitPreset || 'amber';
    root.setAttribute('data-cockpit-theme', preset === 'ice' ? 'ice' : 'amber');

    if (config.theme.cockpitAccentColor) {
      const rgb = hexToRgb(config.theme.cockpitAccentColor);
      if (rgb) {
        root.style.setProperty('--cockpit-accent', config.theme.cockpitAccentColor);
        root.style.setProperty('--cockpit-accent-rgb', rgb);
      }
    }

    const safe = config.theme.safeZoneVertical;
    if (safe) {
      if (Number.isFinite(Number(safe.topPx))) {
        root.style.setProperty('--safe-top', `${Number(safe.topPx)}px`);
      }
      if (Number.isFinite(Number(safe.bottomPx))) {
        root.style.setProperty('--safe-bottom', `${Number(safe.bottomPx)}px`);
      }
      if (Number.isFinite(Number(safe.rightPx))) {
        root.style.setProperty('--safe-right', `${Number(safe.rightPx)}px`);
      }
    }
  }

  function log(...args) {
    if (isDebug) {
      console.log('[ETS2-Overlay]', ...args);
    }
  }

  function warn(...args) {
    if (isDebug) {
      console.warn('[ETS2-Overlay]', ...args);
    }
  }

  applyThemeVariables();

  global.ETS2Overlay = {
    config,
    lang,
    isTestMode,
    isDebug,
    showGuides,
    isPlaceholder,
    escapeHtml,
    applyThemeVariables,
    applyWebcamAspect,
    setWebcamAspect: global.setWebcamAspect,
    log,
    warn
  };
})(window);

/**
 * Строго последовательная FIFO-очередь алертов бортового компьютера ETS2 / ATS.
 * Поддерживает donate, sub, follow, raid, безопасный звук и fallback-таймер.
 */
(function initETS2Alerts(global) {
  'use strict';

  const app = global.ETS2Overlay;
  if (!app) return;

  const { config, isPlaceholder, escapeHtml, log, warn } = app;
  const isEn = app.lang === 'en';

  const ALERT_PRESETS = {
    donate: {
      code: isEn ? 'OBC // FUEL & CARGO' : 'OBC // ТОПЛИВО И ГРУЗ',
      subtitle: isEn ? 'ROAD DONATION' : 'ДОНАТ В РЕЙСЕ',
      defaultBadge: isEn ? 'DONATE' : 'ДОНАТ',
      color: '#f59e0b',
      rgb: '245, 158, 11',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.5L19.5 7v10L12 21.5 4.5 17V7L12 2.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 7v10M9.2 10.2c0-1.1 1.2-1.8 2.8-1.8s2.8.7 2.8 1.8c0 1.2-1.2 1.6-2.8 1.9-1.6.3-2.8.8-2.8 2 0 1.1 1.2 1.8 2.8 1.8s2.8-.7 2.8-1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
    },
    sub: {
      code: isEn ? 'CREW // LICENSE' : 'CREW // ЛИЦЕНЗИЯ',
      subtitle: isEn ? 'NEW SUBSCRIBER' : 'ПОДПИСКА НА КАНАЛ',
      defaultBadge: isEn ? 'SUB' : 'ПОДПИСЧИК',
      color: '#10b981',
      rgb: '16, 185, 129',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.8l7 3v5.7c0 4.6-2.9 8.3-7 9.7-4.1-1.4-7-5.1-7-9.7V5.8l7-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 7.2l1.35 2.75 3.05.45-2.2 2.15.52 3.05L12 14.15 9.28 15.6l.52-3.05-2.2-2.15 3.05-.45L12 7.2Z" fill="currentColor"/></svg>'
    },
    follow: {
      code: isEn ? 'CONVOY // NEW DRIVER' : 'CONVOY // НОВЫЙ ВОДИТЕЛЬ',
      subtitle: isEn ? 'JOINED THE CONVOY' : 'ВСТУПИЛ В КОЛОННУ',
      defaultBadge: isEn ? '+1 UNIT' : '+1 ЮНИТ',
      color: '#38bdf8',
      rgb: '56, 189, 248',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.7" stroke-dasharray="4 2.5"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
    },
    raid: {
      code: isEn ? 'CONVOY // INCOMING FLEET' : 'CONVOY // ВСТРЕЧНАЯ КОЛОННА',
      subtitle: isEn ? 'INCOMING RAID' : 'ВХОДЯЩИЙ РЕЙД',
      defaultBadge: isEn ? 'RAID' : 'РЕЙД',
      color: '#a855f7',
      rgb: '168, 85, 247',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13.2 2.5L4.8 13.2h6.4L10.3 21.5l8.9-11.2h-6.4l.4-7.8Z" fill="currentColor" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>'
    },
    points: {
      code: isEn ? 'TERMINAL // CHANNEL POINTS' : 'TERMINAL // БАЛЛЫ КАНАЛА',
      subtitle: isEn ? 'REWARD REDEEMED' : 'НАГРАДА ЗА БАЛЛЫ',
      defaultBadge: isEn ? 'REWARD' : 'НАГРАДА',
      color: '#f43f5e',
      rgb: '244, 63, 94',
      iconSvg: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l7.5 6.5L12 21 4.5 9.5 12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M4.5 9.5h15M12 3l-2.8 6.5L12 21l2.8-11.5L12 3Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>'
    }
  };

  const queue = [];
  const brokenSounds = new Set();
  const audioPool = new Map();

  let isProcessing = false;
  let activeAlertId = null;
  let activeCardEl = null;
  let activeShatterEl = null;
  let activeShatterAnimations = [];
  let activeAudio = null;
  let audioCtx = null;
  let seqCounter = 0;

  let enterTimer = null;
  let displayTimer = null;
  let exitTimer = null;
  let pauseTimer = null;
  let fallbackTimer = null;

  function getContainer() {
    return global.document.getElementById('alert-dock');
  }

  function cleanupShatter() {
    if (activeShatterAnimations.length > 0) {
      activeShatterAnimations.forEach((anim) => {
        try {
          anim.cancel();
        } catch (_) {
          // Игнорируем ошибку отмены завершённой анимации
        }
      });
      activeShatterAnimations = [];
    }
    if (activeShatterEl && activeShatterEl.parentNode) {
      activeShatterEl.parentNode.removeChild(activeShatterEl);
    }
    activeShatterEl = null;
  }

  function clearTimers() {
    if (enterTimer !== null) {
      cancelAnimationFrame(enterTimer);
      enterTimer = null;
    }
    if (displayTimer !== null) {
      clearTimeout(displayTimer);
      displayTimer = null;
    }
    if (exitTimer !== null) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }
    if (pauseTimer !== null) {
      clearTimeout(pauseTimer);
      pauseTimer = null;
    }
    if (fallbackTimer !== null) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  }

  function stopActiveAudio() {
    if (activeAudio) {
      try {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      } catch (_) {
        // Игнорируем возможные ошибки остановки аудио
      }
      activeAudio = null;
    }
    if (global.speechSynthesis && typeof global.speechSynthesis.cancel === 'function') {
      try {
        global.speechSynthesis.cancel();
      } catch (_) {
        // Игнорируем ограничения браузера
      }
    }
  }

  function playSynthChime(type, volume) {
    if (volume <= 0 || config.alerts.synthFallback === false) return;
    const AudioContextCtor = global.AudioContext || global.webkitAudioContext;
    if (!AudioContextCtor) return;

    try {
      if (!audioCtx) {
        audioCtx = new AudioContextCtor();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const now = audioCtx.currentTime;
      const notesByType = {
        donate: [587.33, 880.0, 1174.66],
        sub: [523.25, 659.25, 783.99],
        follow: [523.25, 659.25],
        raid: [440.0, 554.37, 659.25, 880.0],
        points: [587.33, 739.99, 987.77]
      };
      const notes = notesByType[type] || notesByType.follow;

      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const startAt = now + idx * 0.085;
        const duration = 0.22;

        osc.type = type === 'raid' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, startAt);

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.02, volume * 0.14), startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startAt);
        osc.stop(startAt + duration + 0.02);
      });
    } catch (err) {
      warn('WebAudio chime fallback skipped:', err);
    }
  }

  function playAlertSound(type) {
    const rawVolume = Number(config.alerts.volume);
    const volume = Number.isFinite(rawVolume) ? Math.max(0, Math.min(1, rawVolume)) : 0.65;
    if (volume <= 0) return;

    const soundSrc = config.alerts.sounds && config.alerts.sounds[type];
    if (!soundSrc || brokenSounds.has(soundSrc)) {
      playSynthChime(type, volume);
      return;
    }

    let audio = audioPool.get(soundSrc);
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto';
      audio.src = soundSrc;
      audio.addEventListener('error', () => {
        brokenSounds.add(soundSrc);
        warn(`Звуковой файл не найден или не загружен (${soundSrc}), используется синтезированный сигнал.`);
      });
      audioPool.set(soundSrc, audio);
    }

    const alertIdAtStart = activeAlertId;

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = volume;
      activeAudio = audio;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((err) => {
          if (activeAlertId !== alertIdAtStart || (err && err.name === 'AbortError')) {
            return;
          }
          warn(`Автозапуск звука заблокирован или файл недоступен (${type}):`, err && err.message ? err.message : err);
          playSynthChime(type, volume);
        });
      }
    } catch (err) {
      warn('Ошибка запуска звука алерта:', err);
      playSynthChime(type, volume);
    }
  }

  function speakDonationMessage(alertItem) {
    if (!config.alerts.ttsEnabled || alertItem.type !== 'donate' || !alertItem.message) return;
    if (!global.speechSynthesis || typeof global.SpeechSynthesisUtterance !== 'function') return;

    try {
      const utterance = new global.SpeechSynthesisUtterance(
        `${alertItem.username}. ${alertItem.message}`
      );
      utterance.lang = 'ru-RU';
      const rawVolume = Number(config.alerts.volume);
      utterance.volume = Number.isFinite(rawVolume) ? Math.max(0, Math.min(1, rawVolume)) : 0.65;
      global.speechSynthesis.speak(utterance);
    } catch (err) {
      warn('TTS недоступен:', err);
    }
  }

  function normalizeAlertType(rawType) {
    const clean = String(rawType || 'follow').trim().toLowerCase();
    if (clean === 'reward' || clean === 'channel_points' || clean === 'points') return 'points';
    if (ALERT_PRESETS[clean]) return clean;
    return 'follow';
  }

  function formatBadge(item, preset) {
    if (item.badgeText) return String(item.badgeText);

    if (item.type === 'donate') {
      const amount = Number(item.amount);
      const currency = item.currency || (isEn ? '$' : '₽');
      if (Number.isFinite(amount) && amount > 0) {
        return `${amount.toLocaleString(isEn ? 'en-US' : 'ru-RU')} ${currency}`;
      }
      return preset.defaultBadge;
    }

    if (item.type === 'sub') {
      const months = Number(item.months);
      if (Number.isFinite(months) && months > 1) {
        return isEn ? `${months} MOS` : `${months} МЕС.`;
      }
      return item.tier ? String(item.tier).toUpperCase() : preset.defaultBadge;
    }

    if (item.type === 'raid') {
      const viewers = Number(item.viewers);
      if (Number.isFinite(viewers) && viewers > 0) {
        return isEn ? `+${viewers} TRUCKS` : `+${viewers} ТЯГАЧЕЙ`;
      }
      return preset.defaultBadge;
    }

    if (item.type === 'points') {
      const cost = Number(item.points ?? item.cost ?? item.amount);
      if (Number.isFinite(cost) && cost > 0) {
        return isEn
          ? `${cost.toLocaleString('en-US')} PTS`
          : `${cost.toLocaleString('ru-RU')} БАЛЛОВ`;
      }
      return preset.defaultBadge;
    }

    return preset.defaultBadge;
  }

  function buildAlertCard(item) {
    const preset = ALERT_PRESETS[item.type] || ALERT_PRESETS.follow;
    const badgeText = formatBadge(item, preset);
    const subtitleText = item.subtitle || preset.subtitle;

    const card = global.document.createElement('div');
    card.className = `alert-card stream-alert-card alert-card--${item.type} stream-alert-card--${item.type}`;
    card.setAttribute('role', 'status');
    card.style.setProperty('--alert-color', preset.color);
    card.style.setProperty('--alert-rgb', preset.rgb);
    card.innerHTML = `
      <span class="stream-alert-corner stream-alert-corner--tl" aria-hidden="true"></span>
      <span class="stream-alert-corner stream-alert-corner--tr" aria-hidden="true"></span>
      <span class="stream-alert-corner stream-alert-corner--bl" aria-hidden="true"></span>
      <span class="stream-alert-corner stream-alert-corner--br" aria-hidden="true"></span>
      <div class="stream-alert-layout">
        <div class="stream-alert-icon-box" aria-hidden="true">${preset.iconSvg}</div>
        <div class="stream-alert-body">
          <div class="alert-top">
            <span class="alert-code"><span class="stream-alert-dot" aria-hidden="true"></span>${escapeHtml(preset.code)}</span>
            <span class="alert-badge">${escapeHtml(badgeText)}</span>
          </div>
          <div class="alert-main">
            <div class="alert-user">${escapeHtml(item.username || (isEn ? 'DRIVER' : 'ВОДИТЕЛЬ'))}</div>
            <div class="alert-subtitle">${escapeHtml(subtitleText)}</div>
          </div>
        </div>
      </div>
      ${item.message ? `<div class="alert-message">${escapeHtml(item.message)}</div>` : ''}
      <div class="alert-progress-track">
        <div class="alert-progress-fill"></div>
      </div>
    `;
    return card;
  }

  function buildParabolicKeyframes(vx, vy, gravity, rotDeg, endScale, durationSec) {
    const steps = [0, 0.2, 0.48, 0.76, 1.0];
    const opacities = [1, 1, 0.9, 0.42, 0];
    return steps.map((frac, idx) => {
      const t = durationSec * frac;
      const x = vx * t;
      const y = vy * t + 0.5 * gravity * t * t;
      const r = rotDeg * frac;
      const s = 1 - (1 - endScale) * frac;
      return {
        transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(1)}deg) scale(${s.toFixed(3)})`,
        opacity: opacities[idx],
        offset: frac
      };
    });
  }

  function triggerShatterExplosion(card, container, item) {
    cleanupShatter();
    const doc = global.document;
    const preset = ALERT_PRESETS[item.type] || ALERT_PRESETS.follow;
    const w = Math.max(240, card.offsetWidth || 540);
    const h = Math.max(84, card.offsetHeight || 124);
    const cx = w * 0.5;
    const cy = h * 0.5;

    const stage = doc.createElement('div');
    stage.className = 'stream-alert-shatter-stage';
    stage.setAttribute('aria-hidden', 'true');
    stage.style.width = `${w}px`;
    stage.style.height = `${h}px`;
    stage.style.setProperty('--alert-color', preset.color);
    stage.style.setProperty('--alert-rgb', preset.rgb);

    // 1. Вспышка и ударная волна в момент взрыва
    const flash = doc.createElement('div');
    flash.className = 'shatter-flash';
    stage.appendChild(flash);

    // 2. Сетка 7x4 (28 бесшовных полигональных осколков корпуса и текста)
    const cols = 7;
    const rows = 4;
    const cellW = w / cols;
    const cellH = h / rows;

    const pts = [];
    for (let r = 0; r <= rows; r += 1) {
      const rowPts = [];
      for (let c = 0; c <= cols; c += 1) {
        let px = c * cellW;
        let py = r * cellH;
        if (c > 0 && c < cols) {
          px += (Math.random() - 0.5) * cellW * 0.48;
        }
        if (r > 0 && r < rows) {
          py += (Math.random() - 0.5) * cellH * 0.44;
        }
        rowPts.push([px, py]);
      }
      pts.push(rowPts);
    }

    const canAnimate = typeof stage.animate === 'function';
    const anims = [];

    if (canAnimate) {
      anims.push(flash.animate([
        { transform: 'scale(0.96)', opacity: 0.95 },
        { transform: 'scale(1.13)', opacity: 0 }
      ], {
        duration: 240,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards'
      }));
    } else {
      flash.style.opacity = '0';
    }

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const poly = [pts[r][c], pts[r][c + 1], pts[r + 1][c + 1], pts[r + 1][c]];
        const minX = Math.min(poly[0][0], poly[1][0], poly[2][0], poly[3][0]);
        const maxX = Math.max(poly[0][0], poly[1][0], poly[2][0], poly[3][0]);
        const minY = Math.min(poly[0][1], poly[1][1], poly[2][1], poly[3][1]);
        const maxY = Math.max(poly[0][1], poly[1][1], poly[2][1], poly[3][1]);
        const sw = Math.max(4, maxX - minX);
        const sh = Math.max(4, maxY - minY);

        const shard = doc.createElement('div');
        let shardClass = 'shatter-shard';
        if (r === 0) shardClass += ' shatter-shard--edge-top';
        if (c === 0) shardClass += ' shatter-shard--edge-left';
        if ((r === 1 || r === 2) && c >= 1 && c <= 5) shardClass += ' shatter-shard--text';
        shard.className = shardClass;

        shard.style.left = `${minX.toFixed(1)}px`;
        shard.style.top = `${minY.toFixed(1)}px`;
        shard.style.width = `${sw.toFixed(1)}px`;
        shard.style.height = `${sh.toFixed(1)}px`;

        const clipPts = poly
          .map(([px, py]) => `${(((px - minX) / sw) * 100).toFixed(1)}% ${(((py - minY) / sh) * 100).toFixed(1)}%`)
          .join(', ');
        shard.style.clipPath = `polygon(${clipPts})`;

        stage.appendChild(shard);

        const sx = (minX + maxX) * 0.5;
        const sy = (minY + maxY) * 0.5;
        const normX = (sx - cx) / Math.max(1, cx);
        const normY = (sy - cy) / Math.max(1, cy);

        const vx = normX * (150 + Math.random() * 145) + (Math.random() - 0.5) * 85;
        const vy = normY * (95 + Math.random() * 90) - (130 + Math.random() * 135);
        const rotDeg = (normX >= 0 ? 1 : -1) * (95 + Math.random() * 195) + (Math.random() - 0.5) * 80;
        const durationMs = 740 + Math.round(Math.random() * 120);
        const endScale = 0.62 + Math.random() * 0.24;

        if (canAnimate) {
          const kf = buildParabolicKeyframes(vx, vy, 560, rotDeg, endScale, durationMs / 1000);
          anims.push(shard.animate(kf, {
            duration: durationMs,
            easing: 'linear',
            fill: 'forwards'
          }));
        } else {
          shard.style.opacity = '0';
        }
      }
    }

    // 3. Рой из 18 неоновых искр взрыва
    const sparkCount = 18;
    for (let i = 0; i < sparkCount; i += 1) {
      const spark = doc.createElement('div');
      spark.className = 'shatter-spark';
      const size = 3 + Math.round(Math.random() * 3.5);
      const startX = w * (0.08 + Math.random() * 0.84);
      const startY = h * (0.10 + Math.random() * 0.80);

      spark.style.width = `${size}px`;
      spark.style.height = `${size}px`;
      spark.style.left = `${startX.toFixed(1)}px`;
      spark.style.top = `${startY.toFixed(1)}px`;
      stage.appendChild(spark);

      const angle = Math.atan2(startY - cy, startX - cx) + (Math.random() - 0.5) * 0.7;
      const speed = 185 + Math.random() * 215;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - (95 + Math.random() * 110);
      const durationMs = 560 + Math.round(Math.random() * 230);

      if (canAnimate) {
        const kf = buildParabolicKeyframes(vx, vy, 420, (Math.random() - 0.5) * 320, 0.15, durationMs / 1000);
        anims.push(spark.animate(kf, {
          duration: durationMs,
          easing: 'linear',
          fill: 'forwards'
        }));
      } else {
        spark.style.opacity = '0';
      }
    }

    activeShatterEl = stage;
    activeShatterAnimations = anims;
    container.replaceChildren(stage);
  }

  function finishCurrentAlert(reason) {
    clearTimers();
    stopActiveAudio();
    cleanupShatter();

    if (activeCardEl && activeCardEl.parentNode) {
      activeCardEl.parentNode.removeChild(activeCardEl);
    }

    log(`Алерт #${activeAlertId} завершён (${reason}). В очереди: ${queue.length}`);
    activeCardEl = null;
    activeAlertId = null;
    isProcessing = false;

    processNext();
  }

  function processNext() {
    if (isProcessing || queue.length === 0) return;

    const container = getContainer();
    if (!container) {
      warn('Контейнер #alert-dock не найден в DOM.');
      return;
    }

    const item = queue.shift();
    isProcessing = true;
    activeAlertId = item.id;

    const displayDurationMs = Math.max(1200, Number(config.alerts.displayDurationMs) || 5000);
    const pauseBetweenMs = Math.max(0, Number(config.alerts.pauseBetweenMs) || 800);
    const exitAnimMs = 880;
    const configuredFallbackMs = Math.max(1000, Number(config.alerts.fallbackTimeoutMs) || 10000);
    const fallbackTimeoutMs = Math.max(configuredFallbackMs, displayDurationMs + exitAnimMs + pauseBetweenMs + 2500);

    // Страховочный таймер принудительной разблокировки FIFO-очереди
    fallbackTimer = setTimeout(() => {
      if (activeAlertId === item.id) {
        warn(`Сработал fallback-таймер (${fallbackTimeoutMs}ms) для алерта #${item.id}`);
        finishCurrentAlert('fallback-timeout');
      }
    }, fallbackTimeoutMs);

    cleanupShatter();
    const card = buildAlertCard(item);
    activeCardEl = card;
    container.replaceChildren(card);

    const progressFill = card.querySelector('.alert-progress-fill');

    enterTimer = requestAnimationFrame(() => {
      if (activeAlertId !== item.id) return;
      card.classList.add('is-visible');

      if (progressFill) {
        progressFill.style.transition = `transform ${displayDurationMs}ms linear`;
        requestAnimationFrame(() => {
          if (activeAlertId === item.id) {
            progressFill.style.transform = 'scaleX(0)';
          }
        });
      }
    });

    playAlertSound(item.type);
    speakDonationMessage(item);

    displayTimer = setTimeout(() => {
      if (activeAlertId !== item.id) return;
      triggerShatterExplosion(card, container, item);
      activeCardEl = null;

      exitTimer = setTimeout(() => {
        if (activeAlertId !== item.id) return;
        cleanupShatter();
        stopActiveAudio();

        if (pauseBetweenMs > 0) {
          pauseTimer = setTimeout(() => {
            if (activeAlertId === item.id) {
              finishCurrentAlert('completed');
            }
          }, pauseBetweenMs);
        } else {
          finishCurrentAlert('completed');
        }
      }, exitAnimMs);
    }, displayDurationMs);
  }

  function enqueueAlert(rawPayload) {
    if (!rawPayload || typeof rawPayload !== 'object') return false;

    const normalizedType = normalizeAlertType(rawPayload.type);
    if (normalizedType === 'donate' && !rawPayload.force) {
      const minDonate = Number(config.alerts.minDonateAmount) || 0;
      const amount = Number(rawPayload.amount) || 0;
      if (amount < minDonate) {
        log(`Донат ${amount} отклонён по фильтру minDonateAmount (${minDonate}).`);
        return false;
      }
    }

    seqCounter += 1;
    const item = {
      id: seqCounter,
      type: normalizedType,
      username: rawPayload.username || (isEn ? 'DRIVER' : 'ВОДИТЕЛЬ'),
      amount: rawPayload.amount,
      currency: rawPayload.currency || (isEn ? '$' : '₽'),
      points: rawPayload.points,
      cost: rawPayload.cost,
      months: rawPayload.months,
      tier: rawPayload.tier,
      viewers: rawPayload.viewers,
      subtitle: rawPayload.subtitle,
      badgeText: rawPayload.badgeText,
      message: rawPayload.message ? String(rawPayload.message).trim() : ''
    };

    queue.push(item);
    log(`Алерт #${item.id} (${item.type}) добавлен в FIFO-очередь. Длина очереди: ${queue.length}`);

    if (!isProcessing) {
      processNext();
    }
    return true;
  }

  function clearQueue() {
    queue.length = 0;
    finishCurrentAlert('manual-clear');
  }

  let daSocket = null;
  let daPingTimer = null;
  let daReconnectTimer = null;
  let daClosedByPage = false;

  function stopDonationAlertsTimers() {
    if (daPingTimer !== null) {
      clearInterval(daPingTimer);
      daPingTimer = null;
    }
    if (daReconnectTimer !== null) {
      clearTimeout(daReconnectTimer);
      daReconnectTimer = null;
    }
  }

  function decodeJwtPayload(token) {
    try {
      const parts = String(token || '').split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const json = global.atob(padded);
      return JSON.parse(json);
    } catch (_) {
      return null;
    }
  }

  function extractDonationPayload(rawData) {
    let data = rawData;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (_) {
        return null;
      }
    }
    if (!data || typeof data !== 'object') return null;

    // Разворачиваем вложенные обёртки Centrifugo (data.data)
    if (!data.username && !data.name && data.data !== undefined) {
      if (typeof data.data === 'string') {
        try {
          data = JSON.parse(data.data);
        } catch (_) {
          return null;
        }
      } else if (data.data && typeof data.data === 'object') {
        data = data.data;
      }
    }

    const hasAmountField = data.amount_main !== undefined || data.amount !== undefined || data.money !== undefined;
    const amount = Number(data.amount_main ?? data.amount ?? data.money ?? 0);
    const username = data.username || data.name;
    if (!username && !hasAmountField) return null;

    return {
      type: 'donate',
      username: username || 'Аноним',
      amount: Number.isFinite(amount) ? amount : 0,
      currency: data.currency || '₽',
      message: data.message ? String(data.message) : ''
    };
  }

  function connectDonationAlerts() {
    const da = config.channels && config.channels.donationAlerts;
    if (!da || !da.enabled || isPlaceholder(da.socketToken)) return false;

    const rawToken = String(da.socketToken).trim();
    const centrifugoUrl = da.centrifugoUrl || 'wss://centrifugo.donationalerts.com/connection/websocket';
    const fallbackSocketUrl = da.socketUrl || 'wss://socket.donationalerts.com/socket.io/?EIO=3&transport=websocket';

    let backoffMs = 4000;
    let activeMode = da.socketUrl ? 'socketio' : 'centrifugo';
    let cmdSeq = 0;

    function nextCmdId() {
      cmdSeq += 1;
      return cmdSeq;
    }

    function scheduleReconnect(targetMode, delayMs) {
      if (daClosedByPage) return;
      stopDonationAlertsTimers();
      daReconnectTimer = setTimeout(() => {
        daReconnectTimer = null;
        if (daClosedByPage) return;
        activeMode = targetMode;
        openConnection();
      }, delayMs);
    }

    async function fetchWidgetOAuthInfo(accessToken) {
      const res = await fetch('https://www.donationalerts.com/api/v1/user/oauth', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error(`OAuth HTTP ${res.status}`);
      const json = await res.json();
      return json && json.data ? json.data : null;
    }

    async function fetchCentrifugeSubToken(accessToken, channel, clientUuid) {
      const res = await fetch('https://www.donationalerts.com/api/v1/centrifuge/subscribe', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ channels: [channel], client: clientUuid })
      });
      if (!res.ok) throw new Error(`Subscribe HTTP ${res.status}`);
      const json = await res.json();
      const first = json && Array.isArray(json.channels) ? json.channels[0] : null;
      return first && first.token ? first.token : '';
    }

    async function openCentrifugo() {
      if (daClosedByPage) return;
      stopDonationAlertsTimers();

      let connectToken = rawToken;
      let resolvedUserId = da.userId ? String(da.userId) : '';
      const accessToken = !isPlaceholder(da.oauthToken || da.accessToken)
        ? String(da.oauthToken || da.accessToken).trim()
        : '';

      if (accessToken) {
        try {
          const userData = await fetchWidgetOAuthInfo(accessToken);
          if (daClosedByPage) return;
          if (userData) {
            if (userData.id) resolvedUserId = String(userData.id);
            if (userData.socket_connection_token) connectToken = String(userData.socket_connection_token);
          }
        } catch (err) {
          warn('Не удалось получить socket_connection_token через OAuth, пробуем прямой socketToken:', err);
        }
      }

      if (!resolvedUserId) {
        const jwtPayload = decodeJwtPayload(connectToken);
        if (jwtPayload && jwtPayload.sub) {
          resolvedUserId = String(jwtPayload.sub);
        }
      }

      const ws = new WebSocket(centrifugoUrl);
      daSocket = ws;

      let connectCmdId = null;
      let subscribeCmdId = null;
      let isSubscribed = false;
      let switchingToFallback = false;

      function switchToSocketIoFallback(reason) {
        if (switchingToFallback || daClosedByPage) return;
        switchingToFallback = true;
        warn(`Centrifugo (${reason}) — переключение на резервный Socket.IO (${fallbackSocketUrl}).`);
        stopDonationAlertsTimers();
        try {
          ws.close();
        } catch (_) {
          // Игнорируем ошибку закрытия сокета
        }
        scheduleReconnect('socketio', 350);
      }

      ws.addEventListener('open', () => {
        if (daClosedByPage || ws !== daSocket) return;
        connectCmdId = nextCmdId();
        ws.send(JSON.stringify({
          params: { token: connectToken },
          id: connectCmdId
        }));
      });

      ws.addEventListener('message', async (event) => {
        if (daClosedByPage || ws !== daSocket) return;
        const lines = String(event.data || '').split(/\r?\n/);

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          // Серверный ping Centrifugo ({}) — отвечаем {} для удержания соединения
          if (line === '{}') {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('{}');
            }
            continue;
          }

          let frame;
          try {
            frame = JSON.parse(line);
          } catch (_) {
            continue;
          }

          if (frame && typeof frame === 'object' && Object.keys(frame).length === 0) {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('{}');
            }
            continue;
          }

          // Обработка ответа на авторизацию (connect)
          if (frame.id && frame.id === connectCmdId) {
            if (frame.error) {
              switchToSocketIoFallback(`auth error ${frame.error.code || ''}: ${frame.error.message || 'rejected'}`);
              return;
            }

            const result = frame.result || {};
            const clientUuid = result.client || '';
            const uidFromResult = result.user || (result.data && result.data.id) || (result.info && result.info.id);
            if (!resolvedUserId && uidFromResult) {
              resolvedUserId = String(uidFromResult);
            }

            stopDonationAlertsTimers();
            daPingTimer = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send('{}');
              }
            }, 25000);

            if (!resolvedUserId) {
              switchToSocketIoFallback('не получен user_id для канала $alerts:donation_<user_id>');
              return;
            }

            const channel = `$alerts:donation_${resolvedUserId}`;
            let subToken = da.channelToken ? String(da.channelToken).trim() : '';

            if (!subToken && accessToken && clientUuid) {
              try {
                subToken = await fetchCentrifugeSubToken(accessToken, channel, clientUuid);
              } catch (err) {
                warn('Не удалось получить centrifuge subscribe token:', err);
              }
            }

            if (daClosedByPage || ws.readyState !== WebSocket.OPEN) return;

            subscribeCmdId = nextCmdId();
            const subParams = subToken ? { channel, token: subToken } : { channel };
            ws.send(JSON.stringify({
              method: 1,
              params: subParams,
              id: subscribeCmdId
            }));
            continue;
          }

          // Обработка ответа на подписку (subscribe)
          if (frame.id && frame.id === subscribeCmdId) {
            if (frame.error) {
              switchToSocketIoFallback(`subscribe error ${frame.error.code || ''}: ${frame.error.message || 'denied'}`);
              return;
            }
            isSubscribed = true;
            backoffMs = 4000;
            log(`DonationAlerts Centrifugo подключен (канал $alerts:donation_${resolvedUserId}).`);
            continue;
          }

          // Обработка входящих публикаций (Centrifugo v2/v3 result или push)
          const pubContainer = frame.result || (frame.push && frame.push.pub ? {
            channel: frame.push.channel,
            data: frame.push.pub.data
          } : null);

          if (pubContainer && pubContainer.data) {
            const ch = String(pubContainer.channel || '');
            if (!ch || ch.startsWith('$alerts:donation')) {
              const donation = extractDonationPayload(pubContainer.data);
              if (donation) {
                enqueueAlert(donation);
              }
            }
          }
        }
      });

      ws.addEventListener('close', () => {
        stopDonationAlertsTimers();
        if (daClosedByPage || switchingToFallback || ws !== daSocket) return;
        if (!isSubscribed) {
          switchToSocketIoFallback('соединение закрыто до завершения подписки');
          return;
        }
        scheduleReconnect('centrifugo', backoffMs);
        backoffMs = Math.min(30000, backoffMs * 2);
      });

      ws.addEventListener('error', (err) => {
        warn('Ошибка DonationAlerts Centrifugo WebSocket:', err);
      });
    }

    function openSocketIoFallback() {
      if (daClosedByPage) return;
      stopDonationAlertsTimers();

      const ws = new WebSocket(fallbackSocketUrl);
      daSocket = ws;
      let isAuthed = false;

      ws.addEventListener('message', (event) => {
        if (daClosedByPage || ws !== daSocket) return;
        const raw = String(event.data || '');

        if (raw.startsWith('0')) {
          try {
            const meta = JSON.parse(raw.slice(1));
            const pingInterval = Math.max(10000, Number(meta.pingInterval) || 25000);
            stopDonationAlertsTimers();
            daPingTimer = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send('2');
              }
            }, pingInterval);
          } catch (_) {
            // Игнорируем ошибку разбора handshake
          }
          return;
        }

        if (raw === '2') {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('3');
          }
          return;
        }

        if (raw === '40') {
          ws.send(`42${JSON.stringify(['add-user', { token: rawToken, type: 'alert_widget' }])}`);
          isAuthed = true;
          backoffMs = 4000;
          log('DonationAlerts Socket.IO fallback подключен.');
          return;
        }

        if (raw.startsWith('42')) {
          try {
            const payload = JSON.parse(raw.slice(2));
            if (Array.isArray(payload) && payload[0] === 'donation') {
              const donation = extractDonationPayload(payload[1]);
              if (donation) {
                enqueueAlert(donation);
              }
            }
          } catch (err) {
            warn('Ошибка парсинга DonationAlerts Socket.IO события:', err);
          }
        }
      });

      ws.addEventListener('close', () => {
        stopDonationAlertsTimers();
        if (daClosedByPage || ws !== daSocket) return;
        const nextMode = da.socketUrl ? 'socketio' : 'centrifugo';
        if (!isAuthed) {
          warn(`DonationAlerts fallback закрыт, повтор через ${backoffMs}мс.`);
        }
        scheduleReconnect(nextMode, backoffMs);
        backoffMs = Math.min(30000, backoffMs * 2);
      });

      ws.addEventListener('error', (err) => {
        warn('Ошибка DonationAlerts Socket.IO fallback:', err);
      });
    }

    function openConnection() {
      if (daClosedByPage) return;
      if (activeMode === 'socketio') {
        openSocketIoFallback();
      } else {
        openCentrifugo();
      }
    }

    openConnection();
    return true;
  }

  global.addEventListener('pagehide', () => {
    daClosedByPage = true;
    clearTimers();
    cleanupShatter();
    stopActiveAudio();
    stopDonationAlertsTimers();
    if (daSocket) {
      try {
        daSocket.close();
      } catch (_) {
        // Игнорируем ошибку закрытия
      }
    }
  });

  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', connectDonationAlerts);
  } else {
    connectDonationAlerts();
  }

  const STREAM_ALERT_SAMPLES = {
    donate: {
      type: 'donate',
      username: isEn ? 'Daniel_Trucker' : 'Даниил_Дальнобой',
      amount: isEn ? 15 : 500,
      currency: isEn ? '$' : '₽',
      message: isEn
        ? 'For a full diesel tank and hot coffee on the night highway!'
        : 'На полный бак дизеля и горячий кофе на ночной трассе!',
      force: true
    },
    sub: {
      type: 'sub',
      username: 'Ksenia_Road',
      months: 6,
      tier: 'TIER 1',
      message: isEn
        ? 'Renewed trucker crew license for 6 months!'
        : 'Продлила лицензию дальнобойщика на 6 месяцев!',
      force: true
    },
    follow: {
      type: 'follow',
      username: 'Pavel_FH16',
      force: true
    },
    raid: {
      type: 'raid',
      username: 'ConvoyMasters',
      viewers: 48,
      force: true
    },
    points: {
      type: 'points',
      username: 'Scania_V8_Fan',
      points: 1500,
      subtitle: isEn ? 'AIR HORN SALUTE' : 'ПНЕВМОГУДОК НА ТРАССЕ',
      message: isEn ? 'Give us a double blast on the highway!' : 'Дай двойной гудок на автобане!',
      force: true
    }
  };

  global.testStreamAlert = function testStreamAlert(type = 'donate', overrides = {}) {
    const kind = String(type || 'donate').trim().toLowerCase();
    if (kind === 'all') {
      ['donate', 'sub', 'follow', 'raid', 'points'].forEach((k) => {
        enqueueAlert({ ...STREAM_ALERT_SAMPLES[k], ...overrides, type: k, force: true });
      });
      return '[StreamAlert] Enqueued all 5 demo alerts (donate, sub, follow, raid, points).';
    }
    const normalized = normalizeAlertType(kind);
    const sample = STREAM_ALERT_SAMPLES[normalized] || STREAM_ALERT_SAMPLES.donate;
    enqueueAlert({ ...sample, ...overrides, type: normalized, force: true });
    return `[StreamAlert] Dispatched "${normalized}" alert (rise from cluster + shatter exit).`;
  };

  app.alerts = {
    enqueue: enqueueAlert,
    clear: clearQueue,
    getQueueLength: () => queue.length,
    isActive: () => isProcessing
  };

  // Автоматический триггер для превью скриншотов (?alert=donate | ?alert=sub ...)
  try {
    const urlAlertParam = new URLSearchParams(global.location.search).get('alert');
    if (urlAlertParam) {
      setTimeout(() => {
        if (typeof global.testStreamAlert === 'function') {
          global.testStreamAlert(urlAlertParam);
        }
      }, 400);
    }
  } catch (e) {}

})(window);

/* Copyright (c) 2026 FooZzee. All Rights Reserved. Licensed under Proprietary Freeware License. */
/**
 * 3D-карусель чата: Лента чата (по умолчанию 5 мин) -> Опросник «ОЦЕНИТЕ ИГРУ» (1 мин) -> Чат -> «Не забудь подписаться:» (1 мин).
 * Единственный источник правды для опросника !0–!5 и карточки соцсетей.
 */
(function initETS2ChatCarousel(global) {
  'use strict';

  const app = global.ETS2Overlay || (global.ETS2Overlay = {});
  const POLL_RATINGS = [
    { score: 5, cmd: '!5', label: 'отлично', color: '#22c55e' },
    { score: 4, cmd: '!4', label: 'хорошо', color: '#84cc16' },
    { score: 3, cmd: '!3', label: 'средне', color: '#eab308' },
    { score: 2, cmd: '!2', label: 'слабо', color: '#f97316' },
    { score: 1, cmd: '!1', label: 'не понравилось', color: '#ef4444' },
    { score: 0, cmd: '!0', label: 'не смотрел', color: '#64748b' }
  ];

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SOCIAL_DEFS = [
    {
      key: 'telegram',
      label: 'Telegram',
      color: '#38bdf8',
      pathD: 'M11.8 2.2 1.8 6.1c-.7.3-.7.7-.1.9l2.6.8 6-3.8c.3-.2.5-.1.3.1l-4.9 4.4-.2 2.7c.3 0 .4-.1.6-.3l1.4-1.3 2.8 2.1c.5.3.9.1 1-.5l1.8-8.5c.2-.7-.3-1-.9-.7Z'
    },
    {
      key: 'vk',
      label: 'VK',
      color: '#60a5fa',
      pathD: 'M12.6 8.9h-1.4c-.5 0-.7-.4-1.6-1.3-.8-.8-1.1-.9-1.3-.9-.3 0-.4.1-.4.5v1.2c0 .3-.1.5-.9.5-1.3 0-2.8-.8-3.8-2.3C1.7 4.5 1.3 3 1.3 2.7c0-.2.1-.4.5-.4h1.4c.4 0 .5.2.6.5.7 1.9 1.8 3.6 2.3 3.6.2 0 .3-.1.3-.6V4.1c-.1-.9-.5-1-.5-1.3 0-.2.1-.3.4-.3h2.2c.3 0 .4.2.4.5v2.4c0 .3.1.4.2.4.2 0 .4-.1.7-.5 1-1.1 1.7-2.8 1.7-2.8.1-.2.3-.4.6-.4h1.4c.4 0 .5.2.4.5-.2.9-1.8 3.2-1.8 3.2-.2.3-.2.4 0 .7.2.2.7.7 1.1 1.2.6.7 1.1 1.3 1.2 1.7.1.4-.1.6-.6.6Z'
    },
    {
      key: 'youtube',
      label: 'YouTube',
      color: '#f87171',
      pathD: 'M13.6 4.2c-.2-.6-.6-1.1-1.2-1.2C11.3 2.7 7 2.7 7 2.7s-4.3 0-5.4.3c-.6.2-1 .6-1.2 1.2C.1 5.3.1 7 .1 7s0 1.7.3 2.8c.2.6.6 1.1 1.2 1.2 1.1.3 5.4.3 5.4.3s4.3 0 5.4-.3c.6-.2 1-.6 1.2-1.2.3-1.1.3-2.8.3-2.8s0-1.7-.3-2.8ZM5.6 8.9V5.1L9.1 7 5.6 8.9Z'
    }
  ];

  function pluralVotes(n) {
    const mod100 = n % 100;
    const mod10 = n % 10;
    if (mod100 >= 11 && mod100 <= 19) return `${n} голосов`;
    if (mod10 === 1) return `${n} голос`;
    if (mod10 >= 2 && mod10 <= 4) return `${n} голоса`;
    return `${n} голосов`;
  }

  function resolveAvgColor(avg) {
    if (avg >= 4.5) return '#22c55e';
    if (avg >= 3.5) return '#84cc16';
    if (avg >= 2.5) return '#eab308';
    if (avg >= 1.5) return '#f97316';
    return '#ef4444';
  }

  function createEl(doc, tag, className, textContent) {
    const el = doc.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined) el.textContent = textContent;
    return el;
  }

  function createSvgIcon(doc, pathD, color) {
    const svg = doc.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 14 14');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('hud-social-svg');
    if (color) svg.style.color = color;
    const path = doc.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'currentColor');
    svg.appendChild(path);
    return svg;
  }

  function getManualGameTitle(cfg) {
    const chatCfg = (cfg && cfg.chat) || {};
    const raw = String(chatCfg.gameTitle ?? '').trim();
    if (!raw || raw.toLowerCase() === 'auto') return '';
    return raw;
  }

  function resolveSocialItems(cfg) {
    const socials = (cfg && cfg.socials) || {};
    const result = [];

    SOCIAL_DEFS.forEach((def) => {
      const val = String(socials[def.key] || '').trim();
      if (val) {
        result.push({ ...def, value: val });
      }
    });

    if (result.length === 0 && Array.isArray(socials.items)) {
      socials.items.forEach((item) => {
        if (!item || !item.value) return;
        const lbl = String(item.label || '').toLowerCase();
        const def = SOCIAL_DEFS.find((d) => lbl.includes(d.key) || (d.key === 'telegram' && lbl === 'tg')) || SOCIAL_DEFS[0];
        result.push({ ...def, value: String(item.value).trim() });
      });
    }

    if (result.length === 0) {
      result.push(
        { ...SOCIAL_DEFS[0], value: 't.me/foozzeestream' },
        { ...SOCIAL_DEFS[1], value: 'vk.ru/gtfun' },
        { ...SOCIAL_DEFS[2], value: 'youtube.com/@foozzee' }
      );
    }
    return result;
  }

  function buildPollView(doc) {
    const root = createEl(doc, 'div', 'hud-poll-wrap');

    const headBlock = createEl(doc, 'div', 'hud-poll-block hud-poll-block--head');
    headBlock.appendChild(createEl(doc, 'div', 'hud-poll-kicker', 'ОЦЕНИТЕ ИГРУ'));
    const gameEl = createEl(doc, 'div', 'hud-poll-game', 'Euro Truck Simulator 2');
    headBlock.appendChild(gameEl);

    const bodyBlock = createEl(doc, 'div', 'hud-poll-block hud-poll-block--body');
    const summary = createEl(doc, 'div', 'hud-poll-summary');
    const avgWrap = createEl(doc, 'div', 'hud-poll-avg-wrap');
    const avgEl = createEl(doc, 'span', 'hud-poll-avg', '—');
    const maxEl = createEl(doc, 'span', 'hud-poll-max', '/ 5');
    avgWrap.appendChild(avgEl);
    avgWrap.appendChild(maxEl);

    const totalEl = createEl(doc, 'span', 'hud-poll-total', '0 голосов');
    summary.appendChild(avgWrap);
    summary.appendChild(totalEl);
    bodyBlock.appendChild(summary);

    const rowsEl = createEl(doc, 'div', 'hud-poll-rows');
    const rowRefs = new Map();
    POLL_RATINGS.forEach((item) => {
      const row = createEl(doc, 'div', 'hud-poll-row');
      row.appendChild(createEl(doc, 'span', 'hud-poll-cmd', item.cmd));
      row.appendChild(createEl(doc, 'span', 'hud-poll-lbl', item.label));

      const track = createEl(doc, 'div', 'hud-poll-track');
      const fill = createEl(doc, 'div', 'hud-poll-fill');
      fill.style.background = item.color;
      track.appendChild(fill);
      row.appendChild(track);

      const cnt = createEl(doc, 'span', 'hud-poll-cnt', '0');
      row.appendChild(cnt);
      rowsEl.appendChild(row);
      rowRefs.set(item.score, { fill, cnt });
    });
    bodyBlock.appendChild(rowsEl);

    const footBlock = createEl(doc, 'div', 'hud-poll-block hud-poll-block--foot', 'Пишите в чат !0 – !5');

    root.appendChild(headBlock);
    root.appendChild(bodyBlock);
    root.appendChild(footBlock);

    return { root, gameEl, avgEl, totalEl, rowRefs };
  }

  function buildSocialsView(doc, cfg) {
    const card = createEl(doc, 'div', 'hud-socials-card');
    card.appendChild(createEl(doc, 'div', 'hud-socials-title', 'Не забудь подписаться:'));

    const list = createEl(doc, 'div', 'hud-socials-list');
    resolveSocialItems(cfg).forEach((item) => {
      const pill = createEl(doc, 'div', 'hud-social-pill');
      pill.appendChild(createSvgIcon(doc, item.pathD, item.color));
      const textWrap = createEl(doc, 'div', 'hud-social-text');
      textWrap.appendChild(createEl(doc, 'span', 'hud-social-name', item.label));
      textWrap.appendChild(createEl(doc, 'span', 'hud-social-link', item.value));
      pill.appendChild(textWrap);
      list.appendChild(pill);
    });

    card.appendChild(list);
    return card;
  }

  function init() {
    const doc = global.document;
    if (!doc) return null;

    const dock = doc.querySelector('.cockpit-chat-dock');
    const shell = dock ? dock.querySelector('.cockpit-chat-shell') : null;
    if (!dock || !shell || dock.querySelector('.hud-flip-card')) return null;

    const cfg = app.config || global.OVERLAY_CONFIG || {};
    const chatCfg = cfg.chat || {};
    if (chatCfg.enabled === false) {
      dock.style.display = 'none';
      return null;
    }

    const params = new URLSearchParams(global.location ? global.location.search : '');
    const viewParam = (params.get('view') || (params.get('poll') === '1' ? 'poll' : '')).trim().toLowerCase();
    const isFast = params.get('fast') === '1' || params.get('fast') === 'true';
    const isDemo = params.get('demo') === '1' || params.get('test') === '1';

    const flipCard = createEl(doc, 'div', 'hud-flip-card');
    const frontFace = createEl(doc, 'div', 'hud-flip-face hud-flip-face--front');
    const backFace = createEl(doc, 'div', 'hud-flip-face hud-flip-face--back is-hidden-face');

    shell.parentNode.insertBefore(flipCard, shell);
    frontFace.appendChild(shell);

    const pollView = buildPollView(doc);
    const socialsView = buildSocialsView(doc, cfg);
    backFace.appendChild(pollView.root);
    backFace.appendChild(socialsView);

    flipCard.appendChild(frontFace);
    flipCard.appendChild(backFace);

    const manualTitle = getManualGameTitle(cfg);
    let currentGameTitle = manualTitle || 'Euro Truck Simulator 2';
    pollView.gameEl.textContent = currentGameTitle;

    function applyAutoGameTitle(detectedTitle) {
      if (manualTitle) return;
      const clean = String(detectedTitle || '').trim();
      if (clean && clean !== currentGameTitle) {
        currentGameTitle = clean;
        pollView.gameEl.textContent = clean;
      }
    }

    if (!manualTitle) {
      global.addEventListener('cockpit:telemetry-game', (e) => {
        const g = e && e.detail && e.detail.game;
        if (g === 'ats') applyAutoGameTitle('American Truck Simulator');
        else if (g === 'ets2') applyAutoGameTitle('Euro Truck Simulator 2');
      });

      const tw = cfg.channels && cfg.channels.twitch;
      if (tw && tw.enabled && tw.channelName && !app.isPlaceholder?.(tw.channelName) && app.emotes) {
        app.emotes.fetchTwitchGameName(tw.channelName).then((streamGame) => {
          if (streamGame) applyAutoGameTitle(streamGame);
        });
      }
    }

    const votes = new Map();

    function renderPoll() {
      const counts = [0, 0, 0, 0, 0, 0];
      let ratedSum = 0;
      let ratedCount = 0;
      votes.forEach((score) => {
        counts[score] += 1;
        if (score >= 1) {
          ratedSum += score;
          ratedCount += 1;
        }
      });

      const total = votes.size;
      if (ratedCount === 0) {
        pollView.avgEl.textContent = '—';
        pollView.avgEl.style.color = '#94a3b8';
      } else {
        const avg = ratedSum / ratedCount;
        pollView.avgEl.textContent = avg.toFixed(1).replace('.', ',');
        pollView.avgEl.style.color = resolveAvgColor(avg);
      }

      pollView.totalEl.textContent = pluralVotes(total);
      POLL_RATINGS.forEach((item) => {
        const ref = pollView.rowRefs.get(item.score);
        if (!ref) return;
        const c = counts[item.score];
        ref.cnt.textContent = String(c);
        ref.fill.style.width = total > 0 ? `${((c / total) * 100).toFixed(1)}%` : '0%';
      });
    }

    function processPollVote(username, rawText) {
      const cleanText = String(rawText || '')
        .replace(/[\u200B-\u200F\uFEFF\u034F\u00A0]/g, '')
        .trim();
      const match = cleanText.match(/^!([0-5])(?:\s|$)/i);
      if (!match) return false;
      const key = String(username || 'Зритель').trim().toLowerCase();
      votes.set(key, Number(match[1]));
      renderPoll();
      return true;
    }

    global.addEventListener('cockpit:chat-raw-message', (e) => {
      if (!e || !e.detail) return;
      processPollVote(e.detail.user || e.detail.username, e.detail.text);
    });

    let activeFace = 'chat';
    let hideTimer = null;

    function setBackContent(mode) {
      pollView.root.style.display = mode === 'poll' ? 'flex' : 'none';
      socialsView.style.display = mode === 'socials' ? 'flex' : 'none';
    }

    function showView(mode, immediate = false) {
      activeFace = mode;
      const showBack = mode === 'poll' || mode === 'socials';
      if (showBack) {
        setBackContent(mode);
      }

      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }

      if (showBack) {
        backFace.classList.remove('is-hidden-face');
        flipCard.classList.add('is-flipped');
        if (immediate) {
          frontFace.classList.add('is-hidden-face');
        } else {
          hideTimer = setTimeout(() => {
            if (activeFace !== 'chat') frontFace.classList.add('is-hidden-face');
          }, 800);
        }
      } else {
        frontFace.classList.remove('is-hidden-face');
        flipCard.classList.remove('is-flipped');
        if (immediate) {
          backFace.classList.add('is-hidden-face');
        } else {
          hideTimer = setTimeout(() => {
            if (activeFace === 'chat') backFace.classList.add('is-hidden-face');
          }, 800);
        }
      }
    }

    if (isDemo) {
      [['viewer_1', '!5'], ['viewer_2', '!5'], ['viewer_3', '!4'], ['viewer_4', '!0']].forEach(([u, t]) => {
        processPollVote(u, t);
      });
    }

    const pollEnabled = chatCfg.pollEnabled !== false;
    if (viewParam === 'chat' || viewParam === 'poll' || viewParam === 'socials') {
      showView(viewParam, true);
    } else {
      showView('chat', true);
      const cfgChatSec = Math.max(5, Number(chatCfg.carouselChatSec) || 300);
      const cfgCardSec = Math.max(5, Number(chatCfg.carouselCardSec) || 60);
      const chatMs = isFast ? 6000 : cfgChatSec * 1000;
      const cardMs = isFast ? 4000 : cfgCardSec * 1000;
      const sequence = pollEnabled
        ? [
          { view: 'chat', duration: chatMs },
          { view: 'poll', duration: cardMs },
          { view: 'chat', duration: chatMs },
          { view: 'socials', duration: cardMs }
        ]
        : [
          { view: 'chat', duration: chatMs },
          { view: 'socials', duration: cardMs }
        ];

      let stepIdx = 1;
      const advanceCycle = () => {
        const current = sequence[stepIdx];
        showView(current.view, false);
        stepIdx = (stepIdx + 1) % sequence.length;
        setTimeout(advanceCycle, current.duration);
      };
      setTimeout(advanceCycle, sequence[0].duration);
    }

    return {
      processPollVote,
      showView,
      getGameTitle: () => pollView.gameEl.textContent,
      getVoteStats: () => ({ total: votes.size, avgText: pollView.avgEl.textContent })
    };
  }

  let instance = null;
  function ensureInit() {
    if (!instance) {
      instance = init();
    }
    return instance;
  }

  if (global.document) {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', ensureInit, { once: true });
    } else {
      ensureInit();
    }
  }

  app.chatCarousel = {
    init: ensureInit,
    getInstance: () => instance
  };
})(window);

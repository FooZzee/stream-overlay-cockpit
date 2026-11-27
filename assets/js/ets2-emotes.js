/* Copyright (c) 2026 FooZzee. All Rights Reserved. Licensed under Proprietary Freeware License. */
/**
 * Модуль смайлов и бейджей Twitch (нативные IRC emotes, 7TV, BTTV, FFZ, Twitch GQL badges).
 * Глубокий модуль с узким интерфейсом: безопасный рендер через textContent / createElement.
 */
(function initETS2Emotes(global) {
  'use strict';

  const app = global.ETS2Overlay || (global.ETS2Overlay = {});
  const TWITCH_GQL_URL = 'https://gql.twitch.tv/gql';
  const TWITCH_GQL_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
  const FETCH_TIMEOUT_MS = 4500;

  const thirdPartyEmotes = new Map();
  const badgeIndex = new Map();
  let initializedChannel = '';

  async function fetchJsonWithTimeout(url, options = {}) {
    if (typeof global.fetch !== 'function') return null;
    const controller = typeof global.AbortController === 'function' ? new global.AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS) : null;
    try {
      const resp = await global.fetch(url, {
        ...options,
        signal: controller ? controller.signal : undefined
      });
      if (!resp || !resp.ok) return null;
      return await resp.json();
    } catch (_) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function queryTwitchGql(query, variables) {
    return fetchJsonWithTimeout(TWITCH_GQL_URL, {
      method: 'POST',
      headers: {
        'Client-ID': TWITCH_GQL_CLIENT_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables })
    });
  }

  function registerEmote(name, url) {
    if (!name || !url || thirdPartyEmotes.has(name)) return;
    thirdPartyEmotes.set(name, url);
  }

  function register7tvSet(emoteList) {
    if (!Array.isArray(emoteList)) return;
    emoteList.forEach((item) => {
      if (!item || !item.name || !item.id) return;
      const host = item.data && item.data.host;
      let url = `https://cdn.7tv.app/emote/${encodeURIComponent(item.id)}/2x.webp`;
      if (host && host.url) {
        const base = String(host.url).startsWith('//') ? `https:${host.url}` : String(host.url);
        url = `${base}/2x.webp`;
      }
      registerEmote(item.name, url);
    });
  }

  function registerBttvList(list) {
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      if (!item || !item.code || !item.id) return;
      registerEmote(item.code, `https://cdn.betterttv.net/emote/${encodeURIComponent(item.id)}/2x`);
    });
  }

  function registerFfzSets(sets) {
    if (!sets || typeof sets !== 'object') return;
    Object.keys(sets).forEach((setId) => {
      const setObj = sets[setId];
      const emoticons = setObj && Array.isArray(setObj.emoticons) ? setObj.emoticons : [];
      emoticons.forEach((em) => {
        if (!em || !em.name || !em.urls) return;
        const rawUrl = em.urls['2'] || em.urls['1'] || em.urls['4'];
        if (!rawUrl) return;
        const url = String(rawUrl).startsWith('//') ? `https:${rawUrl}` : String(rawUrl);
        registerEmote(em.name, url);
      });
    });
  }

  function registerBadgesList(badges) {
    if (!Array.isArray(badges)) return;
    badges.forEach((b) => {
      if (!b || !b.setID || !b.version) return;
      const url = b.imageURL || b.image2x || b.image1x;
      if (!url) return;
      badgeIndex.set(`${b.setID}/${b.version}`, {
        url: String(url),
        title: String(b.title || b.setID)
      });
    });
  }

  async function loadChannelMetadata(channelLogin) {
    const cleanChannel = String(channelLogin || '').trim().toLowerCase().replace(/^#/, '');
    if (!cleanChannel) return null;

    const gqlQuery = `
      query CockpitChannelMeta($login: String!) {
        badges { setID version title imageURL(size: DOUBLE) }
        user(login: $login) {
          id
          broadcastBadges { setID version title imageURL(size: DOUBLE) }
          stream { game { displayName } }
        }
      }
    `;

    const gqlRes = await queryTwitchGql(gqlQuery, { login: cleanChannel });
    const data = gqlRes && gqlRes.data;
    if (data) {
      registerBadgesList(data.badges);
      if (data.user) {
        registerBadgesList(data.user.broadcastBadges);
      }
    }

    const userId = data && data.user && data.user.id ? String(data.user.id) : '';
    const streamGame = data && data.user && data.user.stream && data.user.stream.game
      ? String(data.user.stream.game.displayName || '').trim()
      : '';

    const tasks = [
      fetchJsonWithTimeout('https://7tv.io/v3/emote-sets/global').then((d) => d && register7tvSet(d.emotes)),
      fetchJsonWithTimeout('https://api.betterttv.net/3/cached/emotes/global').then((d) => registerBttvList(d)),
      fetchJsonWithTimeout('https://api.frankerfacez.com/v1/set/global').then((d) => d && registerFfzSets(d.sets))
    ];

    if (userId) {
      tasks.push(
        fetchJsonWithTimeout(`https://7tv.io/v3/users/twitch/${encodeURIComponent(userId)}`)
          .then((d) => d && d.emote_set && register7tvSet(d.emote_set.emotes)),
        fetchJsonWithTimeout(`https://api.betterttv.net/3/cached/users/twitch/${encodeURIComponent(userId)}`)
          .then((d) => {
            if (!d) return;
            registerBttvList(d.channelEmotes);
            registerBttvList(d.sharedEmotes);
          }),
        fetchJsonWithTimeout(`https://api.frankerfacez.com/v1/room/id/${encodeURIComponent(userId)}`)
          .then((d) => d && registerFfzSets(d.sets))
      );
    }

    await Promise.allSettled(tasks);
    return { userId, streamGame };
  }

  function initForChannel(channelLogin) {
    const clean = String(channelLogin || '').trim().toLowerCase().replace(/^#/, '');
    if (!clean || initializedChannel === clean) return Promise.resolve(null);
    initializedChannel = clean;
    return loadChannelMetadata(clean);
  }

  async function fetchTwitchGameName(channelLogin) {
    const clean = String(channelLogin || '').trim().toLowerCase().replace(/^#/, '');
    if (!clean) return '';
    const res = await queryTwitchGql(
      'query CockpitStreamGame($login: String!) { user(login: $login) { stream { game { displayName } } } }',
      { login: clean }
    );
    const game = res && res.data && res.data.user && res.data.user.stream && res.data.user.stream.game;
    return game && game.displayName ? String(game.displayName).trim() : '';
  }

  function createEmoteImg(doc, src, altName) {
    const img = doc.createElement('img');
    img.className = 'cockpit-msg-emote chat-emote';
    img.src = src;
    img.alt = altName;
    img.decoding = 'async';
    img.addEventListener('error', () => {
      if (img.parentNode) {
        img.parentNode.replaceChild(doc.createTextNode(altName), img);
      }
    }, { once: true });
    return img;
  }

  function appendTextWithThirdPartyEmotes(doc, parentEl, textSegment) {
    if (!textSegment) return;
    if (thirdPartyEmotes.size === 0) {
      parentEl.appendChild(doc.createTextNode(textSegment));
      return;
    }

    const tokens = textSegment.split(/(\s+)/);
    let textBuf = '';
    for (let i = 0; i < tokens.length; i += 1) {
      const tok = tokens[i];
      if (!tok) continue;
      const emoteUrl = thirdPartyEmotes.get(tok);
      if (emoteUrl) {
        if (textBuf) {
          parentEl.appendChild(doc.createTextNode(textBuf));
          textBuf = '';
        }
        parentEl.appendChild(createEmoteImg(doc, emoteUrl, tok));
      } else {
        textBuf += tok;
      }
    }
    if (textBuf) {
      parentEl.appendChild(doc.createTextNode(textBuf));
    }
  }

  function parseTwitchEmotesTag(emotesTag, codePointLength) {
    if (!emotesTag || typeof emotesTag !== 'string') return [];
    const occurrences = [];

    emotesTag.split('/').forEach((entry) => {
      if (!entry) return;
      const colonIdx = entry.indexOf(':');
      if (colonIdx <= 0) return;

      const emoteId = entry.slice(0, colonIdx).trim();
      if (!emoteId) return;

      const rangesStr = entry.slice(colonIdx + 1);
      rangesStr.split(',').forEach((rangeStr) => {
        const dashIdx = rangeStr.indexOf('-');
        if (dashIdx <= 0) return;

        const start = Number(rangeStr.slice(0, dashIdx));
        const end = Number(rangeStr.slice(dashIdx + 1));
        if (!Number.isInteger(start) || !Number.isInteger(end)) return;
        if (start < 0 || end < start || end >= codePointLength) return;

        occurrences.push({ start, end, emoteId });
      });
    });

    occurrences.sort((a, b) => a.start - b.start || a.end - b.end);

    const nonOverlapping = [];
    let cursor = 0;
    occurrences.forEach((item) => {
      if (item.start >= cursor) {
        nonOverlapping.push(item);
        cursor = item.end + 1;
      }
    });

    return nonOverlapping;
  }

  function appendMessageContent(parentEl, platform, rawText, emotesTag) {
    const doc = global.document;
    if (!doc || !parentEl) return;

    const text = String(rawText || '');
    if (platform === 'twitch' && emotesTag) {
      const chars = Array.from(text);
      const occurrences = parseTwitchEmotesTag(emotesTag, chars.length);
      if (occurrences.length > 0) {
        let cursor = 0;
        occurrences.forEach((occ) => {
          if (occ.start > cursor) {
            appendTextWithThirdPartyEmotes(doc, parentEl, chars.slice(cursor, occ.start).join(''));
          }
          const emoteName = chars.slice(occ.start, occ.end + 1).join('');
          const src = `https://static-cdn.jtvnw.net/emoticons/v2/${encodeURIComponent(occ.emoteId)}/default/dark/2.0`;
          parentEl.appendChild(createEmoteImg(doc, src, emoteName));
          cursor = occ.end + 1;
        });
        if (cursor < chars.length) {
          appendTextWithThirdPartyEmotes(doc, parentEl, chars.slice(cursor).join(''));
        }
        return;
      }
    }

    appendTextWithThirdPartyEmotes(doc, parentEl, text.trim());
  }

  const FALLBACK_BADGE_MAP = {
    broadcaster: { label: 'LIVE', cls: 'driver' },
    moderator: { label: 'MOD', cls: 'mod' },
    vip: { label: 'VIP', cls: 'vip' },
    subscriber: { label: 'SUB', cls: 'sub' }
  };

  function createFallbackBadgeEl(doc, setId) {
    const info = FALLBACK_BADGE_MAP[setId];
    if (!info) return null;
    const span = doc.createElement('span');
    span.className = `cockpit-msg-role cockpit-msg-role--${info.cls}`;
    span.textContent = info.label;
    return span;
  }

  function appendTwitchBadges(parentEl, rawBadgesTag, fallbackRole) {
    const doc = global.document;
    if (!doc || !parentEl) return;

    const raw = String(rawBadgesTag || '').trim();
    if (!raw) {
      if (fallbackRole) {
        const span = doc.createElement('span');
        const safeRole = String(fallbackRole).toLowerCase().replace(/[^a-z0-9-]/g, '');
        span.className = safeRole ? `cockpit-msg-role cockpit-msg-role--${safeRole}` : 'cockpit-msg-role';
        span.textContent = String(fallbackRole).toUpperCase();
        parentEl.appendChild(span);
      }
      return;
    }

    const pairs = raw.split(',').filter(Boolean);
    pairs.forEach((pair) => {
      const slashIdx = pair.indexOf('/');
      const setId = slashIdx > 0 ? pair.slice(0, slashIdx) : pair;
      const meta = badgeIndex.get(pair);
      if (meta && meta.url) {
        const img = doc.createElement('img');
        img.className = 'chat-badge';
        img.src = meta.url;
        img.alt = meta.title || setId;
        img.width = 18;
        img.height = 18;
        img.decoding = 'async';
        img.addEventListener('error', () => {
          if (!img.parentNode) return;
          const fb = createFallbackBadgeEl(doc, setId);
          if (fb) {
            img.parentNode.replaceChild(fb, img);
          } else {
            img.parentNode.removeChild(img);
          }
        }, { once: true });
        parentEl.appendChild(img);
      } else {
        const fb = createFallbackBadgeEl(doc, setId);
        if (fb) {
          parentEl.appendChild(fb);
        }
      }
    });
  }

  app.emotes = {
    initForChannel,
    fetchTwitchGameName,
    appendMessageContent,
    appendTwitchBadges,
    parseTwitchEmotesTag,
    setEmoteMapForTest: (entries) => {
      thirdPartyEmotes.clear();
      if (Array.isArray(entries)) {
        entries.forEach(([k, v]) => registerEmote(k, v));
      }
    },
    setBadgeMapForTest: (entries) => {
      badgeIndex.clear();
      if (Array.isArray(entries)) {
        entries.forEach(([k, v]) => badgeIndex.set(k, v));
      }
    }
  };
})(window);

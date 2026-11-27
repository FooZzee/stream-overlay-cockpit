/* Copyright (c) 2026 FooZzee. All Rights Reserved. Licensed under Proprietary Freeware License. */
/**
 * Модуль чата и входящих WebSocket-событий (Twitch IRC)
 * с защитой от утечек памяти и фильтрацией из window.OVERLAY_CONFIG.
 */
(function initETS2Chat(global) {
  'use strict';

  const app = global.ETS2Overlay;
  if (!app) return;

  const { config, isPlaceholder, log, warn } = app;

  const activeMessageTimers = new Map();
  const sockets = [];
  const reconnectTimers = [];
  let msgSeq = 0;

  function getViewport() {
    return global.document.getElementById('chat-viewport');
  }

  function isIgnoredUser(username) {
    const list = Array.isArray(config.chat.ignoredUsers) ? config.chat.ignoredUsers : [];
    const target = String(username || '').trim().toLowerCase();
    return list.some((u) => String(u || '').trim().toLowerCase() === target);
  }

  function removeMessageEl(el) {
    if (!el) return;
    const msgId = el.dataset.msgId;
    if (msgId && activeMessageTimers.has(msgId)) {
      clearTimeout(activeMessageTimers.get(msgId));
      activeMessageTimers.delete(msgId);
    }

    el.classList.remove('is-visible');
    el.classList.add('is-removing');
    setTimeout(() => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 300);
  }

  function removeOldestMessage(viewport) {
    const oldest = viewport.firstElementChild;
    if (!oldest) return false;
    const msgId = oldest.dataset.msgId;
    if (msgId && activeMessageTimers.has(msgId)) {
      clearTimeout(activeMessageTimers.get(msgId));
      activeMessageTimers.delete(msgId);
    }
    viewport.removeChild(oldest);
    return true;
  }

  function pruneMessages(viewport) {
    const maxMessages = Math.max(5, Number(config.chat.maxMessages) || 30);
    while (viewport.children.length > maxMessages) {
      if (!removeOldestMessage(viewport)) break;
    }
    while (viewport.children.length > 1 && viewport.clientHeight > 0 && viewport.scrollHeight > viewport.clientHeight) {
      if (!removeOldestMessage(viewport)) break;
    }
  }

  function appendChatMessageText(parentEl, platform, rawText, emotesTag) {
    if (app.emotes && typeof app.emotes.appendMessageContent === 'function') {
      app.emotes.appendMessageContent(parentEl, platform, rawText, emotesTag);
      return;
    }
    parentEl.appendChild(global.document.createTextNode(String(rawText || '').trim()));
  }

  function pushMessage(payload) {
    if (!payload) return false;

    const rawText = String(payload.text || '');
    const trimmedText = rawText.trim();
    if (!trimmedText) return false;

    const username = String(payload.username || 'Зритель').trim();
    if (isIgnoredUser(username)) {
      return false;
    }

    const platform = String(payload.platform || 'twitch').toLowerCase();
    if (typeof global.CustomEvent === 'function' && global.dispatchEvent) {
      global.dispatchEvent(new global.CustomEvent('cockpit:chat-raw-message', {
        detail: { user: username, text: rawText, platform }
      }));
    }

    const viewport = getViewport();
    if (!viewport) return false;

    if (config.chat.hideCommands && trimmedText.startsWith('!')) {
      return false;
    }

    const doc = global.document;

    msgSeq += 1;
    const msgId = `msg-${msgSeq}`;
    const safePlatformClass = /^[a-z0-9-]+$/.test(platform) ? platform : 'twitch';
    const role = payload.role ? String(payload.role).toUpperCase() : '';
    const userColor = payload.color || '';

    const el = doc.createElement('article');
    el.className = 'cockpit-msg';
    el.dataset.msgId = msgId;
    el.dataset.platform = safePlatformClass;
    if (role) {
      el.dataset.role = role.toLowerCase();
    }

    if (userColor) {
      el.style.setProperty('--msg-user-color', userColor);
      el.style.setProperty('--msg-accent', userColor);
    }

    const platformLabel = platform === 'vk' ? 'VK' : 'TW';
    const badgesEl = doc.createElement('span');
    badgesEl.className = 'cockpit-msg-badges';

    if (platform === 'twitch' && app.emotes && typeof app.emotes.appendTwitchBadges === 'function' && (payload.badges || role)) {
      app.emotes.appendTwitchBadges(badgesEl, payload.badges || '', role);
    } else {
      const platformTagEl = doc.createElement('span');
      platformTagEl.className = `cockpit-msg-platform cockpit-msg-platform--${safePlatformClass}`;
      platformTagEl.textContent = platformLabel;
      badgesEl.appendChild(platformTagEl);

      if (role) {
        const safeRoleClass = role.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const roleEl = doc.createElement('span');
        roleEl.className = safeRoleClass
          ? `cockpit-msg-role cockpit-msg-role--${safeRoleClass}`
          : 'cockpit-msg-role';
        roleEl.textContent = role;
        badgesEl.appendChild(roleEl);
      }
    }

    const authorEl = doc.createElement('span');
    authorEl.className = 'cockpit-msg-author';
    authorEl.textContent = username;

    const identEl = doc.createElement('div');
    identEl.className = 'cockpit-msg-ident';
    identEl.appendChild(badgesEl);
    identEl.appendChild(authorEl);

    const now = new Date();
    const timeEl = doc.createElement('time');
    timeEl.className = 'cockpit-msg-time';
    timeEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const headEl = doc.createElement('div');
    headEl.className = 'cockpit-msg-head';
    headEl.appendChild(identEl);
    headEl.appendChild(timeEl);

    const bodyEl = doc.createElement('div');
    bodyEl.className = 'cockpit-msg-body';
    appendChatMessageText(bodyEl, platform, rawText, payload.emotes);

    el.appendChild(headEl);
    el.appendChild(bodyEl);

    viewport.appendChild(el);
    pruneMessages(viewport);

    requestAnimationFrame(() => {
      el.classList.add('is-visible');
    });

    const lifetimeMs = Number(config.chat.messageLifetimeMs) || 0;
    if (lifetimeMs > 0) {
      const timerId = setTimeout(() => {
        activeMessageTimers.delete(msgId);
        removeMessageEl(el);
      }, lifetimeMs);
      activeMessageTimers.set(msgId, timerId);
    }

    return true;
  }

  function parseIrcTags(rawTags) {
    const tags = {};
    if (!rawTags) return tags;
    rawTags.split(';').forEach((pair) => {
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) return;
      const key = pair.slice(0, eqIdx);
      const val = pair.slice(eqIdx + 1)
        .replace(/\\s/g, ' ')
        .replace(/\\:/g, ';')
        .replace(/\\\\/g, '\\');
      tags[key] = val;
    });
    return tags;
  }

  function resolveTwitchRole(tags) {
    const badges = String(tags.badges || '');
    if (badges.includes('broadcaster/')) return 'DRIVER';
    if (tags.mod === '1' || badges.includes('moderator/')) return 'MOD';
    if (tags.vip === '1' || badges.includes('vip/')) return 'VIP';
    if (tags.subscriber === '1' || badges.includes('subscriber/')) return 'SUB';
    return '';
  }

  let lastHonkAt = 0;
  let lastCbAt = 0;
  let lastInfoAt = 0;
  const userCooldownMap = new Map();

  function handleChatCommand(username, text, tags, channel) {
    if (!text || !text.startsWith('!')) return false;
    const cmdCfg = config.chatCommands || {};
    if (cmdCfg.enabled === false) return false;
    const cmdFlags = cmdCfg.commands || {};

    const parts = text.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ').trim();

    const badges = String(tags.badges || '');
    const userLower = String(username).toLowerCase();
    const isBroadcaster = badges.includes('broadcaster/') || (channel && userLower === channel);
    const isMod = tags.mod === '1' || badges.includes('moderator/') || isBroadcaster;
    const isVip = tags.vip === '1' || badges.includes('vip/') || isMod;
    const isSub = tags.subscriber === '1' || badges.includes('subscriber/') || isMod;
    const isFirstMsg = tags['first-msg'] === '1';

    const now = Date.now();
    const userLastAt = userCooldownMap.get(userLower) || 0;
    const perUserCd = (Number(cmdCfg.perUserCooldownSec) || 120) * 1000;

    if (['!гудок', '!фафа', '!honk', '!клаксон'].includes(cmd)) {
      if (cmdFlags.honk === false) return false;
      if (!isVip && !isSub && !isMod) return true;
      const globalCd = (Number(cmdCfg.honkCooldownSec) || 60) * 1000;
      if (!isMod) {
        if (now - lastHonkAt < globalCd) return true;
        if (now - userLastAt < perUserCd) return true;
      }
      lastHonkAt = now;
      userCooldownMap.set(userLower, now);
      if (app.triggerChatCommand) {
        app.triggerChatCommand('honk', username);
      }
      return true;
    }

    if (['!рация', '!сиби', '!cb'].includes(cmd)) {
      if (cmdFlags.cb === false) return false;
      if (isFirstMsg && !isSub && !isVip && !isMod) return true;
      if (!args) return true;

      const globalCd = (Number(cmdCfg.cbCooldownSec) || 45) * 1000;
      if (!isMod) {
        if (now - lastCbAt < globalCd) return true;
        if (now - userLastAt < perUserCd) return true;
      }

      let cleanText = args
        .replace(/https?:\/\/\S+/gi, '')
        .replace(/\b[\w-]+\.(?:com|ru|net|org|io|gg|tv|me)\S*/gi, '')
        .trim();
      cleanText = cleanText.slice(0, 70).trim();
      if (!cleanText) return true;

      lastCbAt = now;
      userCooldownMap.set(userLower, now);
      if (app.triggerChatCommand) {
        app.triggerChatCommand('cb', username, cleanText);
      }
      return true;
    }

    if (['!рейс', '!маршрут', '!груз', '!job', '!route'].includes(cmd)) {
      if (cmdFlags.route === false) return false;
      const globalCd = (Number(cmdCfg.infoCooldownSec) || 30) * 1000;
      if (!isMod && (now - lastInfoAt < globalCd)) return true;
      lastInfoAt = now;
      if (app.triggerChatCommand) {
        app.triggerChatCommand('route', username);
      }
      return true;
    }

    if (['!стата', '!статистика', '!стрим', '!stats'].includes(cmd)) {
      if (cmdFlags.stats === false) return false;
      const globalCd = (Number(cmdCfg.infoCooldownSec) || 30) * 1000;
      if (!isMod && (now - lastInfoAt < globalCd)) return true;
      lastInfoAt = now;
      if (app.triggerChatCommand) {
        app.triggerChatCommand('stats', username);
      }
      return true;
    }

    if (['!тягач', '!автобус', '!машина', '!truck'].includes(cmd)) {
      if (cmdFlags.truck === false) return false;
      const globalCd = (Number(cmdCfg.infoCooldownSec) || 30) * 1000;
      if (!isMod && (now - lastInfoAt < globalCd)) return true;
      lastInfoAt = now;
      if (app.triggerChatCommand) {
        app.triggerChatCommand('truck', username);
      }
      return true;
    }

    if (['!водитель', '!права', '!рейтинг', '!driver'].includes(cmd)) {
      if (cmdFlags.driver === false) return false;
      const globalCd = (Number(cmdCfg.infoCooldownSec) || 30) * 1000;
      if (!isMod && (now - lastInfoAt < globalCd)) return true;
      lastInfoAt = now;
      if (app.triggerChatCommand) {
        app.triggerChatCommand('driver', username);
      }
      return true;
    }

    if (['!ставка', '!bet'].includes(cmd)) {
      if (cmdFlags.bet === false) return false;
      const choice = (args.split(/\s+/)[0] || '').toLowerCase();
      if (app.recordTripBet) {
        app.recordTripBet(username, choice);
      }
      return true;
    }

    return false;
  }

  global.testChatCommand = function(cmdString, testUser = 'Tester', role = 'vip') {
    const mockTags = {
      'display-name': testUser,
      badges: role === 'mod' ? 'moderator/1' : role === 'driver' ? 'broadcaster/1' : role === 'vip' ? 'vip/1' : 'subscriber/1',
      mod: role === 'mod' || role === 'driver' ? '1' : '0',
      vip: role === 'vip' ? '1' : '0',
      subscriber: role === 'sub' ? '1' : '0'
    };
    return handleChatCommand(testUser, cmdString, mockTags, 'tester');
  };

  function connectTwitchIRC() {
    const tw = config.channels && config.channels.twitch;
    if (!tw || !tw.enabled || isPlaceholder(tw.channelName)) return false;

    const channel = String(tw.channelName).trim().toLowerCase().replace(/^#/, '');
    if (!channel) return false;

    let backoffMs = 3000;
    let closedByPage = false;

    function openSocket() {
      if (closedByPage) return;
      const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
      sockets.push(ws);

      ws.addEventListener('open', () => {
        backoffMs = 3000;
        log(`Twitch IRC подключен к каналу #${channel}`);
        updateChannelsStatus('live');
        ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');

        if (!isPlaceholder(tw.oauthToken)) {
          const token = String(tw.oauthToken).startsWith('oauth:')
            ? String(tw.oauthToken)
            : `oauth:${tw.oauthToken}`;
          ws.send(`PASS ${token}`);
          ws.send(`NICK ${channel}`);
        } else {
          const guestId = 10000 + Math.floor(Math.random() * 89999);
          ws.send(`NICK justinfan${guestId}`);
        }
        ws.send(`JOIN #${channel}`);
      });

      ws.addEventListener('message', (event) => {
        const lines = String(event.data || '').split('\r\n');
        lines.forEach((line) => {
          if (!line) return;
          if (line.startsWith('PING')) {
            ws.send(line.replace('PING', 'PONG'));
            return;
          }

          let cursor = line;
          let tags = {};
          if (cursor.startsWith('@')) {
            const spaceIdx = cursor.indexOf(' ');
            if (spaceIdx === -1) return;
            tags = parseIrcTags(cursor.slice(1, spaceIdx));
            cursor = cursor.slice(spaceIdx + 1);
          }

          const privMatch = cursor.match(/^:([^!]+)![^ ]+ PRIVMSG #[^ ]+ :(.*)$/);
          if (privMatch) {
            const username = tags['display-name'] || privMatch[1];
            let text = privMatch[2];
            if (text.startsWith('\x01ACTION ') && text.endsWith('\x01')) {
              text = text.slice(8, -1);
            }

            if (!isIgnoredUser(username) && typeof global.CustomEvent === 'function' && global.dispatchEvent) {
              global.dispatchEvent(new global.CustomEvent('cockpit:chat-raw-message', {
                detail: { user: username, text, platform: 'twitch' }
              }));
            }

            const isCmdHandled = handleChatCommand(username, text, tags, channel);

            if (!isCmdHandled || !config.chat.hideCommands) {
              pushMessage({
                platform: 'twitch',
                username,
                text,
                color: tags.color || '',
                role: resolveTwitchRole(tags),
                badges: tags.badges || '',
                emotes: tags.emotes || ''
              });
            }
            return;
          }

          const noticeMatch = cursor.match(/^:[^ ]+ USERNOTICE #[^ ]+(?: :(.*))?$/);
          if (noticeMatch && app.alerts) {
            const msgId = tags['msg-id'];
            const username = tags['display-name'] || tags.login || 'Пилот';
            const message = noticeMatch[1] || '';

            if (msgId === 'sub' || msgId === 'resub' || msgId === 'subgift') {
              app.alerts.enqueue({
                type: 'sub',
                username,
                months: Number(tags['msg-param-cumulative-months']) || 1,
                message
              });
            } else if (msgId === 'raid') {
              app.alerts.enqueue({
                type: 'raid',
                username: tags['msg-param-displayName'] || username,
                viewers: Number(tags['msg-param-viewerCount']) || 0
              });
            }
          }
        });
      });

      ws.addEventListener('close', () => {
        if (closedByPage) return;
        updateChannelsStatus('connecting');
        warn(`Twitch IRC отключен, переподключение через ${backoffMs}мс`);
        const t = setTimeout(openSocket, backoffMs);
        reconnectTimers.push(t);
        backoffMs = Math.min(30000, backoffMs * 2);
      });

      ws.addEventListener('error', (err) => {
        warn('Ошибка Twitch IRC WebSocket:', err);
      });
    }

    global.addEventListener('pagehide', () => {
      closedByPage = true;
    });

    openSocket();
    return true;
  }

  function updateChannelsStatus(statusKey) {
    const channelsLabel = global.document.getElementById('chat-channels-label');
    if (!channelsLabel) return;
    const isRu = app.lang === 'ru';
    const labels = {
      test: isRu ? 'ТЕСТ // В ЭФИРЕ' : 'TEST // LIVE',
      live: isRu ? 'TWITCH // В ЭФИРЕ' : 'TWITCH // LIVE',
      standby: isRu ? 'ОЖИДАНИЕ' : 'STANDBY',
      connecting: isRu ? 'ПОДКЛЮЧЕНИЕ' : 'CONNECTING',
      offline: isRu ? 'НЕ В СЕТИ' : 'OFFLINE'
    };
    channelsLabel.textContent = labels[statusKey] || (isRu ? 'ОЖИДАНИЕ' : 'STANDBY');
    channelsLabel.dataset.status = statusKey || 'standby';
  }

  function initConnections() {
    const tw = config.channels && config.channels.twitch;
    if (tw && tw.enabled && !isPlaceholder(tw.channelName) && app.emotes && typeof app.emotes.initForChannel === 'function') {
      app.emotes.initForChannel(tw.channelName);
    }
    const twitchActive = connectTwitchIRC();
    if (app.isTestMode) {
      updateChannelsStatus('test');
    } else if (twitchActive) {
      updateChannelsStatus('connecting');
    } else {
      updateChannelsStatus('standby');
    }
  }

  function clearChat() {
    const viewport = getViewport();
    if (viewport) {
      viewport.replaceChildren();
    }
    activeMessageTimers.forEach((timerId) => clearTimeout(timerId));
    activeMessageTimers.clear();
  }

  global.addEventListener('pagehide', () => {
    activeMessageTimers.forEach((timerId) => clearTimeout(timerId));
    activeMessageTimers.clear();
    reconnectTimers.forEach((timerId) => clearTimeout(timerId));
    reconnectTimers.length = 0;
    sockets.forEach((ws) => {
      try {
        ws.close();
      } catch (_) {
        // Игнорируем ошибку закрытия сокета
      }
    });
  });

  app.chat = {
    push: pushMessage,
    clear: clearChat,
    initConnections
  };
})(window);

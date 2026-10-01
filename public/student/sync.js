(() => {
  'use strict';
  const QUEUE_PREFIX = 'toeic-pocket-sync-v1:user:';
  let activeUserId = null;
  let pending = null;
  let debounceTimer = null;
  let retryTimer = null;
  let retryDelay = 2000;
  let sending = false;
  let listenersReady = false;

  const queueKey = userId => `${QUEUE_PREFIX}${encodeURIComponent(userId)}`;
  const status = message => {
    const element = document.getElementById('save-status');
    if (element) element.textContent = message;
  };
  function keepPending(payload) {
    pending = payload;
    try { localStorage.setItem(queueKey(payload.expectedUserId), JSON.stringify(payload)); } catch {}
  }
  function forgetPending(payload) {
    if (pending !== payload) return;
    pending = null;
    try { localStorage.removeItem(queueKey(payload.expectedUserId)); } catch {}
  }
  function loadPending(userId) {
    try {
      const value = JSON.parse(localStorage.getItem(queueKey(userId)) || 'null');
      return value && value.expectedUserId === userId && value.state && typeof value.state === 'object' ? value : null;
    } catch { return null; }
  }
  function clearTimers() {
    clearTimeout(debounceTimer);
    clearTimeout(retryTimer);
    debounceTimer = null;
    retryTimer = null;
  }
  function bind(userId) {
    clearTimers();
    activeUserId = typeof userId === 'string' && userId ? userId : null;
    pending = activeUserId ? loadPending(activeUserId) : null;
    retryDelay = 2000;
    if (!listenersReady) {
      window.addEventListener?.('online', () => { if (pending) void send(); });
      document.addEventListener?.('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && pending) void send();
      });
      listenersReady = true;
    }
  }
  function cancel() {
    clearTimers();
    activeUserId = null;
    pending = null;
    sending = false;
  }
  function scheduleRetry() {
    if (!pending || retryTimer) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      void send();
    }, retryDelay);
    retryDelay = Math.min(30000, retryDelay * 2);
  }
  async function send() {
    if (sending || !pending || !activeUserId || pending.expectedUserId !== activeUserId) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      status('Progression enregistrée sur cet appareil');
      return;
    }
    const payload = pending;
    sending = true;
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      if (response.ok) {
        forgetPending(payload);
        retryDelay = 2000;
        status(pending ? 'Nouvelle progression en attente' : 'Progression synchronisée');
      } else if (response.status === 409 || response.status === 401) {
        cancel();
        status('Reconnecte-toi pour synchroniser');
      } else {
        status('Progression enregistrée sur cet appareil');
        scheduleRetry();
      }
    } catch {
      status('Progression enregistrée sur cet appareil');
      scheduleRetry();
    } finally {
      sending = false;
      if (pending && pending !== payload && activeUserId) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => { void send(); }, 0);
      }
    }
  }
  function queue(state, expectedUserId, replace) {
    if (!activeUserId || expectedUserId !== activeUserId) return;
    keepPending({
      expectedUserId,
      replace,
      state: {
        cursor: state.cursor,
        answers: state.answers || {},
        hints: state.hints || {},
        monthly: state.monthly || {},
        game: state.game || {},
      },
    });
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { void send(); }, 700);
  }
  function push(state, _bank, expectedUserId) { queue(state, expectedUserId, false); }
  function replace(state, _bank, expectedUserId) { queue(state, expectedUserId, true); }
  window.PocketSync = { bind, cancel, push, replace, flush: send };
})();

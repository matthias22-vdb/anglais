const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Storage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

(async () => {
  const storage = new Storage();
  const status = { textContent: '' };
  const listeners = {};
  const timers = new Map();
  let timerId = 0;
  let shouldFail = true;
  const requests = [];
  const context = {
    window: { addEventListener: (name, handler) => { listeners[name] = handler; } },
    document: { visibilityState: 'visible', addEventListener: (name, handler) => { listeners[name] = handler; }, getElementById: () => status },
    localStorage: storage,
    navigator: { onLine: true },
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (shouldFail) throw new Error('offline');
      return { ok: true, status: 200 };
    },
    setTimeout: (handler) => { const id = ++timerId; timers.set(id, handler); return id; },
    clearTimeout: id => timers.delete(id),
    JSON,
    encodeURIComponent,
  };
  vm.runInNewContext(fs.readFileSync('public/student/sync.js', 'utf8'), context);
  context.window.PocketSync.bind('student-a');
  const state = { cursor: 1, answers: { q001: { choice: 2 } }, monthly: {}, game: {} };
  context.window.PocketSync.push(state, [], 'student-a');
  const queueKey = 'toeic-pocket-sync-v1:user:student-a';
  assert.ok(storage.getItem(queueKey));
  await context.window.PocketSync.flush();
  assert.equal(requests.length, 1);
  assert.ok(storage.getItem(queueKey));
  assert.equal(status.textContent, 'Progression enregistrée sur cet appareil');
  const body = JSON.parse(requests[0].options.body);
  assert.equal(body.expectedUserId, 'student-a');
  assert.deepEqual(body.state.answers.q001, { choice: 2 });
  assert.equal('grade' in body, false);

  shouldFail = false;
  listeners.online();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests.length, 2);
  assert.equal(storage.getItem(queueKey), null);
  assert.equal(status.textContent, 'Progression synchronisée');

  context.window.PocketSync.bind('student-b');
  context.window.PocketSync.push(state, [], 'student-a');
  await context.window.PocketSync.flush();
  assert.equal(requests.length, 2);
  console.log('PASS: durable sync queue, offline preservation, reconnect retry, server-computed payload and account isolation.');
})().catch(error => { console.error(error); process.exitCode = 1; });

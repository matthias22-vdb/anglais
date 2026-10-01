const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor() { this.hidden = false; this.value = ''; this.textContent = ''; }
  focus() {}
}

function elementsFromHtml() {
  const html = fs.readFileSync('public/student/index.html', 'utf8');
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
  return Object.fromEntries(ids.map(id => [id, new Element()]));
}

async function boot(responses, search = '', saved = new Map()) {
  const elements = elementsFromHtml();
  const calls = [];
  const starts = [];
  const context = {
    URLSearchParams,
    window: { location: {search, pathname:'/student/index.html', replace: path => calls.push({redirect: path}), reload: () => calls.push({reload:true})}, ENGLISH_POCKET_CONFIG: { productName: 'ENGLISH POCKET EXAM' }, TOEIC_QUESTIONS: [], PocketApp:{start:identity=>starts.push(identity)}, PocketSync:{bind:userId=>calls.push({bind:userId}),cancel:()=>calls.push({cancel:true})} },
    document: { getElementById: id => elements[id] },
    localStorage: { get length() { return saved.size; }, key: index => [...saved.keys()][index] ?? null, getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) },
    fetch: async (url, options = {}) => {
      calls.push({ url, options });
      const response = responses.shift();
      return { status: response.status, ok: response.status >= 200 && response.status < 300, json: async () => response.body };
    },
    Error,
    JSON,
  };
  vm.runInNewContext(fs.readFileSync('public/student/auth.js', 'utf8'), context);
  await new Promise(resolve => setImmediate(resolve));
  return { elements, calls, starts };
}

(async () => {
  const teacher = await boot([{status:200,body:{userId:'teacher-1',isTeacher:true,class:null}},{status:200,body:{state:null}}]);
  assert.equal(teacher.elements['app-shell'].hidden, false);
  assert.equal(teacher.calls.some(call => call.redirect), false);
  const anonymous = await boot([{ status: 401, body: { authenticated: false } }]);
  assert.equal(anonymous.elements['login-screen'].hidden, false);
  assert.equal(anonymous.elements['app-shell'].hidden, true);
  assert.equal(anonymous.elements['secure-login'].hidden, false);

  const member = await boot([{ status: 200, body: { authenticated: true, userId:'student-1', displayName: 'Lina', class: { className: 'BA3' }, isTeacher: false } },{status:200,body:{state:{cursor:4,answers:{}}}}]);
  assert.equal(member.elements['login-screen'].hidden, true);
  assert.equal(member.elements['app-shell'].hidden, false);

  const newcomer = await boot([
    { status: 200, body: { authenticated: true, userId:'student-2', displayName: 'Lina', class: null, isTeacher: false } },
    { status: 201, body: { ok: true, class: { className: 'BA3' } } },
    { status: 200, body: { state: null } },
  ]);
  assert.equal(newcomer.elements['class-form'].hidden, false);
  newcomer.elements['class-code'].value = 'ab3k7p';
  await newcomer.elements['class-form'].onsubmit({ preventDefault() {} });
  assert.equal(newcomer.calls[1].url, '/api/student/join');
  assert.equal(JSON.parse(newcomer.calls[1].options.body).code, 'AB3K7P');
  assert.equal(newcomer.elements['app-shell'].hidden, false);
  const invited = await boot([{status:401,body:{}}], '?classe=AB3K7P');
  assert.equal(invited.elements['class-code'].value, 'AB3K7P');
  assert.match(invited.elements['secure-login'].href, /classe%3DAB3K7P/);
  const ready = await boot([{status:200,body:{userId:'student-3',displayName:'Lina',class:null}}], '?classe=AB3K7P');
  assert.equal(ready.elements['class-form'].hidden, false);
  assert.match(ready.elements['login-intro'].textContent, /déjà rempli/);
  const solo = await boot([{status:200,body:{userId:'student-4',displayName:'Solo',class:null,isTeacher:false}},{status:200,body:{state:null}}]);
  solo.elements['skip-class'].onclick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(solo.elements['app-shell'].hidden, false);
  assert.equal(solo.starts.length, 1);
  assert.equal(solo.starts[0].userId, 'student-4');
  assert.equal(member.starts[0].remoteState.cursor, 4);
  const prior = { cursor: 2, answers: { 'g-001': { choice: 1 } }, monthly: {}, game: {} };
  const saved = new Map([['toeic-pocket-stage1-v1:user:old-account', JSON.stringify(prior)]]);
  const guest = await boot([{ status: 200, body: { userId:'test-guest', testMode:true, role:'student', class:null } }, {status:200,body:{state:null}}], '', saved);
  assert.equal(guest.elements['recovery-panel'].hidden, false);
  assert.match(guest.elements['recovery-local-text'].textContent, /1 question déjà travaillée/);
  guest.elements['recover-local'].onclick();
  assert.equal(JSON.parse(saved.get('toeic-pocket-stage1-v1:user:test-guest')).answers['g-001'].choice, 1);
  assert.ok(saved.has('toeic-pocket-stage1-v1:user:old-account'));
  assert.ok(guest.calls.some(call => call.reload));
  const missingIdentity = await boot([{status:200,body:{displayName:'Inconnu',class:{className:'BA3'}}}]);
  assert.equal(missingIdentity.elements['app-shell'].hidden, true);
  assert.equal(missingIdentity.starts.length, 0);
  const firstLogin = await boot([{status:200,body:{userId:'student-5',displayName:'Lina',mustChangePassword:true}}], '?classe=AB3K7P');
  assert.equal(firstLogin.starts.length, 0);
  assert.match(firstLogin.calls.find(call => call.redirect).redirect, /^\/change-password\?return_to=/);
  console.log('PASS: personal-account sign-in, class membership check and one-time class join flow.');
})().catch(error => { console.error(error); process.exitCode = 1; });

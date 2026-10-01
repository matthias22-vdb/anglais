(() => {
'use strict';
let started = false;
window.PocketApp = { start };
function start(identity) {
if (started) return;
if (!identity || typeof identity.userId !== 'string' || !identity.userId) {
  throw new Error('Identité utilisateur manquante.');
}
started = true;
const $ = id => document.getElementById(id);
const bank = window.TOEIC_QUESTIONS;
const config = window.ENGLISH_POCKET_CONFIG;
if (!config || !config.productName || !config.secondaryDescription || !config.trademarkNotice) {
  throw new Error('La configuration de l’application est incomplète.');
}
document.title = `${config.productName} · 500 questions`;
$('product-name').textContent = config.productName;
$('product-description').textContent = config.secondaryDescription;
$('product-secondary').textContent = config.secondaryDescription;
$('trademark-notice').textContent = config.trademarkNotice;
$('app-description-meta').setAttribute('content', `${config.productName} propose 500 questions de grammaire et d’anglais professionnel avec des explications simples en français.`);
const LEGACY_KEY = 'toeic-pocket-stage1-v1';
const KEY = `${LEGACY_KEY}:user:${encodeURIComponent(identity.userId)}`;
const SIZE = 20;
if (!Array.isArray(bank) || bank.length !== 500) {
  $('sentence').textContent = 'Les questions n’ont pas chargé. Rouvre cette page avec Internet.';
  return;
}
const byId = new Map(bank.map(q => [q.id, q]));
function localDay() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
let state = { cursor: 0, answers: {}, hints: {}, drafts: {}, monthly: {}, comfortable: false, game: { date: localDay(), dailyIds: [], streak: 0, best: 0 } };
let mode = 'learn', queue = [], reviewAt = 0, selected = null, locked = false, assisted = false;
let justAnswered = false, goalJustReached = false;
let storageOK = true;
const reviewed = new Set();
function storageWarning() {
  storageOK = false;
  $('save-warning').hidden = false;
  $('save-warning').textContent = 'La sauvegarde est indisponible. Tes réponses restent utilisables pendant cette séance, mais pourraient être perdues à la fermeture.';
  $('save-status').textContent = 'Sauvegarde indisponible';
}
try {
  let savedText = localStorage.getItem(KEY);
  if (savedText === null && identity.legacyStorageOwner === true) {
    const legacyText = localStorage.getItem(LEGACY_KEY);
    if (legacyText !== null) {
      localStorage.setItem(KEY, legacyText);
      savedText = legacyText;
    }
  }
  if (savedText === null && identity.remoteState && typeof identity.remoteState === 'object') {
    savedText = JSON.stringify(identity.remoteState);
    localStorage.setItem(KEY, savedText);
  }
  const saved = savedText === null ? null : JSON.parse(savedText);
  if (saved && typeof saved === 'object') {
    if (Number.isInteger(saved.cursor) && saved.cursor >= 0 && saved.cursor <= bank.length) state.cursor = saved.cursor;
    if (saved.answers && typeof saved.answers === 'object') {
      for (const [id, a] of Object.entries(saved.answers)) {
        if (byId.has(id) && a && Number.isInteger(a.choice) && a.choice >= 0 && a.choice < 4) {
          state.answers[id] = { choice: a.choice, assisted: !!a.assisted, pending: a.pending === true && a.choice !== byId.get(id).answer, rejected: Array.isArray(a.rejected) ? [...new Set(a.rejected.filter(i => Number.isInteger(i) && i >= 0 && i < 4 && i !== byId.get(id).answer))] : [], needsReview: a.needsReview === true || a.assisted === true || a.choice !== byId.get(id).answer, changedAt: Number.isFinite(a.changedAt) && a.changedAt >= 0 ? Math.round(a.changedAt) : 0 };
        }
      }
    }
    if (saved.hints && typeof saved.hints === 'object') {
      for (const [id, hint] of Object.entries(saved.hints)) {
        if (!byId.has(id) || !hint || typeof hint !== 'object' || hint.used !== true) continue;
        state.hints[id] = { used: true, eliminated: Array.isArray(hint.eliminated) ? [...new Set(hint.eliminated.filter(i => Number.isInteger(i) && i >= 0 && i < 4 && i !== byId.get(id).answer))] : [] };
      }
    }
    if (saved.drafts && typeof saved.drafts === 'object') {
      for (const [id, value] of Object.entries(saved.drafts)) {
        if (byId.has(id) && typeof value === 'string') state.drafts[id] = value.slice(0, 3000);
      }
    }
    state.comfortable = saved.comfortable === true;
    state.monthly = window.PocketProgress.clean(saved.monthly);
    if (saved.game && typeof saved.game === 'object') {
      const sameDay = saved.game.date === localDay();
      state.game.date = localDay();
      state.game.dailyIds = sameDay && Array.isArray(saved.game.dailyIds)
        ? [...new Set(saved.game.dailyIds.filter(id => byId.has(id)))] : [];
      state.game.streak = Number.isInteger(saved.game.streak) && saved.game.streak >= 0 ? saved.game.streak : 0;
      state.game.best = Number.isInteger(saved.game.best) && saved.game.best >= 0 ? saved.game.best : 0;
    }
  }
} catch (e) { storageWarning(); }
function save(syncMode = 'merge') {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageOK = true;
    $('save-warning').hidden = true;
    $('save-status').textContent = 'Progression enregistrée';
    if (window.PocketSync) {
      if (syncMode === 'replace') window.PocketSync.replace(state, bank, identity.userId);
      else window.PocketSync.push(state, bank, identity.userId);
    }
  } catch (e) { storageWarning(); }
}
const wrongIds = () => bank.filter(q => state.answers[q.id]?.needsReview === true || (state.answers[q.id] && state.answers[q.id].choice !== q.answer)).map(q => q.id);
function ensureToday() {
  const today = localDay();
  if (state.game.date !== today) {
    state.game.date = today;
    state.game.dailyIds = [];
  }
}
const current = () => mode === 'learn' ? bank[state.cursor] : byId.get(queue[reviewAt]);
const firstUnanswered = () => bank.findIndex(q => !state.answers[q.id]);
function focusQuestion() {
  const target = $('quiz').hidden ? $('end-title') : $('sentence');
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'start', behavior: 'auto' });
}
function openSeries(index) {
  const start = index * SIZE;
  const first = bank.slice(start, start + SIZE).findIndex(q => !state.answers[q.id]);
  state.cursor = start + (first < 0 ? 0 : first);
  mode = 'learn';
  $('series-panel').open = false;
  save();
  render();
  focusQuestion();
}
function seriesList() {
  $('series-list').replaceChildren();
  for (let i = 0; i < bank.length / SIZE; i++) {
    const items = bank.slice(i * SIZE, (i + 1) * SIZE);
    const done = items.filter(q => state.answers[q.id]).length;
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-current', String(mode === 'learn' && Math.floor(state.cursor / SIZE) === i));
    button.setAttribute('aria-label', `Série ${i + 1}, questions ${i * SIZE + 1} à ${(i + 1) * SIZE}, ${done} sur ${SIZE} travaillées`);
    const title = document.createElement('strong');
    title.textContent = `Série ${i + 1}`;
    const detail = document.createElement('small');
    detail.textContent = done === SIZE ? '✓ 20 / 20 · Relire' : `${done} / 20 travaillées`;
    button.append(title, detail);
    button.onclick = () => openSeries(i);
    $('series-list').append(button);
  }
}
function updateStats() {
  ensureToday();
  const done = Object.keys(state.answers).length;
  const right = bank.filter(q => state.answers[q.id]?.choice === q.answer && !state.answers[q.id].assisted && !state.answers[q.id].needsReview).length;
  const masteryScore = done ? 14 * right / done : 0;
  const effortScore = 6 * Math.min(done / 100, 1);
  const balancedGrade = Math.min(20, masteryScore + effortScore);
  $('done-count').textContent = done;
  $('correct-count').textContent = right;
  $('practice-grade').textContent = done ? balancedGrade.toFixed(2).replace('.', ',') : '—';
  $('grade-detail').textContent = done ? `${done} question${done > 1 ? 's' : ''} différente${done > 1 ? 's' : ''} · mise à jour immédiate` : 'Mise à jour après chaque réponse.';
  $('grade-breakdown').textContent = done
    ? `Anglais ${masteryScore.toFixed(2).replace('.', ',')} / 14 · Bonus d’effort ${effortScore.toFixed(2).replace('.', ',')} / 6`
    : 'Anglais — / 14 · Bonus d’effort 0 / 6';
  $('xp-count').textContent = right * 10 + done * 2;
  $('streak-count').textContent = state.game.streak;
  const daily = Math.min(10, state.game.dailyIds.length);
  $('daily-count').textContent = `${daily} / 10`;
  $('daily-progress').value = daily;
  $('daily-goal').classList.toggle('done', daily === 10);
  $('daily-message').textContent = daily === 10 ? 'Mission accomplie ! Reviens demain pour une nouvelle.' : daily === 0 ? 'Encore 10 questions. Tu peux le faire !' : `Encore ${10 - daily} question${10 - daily > 1 ? 's' : ''} pour réussir la mission.`;
  $('overall-progress').value = done;
  $('stats').textContent = `${bank.length - done} question(s) à découvrir · ${wrongIds().length} à revoir`;
  $('error-count').textContent = wrongIds().length;
  for (const id of ['learn', 'review']) {
    $(id).setAttribute('aria-pressed', String(mode === id));
    $(id).classList.toggle('active', mode === id);
  }
  $('series-label').textContent = mode === 'review' ? 'Révision de mes erreurs' : state.cursor < bank.length ? `Série ${Math.floor(state.cursor / SIZE) + 1} sur ${bank.length / SIZE}` : `Parcours de ${bank.length} questions`;
  seriesList();
}
function sentence(q, completed = false) {
  const [before, after] = q.sentence.split('_____');
  const mark = document.createElement('span');
  mark.className = completed ? 'filled' : 'blank';
  mark.textContent = completed ? q.options[q.answer] : '…';
  if (!completed) mark.setAttribute('aria-label', 'missing word');
  $('sentence').replaceChildren(document.createTextNode(before), mark, document.createTextNode(after));
}
function finish() {
  updateStats();
  $('quiz').hidden = true;
  $('empty').hidden = false;
  const left = bank.length - Object.keys(state.answers).length;
  const wrong = wrongIds().length;
  $('end-title').textContent = mode === 'review' ? (queue.length ? 'Révision terminée !' : 'Aucune erreur à revoir') : left ? 'Tu es au bout du parcours' : `${bank.length} questions travaillées !`;
  $('end-text').textContent = mode === 'review' && !queue.length ? 'Tes réponses actuelles sont toutes justes. Tu peux poursuivre le parcours ou relire une série.' : `${left} question(s) à découvrir. ${wrong} question(s) restent à revoir. Tu peux aussi relire une série avec « Choisir une série ».`;
  $('return').hidden = mode === 'learn' && left === 0;
  $('return').textContent = left ? 'Continuer mon parcours' : 'Relire le parcours';
  $('review-end').hidden = wrong === 0;
}
function showFeedback(q) {
  const answer = state.answers[q.id];
  locked = true;
  selected = answer.choice;
  $('validate').hidden = true;
  $('next').hidden = false;
  $('feedback').hidden = false;
  const correct = selected === q.answer;
  $('feedback').classList.toggle('good', correct);
  $('feedback').classList.toggle('bad', !correct);
  if (correct) {
    $('verdict').textContent = answer.assisted || answer.needsReview
      ? '✓ Bonne réponse avec aide · à revoir sans indice'
      : goalJustReached ? '🎉 Mission du jour accomplie !' : justAnswered && state.game.streak >= 5 ? `🔥 ${state.game.streak} bonnes réponses de suite !` : justAnswered ? '✓ Bonne réponse ! +10 points' : '✓ Bonne réponse !';
  } else {
    $('verdict').textContent = `Pas grave ! La bonne réponse est : ${q.options[q.answer]}`;
  }
  $('explanation').textContent = q.feedback[q.answer];
  $('rule').textContent = q.rule;
  $('translation').hidden = false;
  $('translation-button').setAttribute('aria-expanded', 'true');
  sentence(q, true);
  $('reasons').replaceChildren();
  q.options.forEach((word, i) => {
    const button = $('options').querySelectorAll('button')[i];
    button.disabled = true;
    button.setAttribute('aria-pressed', String(i === selected));
    button.classList.toggle('correct', i === q.answer);
    button.classList.toggle('wrong', i === selected && !correct);
    if (i === q.answer || i === selected) {
      const status = document.createElement('small');
      status.className = 'answer-status';
      status.textContent = i === q.answer ? '✓ Bonne réponse' : 'Ton choix';
      button.append(status);
    }
    if (i !== q.answer) {
      const li = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = `${'ABCD'[i]}. ${word}`;
      li.append(title, document.createTextNode(q.feedback[i]));
      $('reasons').append(li);
    }
  });
  $('next').textContent = (mode === 'learn' ? state.cursor === bank.length - 1 : reviewAt === queue.length - 1) ? 'Voir mon bilan →' : 'Question suivante →';
  updateStats();
}
function render() {
  updateStats();
  const q = current();
  if (!q) { finish(); return; }
  $('quiz').hidden = false;
  $('empty').hidden = true;
  selected = null;
  locked = false;
  assisted = mode === 'learn' && state.hints[q.id]?.used === true;
  justAnswered = false;
  goalJustReached = false;
  sentence(q);
  $('category').textContent = q.category === 'Expression professionnelle' ? '💼 Expression pro' : '🧩 Grammaire';
  $('category').classList.toggle('expression', q.category === 'Expression professionnelle');
  const index = mode === 'learn' ? state.cursor % SIZE : reviewAt;
  const total = mode === 'learn' ? SIZE : queue.length;
  $('position').textContent = mode === 'learn' ? `Question ${state.cursor + 1} / ${bank.length}` : `Révision ${reviewAt + 1} / ${queue.length}`;
  $('progress').max = total;
  $('progress').value = index;
  $('options').replaceChildren();
  const legend = document.createElement('legend');
  legend.className = 'sr-only';
  legend.textContent = 'Choisis une réponse';
  $('options').append(legend);
  q.options.forEach((word, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option';
    button.setAttribute('aria-pressed', 'false');
    const letter = document.createElement('span');
    letter.className = 'letter';
    letter.textContent = 'ABCD'[i];
    const label = document.createElement('span');
    label.className = 'word';
    label.lang = 'en';
    label.textContent = word;
    button.append(letter, label);
    button.onclick = () => {
      if (locked) return;
      submitAnswer(i);
    };
    $('options').append(button);
  });
  $('hint').textContent = window.PocketHints.help(q).text;
  $('translation').textContent = q.translation;
  for (const id of ['hint', 'translation', 'feedback', 'next', 'pause']) $(id).hidden = true;
  for (const id of ['hint-button', 'translation-button']) $(id).setAttribute('aria-expanded', 'false');
  $('reasoning').open = false;
  $('alternatives').open = false;
  $('reason').value = state.drafts[q.id] || '';
  $('validate').hidden = true;
  $('previous').hidden = mode === 'review';
  $('previous').disabled = state.cursor === 0;
  $('pause').hidden = !(mode === 'learn' && state.cursor > 0 && state.cursor % SIZE === 0);
  if (mode === 'learn' && state.answers[q.id]?.pending) showRetry(q);
  else {
    if (mode === 'learn' && state.hints[q.id]?.used) restoreHint(q);
    if (state.answers[q.id] && (mode === 'learn' || reviewed.has(q.id))) showFeedback(q);
  }
}
function restoreHint(q) {
  $('hint').hidden = false;
  $('hint-button').setAttribute('aria-expanded', 'true');
  const buttons = $('options').querySelectorAll('button');
  for (const i of state.hints[q.id].eliminated || []) {
    const button = buttons[i];
    if (!button || button.disabled) continue;
    button.disabled = true;
    button.classList.toggle('hint-eliminated', true);
    const status = document.createElement('small');
    status.className = 'answer-status';
    status.textContent = 'Écartée par l’indice';
    button.append(status);
  }
}
function showRetry(q) {
  locked = false;
  assisted = true;
  selected = null;
  const buttons = $('options').querySelectorAll('button');
  for (const i of state.answers[q.id].rejected || []) {
    buttons[i].disabled = true;
    buttons[i].hidden = true;
  }
  $('feedback').hidden = true;
  $('hint').textContent = window.PocketHints.retry(q);
  $('hint').hidden = false;
  $('hint-button').setAttribute('aria-expanded', 'true');
  $('next').hidden = false;
  $('next').textContent = 'Passer pour y revenir →';
  updateStats();
}
function submitAnswer(choice) {
  if (locked) return;
  const q = current();
  if (!q || $('options').querySelectorAll('button')[choice]?.disabled) return;
  ensureToday();
  const month = localDay().slice(0, 7);
  const bucket = state.monthly[month] || (state.monthly[month] = { total: 0, errors: 0 });
  bucket.total++;
  if (choice !== q.answer) bucket.errors++;
  selected = choice;
  const before = Math.min(10, state.game.dailyIds.length);
  if (!state.game.dailyIds.includes(q.id)) state.game.dailyIds.push(q.id);
  goalJustReached = before < 10 && state.game.dailyIds.length >= 10;
  if (choice === q.answer) state.game.streak = Math.min(500, state.game.streak + 1);
  else state.game.streak = 0;
  state.game.best = Math.max(state.game.best, state.game.streak);
  const rejected = state.answers[q.id]?.rejected || [];
  const needsReview = mode === 'review' && choice === q.answer
    ? false
    : state.answers[q.id]?.needsReview === true || choice !== q.answer || assisted;
  state.answers[q.id] = { choice, assisted, pending: choice !== q.answer, rejected: choice !== q.answer ? [...new Set([...rejected, choice])] : rejected, needsReview, changedAt: Date.now() };
  if (mode === 'review' && choice === q.answer) reviewed.add(q.id);
  justAnswered = true;
  if (choice !== q.answer) {
    assisted = true;
    state.answers[q.id].assisted = true;
    save();
    showRetry(q);
    return;
  }
  save();
  showFeedback(q);
  $('verdict').focus({ preventScroll: true });
  $('feedback').scrollIntoView({ block: 'nearest', behavior: 'auto' });
}
$('validate').onclick = () => { if (selected !== null) submitAnswer(selected); };
$('next').onclick = () => {
  if (!locked && !state.answers[current()?.id]?.pending) return;
  if (mode === 'learn') state.cursor++;
  else reviewAt++;
  save();
  render();
  focusQuestion();
};
$('previous').onclick = () => {
  if (mode !== 'learn' || state.cursor === 0) return;
  state.cursor--;
  save();
  render();
  focusQuestion();
};
for (const name of ['hint', 'translation']) {
  $(name + '-button').onclick = () => {
    const show = $(name).hidden;
    $(name).hidden = !show;
    $(name + '-button').setAttribute('aria-expanded', String(show));
    if (show && !locked) assisted = true;
    if (name === 'hint' && show && !locked) {
      const help = window.PocketHints.help(current());
      state.hints[current().id] = { used: true, eliminated: help.eliminated };
      const buttons = $('options').querySelectorAll('button');
      for (const i of help.eliminated) {
        const button = buttons[i];
        if (button.disabled) continue;
        button.disabled = true;
        button.classList.toggle('hint-eliminated', true);
        const status = document.createElement('small');
        status.className = 'answer-status';
        status.textContent = 'Écartée par l’indice';
        button.append(status);
      }
      save();
    }
  };
}
$('reason').oninput = () => {
  const q = current();
  if (q) { state.drafts[q.id] = $('reason').value.slice(0, 3000); save(); }
};
function startReview() {
  mode = 'review';
  queue = wrongIds();
  reviewAt = 0;
  reviewed.clear();
  render();
  focusQuestion();
}
$('review').onclick = $('review-end').onclick = startReview;
$('learn').onclick = () => { mode = 'learn'; render(); focusQuestion(); };
$('return').onclick = () => {
  mode = 'learn';
  if (state.cursor >= bank.length) state.cursor = Math.max(0, firstUnanswered());
  save(); render(); focusQuestion();
};
$('redo').onclick = () => {
  if (!window.confirm(`Effacer les réponses et les notes des ${bank.length} questions pour recommencer ?`)) return;
  state = { cursor: 0, answers: {}, hints: {}, drafts: {}, monthly: state.monthly, comfortable: state.comfortable, game: { date: localDay(), dailyIds: state.game.dailyIds, streak: 0, best: state.game.best } };
  mode = 'learn';
  reviewed.clear();
  save('replace'); render(); focusQuestion();
};
function readingSize() {
  document.body.classList.toggle('comfortable', state.comfortable);
  $('reading-size')?.setAttribute('aria-pressed', String(state.comfortable));
  $('reading-size')?.setAttribute('aria-label', state.comfortable ? 'Revenir à la taille habituelle' : 'Agrandir la lecture');
}
if ($('reading-size')) $('reading-size').onclick = () => { state.comfortable = !state.comfortable; readingSize(); save(); };
readingSize();
render();
if (window.PocketSync) window.PocketSync.push(state, bank, identity.userId);
}
})();

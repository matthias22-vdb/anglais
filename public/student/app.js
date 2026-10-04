(() => {
'use strict';
const $ = id => document.getElementById(id);
const bank = window.TOEIC_QUESTIONS;
const config = window.ENGLISH_POCKET_CONFIG;
const KEY = 'english-pocket-simple-v1';
let state = { cursor: 0, answers: {}, comfortable: false };
let review = false, queue = [], reviewAt = 0, usedHint = false;
const byId = new Map((bank || []).map(q => [q.id, q]));
function clean(value) {
  const answers = {};
  for (const [id, answer] of Object.entries(value?.answers || {})) {
    if (byId.has(id) && Number.isInteger(answer?.choice) && answer.choice >= 0 && answer.choice < 4)
      answers[id] = { choice: answer.choice, assisted: answer.assisted === true, needsReview: answer.needsReview === true || answer.assisted === true || answer.choice !== byId.get(id).answer };
  }
  return { cursor: Number.isInteger(value?.cursor) ? Math.max(0, Math.min(bank.length - 1, value.cursor)) : 0, answers, comfortable: value?.comfortable === true };
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); $('save-warning').hidden = true; $('save-status').textContent = 'Réponses gardées sur cet appareil'; }
  catch { $('save-warning').hidden = false; $('save-warning').textContent = 'Sauvegarde indisponible : tes réponses pourraient être perdues à la fermeture.'; $('save-status').textContent = 'Sauvegarde indisponible'; }
}
if (!Array.isArray(bank) || bank.length < 500) { $('sentence').textContent = 'Les questions n’ont pas chargé. Recharge la page avec Internet.'; return; }
try { state = clean(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch {}
document.title = config.productName;
$('product-name').textContent = config.productName;
$('product-description').textContent = 'Questions, indices et explications';
$('trademark-notice').textContent = config.trademarkNotice;
const mistakes = () => bank.filter(q => state.answers[q.id]?.needsReview).map(q => q.id);
const current = () => review ? byId.get(queue[reviewAt]) : bank[state.cursor];
function focus() { ($('quiz').hidden ? $('end-title') : $('sentence')).focus({ preventScroll: true }); }
function grade() {
  const done = Object.keys(state.answers).length;
  const correct = bank.filter(q => state.answers[q.id]?.choice === q.answer && !state.answers[q.id].assisted && !state.answers[q.id].needsReview).length;
  const mastery = done ? 14 * correct / done : 0;
  const effort = 6 * Math.min(done / 100, 1);
  $('practice-grade').textContent = done ? (mastery + effort).toFixed(2).replace('.', ',') : '—';
  $('grade-breakdown').textContent = `Réussite ${mastery.toFixed(2).replace('.', ',')} / 14 · Effort ${effort.toFixed(2).replace('.', ',')} / 6`;
}
function size() { document.body.classList.toggle('comfortable', state.comfortable); }
function series() {
  $('series-label').textContent = review ? 'Revoir mes erreurs' : `Série ${Math.floor(state.cursor / 20) + 1} sur ${Math.ceil(bank.length / 20)}`;
  $('series-list').replaceChildren();
  for (let i = 0; i < Math.ceil(bank.length / 20); i++) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = i === 25 ? 'Part 5 · Nouvelle série' : `Série ${i + 1}`;
    button.onclick = () => { state.cursor = i * 20; review = false; $('series-panel').open = false; save(); render(); focus(); };
    $('series-list').append(button);
  }
  $('learn').classList.toggle('active', !review); $('review').classList.toggle('active', review);
  $('learn').setAttribute('aria-pressed', String(!review)); $('review').setAttribute('aria-pressed', String(review));
}
function sentence(q, filled) {
  const [before, after] = q.sentence.split('_____'); const blank = document.createElement('span');
  blank.className = filled ? 'filled' : 'blank'; blank.textContent = filled ? q.options[q.answer] : '…';
  $('sentence').replaceChildren(document.createTextNode(before), blank, document.createTextNode(after || ''));
}
function feedback(q, answer) {
  $('feedback').hidden = false; const correct = answer.choice === q.answer;
  $('feedback').classList.toggle('good', correct); $('feedback').classList.toggle('bad', !correct);
  $('verdict').textContent = correct ? 'Bonne réponse !' : `La bonne réponse est : ${q.options[q.answer]}`;
  $('explanation').textContent = q.feedback[q.answer]; $('rule').textContent = q.rule;
  $('translation').hidden = false; $('translation-button').setAttribute('aria-expanded', 'true');
  sentence(q, true); $('reasons').replaceChildren();
  q.options.forEach((word, i) => {
    const button = $('options').querySelectorAll('button')[i]; button.disabled = true;
    button.classList.toggle('correct', i === q.answer); button.classList.toggle('wrong', i === answer.choice && !correct);
    if (i === q.answer || i === answer.choice) { const label = document.createElement('small'); label.className = 'answer-status'; label.textContent = i === q.answer ? 'Bonne réponse' : 'Ton choix'; button.append(label); }
    if (i !== q.answer) { const li = document.createElement('li'); const title = document.createElement('strong'); title.textContent = `${'ABCD'[i]}. ${word} : `; li.append(title, document.createTextNode(q.feedback[i])); $('reasons').append(li); }
  });
  $('next').hidden = false;
}
function render() {
  grade(); series(); usedHint = false; const q = current(); $('quiz').hidden = !q; $('empty').hidden = !!q;
  if (!q) { $('end-title').textContent = review ? 'Révision terminée' : 'Parcours terminé'; $('end-text').textContent = 'Tu peux reprendre les exercices ou choisir une série.'; $('review-end').hidden = mistakes().length === 0; return; }
  $('category').textContent = q.category; $('position').textContent = `Question ${bank.indexOf(q) + 1} / ${bank.length}`;
  $('progress').value = bank.indexOf(q) % 20; sentence(q, false);
  $('feedback').hidden = true; $('hint').hidden = true; $('translation').hidden = true;
  $('hint-button').setAttribute('aria-expanded', 'false'); $('translation-button').setAttribute('aria-expanded', 'false');
  $('translation').textContent = q.translation; $('alternatives').open = false; $('next').hidden = true; $('pause').hidden = true;
  $('reasoning').hidden = true; $('validate').hidden = true;
  $('previous').disabled = review ? reviewAt === 0 : state.cursor === 0;
  $('next').textContent = (review ? reviewAt === queue.length - 1 : state.cursor === bank.length - 1) ? 'Terminer' : 'Question suivante';
  $('options').replaceChildren();
  q.options.forEach((word, choice) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'option';
    const letter = document.createElement('span'); letter.className = 'letter'; letter.textContent = 'ABCD'[choice];
    const text = document.createElement('span'); text.className = 'word'; text.textContent = word; button.append(letter, text);
    button.onclick = () => { const answer = { choice, assisted: usedHint, needsReview: choice !== q.answer || usedHint }; state.answers[q.id] = answer; save(); grade(); feedback(q, answer); };
    $('options').append(button);
  });
  if (!review && state.answers[q.id]) feedback(q, state.answers[q.id]);
}
$('hint-button').onclick = () => { const q = current(); if (!q) return; if ($('feedback').hidden) usedHint = true; const help = window.PocketHints.help(q); if ($('feedback').hidden) for (const i of help.eliminated) { const button = $('options').querySelectorAll('button')[i]; button.disabled = true; button.classList.add('wrong'); } $('hint').textContent = help.text; $('hint').hidden = !$('hint').hidden; $('hint-button').setAttribute('aria-expanded', String(!$('hint').hidden)); };
$('translation-button').onclick = () => { $('translation').hidden = !$('translation').hidden; $('translation-button').setAttribute('aria-expanded', String(!$('translation').hidden)); };
$('next').onclick = () => { if (review) reviewAt++; else state.cursor++; save(); render(); focus(); };
$('previous').onclick = () => { if (review) reviewAt = Math.max(0, reviewAt - 1); else state.cursor = Math.max(0, state.cursor - 1); save(); render(); focus(); };
$('learn').onclick = $('return').onclick = () => { review = false; if (state.cursor >= bank.length) state.cursor = 0; render(); focus(); };
$('new-part5').onclick = () => { state.cursor = 500; review = false; save(); render(); focus(); };
$('review').onclick = $('review-end').onclick = () => { review = true; queue = mistakes(); reviewAt = 0; render(); focus(); };
$('redo').onclick = () => { if (!confirm('Effacer les réponses de cette version pour recommencer ? Les anciennes sauvegardes restent conservées.')) return; state.answers = {}; state.cursor = 0; review = false; save(); render(); focus(); };

// Old saves are selected explicitly: never silently mix accounts on a shared device.
try {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i); if (key !== 'toeic-pocket-stage1-v1' && !key?.startsWith('toeic-pocket-stage1-v1:user:')) continue;
    let old; try { old = clean(JSON.parse(localStorage.getItem(key))); } catch { continue; }
    const count = Object.keys(old.answers).length; if (!count) continue;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'help-button'; button.textContent = `Sauvegarde ${$('saved-list').children.length + 1} · ${count} réponses`;
    button.onclick = () => { if (!confirm('Reprendre cette sauvegarde à la place des réponses actuelles ?')) return; state = old; review = false; save(); size(); render(); focus(); };
    $('saved-list').append(button); 
  }
} catch {}
async function recoverServer(automatic = false) {
  const button = $('recover-server'); button.disabled = true;
  try {
    const response = await fetch('/api/recover-progress', { cache: 'no-store' });
    const result = await response.json();
    if (response.status === 401) {
      if (!automatic) { $('recover-message').textContent = result.error; $('recover-account').hidden = false; }
      return;
    }
    if (!response.ok) throw new Error(result.error || 'Récupération indisponible.');
    if (!result.state || !Object.keys(result.state.answers || {}).length) {
      if (!automatic) $('recover-message').textContent = 'Aucune réponse retrouvée sur ce compte. Vérifie les sauvegardes locales ou le compte ChatGPT utilisé auparavant.';
      return;
    }
    const marker = 'english-pocket-recovered-v1';
    if (automatic && localStorage.getItem(marker)) return;
    const old = clean(result.state);
    state.answers = { ...old.answers, ...state.answers };
    state.cursor = Math.max(state.cursor, old.cursor);
    // Preserve a backup before changing this device's current learning state.
    const before = localStorage.getItem(KEY);
    if (before) localStorage.setItem('english-pocket-before-recovery-v1', before);
    save(); localStorage.setItem(marker, 'true');
    review = false; render();
    $('recover-message').textContent = `${Object.keys(old.answers).length} anciennes réponses récupérées. Tes nouvelles réponses sont conservées.`;
    
  } catch (error) { if (!automatic) $('recover-message').textContent = error.message || 'Récupération indisponible.'; }
  finally { button.disabled = false; }
}
$('recover-server').onclick = () => { void recoverServer(); };
size(); render();
void recoverServer(true);
})();

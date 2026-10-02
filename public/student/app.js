(() => {
'use strict';
const $ = id => document.getElementById(id);
const bank = window.TOEIC_QUESTIONS;
const config = window.ENGLISH_POCKET_CONFIG;
const KEY = 'english-pocket-simple-v1';
let state = { cursor: 0, answers: {}, comfortable: false };
let review = false, queue = [], reviewAt = 0;
const byId = new Map((bank || []).map(q => [q.id, q]));
function clean(value) {
  const answers = {};
  for (const [id, answer] of Object.entries(value?.answers || {})) {
    if (byId.has(id) && Number.isInteger(answer?.choice) && answer.choice >= 0 && answer.choice < 4)
      answers[id] = { choice: answer.choice, needsReview: answer.needsReview === true || answer.choice !== byId.get(id).answer };
  }
  return { cursor: Number.isInteger(value?.cursor) ? Math.max(0, Math.min(bank.length - 1, value.cursor)) : 0, answers, comfortable: value?.comfortable === true };
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); $('save-warning').hidden = true; $('save-status').textContent = 'Réponses gardées sur cet appareil'; }
  catch { $('save-warning').hidden = false; $('save-warning').textContent = 'Sauvegarde indisponible : tes réponses pourraient être perdues à la fermeture.'; $('save-status').textContent = 'Sauvegarde indisponible'; }
}
if (!Array.isArray(bank) || bank.length !== 500) { $('sentence').textContent = 'Les questions n’ont pas chargé. Recharge la page avec Internet.'; return; }
try { state = clean(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch {}
document.title = config.productName;
$('product-name').textContent = config.productName;
$('product-description').textContent = 'Questions, indices et explications';
$('trademark-notice').textContent = config.trademarkNotice;
const mistakes = () => bank.filter(q => state.answers[q.id]?.needsReview).map(q => q.id);
const current = () => review ? byId.get(queue[reviewAt]) : bank[state.cursor];
function focus() { ($('quiz').hidden ? $('end-title') : $('sentence')).focus({ preventScroll: true }); }
function size() { document.body.classList.toggle('comfortable', state.comfortable); $('reading-size').setAttribute('aria-pressed', String(state.comfortable)); $('reading-size').textContent = state.comfortable ? 'Taille habituelle' : 'Agrandir le texte'; }
function series() {
  $('series-label').textContent = review ? 'Revoir mes erreurs' : `Série ${Math.floor(state.cursor / 20) + 1} sur 25`;
  $('series-list').replaceChildren();
  for (let i = 0; i < 25; i++) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = `Série ${i + 1}`;
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
  series(); const q = current(); $('quiz').hidden = !q; $('empty').hidden = !!q;
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
    button.onclick = () => { const answer = { choice, needsReview: choice !== q.answer }; state.answers[q.id] = answer; save(); feedback(q, answer); };
    $('options').append(button);
  });
  if (!review && state.answers[q.id]) feedback(q, state.answers[q.id]);
}
$('hint-button').onclick = () => { const q = current(); if (!q) return; const help = window.PocketHints.help(q); if ($('feedback').hidden) for (const i of help.eliminated) { const button = $('options').querySelectorAll('button')[i]; button.disabled = true; button.classList.add('wrong'); } $('hint').textContent = help.text; $('hint').hidden = !$('hint').hidden; $('hint-button').setAttribute('aria-expanded', String(!$('hint').hidden)); };
$('translation-button').onclick = () => { $('translation').hidden = !$('translation').hidden; $('translation-button').setAttribute('aria-expanded', String(!$('translation').hidden)); };
$('next').onclick = () => { if (review) reviewAt++; else state.cursor++; save(); render(); focus(); };
$('previous').onclick = () => { if (review) reviewAt = Math.max(0, reviewAt - 1); else state.cursor = Math.max(0, state.cursor - 1); save(); render(); focus(); };
$('learn').onclick = $('return').onclick = () => { review = false; if (state.cursor >= bank.length) state.cursor = 0; render(); focus(); };
$('review').onclick = $('review-end').onclick = () => { review = true; queue = mistakes(); reviewAt = 0; render(); focus(); };
$('redo').onclick = () => { if (!confirm('Effacer les réponses de cette version pour recommencer ? Les anciennes sauvegardes restent conservées.')) return; state.answers = {}; state.cursor = 0; review = false; save(); render(); focus(); };
$('reading-size').onclick = () => { state.comfortable = !state.comfortable; size(); save(); };
// Old saves are selected explicitly: never silently mix accounts on a shared device.
try {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i); if (key !== 'toeic-pocket-stage1-v1' && !key?.startsWith('toeic-pocket-stage1-v1:user:')) continue;
    let old; try { old = clean(JSON.parse(localStorage.getItem(key))); } catch { continue; }
    const count = Object.keys(old.answers).length; if (!count) continue;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'help-button'; button.textContent = `Sauvegarde ${$('saved-list').children.length + 1} · ${count} réponses`;
    button.onclick = () => { if (!confirm('Reprendre cette sauvegarde à la place des réponses actuelles ?')) return; state = old; review = false; save(); size(); render(); focus(); };
    $('saved-list').append(button); $('saved-work').hidden = false;
  }
} catch {}
size(); render();
})();

import assert from 'node:assert/strict';
import fs from 'node:fs';

const questions = JSON.parse(fs.readFileSync(new URL('../questions-reviewed.json', import.meta.url), 'utf8'));
assert.equal(questions.length, 500, 'La banque doit contenir 500 questions.');
const ids = new Set();
const sentences = new Set();
const topics = new Map();

for (const [index, question] of questions.entries()) {
  assert.equal(question.id, `q${String(index + 1).padStart(3, '0')}`);
  assert.equal(question.category, index % 2 === 0 ? 'Grammaire' : 'Expression professionnelle');
  assert.equal(question.sentence.split('_____').length, 2, `${question.id}: un seul trou est requis`);
  assert.equal(question.options.length, 4, `${question.id}: quatre choix sont requis`);
  assert.equal(new Set(question.options.map(option => option.trim().toLocaleLowerCase('en'))).size, 4, `${question.id}: choix répété`);
  assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4, `${question.id}: réponse invalide`);
  assert.equal(question.feedback.length, 4, `${question.id}: quatre explications sont requises`);
  for (const field of ['translation', 'hint', 'rule']) assert.ok(question[field]?.trim(), `${question.id}: ${field} manquant`);
  for (const feedback of question.feedback) assert.ok(feedback?.trim(), `${question.id}: explication vide`);
  assert.ok(!ids.has(question.id), `${question.id}: identifiant répété`);
  ids.add(question.id);
  const normalized = question.sentence.toLocaleLowerCase('en').replace(/[^a-z]+/g, ' ').trim();
  assert.ok(!sentences.has(normalized), `${question.id}: phrase dupliquée`);
  sentences.add(normalized);
  topics.set(question.topic, (topics.get(question.topic) || 0) + 1);
}

assert.equal([...topics.values()].reduce((sum, count) => sum + count, 0), 500);
assert.equal(topics.size, 75, 'Les 75 notions pédagogiques attendues doivent être présentes.');
console.log('PASS: 500 questions, 75 notions, identifiants stables, alternance, quatre choix, réponses, explications et absence de doublons exacts.');

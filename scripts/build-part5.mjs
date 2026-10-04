import { readFileSync, writeFileSync } from 'node:fs';
const rows = [...JSON.parse(readFileSync('part5-original.json', 'utf8')), ...JSON.parse(readFileSync('part5-extra.json', 'utf8'))];
if (rows.length !== 100) throw new Error('Expected 100 new questions');
const questions = rows.map(([sentence, translation, options, answer, topic, rule, feedback], i) => ({
  id: `part5-${String(i + 1).padStart(3, '0')}`, category: 'Part 5 · Grammaire et vocabulaire',
  sentence, translation, options, answer, topic, rule, feedback,
  hint: `Observe le contexte et la place du mot manquant.\n${rule}`,
}));
// Shuffle choices only for the 80 additions; existing IDs and choice indices stay intact.
let seed = 4171;
for (const q of questions.slice(20)) {
  const order = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = Math.floor(seed / 4294967296 * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  q.options = order.map(i => q.options[i]);
  q.feedback = order.map(i => q.feedback[i]);
  q.answer = order.indexOf(q.answer);
}
writeFileSync('public/student/part5.js', `(() => {\nconst original = window.TOEIC_QUESTIONS;\nconst added = ${JSON.stringify(questions)};\nwindow.POCKET_PREVIOUS_ORDER = [...original, ...added.slice(0, 20)].map(q => q.id);\nwindow.POCKET_ORDER_VERSION = 'mixed-600-v1';\nwindow.TOEIC_QUESTIONS = original.flatMap((q, i) => (i + 1) % 5 === 0 ? [q, added[Math.floor(i / 5)]] : [q]);\n})();\n`);

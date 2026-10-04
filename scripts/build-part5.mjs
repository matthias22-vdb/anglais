import { readFileSync, writeFileSync } from 'node:fs';
const rows = JSON.parse(readFileSync('part5-original.json', 'utf8'));
const questions = rows.map(([sentence, translation, options, answer, topic, rule, feedback], i) => ({
  id: `part5-${String(i + 1).padStart(3, '0')}`, category: 'Part 5 · Grammaire et vocabulaire',
  sentence, translation, options, answer, topic, rule, feedback,
  hint: `Observe le contexte et la place du mot manquant.\n${rule}`,
}));
writeFileSync('public/student/part5.js', `window.TOEIC_QUESTIONS.push(...${JSON.stringify(questions)});\n`);

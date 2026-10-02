import { rmSync, mkdirSync, cpSync, readdirSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true }); mkdirSync('dist', { recursive: true });
for (const name of ['index.html', 'style.css', 'app.js', 'config.js', 'questions.js', 'hints.js']) cpSync(`public/student/${name}`, `dist/${name}`);
cpSync('public/favicon.svg', 'dist/favicon.svg');
mkdirSync('dist/student', { recursive: true });
for (const name of readdirSync('dist').filter(n => n !== 'student')) cpSync(`dist/${name}`, `dist/student/${name}`);

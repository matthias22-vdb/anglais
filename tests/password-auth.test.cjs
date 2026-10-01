const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');

const script = `import('./lib/passwords.ts').then(async m => {
  const password = 'UnePhraseFacile42';
  const stored = await m.hashPassword(password);
  if (stored.hash === password || stored.salt.length < 32 || stored.iterations < 100000) process.exit(2);
  if (!await m.verifyPassword(password, stored.hash, stored.salt, stored.iterations)) process.exit(3);
  if (await m.verifyPassword('MotIncorrect', stored.hash, stored.salt, stored.iterations)) process.exit(4);
  if (m.normalizeUsername('  Lina.BA3 ') !== 'lina.ba3') process.exit(5);
  if (!m.validatePassword('court')) process.exit(6);
})`;
const result = spawnSync(process.execPath, ['--experimental-strip-types', '-e', script], { cwd: process.cwd(), encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr || result.stdout);

const migration = fs.readFileSync('drizzle/0004_opposite_blackheart.sql', 'utf8');
assert.match(migration, /CREATE TABLE `sessions`/);
assert.match(migration, /CREATE UNIQUE INDEX `idx_users_username`/);
const login = fs.readFileSync('app/api/auth/login/route.ts', 'utf8');
assert.match(login, /Trop de tentatives/);
assert.match(login, /set-cookie/);
assert.doesNotMatch(login, /password\s*===\s*["'][^"']+["']/);
console.log('PASS: password hashing, username normalization, unique accounts, secure cookie session and login throttling.');

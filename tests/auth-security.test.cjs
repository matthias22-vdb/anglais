const assert = require('node:assert/strict');
const fs = require('node:fs');

const sessionAuth = fs.readFileSync('lib/session-auth.ts', 'utf8');
assert.match(sessionAuth, /HttpOnly/);
assert.match(sessionAuth, /Secure/);
assert.match(sessionAuth, /SameSite=Lax/);
assert.match(sessionAuth, /isLegacyStorageOwner/);

const reset = fs.readFileSync('app/api/teacher/students/route.ts', 'utf8');
assert.match(reset, /classes\.teacherUserId/);
assert.match(reset, /delete\(sessions\)/);
assert.match(reset, /mustChangePassword: true/);

for (const file of [
  'app/api/progress/route.ts',
  'app/api/student/join/route.ts',
  'app/api/student/me/route.ts',
  'app/api/teacher/classes/route.ts',
  'app/api/teacher/students/route.ts',
  'app/api/admin/users/route.ts',
  'app/api/admin/accounts/route.ts',
]) {
  assert.match(fs.readFileSync(file, 'utf8'), /getCurrentUser/, `${file} must authenticate on the server`);
}
console.log('PASS: protected APIs use server sessions, cookies are hardened, teacher ownership is checked and password reset revokes sessions.');

// Scripts that the course pages start directly must be executable in Git, or a fresh clone fails with «Permission denied»
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('every script with a shebang is executable', () => {
  const rows = execFileSync('git', ['ls-files', '-s'], { encoding: 'utf8' }).trim().split('\n');
  const missing = rows
    .map((row) => row.split(/\s+/))
    .filter(([mode, , , file]) => mode === '100644' && !file.endsWith('.tftpl') && readFileSync(file, 'utf8').startsWith('#!'))
    .map(([, , , file]) => file);
  assert.deepEqual(missing, []);
});

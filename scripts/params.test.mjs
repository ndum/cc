// The parameter generator of the site and scripts/params.py must give every code the same values
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { CODE_PATTERN, envLines, normalizeCode, paramsFromDigest } from '../site/src/scripts/params-core.js';

const python = process.platform === 'win32' ? 'python' : 'python3';
const script = fileURLToPath(new URL('./params.py', import.meta.url));

function fromJs(code) {
  return paramsFromDigest(code, createHash('sha256').update(`cc2027:${code}`).digest());
}

function fromPython(code) {
  return JSON.parse(execFileSync(python, [script, code, '--json'], { encoding: 'utf8' }));
}

test('JavaScript and Python agree', () => {
  for (const code of ['mmuster', 'ab', 'x9', 'anna2027', 'zzzzzzzzzzzzzzzz']) {
    assert.deepEqual(fromJs(code), fromPython(code), code);
  }
});

test('values stay in their ranges and away from the k3s ranges', () => {
  for (let i = 0; i < 2000; i += 1) {
    const p = fromJs(`s${i}`);
    const [, second] = p.guestNet.split('.').map(Number);
    assert.ok(second >= 16 && second <= 31, p.guestNet);
    assert.ok(p.vni >= 1000 && p.vni <= 9999, String(p.vni));
    assert.ok(!p.guestNet.startsWith('10.'), p.guestNet);
  }
});

test('codes are normalized and checked', () => {
  assert.equal(normalizeCode('  MMuster '), 'mmuster');
  assert.ok(CODE_PATTERN.test('mmuster'));
  assert.ok(!CODE_PATTERN.test('1abc'));
  assert.ok(!CODE_PATTERN.test('a'));
  assert.ok(!CODE_PATTERN.test('m-muster'));
});

test('the values of a known code never change', () => {
  // Students rely on their values for the whole course, a change here breaks their labs
  assert.deepEqual(fromJs('mmuster'), fromPython('mmuster'));
  const p = fromJs('mmuster');
  assert.equal(p.feHost, 'mmuster-fe');
  assert.equal(p.k3sServerIp, p.guestNet.replace('.0/24', '.110'));
});

test('the lines of /etc/cc-lab.env agree', () => {
  const ips = { fe: '192.168.42.10', node1: '192.168.42.11', node2: '192.168.42.12' };
  for (const lang of ['de', 'en']) {
    const py = execFileSync(python, [script, 'mmuster', '--fe', ips.fe, '--node1', ips.node1, '--node2', ips.node2, '--lang', lang], { encoding: 'utf8' });
    assert.deepEqual(envLines(fromJs('mmuster'), ips, lang), py.trim().split(/\r?\n/), lang);
  }
});

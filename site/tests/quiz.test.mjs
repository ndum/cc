import assert from 'node:assert/strict';
import { test } from 'node:test';

// quiz.js defines a custom element when it loads, Node only needs stand-ins for that
globalThis.HTMLElement = class {};
globalThis.customElements = { get: () => undefined, define: () => {} };
const { matches, normalizeAnswer } = await import('../src/scripts/quiz.js');

test('whitespace and surrounding quotes do not count', () => {
  assert.equal(normalizeAnswer('  [ 1, 2, 3 ] '), '[1,2,3]');
  assert.equal(normalizeAnswer("'object'"), 'object');
  assert.equal(normalizeAnswer('«leer 0»'), 'leer0');
});

test('case counts and alternatives are separated by |', () => {
  assert.ok(matches('object', "object|'object'"));
  assert.ok(matches('"object"', 'object'));
  assert.ok(!matches('Object', 'object'));
  assert.ok(matches('{"name":"Zelt"}', '{"name":"Zelt"}'));
  assert.ok(matches('[1, 3]', '[1,3]|1 3'));
});

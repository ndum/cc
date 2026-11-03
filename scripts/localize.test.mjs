import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isText, localize } from './localize.mjs';

describe('localize', () => {
  it('keeps the text of one language', () => {
    const source = '<button>[%Reservieren|Reserve%]</button> {{ count }} [%Dinge|things%]';
    assert.equal(localize(source, 'de'), '<button>Reservieren</button> {{ count }} Dinge');
    assert.equal(localize(source, 'en'), '<button>Reserve</button> {{ count }} things');
  });

  it('allows empty sides and leaves code without pairs alone', () => {
    assert.equal(localize("const label = '[%ab|%]'", 'en'), "const label = ''");
    assert.equal(localize('const pairs = Object.fromEntries([[1, 2], [3, 4]])', 'de'), 'const pairs = Object.fromEntries([[1, 2], [3, 4]])');
    assert.equal(localize('width: 100%; [%«Zelt»|"tent"%]', 'de'), 'width: 100%; «Zelt»');
  });

  it('treats TypeScript, JSX and the web app manifest as text', () => {
    for (const name of ['src/main.ts', 'src/App.jsx', 'public/manifest.webmanifest', '.env.example']) assert.ok(isText(name), name);
    assert.ok(!isText('public/icon-192.png'));
  });

  it('rejects unpaired markers', () => {
    assert.throws(() => localize('<p>[%Nur Deutsch%]</p>', 'de'), /Unpaired/);
    assert.throws(() => localize('<p>text%]</p>', 'en'), /line 1/);
  });
});
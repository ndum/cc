/**
 * <cc-params>: the parameter generator of chapter 0.3.
 *
 * Students type their personal code and the addresses of their three VMs, the element shows the
 * content of /etc/cc-lab.env. Everything is computed in the browser, nothing leaves the page.
 * The last input is kept in localStorage, so the values are still there on the next visit.
 */
import { CODE_PATTERN, envLines, milestonesFromDigest, normalizeCode, paramsFromDigest } from './params-core.js';

const TEXT = {
  de: {
    code: 'Persönlicher Code',
    codeHint: 'Kleinbuchstaben und Ziffern, beginnt mit einem Buchstaben, 2 bis 16 Zeichen',
    fe: 'IP-Adresse des Front-ends',
    node1: 'IP-Adresse von Knoten 1',
    node2: 'IP-Adresse von Knoten 2',
    invalidCode: 'Der Code beginnt mit einem Buchstaben und hat 2 bis 16 Kleinbuchstaben oder Ziffern.',
    invalidIp: 'Diese Adresse ist keine gültige IPv4-Adresse.',
    result: 'Inhalt von /etc/cc-lab.env',
    copy: 'Kopieren',
    copied: 'Kopiert',
    milestones: 'Deine Werte für die Meilensteine',
    m1: (v) => `Meilenstein 1, Quota der Gemeinde: ${v.gemeindeVms} VMs, ${String(v.gemeindeCpu).replace('.', ',')} CPU, ${v.gemeindeMemory} MB`,
    m2: (v) => `Meilenstein 2, ResourceQuota im Namespace gemeinde: limits.cpu ${v.gemeindeLimitsCpu}, limits.memory ${v.gemeindeLimitsMemory}`,
    m3: (v) => `Meilenstein 3, SLO des Webshops ${v.sloTarget.replace('.', ',')} %, höchstens ${v.hpaMax} Pods im HPA`,
    m4: (v) => `Meilenstein 4, Backup-Job um ${v.backupHour} Uhr, ${v.backupKeep} Backups behalten`,
  },
  en: {
    code: 'Personal code',
    codeHint: 'lower case letters and digits, starts with a letter, 2 to 16 characters',
    fe: 'IP address of the front-end',
    node1: 'IP address of node 1',
    node2: 'IP address of node 2',
    invalidCode: 'The code starts with a letter and has 2 to 16 lower case letters or digits.',
    invalidIp: 'This is not a valid IPv4 address.',
    result: 'Content of /etc/cc-lab.env',
    copy: 'Copy',
    copied: 'Copied',
    milestones: 'Your values for the milestones',
    m1: (v) => `Milestone 1, quota of the municipality: ${v.gemeindeVms} VMs, ${v.gemeindeCpu} CPU, ${v.gemeindeMemory} MB`,
    m2: (v) => `Milestone 2, ResourceQuota in the namespace gemeinde: limits.cpu ${v.gemeindeLimitsCpu}, limits.memory ${v.gemeindeLimitsMemory}`,
    m3: (v) => `Milestone 3, web shop SLO ${v.sloTarget} %, at most ${v.hpaMax} pods in the HPA`,
    m4: (v) => `Milestone 4, backup job at ${v.backupHour}:00, keep ${v.backupKeep} backups`,
  },
};

const STORAGE_KEY = 'cc-params';
const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function save(values) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Private windows may refuse storage, the generator works without it
  }
}

async function digestOf(code, prefix = 'cc2027') {
  const data = new TextEncoder().encode(`${prefix}:${code}`);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

class CcParams extends HTMLElement {
  connectedCallback() {
    const lang = document.documentElement.lang.startsWith('en') ? 'en' : 'de';
    const t = TEXT[lang];
    const stored = load();
    const field = (name, label, hint = '') => `
      <p class="cc-params-field">
        <label for="cc-${name}">${label}</label>
        <input id="cc-${name}" name="${name}" autocomplete="off" spellcheck="false" value="${stored[name] ?? ''}">
        ${hint ? `<span class="cc-params-hint">${hint}</span>` : ''}
      </p>`;
    this.innerHTML = `
      <form class="cc-params-form">
        ${field('code', t.code, t.codeHint)}
        ${field('fe', t.fe)}
        ${field('node1', t.node1)}
        ${field('node2', t.node2)}
      </form>
      <p class="cc-params-error" role="alert"></p>
      <div class="cc-params-result" hidden>
        <p class="cc-params-label">${t.result}</p>
        <pre><code></code></pre>
        <button type="button">${t.copy}</button>
        <p class="cc-params-label">${t.milestones}</p>
        <ul class="cc-params-milestones"></ul>
      </div>`;
    const form = this.querySelector('form');
    const error = this.querySelector('.cc-params-error');
    const result = this.querySelector('.cc-params-result');
    const code = this.querySelector('code');
    const button = this.querySelector('button');

    const update = async () => {
      const values = Object.fromEntries(new FormData(form));
      save(values);
      const normalized = normalizeCode(values.code);
      const badIp = ['fe', 'node1', 'node2'].find((key) => values[key] && !IPV4.test(values[key].trim()));
      if (!CODE_PATTERN.test(normalized)) {
        error.textContent = normalized ? t.invalidCode : '';
        result.hidden = true;
        return;
      }
      error.textContent = badIp ? t.invalidIp : '';
      const params = paramsFromDigest(normalized, await digestOf(normalized));
      const ips = { fe: values.fe?.trim(), node1: values.node1?.trim(), node2: values.node2?.trim() };
      code.textContent = envLines(params, ips, lang).join('\n');
      const ms = milestonesFromDigest(await digestOf(normalized, 'cc2027-ms'));
      this.querySelector('.cc-params-milestones').replaceChildren(
        ...['m1', 'm2', 'm3', 'm4'].map((key) => {
          const item = document.createElement('li');
          item.textContent = t[key](ms[key]);
          return item;
        }),
      );
      result.hidden = false;
    };

    form.addEventListener('input', update);
    form.addEventListener('submit', (event) => event.preventDefault());
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(`${code.textContent}\n`);
      button.textContent = t.copied;
      setTimeout(() => (button.textContent = t.copy), 1500);
    });
    update();
  }
}

if (!customElements.get('cc-params')) customElements.define('cc-params', CcParams);

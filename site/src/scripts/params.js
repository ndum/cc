/**
 * <cc-params>: the parameter generator of chapter 0.3.
 *
 * Students type their personal code and the name of the network interface of their VMs. The
 * element shows the addresses of the three VMs, the netplan file for each of them and the content
 * of /etc/cc-lab.env. Everything is computed in the browser, nothing leaves the page. The last
 * input is kept in localStorage, so the values are still there on the next visit.
 */
import {
  CODE_PATTERN,
  envLines,
  labFromDigest,
  milestonesFromDigest,
  netplanText,
  normalizeCode,
  paramsFromDigest,
} from './params-core.js';

const TEXT = {
  de: {
    code: 'Persönlicher Code',
    codeHint: 'Kleinbuchstaben und Ziffern, beginnt mit einem Buchstaben, 2 bis 16 Zeichen',
    iface: 'Netzwerkschnittstelle',
    ifaceHint: 'so, wie sie ip -br link auf deinen VMs zeigt, etwa ens160 oder eth0',
    invalidCode: 'Der Code beginnt mit einem Buchstaben und hat 2 bis 16 Kleinbuchstaben oder Ziffern.',
    invalidIface: 'Der Name der Schnittstelle besteht aus Kleinbuchstaben und Ziffern.',
    addresses: 'Adressen deiner drei VMs',
    vm: 'VM',
    host: 'Hostname',
    address: 'Adresse',
    names: { fe: 'Front-end', node1: 'Knoten 1', node2: 'Knoten 2' },
    netplan: (name) => `/etc/netplan/60-cc-lab.yaml auf ${name}`,
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
    iface: 'Network interface',
    ifaceHint: 'as ip -br link shows it on your VMs, for example ens160 or eth0',
    invalidCode: 'The code starts with a letter and has 2 to 16 lower case letters or digits.',
    invalidIface: 'The interface name consists of lower case letters and digits.',
    addresses: 'Addresses of your three VMs',
    vm: 'VM',
    host: 'Host name',
    address: 'Address',
    names: { fe: 'Front-end', node1: 'Node 1', node2: 'Node 2' },
    netplan: (name) => `/etc/netplan/60-cc-lab.yaml on ${name}`,
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
const IFACE = /^[a-z][a-z0-9]{1,14}$/;
const ROLES = ['fe', 'node1', 'node2'];

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

/** A block with a label, preformatted text and a copy button */
function block(label, text, t) {
  const wrap = document.createElement('div');
  const title = document.createElement('p');
  title.className = 'cc-params-label';
  title.textContent = label;
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.textContent = text;
  pre.append(code);
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = t.copy;
  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(`${text}\n`);
    button.textContent = t.copied;
    setTimeout(() => (button.textContent = t.copy), 1500);
  });
  wrap.append(title, pre, button);
  return wrap;
}

class CcParams extends HTMLElement {
  connectedCallback() {
    const lang = document.documentElement.lang.startsWith('en') ? 'en' : 'de';
    const t = TEXT[lang];
    const stored = load();
    const field = (name, label, hint, fallback = '') => `
      <p class="cc-params-field">
        <label for="cc-${name}">${label}</label>
        <input id="cc-${name}" name="${name}" autocomplete="off" spellcheck="false" value="${stored[name] ?? fallback}">
        <span class="cc-params-hint">${hint}</span>
      </p>`;
    this.innerHTML = `
      <form class="cc-params-form">
        ${field('code', t.code, t.codeHint)}
        ${field('iface', t.iface, t.ifaceHint, 'ens160')}
      </form>
      <p class="cc-params-error" role="alert"></p>
      <div class="cc-params-result" hidden></div>`;
    const form = this.querySelector('form');
    const error = this.querySelector('.cc-params-error');
    const result = this.querySelector('.cc-params-result');

    const update = async () => {
      const values = Object.fromEntries(new FormData(form));
      save(values);
      const normalized = normalizeCode(values.code);
      const iface = (values.iface ?? '').trim();
      if (!CODE_PATTERN.test(normalized) || !IFACE.test(iface)) {
        error.textContent = normalized && !CODE_PATTERN.test(normalized) ? t.invalidCode : iface && !IFACE.test(iface) ? t.invalidIface : '';
        result.hidden = true;
        return;
      }
      error.textContent = '';
      const params = paramsFromDigest(normalized, await digestOf(normalized));
      const ips = labFromDigest(await digestOf(normalized, 'cc2027-lab'));
      const hosts = { fe: params.feHost, node1: params.node1Host, node2: params.node2Host };

      const label = document.createElement('p');
      label.className = 'cc-params-label';
      label.textContent = t.addresses;
      const table = document.createElement('table');
      const head = table.createTHead().insertRow();
      for (const text of [t.vm, t.host, t.address]) head.append(Object.assign(document.createElement('th'), { textContent: text }));
      const body = table.createTBody();
      for (const role of ROLES) {
        const row = body.insertRow();
        for (const text of [t.names[role], hosts[role], `${ips[role]}/24`]) row.insertCell().textContent = text;
      }

      const ms = milestonesFromDigest(await digestOf(normalized, 'cc2027-ms'));
      const msLabel = document.createElement('p');
      msLabel.className = 'cc-params-label';
      msLabel.textContent = t.milestones;
      const list = document.createElement('ul');
      list.className = 'cc-params-milestones';
      list.append(...['m1', 'm2', 'm3', 'm4'].map((key) => Object.assign(document.createElement('li'), { textContent: t[key](ms[key]) })));

      result.replaceChildren(
        label,
        table,
        ...ROLES.map((role) => block(t.netplan(t.names[role]), netplanText(ips[role], iface), t)),
        block(t.result, envLines(params, ips, lang).join('\n'), t),
        msLabel,
        list,
      );
      result.hidden = false;
    };

    form.addEventListener('input', update);
    form.addEventListener('submit', (event) => event.preventDefault());
    update();
  }
}

if (!customElements.get('cc-params')) customElements.define('cc-params', CcParams);

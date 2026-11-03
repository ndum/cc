/**
 * <cc-params>: the parameter generator of chapter 0.3.
 *
 * Students type their personal code and the name of the network interface of their servers. The
 * element shows the addresses of the three servers and, in the order of chapter 0.3, the two
 * commands for a first address at the console of each server, the commands for its SSH session that
 * write and apply its netplan file and the command that writes /etc/cc-lab.env. Everything is
 * computed in the browser, nothing leaves the page. The last input is kept in localStorage, so the
 * values are still there on the next visit.
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
    ifacePlaceholder: 'Name aus ip -br link',
    ifaceHint: 'Der Name, den ip -br link auf deinen Servern zeigt, nicht einfach ein Beispiel aus dem Kurs',
    invalidCode: 'Der Code beginnt mit einem Buchstaben und hat 2 bis 16 Kleinbuchstaben oder Ziffern.',
    invalidIface: 'Der Name der Schnittstelle besteht aus Kleinbuchstaben und Ziffern.',
    missingIface: 'Sobald du den Namen der Netzwerkschnittstelle eingibst, erscheinen hier die Blöcke für die Konsole und die SSH-Sitzung jedes Servers.',
    ifaceUsed: (iface) => ['Die Befehle für die Konsole und für netplan verwenden die Schnittstelle ', { code: iface }, '. Zeigt ', { code: 'ip -br link' }, ' auf deinen Servern einen anderen Namen, korrigiere ihn oben.'],
    addresses: 'Adressen deiner drei Server',
    vm: 'Server',
    host: 'Hostname',
    address: 'Adresse',
    names: { fe: 'Front-end', node1: 'Knoten 1', node2: 'Knoten 2' },
    console: (role) => `An der Konsole ${{ fe: 'des Front-ends', node1: 'von Knoten 1', node2: 'von Knoten 2' }[role]} tippen`,
    ssh: (role) => `In der SSH-Sitzung auf ${{ fe: 'dem Front-end', node1: 'Knoten 1', node2: 'Knoten 2' }[role]} einfügen`,
    env: 'In der SSH-Sitzung auf jedem der drei Server einfügen',
    copy: 'Kopieren',
    copied: 'Kopiert',
    milestones: 'Deine Werte für die Meilensteine',
    msHead: ['Meilenstein', 'Einstellung', 'Wert'],
    msRows: (ms) => [
      ['1', 'Quota der Gruppe gemeinde', `${ms.m1.gemeindeVms} VMs, ${decimal(ms.m1.gemeindeCpu)} CPU, ${ms.m1.gemeindeMemory} MB`],
      ['2', 'ResourceQuota im Namespace gemeinde', `limits.cpu ${ms.m2.gemeindeLimitsCpu}, limits.memory ${ms.m2.gemeindeLimitsMemory}`],
      ['3', 'Ziel des SLO für den Webshop', `${decimal(ms.m3.sloTarget)} %`],
      ['3', 'Höchstzahl Pods im HPA', `${ms.m3.hpaMax}`],
      ['4', 'Uhrzeit des Backup-Jobs', `${ms.m4.backupHour}.00 Uhr`],
      ['4', 'Backups, die der Job behält', `${ms.m4.backupKeep}`],
    ],
  },
  en: {
    code: 'Personal code',
    codeHint: 'Lower case letters and digits, starts with a letter, 2 to 16 characters',
    iface: 'Network interface',
    ifacePlaceholder: 'name from ip -br link',
    ifaceHint: 'The name ip -br link shows on your servers, not just an example from the course',
    invalidCode: 'The code starts with a letter and has 2 to 16 lower case letters or digits.',
    invalidIface: 'The interface name consists of lower case letters and digits.',
    missingIface: 'Once you enter the name of the network interface, the blocks for the console and the SSH session of every server appear here.',
    ifaceUsed: (iface) => ['The commands for the console and for netplan use the interface ', { code: iface }, '. If ', { code: 'ip -br link' }, ' shows another name on your servers, correct it above.'],
    addresses: 'Addresses of your three servers',
    vm: 'Server',
    host: 'Host name',
    address: 'Address',
    names: { fe: 'Front-end', node1: 'Node 1', node2: 'Node 2' },
    console: (role) => `Type at the console of ${{ fe: 'the front-end', node1: 'node 1', node2: 'node 2' }[role]}`,
    ssh: (role) => `Paste into the SSH session on ${{ fe: 'the front-end', node1: 'node 1', node2: 'node 2' }[role]}`,
    env: 'Paste into the SSH session on each of the three servers',
    copy: 'Copy',
    copied: 'Copied',
    milestones: 'Your values for the milestones',
    msHead: ['Milestone', 'Setting', 'Value'],
    msRows: (ms) => [
      ['1', 'Quota of the group gemeinde', `${ms.m1.gemeindeVms} VMs, ${ms.m1.gemeindeCpu} CPU, ${ms.m1.gemeindeMemory} MB`],
      ['2', 'ResourceQuota in the namespace gemeinde', `limits.cpu ${ms.m2.gemeindeLimitsCpu}, limits.memory ${ms.m2.gemeindeLimitsMemory}`],
      ['3', 'SLO target of the web shop', `${ms.m3.sloTarget}%`],
      ['3', 'Maximum number of pods in the HPA', `${ms.m3.hpaMax}`],
      ['4', 'Time of the backup job', `${ms.m4.backupHour}:00`],
      ['4', 'Backups the job keeps', `${ms.m4.backupKeep}`],
    ],
  },
};

const STORAGE_KEY = 'cc-params';
const IFACE = /^[a-z][a-z0-9]{1,14}$/;
const ROLES = ['fe', 'node1', 'node2'];

/** German decimals use a comma */
function decimal(value) {
  return String(value).replace('.', ',');
}

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

/** A paragraph from strings and { code } parts, built from text nodes so no input becomes HTML */
function paragraph(className, parts) {
  const element = document.createElement('p');
  element.className = className;
  for (const part of parts) {
    element.append(typeof part === 'string' ? part : Object.assign(document.createElement('code'), { textContent: part.code }));
  }
  return element;
}

/** A labelled table with a header row */
function table(label, head, rows) {
  const title = document.createElement('p');
  title.className = 'cc-params-label';
  title.textContent = label;
  const element = document.createElement('table');
  const headRow = element.createTHead().insertRow();
  for (const text of head) headRow.append(Object.assign(document.createElement('th'), { textContent: text }));
  const body = element.createTBody();
  for (const cells of rows) {
    const row = body.insertRow();
    for (const text of cells) row.insertCell().textContent = text;
  }
  return [title, element];
}

/** The two commands that give a server its first address before SSH works */
function consoleText(ip, iface) {
  return [`sudo ip link set ${iface} up`, `sudo ip addr add ${ip}/24 dev ${iface}`].join('\n');
}

/**
 * The commands for the SSH session that write the netplan file of a server and apply it. netplan try
 * comes last, because it waits for Enter and would take the next pasted line as the answer
 */
function sshText(ip, iface) {
  return [
    "sudo tee /etc/netplan/60-cc-lab.yaml <<'EOF'",
    netplanText(ip, iface),
    'EOF',
    'sudo chmod 600 /etc/netplan/60-cc-lab.yaml',
    'sudo netplan try',
  ].join('\n');
}

/** The command for the SSH session that writes /etc/cc-lab.env, the same on all three servers */
function envText(lines) {
  return ["sudo tee /etc/cc-lab.env <<'EOF'", ...lines, 'EOF'].join('\n');
}

class CcParams extends HTMLElement {
  connectedCallback() {
    const lang = document.documentElement.lang.startsWith('en') ? 'en' : 'de';
    const t = TEXT[lang];
    const stored = load();
    const field = (name, label, hint, placeholder = '') => `
      <p class="cc-params-field">
        <label for="cc-${name}">${label}</label>
        <input id="cc-${name}" name="${name}" autocomplete="off" spellcheck="false" placeholder="${placeholder}" value="${stored[name] ?? ''}">
        <span class="cc-params-hint">${hint}</span>
      </p>`;
    this.innerHTML = `
      <form class="cc-params-form">
        ${field('code', t.code, t.codeHint)}
        ${field('iface', t.iface, t.ifaceHint, t.ifacePlaceholder)}
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
      const ifaceOk = IFACE.test(iface);
      error.textContent = normalized && !CODE_PATTERN.test(normalized) ? t.invalidCode : iface && !ifaceOk ? t.invalidIface : '';
      if (!CODE_PATTERN.test(normalized)) {
        result.hidden = true;
        return;
      }
      const params = paramsFromDigest(normalized, await digestOf(normalized));
      const ips = labFromDigest(await digestOf(normalized, 'cc2027-lab'));
      const ms = milestonesFromDigest(await digestOf(normalized, 'cc2027-ms'));
      const hosts = { fe: params.feHost, node1: params.node1Host, node2: params.node2Host };

      const perServer = ifaceOk
        ? [
            // The name of the interface is the most common mistake, so the result repeats it
            paragraph('cc-params-note', t.ifaceUsed(iface)),
            ...ROLES.flatMap((role) => [
              block(t.console(role), consoleText(ips[role], iface), t),
              block(t.ssh(role), sshText(ips[role], iface), t),
            ]),
          ]
        : [Object.assign(document.createElement('p'), { className: 'cc-params-hint', textContent: t.missingIface })];

      result.replaceChildren(
        ...table(t.addresses, [t.vm, t.host, t.address], ROLES.map((role) => [t.names[role], hosts[role], `${ips[role]}/24`])),
        ...perServer,
        block(t.env, envText(envLines(params, ips, lang)), t),
        ...table(t.milestones, t.msHead, t.msRows(ms)),
      );
      result.hidden = false;
    };

    form.addEventListener('input', update);
    form.addEventListener('submit', (event) => event.preventDefault());
    update();
  }
}

if (!customElements.get('cc-params')) customElements.define('cc-params', CcParams);

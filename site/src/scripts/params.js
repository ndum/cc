/**
 * <cc-params>: the parameter generator of chapter 0.3.
 *
 * Students type their personal code. The element shows the default and the new address of each of
 * the three servers and two blocks that are the same on every server, the first writes
 * /etc/cc-lab.env, the second moves the server on smartlearn from its default address to its new one
 * in 00-eth0.yaml. Last come the personal values for the milestones. With part="ssh", as in chapter
 * 0.4, it shows only the block for the client that writes the SSH configuration and copies the key.
 * Everything is computed in the browser, nothing leaves the page. The code is kept in localStorage,
 * so chapter 0.4 already knows it from chapter 0.3.
 */
import { CODE_PATTERN, envLines, labFromDigest, milestonesFromDigest, normalizeCode, paramsFromDigest } from './params-core.js';

const TEXT = {
  de: {
    code: 'Persönlicher Code',
    codeHint: 'Kleinbuchstaben und Ziffern, beginnt mit einem Buchstaben, 2 bis 16 Zeichen',
    invalidCode: 'Der Code beginnt mit einem Buchstaben und hat 2 bis 16 Kleinbuchstaben oder Ziffern.',
    addresses: 'Deine drei Server',
    head: ['Server', 'Hostname', 'Standardadresse', 'Neue Adresse'],
    names: { fe: 'Front-end', node1: 'Knoten 1', node2: 'Knoten 2' },
    env: '1. Die Datei /etc/cc-lab.env, auf jedem Server einfügen',
    move: '2. Die neue Adresse, auf jedem Server einfügen',
    ssh: 'Im Terminal des Clients einfügen',
    copy: 'Kopieren',
    copied: 'Kopiert',
    milestones: 'Deine Werte für die Meilensteine',
    msHead: ['Meilenstein', 'Einstellung', 'Wert'],
    msRows: (ms) => [
      // The CPU keeps its point, it goes as it is into set-quotas.sh of chapter 3.2
      ['1', 'Quota der Gruppe gemeinde', `${ms.m1.gemeindeVms} VMs, ${ms.m1.gemeindeCpu} CPU, ${ms.m1.gemeindeMemory} MB`],
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
    invalidCode: 'The code starts with a letter and has 2 to 16 lower case letters or digits.',
    addresses: 'Your three servers',
    head: ['Server', 'Host name', 'Default address', 'New address'],
    names: { fe: 'Front-end', node1: 'Node 1', node2: 'Node 2' },
    env: '1. The file /etc/cc-lab.env, paste on every server',
    move: '2. The new address, paste on every server',
    ssh: 'Paste into the terminal of the client',
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
const ROLES = ['fe', 'node1', 'node2'];
/** The template of the smartlearn environments starts the servers with these addresses */
const DEFAULTS = { fe: '192.168.210.137', node1: '192.168.210.138', node2: '192.168.210.139' };

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

/** The command that writes /etc/cc-lab.env, the same on all three servers */
function envText(lines) {
  return ["sudo tee /etc/cc-lab.env <<'EOF'", ...lines, 'EOF'].join('\n');
}

/**
 * The commands that move a server on smartlearn to its new address. One sed with a line per server
 * fits all three, because each server finds only its own default address in its 00-eth0.yaml. A new
 * front-end address is 20 + 3k and never equals the default address of a node, so no line changes
 * a result of an earlier one. netplan apply would freeze the SSH session that runs on the old
 * address, so systemd-run starts it as a service of its own after two seconds, when exit has already
 * ended the session. A timer with --on-active would wait up to a minute because of its default accuracy
 */
function moveText(ips) {
  return [
    'sudo sed -i \\',
    ...ROLES.map((role) => `  -e 's#${DEFAULTS[role]}/#${ips[role]}/#' \\`),
    '  /etc/netplan/00-eth0.yaml',
    "sudo systemd-run sh -c 'sleep 2; netplan apply'",
    'exit',
  ].join('\n');
}

/**
 * The block for the client of chapter 0.4. It appends a host entry per server to ~/.ssh/config, so a
 * name like mmuster-fe stands for the new address and the user vmadmin of the smartlearn template,
 * and copies the key to each server
 */
function sshText(hosts, ips) {
  return [
    "cat >> ~/.ssh/config <<'EOF'",
    ...ROLES.flatMap((role, i) => [...(i ? [''] : []), `Host ${hosts[role]}`, `  HostName ${ips[role]}`, '  User vmadmin']),
    'EOF',
    ...ROLES.map((role) => `ssh-copy-id ${hosts[role]}`),
  ].join('\n');
}

class CcParams extends HTMLElement {
  connectedCallback() {
    const lang = document.documentElement.lang.startsWith('en') ? 'en' : 'de';
    const t = TEXT[lang];
    const stored = load();
    this.innerHTML = `
      <form class="cc-params-form">
        <p class="cc-params-field">
          <label for="cc-code">${t.code}</label>
          <input id="cc-code" name="code" autocomplete="off" spellcheck="false" value="${stored.code ?? ''}">
          <span class="cc-params-hint">${t.codeHint}</span>
        </p>
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
      error.textContent = normalized && !CODE_PATTERN.test(normalized) ? t.invalidCode : '';
      if (!CODE_PATTERN.test(normalized)) {
        result.hidden = true;
        return;
      }
      const params = paramsFromDigest(normalized, await digestOf(normalized));
      const ips = labFromDigest(await digestOf(normalized, 'cc2027-lab'));
      const ms = milestonesFromDigest(await digestOf(normalized, 'cc2027-ms'));
      const hosts = { fe: params.feHost, node1: params.node1Host, node2: params.node2Host };

      if (this.getAttribute('part') === 'ssh') {
        result.replaceChildren(block(t.ssh, sshText(hosts, ips), t));
        result.hidden = false;
        return;
      }
      result.replaceChildren(
        ...table(t.addresses, t.head, ROLES.map((role) => [t.names[role], hosts[role], DEFAULTS[role], ips[role]])),
        block(t.env, envText(envLines(params, ips, lang)), t),
        block(t.move, moveText(ips), t),
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

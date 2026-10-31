/**
 * <lt-tabs>: turns the markup written by remark-learn-blocks into an accessible,
 * synced tab group. No framework, no dependencies.
 *
 * Markup in (this is also what a visitor without JavaScript sees; every panel
 * is visible and carries its own label):
 *
 *   <lt-tabs data-label="Dateien">
 *     <div class="lt-panel" data-key="file-App.vue" data-label="App.vue">
 *       <p class="lt-panel-label">App.vue</p> ...content... </div>
 *     <div class="lt-panel" data-key="file-ItemCard.vue" ...> ... </div>
 *   </lt-tabs>
 *
 * Behaviour:
 *  - WAI-ARIA tabs pattern: tablist / tab / tabpanel, roving tabindex,
 *    Left/Right (wrapping), Home, End; selection follows focus.
 *  - One global preference (localStorage "cc:tab" = tab key). Choosing
 *    "template" switches every group on the page that has a "template" tab, and the
 *    next page or reload starts with it. Groups without that tab keep their own.
 *  - Other browser tabs/windows follow via the storage event; a page restored
 *    from the back/forward cache re-reads the preference.
 *  - Being a custom element, it also works when a router swaps page content
 *    (connectedCallback/disconnectedCallback), not only on full page loads.
 */

const STORAGE_KEY = 'cc:tab';
/** Groups currently in the document. */
const groups = new Set();
let counter = 0;

const preference = {
  get() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null; // storage blocked (private mode, policy): just don't remember
    }
  },
  set(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  },
};

class LtTabs extends HTMLElement {
  connectedCallback() {
    groups.add(this);
    if (this.hasAttribute('data-ready')) return; // re-attached after a move: already built
    if (!this.#build()) return;
    const wanted = preference.get();
    this.select(wanted && this.has(wanted) ? wanted : this.tabs[0].dataset.key);
  }

  disconnectedCallback() {
    groups.delete(this);
  }

  has(key) {
    return this.tabs.some((tab) => tab.dataset.key === key);
  }

  /** Show the panel for `key`; returns false when this group has no such tab. */
  select(key) {
    const index = this.tabs.findIndex((tab) => tab.dataset.key === key);
    if (index < 0) return false;
    this.tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      this.panels[i].hidden = !on;
    });
    return true;
  }

  #build() {
    const panels = [...this.querySelectorAll(':scope > .lt-panel')];
    if (panels.length < 2) return false;
    const id = `lt${++counter}`;

    const list = document.createElement('div');
    list.className = 'lt-tablist not-content'; // not-content: opt out of Starlight's markdown spacing
    list.setAttribute('role', 'tablist');
    if (this.dataset.label) list.setAttribute('aria-label', this.dataset.label);

    this.tabs = panels.map((panel, i) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'lt-tab';
      tab.id = `${id}-tab-${i}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', `${id}-panel-${i}`);
      tab.dataset.key = panel.dataset.key;
      tab.textContent = panel.dataset.label;

      panel.id = `${id}-panel-${i}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
      const plainLabel = panel.querySelector(':scope > .lt-panel-label');
      if (plainLabel) plainLabel.hidden = true; // only needed without JS (and in print)

      list.append(tab);
      return tab;
    });
    this.panels = panels;

    list.addEventListener('click', (event) => {
      const tab = event.target.closest('[role="tab"]');
      if (tab) activate(this, tab.dataset.key);
    });
    list.addEventListener('keydown', (event) => {
      const current = this.tabs.indexOf(event.target);
      if (current < 0) return;
      const last = this.tabs.length - 1;
      const rtl = getComputedStyle(this).direction === 'rtl';
      let next;
      switch (event.key) {
        case 'ArrowRight':
          next = rtl ? current - 1 : current + 1;
          break;
        case 'ArrowLeft':
          next = rtl ? current + 1 : current - 1;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = last;
          break;
        default:
          return;
      }
      event.preventDefault();
      next = next < 0 ? last : next > last ? 0 : next;
      activate(this, this.tabs[next].dataset.key, { focus: true });
    });

    this.prepend(list);
    this.setAttribute('data-ready', '');
    return true;
  }
}

/** Select `key` in every group, remember it, and keep the clicked tab where it was on screen. */
function activate(origin, key, { focus = false } = {}) {
  const anchor = origin.tabs.find((tab) => tab.dataset.key === key);
  const before = anchor.getBoundingClientRect().top;
  for (const group of groups) group.select(key);
  preference.set(key);
  if (focus) anchor.focus({ preventScroll: true });
  const shift = anchor.getBoundingClientRect().top - before;
  if (shift) window.scrollBy(0, shift); // other groups changed height above/below us
}

function applyStoredPreference() {
  const wanted = preference.get();
  if (wanted) for (const group of groups) group.select(wanted);
}

if (!customElements.get('lt-tabs')) {
  customElements.define('lt-tabs', LtTabs);
  // Another browser tab changed the choice.
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) applyStoredPreference();
  });
  // Page came back from the back/forward cache: the choice may have changed meanwhile.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) applyStoredPreference();
  });
}

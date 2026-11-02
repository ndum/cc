/**
 * Screenshots of the lab interfaces (<figure class="lt-shot"> from remark-inline-figures).
 *
 * The content column shows a screenshot smaller than the interface really is. A click on the
 * picture or on its button opens it in a modal dialog at its real size, which is half its pixel
 * width because the pictures are taken at twice their CSS size. Escape, a click anywhere or the
 * close button closes it. Without JavaScript the picture simply stays in the column.
 */

const german = document.documentElement.lang.startsWith('de');
const LABELS = german ? { open: 'Bild vergrössern', close: 'Schliessen' } : { open: 'Enlarge image', close: 'Close' };
const ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6"/></svg>';

let dialog;

function getDialog() {
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.className = 'lt-shot-dialog';
    dialog.addEventListener('click', () => dialog.close());
    document.body.append(dialog);
  }
  return dialog;
}

function open(image) {
  const big = image.cloneNode();
  big.removeAttribute('loading');
  // A lazy image that has not loaded yet has no natural width, its width attribute has the same value
  const width = image.naturalWidth || Number(image.getAttribute('width'));
  if (width) big.style.width = `${Math.round(width / 2)}px`;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'lt-shot-close';
  close.textContent = LABELS.close;
  const box = getDialog();
  box.replaceChildren(close, big);
  box.showModal();
}

function enhance(figure) {
  const image = figure.querySelector('img');
  if (!image || figure.querySelector('.lt-shot-zoom')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'lt-shot-zoom';
  button.title = LABELS.open;
  button.setAttribute('aria-label', LABELS.open);
  button.innerHTML = ICON;
  button.addEventListener('click', () => open(image));
  image.addEventListener('click', () => open(image));
  figure.append(button);
}

document.querySelectorAll('figure.lt-shot').forEach(enhance);

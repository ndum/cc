// <lt-quiz> turns the questions of a :::quiz into a test with answer fields. The markup comes
// from remark-learn-blocks, every question carries its answers and the slug of its workshop unit:
//
//   <lt-quiz data-label="Test">
//     <div class="lt-box lt-question" data-answer="object|'object'" data-unit="variables">
//       question ... <details class="lt-solution"> ... link to the unit ... </details>
//     </div>
//   </lt-quiz>
//
// Learners type what they expect and get immediate feedback, a summary below the test lists the
// units of the JS workshop that cover the questions they got wrong. Without JavaScript every
// question keeps its collapsible solution.

const STRINGS = {
  de: {
    answer: 'Deine Antwort',
    check: 'Prüfen',
    right: 'Richtig.',
    wrong: 'Noch nicht. Die Lösung erklärt es.',
    empty: 'Gib zuerst eine Antwort ein.',
    progress: (checked, total, right) => `Du hast ${checked} von ${total} Fragen geprüft, ${right} davon richtig.`,
    repeat: 'Diese Einheiten der JS-Werkstatt helfen dir bei den übrigen Fragen:',
    allRight: 'Damit bist du für den Kurs gut vorbereitet.',
  },
  en: {
    answer: 'Your answer',
    check: 'Check',
    right: 'Correct.',
    wrong: 'Not yet. The solution explains it.',
    empty: 'Enter an answer first.',
    progress: (checked, total, right) => `You have checked ${checked} of ${total} questions, ${right} of them correct.`,
    repeat: 'These units of the JS workshop help with the other questions:',
    allRight: 'You are well prepared for the course.',
  },
};

/**
 * Makes typed answers comparable. Whitespace does not count, and quotes around the whole answer
 * are dropped, so `[1,2]` matches `[ 1, 2 ]` and 'object' matches object. Case still counts,
 * because JavaScript output is case-sensitive.
 */
export function normalizeAnswer(text) {
  let value = String(text).trim();
  if (value.length >= 2 && /^(['"`«]).*(['"`»])$/s.test(value)) value = value.slice(1, -1);
  return value.replace(/\s+/g, '');
}

/** True when the typed text matches one of the answers, alternatives are separated by | */
export function matches(typed, answers) {
  const wanted = normalizeAnswer(typed);
  return String(answers)
    .split('|')
    .some((answer) => normalizeAnswer(answer) === wanted);
}

let counter = 0;

class LtQuiz extends HTMLElement {
  connectedCallback() {
    if (this.hasAttribute('data-ready')) return;
    this.setAttribute('data-ready', '');
    this.lang2 = (document.documentElement.lang || 'en').startsWith('de') ? 'de' : 'en';
    this.t = STRINGS[this.lang2];
    this.questions = [...this.querySelectorAll(':scope > .lt-question')];
    this.results = new Map();
    this.questions.forEach((question) => this.addAnswerField(question));
    this.summary = document.createElement('div');
    this.summary.className = 'lt-quiz-summary';
    this.summary.setAttribute('role', 'status');
    this.summary.hidden = true;
    this.append(this.summary);
  }

  addAnswerField(question) {
    const t = this.t;
    const id = `lt-quiz-${++counter}`;
    const form = document.createElement('form');
    form.className = 'lt-quiz-answer';
    form.noValidate = true;
    form.innerHTML = `
      <label for="${id}"></label>
      <input id="${id}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="${id}-feedback">
      <button type="submit"></button>
      <p class="lt-quiz-feedback" id="${id}-feedback" aria-live="polite"></p>`;
    form.querySelector('label').textContent = t.answer;
    form.querySelector('button').textContent = t.check;
    const solution = question.querySelector(':scope > details.lt-solution');
    question.insertBefore(form, solution);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.check(question, form, solution);
    });
  }

  check(question, form, solution) {
    const t = this.t;
    const input = form.querySelector('input');
    const feedback = form.querySelector('.lt-quiz-feedback');
    if (input.value.trim() === '') {
      feedback.textContent = t.empty;
      feedback.dataset.state = 'invalid';
      input.removeAttribute('aria-invalid');
      return;
    }
    const right = matches(input.value, question.dataset.answer ?? '');
    this.results.set(question, right);
    feedback.textContent = right ? t.right : t.wrong;
    feedback.dataset.state = right ? 'right' : 'wrong';
    input.setAttribute('aria-invalid', String(!right));
    if (!right && solution) solution.open = true;
    this.updateSummary();
  }

  /** Lists each unit once, in the order of the questions, with the link from its solution. */
  unitsToRepeat() {
    const units = new Map();
    for (const question of this.questions) {
      if (this.results.get(question) !== false) continue;
      const slug = question.dataset.unit;
      if (units.has(slug)) continue;
      const link = [...question.querySelectorAll('a[href]')].find((a) => a.getAttribute('href').includes(`js/${slug}/`));
      if (link) units.set(slug, { href: link.getAttribute('href'), text: link.textContent });
    }
    return [...units.values()];
  }

  updateSummary() {
    const t = this.t;
    const checked = this.results.size;
    const right = [...this.results.values()].filter(Boolean).length;
    const text = document.createElement('p');
    text.textContent = t.progress(checked, this.questions.length, right);
    const parts = [text];
    const units = this.unitsToRepeat();
    if (units.length > 0) {
      const intro = document.createElement('p');
      intro.textContent = t.repeat;
      const list = document.createElement('ul');
      for (const unit of units) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = unit.href;
        link.textContent = unit.text;
        item.append(link);
        list.append(item);
      }
      parts.push(intro, list);
    } else if (checked === this.questions.length) {
      const done = document.createElement('p');
      done.textContent = t.allRight;
      parts.push(done);
    }
    this.summary.replaceChildren(...parts);
    this.summary.hidden = false;
  }
}

if (!customElements.get('lt-quiz')) customElements.define('lt-quiz', LtQuiz);

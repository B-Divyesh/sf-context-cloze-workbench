import './styles.css';
import {
  addBlank,
  answersMatch,
  clozeText,
  isBackup,
  recentAccuracy,
  sentenceParts,
  toCsv,
  type Attempt,
  type Backup,
  type Blank,
  type Direction,
  type Prompt
} from './core';
import { deletePrompt, loadAll, putAttempt, putPrompt, replaceBackup, type StorageNamespace } from './storage';

type Route = 'workbench' | 'practice' | 'print' | 'privacy' | 'terms';

interface Draft {
  id: string | null;
  sentence: string;
  blanks: Blank[];
  note: string;
  direction: Direction;
  createdAt: string | null;
}

const emptyDraft = (): Draft => ({ id: null, sentence: '', blanks: [], note: '', direction: 'auto', createdAt: null });
const samplePrompt = (id: string, sentence: string, answer: string, note: string): Prompt => {
  const start = sentence.indexOf(answer);
  const createdAt = '2026-09-05T00:00:00.000Z';
  return {
    id,
    sentence,
    blanks: [{ start, end: start + answer.length, answer }],
    note,
    direction: 'auto',
    createdAt,
    updatedAt: createdAt
  };
};
const SAMPLE_BACKUP: Backup = {
  version: 1,
  exportedAt: '2026-09-05T00:00:00.000Z',
  prompts: [
    samplePrompt('demo-field-notebook', 'A field notebook helps a gardener notice changes after rain.', 'field notebook', 'A written record of observations made outdoors.'),
    samplePrompt('demo-thermometer', 'Before opening the greenhouse, Mira checked the thermometer.', 'thermometer', 'A tool that measures temperature.'),
    samplePrompt('demo-infer', "Students infer a new word's meaning by comparing clues in the sentence.", 'infer', 'To reach an idea from evidence and context.')
  ],
  attempts: []
};
const app = document.querySelector<HTMLDivElement>('#app')!;
let prompts: Prompt[] = [];
let attempts: Attempt[] = [];
let draft = emptyDraft();
let filter = '';
let practiceOrder: string[] = [];
let practiceIndex = 0;
let practiceChecked: { answers: string[]; correct: boolean } | null = null;
let lastDeleted: Prompt | null = null;
let storageError = '';
let demoMode = location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]!);
}

function currentRoute(): Route {
  const value = location.hash.slice(1).split('?')[0] ?? '';
  return ['practice', 'print', 'privacy', 'terms'].includes(value) ? value as Route : 'workbench';
}

function storageNamespace(): StorageNamespace {
  return demoMode ? 'demo' : 'real';
}

function pageTitle(route: Route): string {
  if (demoMode) return 'Demo — Context Cloze';
  if (route === 'practice') return 'Practice vocabulary — Context Cloze';
  if (route === 'print') return 'Print practice sheet — Context Cloze';
  return 'Context Cloze — sentence retrieval practice';
}

function icon(name: 'leaf' | 'plus' | 'practice' | 'download' | 'print' | 'edit' | 'trash' | 'undo'): string {
  const paths = {
    leaf: '<path d="M19 3C10 3 5 8 5 15c3-3 6-5 10-6-4 2-7 5-9 9 7 1 13-4 13-15Z"/><path d="M5 21c1-5 4-9 10-12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    practice: '<path d="m5 12 4 4L19 6"/>',
    download: '<path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"/>',
    print: '<path d="M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7z"/>',
    edit: '<path d="m4 20 4-1 11-11-3-3L5 16l-1 4ZM14 7l3 3"/>',
    trash: '<path d="M4 7h16M9 3h6l1 4M7 7l1 14h8l1-14M10 11v6m4-6v6"/>',
    undo: '<path d="M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6"/>'
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">${paths[name]}</svg>`;
}

function shell(content: string): string {
  const route = currentRoute();
  const accuracy = recentAccuracy(attempts);
  return `
    <header class="masthead">
      <div class="brand-block">
        <a href="/" class="brand">CONTEXT<span>//</span>CLOZE</a>
        <p>Typed retrieval from real sentences</p>
      </div>
      <nav aria-label="Primary">
        <a href="/" ${!demoMode && route === 'workbench' ? 'aria-current="page"' : ''}>Workbench <span class="count">${prompts.length}</span></a>
        <a href="/demo" ${demoMode ? 'aria-current="page"' : ''}>Demo</a>
        <a href="#practice" ${route === 'practice' ? 'aria-current="page"' : ''}>Practice ${accuracy === null ? '' : `<span class="count">${accuracy}%</span>`}</a>
      </nav>
      <div class="connection" role="status"><span class="signal" aria-hidden="true"></span><span id="connection-text">${navigator.onLine ? 'Saved on this device' : 'Offline · work stays local'}</span></div>
    </header>
    ${demoMode ? `<aside class="demo-banner" aria-label="Demo mode"><p><strong>Demo — sample data, nothing is saved</strong><span>Changes stay in this separate sample workspace.</span></p><div><button type="button" class="compact-button" id="reset-demo">Reset demo</button><button type="button" class="compact-button" id="start-for-real">Start for real</button></div></aside>` : ''}
    <main id="main" tabindex="-1">${content}</main>
    <footer>
      <p><strong>Context Cloze</strong> stores your sentence bank in this browser.</p>
      <nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav>
      <p class="generated-note">Illustration generated for Context Cloze with the Param Factory image model.</p>
    </footer>
    <div id="route-announcement" class="sr-only" aria-live="polite" aria-atomic="true"></div>
    <div id="toast-region" class="toast-region" aria-live="polite" aria-atomic="true"></div>`;
}

function render(moveFocus = false): void {
  const route = currentRoute();
  const pages: Record<Route, () => string> = {
    workbench: renderWorkbench,
    practice: renderPractice,
    print: renderPrint,
    privacy: renderPrivacy,
    terms: renderTerms
  };
  app.innerHTML = shell(pages[route]());
  document.title = pageTitle(route);
  bindGlobal();
  if (route === 'workbench') bindWorkbench();
  if (route === 'practice') bindPractice();
  if (route === 'print') document.querySelector<HTMLButtonElement>('#print-now')?.focus();
  if (moveFocus) {
    const heading = document.querySelector<HTMLElement>('main h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
    const announcement = document.querySelector('#route-announcement');
    if (announcement) announcement.textContent = heading?.textContent ?? 'Page changed';
  }
}

function renderWorkbench(): string {
  const visible = prompts.filter((prompt) => `${prompt.sentence} ${prompt.note}`.toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
  const preview = draft.sentence ? previewMarkup(draft) : '<span class="preview-placeholder">Your sentence preview will appear here.</span>';
  const isEditing = Boolean(draft.id);
  return `
    <section class="page-intro" aria-labelledby="page-title">
      <div>
        <p class="eyebrow">Sentence practice workbench</p>
        <h1 id="page-title">Build vocabulary practice from real sentences.</h1>
        <p class="page-summary">For vocabulary learners and teachers who need typed recall from meaningful sentence context.</p>
        <div class="intro-actions"><button class="button primary" type="button" id="try-sample">Try it with sample data</button><a class="button secondary" href="#sentence" id="start-authoring">Start with your sentence</a></div>
        <p class="action-help">The sample opens three ready-to-practice prompts in a separate workspace.</p>
        <ul class="plain-facts"><li>Stored only in this browser</li><li>Works offline after the first visit</li><li>Free with no sign-in</li></ul>
      </div>
      ${demoMode && prompts[0]
        ? `<article class="demo-intro-preview" aria-label="First sample prompt" dir="${prompts[0].direction}"><p class="stamped-label">Sample prompt</p><p class="cloze-sentence">${previewMarkup(prompts[0])}</p><p>${escapeHtml(prompts[0].note)}</p></article>`
        : `<div class="intro-stat" aria-label="Sentence bank count"><strong>${String(prompts.length).padStart(2, '0')}</strong><span>prompts<br>on this device</span></div>`}
    </section>
    ${storageError ? `<div class="alert error" role="alert"><strong>Local storage is unavailable.</strong> ${escapeHtml(storageError)} You can still inspect the app, but new work may not persist.</div>` : ''}
    <div class="workbench-grid">
      <section class="author-panel" aria-labelledby="author-title">
        <div class="section-marker"><span>01</span><h2 id="author-title">${isEditing ? 'Edit prompt' : 'Build a prompt'}</h2></div>
        <form id="prompt-form" novalidate>
          <div class="field-group">
            <label for="sentence">Sentence <span>Required</span></label>
            <p id="sentence-help" class="field-help">Paste or type a sentence, then highlight a word or phrase inside it.</p>
            <textarea id="sentence" name="sentence" rows="5" dir="auto" aria-describedby="sentence-help form-error" required>${escapeHtml(draft.sentence)}</textarea>
            <div class="selection-tools">
              <button class="button secondary" type="button" id="mark-blank" ${draft.blanks.length >= 2 ? 'disabled' : ''}>${icon('plus')} Mark selection as blank</button>
              <span>${draft.blanks.length}/2 blanks marked</span>
            </div>
          </div>
          <div class="preview-block" aria-live="polite">
            <span class="stamped-label">Learner preview</span>
            <p id="prompt-preview" dir="auto">${preview}</p>
            ${draft.blanks.length ? `<div class="blank-list">${draft.blanks.map((blank, index) => `<button type="button" class="blank-chip" data-remove-blank="${index}" title="Restore ${escapeHtml(blank.answer)}">${index + 1}. ${escapeHtml(blank.answer)} <span aria-hidden="true">×</span><span class="sr-only">Remove blank</span></button>`).join('')}</div>` : ''}
          </div>
          <div class="field-row">
            <div class="field-group grow">
              <label for="note">Definition or note <span>Optional</span></label>
              <textarea id="note" name="note" rows="3" dir="auto" placeholder="A short definition, hint, translation, or teaching note">${escapeHtml(draft.note)}</textarea>
            </div>
            <div class="field-group direction-field">
              <label for="direction">Text direction</label>
              <select id="direction" name="direction">
                <option value="auto" ${draft.direction === 'auto' ? 'selected' : ''}>Auto</option>
                <option value="ltr" ${draft.direction === 'ltr' ? 'selected' : ''}>Left to right</option>
                <option value="rtl" ${draft.direction === 'rtl' ? 'selected' : ''}>Right to left</option>
              </select>
            </div>
          </div>
          <p id="form-error" class="form-error" role="alert"></p>
          <div class="form-actions">
            <button class="button primary" type="submit">${isEditing ? 'Save changes' : 'Add to sentence bank'}</button>
            ${isEditing ? '<button class="button text-button" id="cancel-edit" type="button">Cancel editing</button>' : '<span class="key-hint">Shortcut: <kbd>Ctrl</kbd> + <kbd>Enter</kbd></span>'}
          </div>
        </form>
      </section>
      <section class="bank-panel" aria-labelledby="bank-title">
        <div class="section-marker"><span>02</span><div><h2 id="bank-title">Sentence bank</h2><p>${demoMode ? 'Sample prompts in a separate demo workspace.' : prompts.length ? 'Reusable, editable, and only on this device.' : 'Your prompts will collect here.'}</p></div></div>
        ${prompts.length ? renderBankTools(visible) : renderEmptyState()}
      </section>
    </div>`;
}

function previewMarkup(value: Pick<Prompt, 'sentence' | 'blanks'>): string {
  return sentenceParts(value).map((part, index) => part.blank
    ? `<mark class="blank-preview" aria-label="Blank ${index + 1}">${'_'.repeat(Math.min(Math.max(part.blank.answer.length, 4), 12))}</mark>`
    : escapeHtml(part.text)).join('');
}

function renderEmptyState(): string {
  return `<div class="empty-state">
    <img src="/assets/hero-concrete-moss.webp" srcset="/assets/hero-concrete-moss-384.webp 384w, /assets/hero-concrete-moss.webp 768w" sizes="(max-width: 680px) calc(100vw - 32px), 50vw" width="768" height="512" alt="Dark word blocks in a concrete groove, with living moss filling two missing spaces" decoding="async" fetchpriority="high">
    <div><p class="stamped-label">No prompts yet</p><h3>Start with one useful sentence.</h3><p>Choose context that makes the missing word recoverable—enough meaning to think, not enough to guess blindly.</p><div class="empty-bank-actions"><a href="#sentence" class="inline-link" id="start-authoring">Write the first prompt <span aria-hidden="true">↗</span></a><label class="compact-button file-button">${icon('plus')} Import backup<input id="import-json" type="file" accept="application/json,.json"></label></div></div>
  </div>`;
}

function renderBankTools(visible: Prompt[]): string {
  return `<div class="bank-tools">
      <label class="search-field" for="search"><span class="sr-only">Search sentence bank</span><input id="search" type="search" placeholder="Search sentences or notes" value="${escapeHtml(filter)}"><span aria-hidden="true">⌕</span></label>
      <div class="export-row" aria-label="Bank actions">
        <button type="button" class="compact-button" id="export-csv">${icon('download')} CSV</button>
        <button type="button" class="compact-button" id="export-json">${icon('download')} Backup</button>
        <label class="compact-button file-button">${icon('plus')} Import<input id="import-json" type="file" accept="application/json,.json"></label>
        <a class="compact-button" href="#print">${icon('print')} Print</a>
      </div>
      <div class="prompt-list" aria-live="polite">
        ${visible.length ? visible.map(renderPromptCard).join('') : `<div class="no-results"><strong>No prompts match “${escapeHtml(filter)}”.</strong><button type="button" class="inline-link" id="clear-search">Clear search</button></div>`}
      </div>
      <a href="#practice" class="button primary practice-all">${icon('practice')} Practice all ${prompts.length}</a>
    </div>`;
}

function renderPromptCard(prompt: Prompt, index: number): string {
  const promptAttempts = attempts.filter((attempt) => attempt.promptId === prompt.id);
  const correct = promptAttempts.filter((attempt) => attempt.correct).length;
  return `<article class="prompt-card">
    <div class="prompt-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</div>
    <div class="prompt-content" dir="${prompt.direction}">
      <p class="cloze-sentence">${previewMarkup(prompt)}</p>
      ${prompt.note ? `<p class="prompt-note">${escapeHtml(prompt.note)}</p>` : ''}
      <p class="prompt-meta" dir="ltr">${prompt.blanks.length} ${prompt.blanks.length === 1 ? 'blank' : 'blanks'} · ${promptAttempts.length ? `${correct}/${promptAttempts.length} correct` : 'not practiced yet'}</p>
    </div>
    <div class="card-actions">
      <button type="button" class="icon-button" data-edit="${prompt.id}">${icon('edit')}<span class="sr-only">Edit prompt</span></button>
      <button type="button" class="icon-button danger" data-delete="${prompt.id}">${icon('trash')}<span class="sr-only">Delete prompt</span></button>
    </div>
  </article>`;
}

function renderPractice(): string {
  if (!prompts.length) {
    return `<section class="practice-empty"><p class="eyebrow">Practice mode</p><h1>No prompts to practice yet.</h1><p>Build at least one sentence prompt, then come back here for typed retrieval.</p><a class="button primary" href="#workbench">Build a prompt</a></section>`;
  }
  ensurePracticeOrder();
  const id = practiceOrder[practiceIndex] ?? practiceOrder[0]!;
  const prompt = prompts.find((item) => item.id === id) ?? prompts[0]!;
  const progress = practiceOrder.length ? Math.round(((practiceIndex + (practiceChecked ? 1 : 0)) / practiceOrder.length) * 100) : 0;
  return `<section class="practice-page" aria-labelledby="practice-title">
    <div class="practice-header">
      <div><p class="eyebrow">Practice mode / ${practiceIndex + 1} of ${practiceOrder.length}</p><h1 id="practice-title">Retrieve the missing ${prompt.blanks.length === 1 ? 'word' : 'words'}.</h1></div>
      <a class="close-practice" href="#workbench">Exit practice <span aria-hidden="true">×</span></a>
    </div>
    <progress class="progress-track" aria-label="Practice progress" value="${progress}" max="100">${progress}%</progress>
    <article class="practice-sheet" dir="${prompt.direction}">
      <span class="stamped-label">Read the whole sentence</span>
      <p class="practice-sentence">${previewMarkup(prompt)}</p>
      ${prompt.note ? `<p class="practice-note"><strong>Context note</strong>${escapeHtml(prompt.note)}</p>` : ''}
      <form id="answer-form" ${practiceChecked ? 'data-checked="true"' : ''}>
        <fieldset ${practiceChecked ? 'disabled' : ''}>
          <legend>Type ${prompt.blanks.length === 1 ? 'the missing answer' : 'each missing answer'}</legend>
          <div class="answer-fields">
            ${prompt.blanks.map((blank, index) => `<div class="field-group"><label for="answer-${index}">Blank ${index + 1}<span class="answer-length">${blank.answer.length} ${blank.answer.length === 1 ? 'character' : 'characters'}</span></label><input id="answer-${index}" name="answer-${index}" type="text" dir="auto" autocomplete="off" autocapitalize="none" spellcheck="false" value="${escapeHtml(practiceChecked?.answers[index] ?? '')}" required></div>`).join('')}
          </div>
        </fieldset>
        ${practiceChecked ? renderFeedback(prompt) : '<p class="answer-guidance">Capitalization and surrounding punctuation do not affect the check.</p>'}
        <div class="practice-actions">
          ${practiceChecked
            ? `<button class="button primary" type="button" id="next-prompt">${practiceIndex + 1 >= practiceOrder.length ? 'See session result' : 'Next prompt'} <span aria-hidden="true">→</span></button>`
            : '<button class="button primary" type="submit">Check answer</button><span class="key-hint"><kbd>Enter</kbd> to check</span>'}
        </div>
      </form>
    </article>
    <p class="practice-privacy">Nothing you type leaves this device.</p>
  </section>`;
}

function renderFeedback(prompt: Prompt): string {
  const checked = practiceChecked!;
  return `<div class="feedback ${checked.correct ? 'correct' : 'incorrect'}" role="status">
    <p class="feedback-title"><span aria-hidden="true">${checked.correct ? '✓' : '↗'}</span><strong>${checked.correct ? 'Retrieved.' : 'Not quite—compare the answer.'}</strong></p>
    <div class="answer-comparison">
      ${prompt.blanks.map((blank, index) => `<p><span>Blank ${index + 1}</span><s>${checked.correct || answersMatch(blank.answer, checked.answers[index] ?? '') ? '' : escapeHtml(checked.answers[index] || 'No answer')}</s><strong>${escapeHtml(blank.answer)}</strong></p>`).join('')}
    </div>
  </div>`;
}

function renderPrint(): string {
  return `<section class="print-page">
    <div class="print-controls"><div><p class="eyebrow">Classroom export</p><h1>Printable practice sheet</h1><p>${prompts.length} ${prompts.length === 1 ? 'prompt' : 'prompts'}, with a separate answer key.</p></div><div><button class="button primary" type="button" id="print-now">${icon('print')} Print sheet</button><a href="#workbench" class="button secondary">Back to workbench</a></div></div>
    ${prompts.length ? `<div class="print-sheet"><header><strong>CONTEXT//CLOZE</strong><span>Name ____________________ &nbsp; Date __________</span></header><ol>${prompts.map((prompt) => `<li dir="${prompt.direction}"><p>${escapeHtml(clozeText(prompt))}</p>${prompt.note ? `<small>${escapeHtml(prompt.note)}</small>` : ''}</li>`).join('')}</ol></div>
    <div class="print-sheet answer-key"><header><strong>ANSWER KEY</strong></header><ol>${prompts.map((prompt) => `<li dir="${prompt.direction}"><p>${escapeHtml(clozeText(prompt, true))}</p><strong>${prompt.blanks.map((blank) => escapeHtml(blank.answer)).join(' · ')}</strong></li>`).join('')}</ol></div>` : '<div class="alert">There are no prompts to print yet.</div>'}
  </section>`;
}

function renderPrivacy(): string {
  return legalPage('Privacy', 'How Context Cloze stores your data.', [
    ['What is stored', 'Sentences, blank answers, notes, and practice results are stored in IndexedDB inside this browser.'],
    ['What is sent', 'Nothing. Context Cloze has no account, analytics, advertising, remote database, or third-party runtime scripts.'],
    ['Your control', 'Use Backup to export a portable JSON copy, CSV for a spreadsheet, or your browser’s site-data controls to erase all local data. Uninstalling or clearing this site’s storage removes the bank from this device.']
  ]);
}

function renderTerms(): string {
  return legalPage('Terms', 'Terms for using Context Cloze.', [
    ['Use', 'Context Cloze is provided free of charge for personal and classroom sentence-retrieval practice. You are responsible for having the right to use the sentences you enter.'],
    ['No warranty', 'The tool is provided as-is. Keep a JSON backup if your sentence bank matters to you; browser storage can be cleared by the device owner or browser.'],
    ['Content', 'The app includes no sentence corpus and does not publish your prompts. Do not rely on answer matching as a substitute for a teacher’s judgment.']
  ]);
}

function legalPage(label: string, heading: string, sections: [string, string][]): string {
  return `<article class="legal-page"><p class="eyebrow">Context Cloze / ${label}</p><h1>${heading}</h1><p class="legal-date">Effective 28 August 2026</p>${sections.map(([title, body]) => `<section><h2>${title}</h2><p>${body}</p></section>`).join('')}<a class="inline-link" href="#workbench">← Return to the workbench</a></article>`;
}

function bindGlobal(): void {
  window.addEventListener('online', updateConnection, { once: true });
  window.addEventListener('offline', updateConnection, { once: true });
  document.querySelector('#print-now')?.addEventListener('click', () => window.print());
  document.querySelector('#reset-demo')?.addEventListener('click', () => { void resetDemo(); });
  document.querySelector('#start-for-real')?.addEventListener('click', () => { void startForReal(); });
}

document.querySelector<HTMLAnchorElement>('.skip-link')?.addEventListener('click', () => {
  let tries = 0;
  const focusMain = () => {
    const main = document.querySelector<HTMLElement>('#main');
    if (main) {
      main.focus();
    } else if (tries++ < 10) {
      setTimeout(focusMain, 20);
    }
  };
  setTimeout(focusMain, 0);
});

function updateConnection(): void {
  const label = document.querySelector('#connection-text');
  if (label) label.textContent = navigator.onLine ? 'Saved on this device' : 'Offline · work stays local';
  document.querySelector('.connection')?.classList.toggle('is-offline', !navigator.onLine);
}

function bindWorkbench(): void {
  const form = document.querySelector<HTMLFormElement>('#prompt-form')!;
  const sentence = document.querySelector<HTMLTextAreaElement>('#sentence')!;
  const note = document.querySelector<HTMLTextAreaElement>('#note')!;
  const direction = document.querySelector<HTMLSelectElement>('#direction')!;
  const error = document.querySelector<HTMLParagraphElement>('#form-error')!;

  sentence.addEventListener('input', () => {
    if (sentence.value !== draft.sentence && draft.blanks.length) {
      draft.blanks = [];
      error.textContent = 'Sentence changed, so the previous blank markers were cleared. Select them again.';
    }
    draft.sentence = sentence.value;
  });
  note.addEventListener('input', () => { draft.note = note.value; });
  direction.addEventListener('change', () => { draft.direction = direction.value as Direction; });
  document.querySelector('#mark-blank')?.addEventListener('click', () => {
    draft.sentence = sentence.value;
    draft.note = note.value;
    draft.direction = direction.value as Direction;
    try {
      draft.blanks = addBlank(draft.blanks, sentence.value, sentence.selectionStart, sentence.selectionEnd);
      render();
      const target = document.querySelector<HTMLTextAreaElement>('#sentence');
      target?.focus();
    } catch (cause) {
      error.textContent = cause instanceof Error ? cause.message : 'Could not mark that selection.';
      sentence.focus();
    }
  });
  document.querySelectorAll<HTMLButtonElement>('[data-remove-blank]').forEach((button) => button.addEventListener('click', () => {
    draft.blanks.splice(Number(button.dataset.removeBlank), 1);
    render();
  }));
  form.addEventListener('submit', saveDraft);
  form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  document.querySelector('#cancel-edit')?.addEventListener('click', () => { draft = emptyDraft(); render(); });
  document.querySelector('#start-authoring')?.addEventListener('click', () => setTimeout(() => sentence.focus(), 0));
  document.querySelector('#try-sample')?.addEventListener('click', () => { void enterDemo(); });
  document.querySelector<HTMLInputElement>('#search')?.addEventListener('input', (event) => {
    filter = (event.target as HTMLInputElement).value;
    const cursor = filter.length;
    render();
    const input = document.querySelector<HTMLInputElement>('#search');
    input?.focus(); input?.setSelectionRange(cursor, cursor);
  });
  document.querySelector('#clear-search')?.addEventListener('click', () => { filter = ''; render(); });
  document.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((button) => button.addEventListener('click', () => editPrompt(button.dataset.edit!)));
  document.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach((button) => button.addEventListener('click', () => removePrompt(button.dataset.delete!)));
  document.querySelector('#export-csv')?.addEventListener('click', () => download('context-cloze-prompts.csv', toCsv(prompts), 'text/csv;charset=utf-8'));
  document.querySelector('#export-json')?.addEventListener('click', exportJson);
  document.querySelector<HTMLInputElement>('#import-json')?.addEventListener('change', importJson);
}

async function saveDraft(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const sentence = String(data.get('sentence') ?? '');
  const error = document.querySelector<HTMLParagraphElement>('#form-error')!;
  if (!sentence.trim()) { error.textContent = 'Enter a sentence before saving.'; return; }
  if (!draft.blanks.length) { error.textContent = 'Select at least one word or phrase and mark it as a blank.'; return; }
  if (sentence !== draft.sentence) { error.textContent = 'The sentence changed. Mark its blank again before saving.'; return; }
  const now = new Date().toISOString();
  const prompt: Prompt = {
    id: draft.id ?? crypto.randomUUID(), sentence, blanks: draft.blanks, note: String(data.get('note') ?? '').trim(),
    direction: String(data.get('direction') ?? 'auto') as Direction, createdAt: draft.createdAt ?? now, updatedAt: now
  };
  const wasEditing = Boolean(draft.id);
  try {
    await putPrompt(prompt, storageNamespace());
    prompts = [prompt, ...prompts.filter((item) => item.id !== prompt.id)];
    draft = emptyDraft();
    render();
    showToast(wasEditing ? 'Prompt updated.' : 'Prompt added to the bank.');
  } catch (cause) {
    error.textContent = cause instanceof Error ? cause.message : 'Could not save this prompt.';
  }
}

function editPrompt(id: string): void {
  const prompt = prompts.find((item) => item.id === id);
  if (!prompt) return;
  draft = { id: prompt.id, sentence: prompt.sentence, blanks: structuredClone(prompt.blanks), note: prompt.note, direction: prompt.direction, createdAt: prompt.createdAt };
  render();
  document.querySelector('#author-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelector<HTMLTextAreaElement>('#sentence')?.focus({ preventScroll: true });
}

async function removePrompt(id: string): Promise<void> {
  const prompt = prompts.find((item) => item.id === id);
  if (!prompt || !confirm(`Delete this prompt?\n\n${clozeText(prompt)}\n\nIts practice history will also be removed.`)) return;
  try {
    await deletePrompt(id, storageNamespace());
    lastDeleted = prompt;
    prompts = prompts.filter((item) => item.id !== id);
    attempts = attempts.filter((attempt) => attempt.promptId !== id);
    render();
    showToast('Prompt deleted.', 'Undo', undoDelete);
  } catch (cause) { showToast(cause instanceof Error ? cause.message : 'Could not delete the prompt.'); }
}

async function undoDelete(): Promise<void> {
  if (!lastDeleted) return;
  await putPrompt(lastDeleted, storageNamespace());
  prompts = [lastDeleted, ...prompts];
  lastDeleted = null;
  render();
  showToast('Prompt restored.');
}

function ensurePracticeOrder(): void {
  const ids = prompts.map((prompt) => prompt.id);
  if (!practiceOrder.length || practiceOrder.some((id) => !ids.includes(id)) || practiceOrder.length !== ids.length) {
    practiceOrder = [...ids].sort(() => Math.random() - 0.5);
    practiceIndex = 0;
    practiceChecked = null;
  }
}

function bindPractice(): void {
  const form = document.querySelector<HTMLFormElement>('#answer-form');
  form?.addEventListener('submit', checkAnswer);
  document.querySelector('#next-prompt')?.addEventListener('click', nextPrompt);
  if (!practiceChecked) document.querySelector<HTMLInputElement>('#answer-0')?.focus();
}

async function checkAnswer(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const prompt = prompts.find((item) => item.id === practiceOrder[practiceIndex]);
  if (!prompt) return;
  const data = new FormData(event.currentTarget as HTMLFormElement);
  const answers = prompt.blanks.map((_, index) => String(data.get(`answer-${index}`) ?? ''));
  const correct = prompt.blanks.every((blank, index) => answersMatch(blank.answer, answers[index] ?? ''));
  const attempt: Attempt = { id: crypto.randomUUID(), promptId: prompt.id, answers, correct, createdAt: new Date().toISOString() };
  try { await putAttempt(attempt, storageNamespace()); attempts.push(attempt); } catch { /* Practice remains usable if storage is blocked. */ }
  practiceChecked = { answers, correct };
  render();
  document.querySelector('.feedback')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function nextPrompt(): void {
  if (practiceIndex + 1 >= practiceOrder.length) {
    const sessionIds = new Set(practiceOrder);
    const sessionAttempts = attempts.filter((attempt) => sessionIds.has(attempt.promptId)).slice(-practiceOrder.length);
    const score = sessionAttempts.filter((attempt) => attempt.correct).length;
    showToast(`Session complete: ${score}/${practiceOrder.length} retrieved.`);
    practiceOrder = [];
    practiceIndex = 0;
    practiceChecked = null;
    location.hash = '#workbench';
    return;
  }
  practiceIndex += 1;
  practiceChecked = null;
  render();
}

function exportJson(): void {
  const backup: Backup = { version: 1, exportedAt: new Date().toISOString(), prompts, attempts };
  download('context-cloze-backup.json', JSON.stringify(backup, null, 2), 'application/json');
}

async function importJson(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    let candidate: unknown;
    try {
      candidate = JSON.parse(await file.text());
    } catch {
      throw new Error('This file is not valid JSON. Choose a Context Cloze backup JSON file and try again.');
    }
    if (!isBackup(candidate)) throw new Error('Choose a Context Cloze backup JSON file with prompts and practice results.');
    if (!confirm(`Replace this device’s bank with ${candidate.prompts.length} imported prompts?`)) return;
    await replaceBackup(candidate, storageNamespace());
    prompts = candidate.prompts;
    attempts = candidate.attempts;
    draft = emptyDraft();
    render();
    showToast(`Imported ${prompts.length} prompts.`);
  } catch (cause) { showToast(cause instanceof Error ? cause.message : 'Could not import that file.'); }
  finally { input.value = ''; }
}

function download(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`${filename} exported.`);
}

function showToast(message: string, action?: string, handler?: () => void): void {
  const region = document.querySelector<HTMLDivElement>('#toast-region');
  if (!region) return;
  region.innerHTML = `<div class="toast"><span>${escapeHtml(message)}</span>${action ? `<button type="button">${escapeHtml(action)}</button>` : ''}</div>`;
  if (action && handler) region.querySelector('button')?.addEventListener('click', handler);
  setTimeout(() => { if (region.isConnected) region.innerHTML = ''; }, 6000);
}

async function loadWorkspace(): Promise<void> {
  ({ prompts, attempts } = await loadAll(storageNamespace()));
}

async function resetDemo(announce = true): Promise<void> {
  await replaceBackup(structuredClone(SAMPLE_BACKUP), 'demo');
  await loadWorkspace();
  draft = emptyDraft();
  practiceOrder = [];
  practiceIndex = 0;
  practiceChecked = null;
  render();
  if (announce) showToast('Demo reset to three sample prompts.');
}

async function enterDemo(): Promise<void> {
  if (!demoMode) {
    history.pushState({ demo: true }, '', '/demo');
    demoMode = true;
  }
  try {
    await loadWorkspace();
    if (!prompts.length) await resetDemo(false);
    else render(true);
  } catch (cause) {
    storageError = cause instanceof Error ? cause.message : 'The sample workspace could not open.';
    render(true);
  }
}

async function startForReal(): Promise<void> {
  try {
    await replaceBackup({ version: 1, exportedAt: new Date().toISOString(), prompts: [], attempts: [] }, 'demo');
    demoMode = false;
    history.pushState({}, '', '/');
    await loadWorkspace();
    draft = emptyDraft();
    practiceOrder = [];
    practiceIndex = 0;
    practiceChecked = null;
    render(true);
    showToast('You are using your own empty sentence bank.');
  } catch (cause) {
    storageError = cause instanceof Error ? cause.message : 'Could not open your sentence bank.';
    render(true);
  }
}

window.addEventListener('hashchange', () => {
  if (location.hash === '#main') return;
  practiceChecked = null;
  render(true);
});
window.addEventListener('popstate', () => {
  const shouldUseDemo = location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
  if (shouldUseDemo !== demoMode) {
    demoMode = shouldUseDemo;
    if (demoMode) {
      void enterDemo();
    } else {
      void loadWorkspace().then(() => {
        draft = emptyDraft();
        practiceOrder = [];
        practiceIndex = 0;
        practiceChecked = null;
        render(true);
      }).catch((cause) => {
        storageError = cause instanceof Error ? cause.message : 'Could not open your sentence bank.';
        render(true);
      });
    }
    return;
  }
  render(true);
});
window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);

async function boot(): Promise<void> {
  try {
    await loadWorkspace();
    if (demoMode && !prompts.length) await resetDemo(false);
  } catch (cause) {
    storageError = cause instanceof Error ? cause.message : 'The browser refused access to local storage.';
  }
  render();
  registerServiceWorker();
}

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const hadController = Boolean(navigator.serviceWorker.controller);
    const registration = await navigator.serviceWorker.register('/sw.js');
    if (registration.waiting) offerUpdate(registration);
    registration.addEventListener('updatefound', () => {
      registration.installing?.addEventListener('statechange', () => {
        if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration);
      });
    });
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !refreshing) { refreshing = true; location.reload(); }
    });
  } catch { /* The app still works without installability. */ }
}

function offerUpdate(registration: ServiceWorkerRegistration): void {
  showToast('A new version is ready.', 'Update', () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' }));
}

boot();

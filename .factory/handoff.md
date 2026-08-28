# Context Cloze handoff

## Shipped

Context Cloze v1 is a finished static, offline-first PWA for building and practicing context-rich typed vocabulary prompts. Authors can paste any Unicode sentence, select one or two non-overlapping blanks without markup, attach a note, set automatic/LTR/RTL direction, edit and search a durable local bank, and confirm or undo deletion. Learners get a shuffled prompt session, one input per blank, normalized case/punctuation-aware checking, answer comparison, persisted attempts, and recent accuracy.

The bank supports CSV export, complete JSON backup/import, and a printable learner sheet plus answer key. Empty, no-results, validation, storage-error, offline, correct/incorrect, update-available, and practice-complete states are implemented. Data stays in IndexedDB; there is no backend, telemetry, account, or third-party runtime request. Privacy and terms are available at `#privacy` and `#terms`.

The custom brutalist concrete-and-moss visual system is documented in `.factory/design.md`. Its original generated empty-state illustration was reviewed for text, brand, anatomy, and seam artifacts; source prompt/provenance live in `assets/src/`, and the shipped responsive WebP files are 68 KB and 12 KB.

## Run and deploy

```bash
npm install
npm test
npm run build
npm run test:e2e
```

The work-order build command is exactly `npm run build`. Static output lands in `dist/`, with `dist/index.html` at its root. Deploy only `dist/`; HTTPS is required for installed service workers outside localhost.

## Verification — 2026-08-28

- `npm test`: 7/7 Vitest tests passed.
- `npm run build`: passed with TypeScript strict checks; Vite 7.3.6 emitted `dist/`.
- Production bundle: 26.58 KB JS / 9.41 KB gzip; 18.01 KB CSS / 4.65 KB gzip; no webfont payload; initial Lighthouse transfer 85 KiB.
- `npm run test:e2e`: 6/6 Playwright tests passed across desktop Chromium and a 390 × 844 Chromium mobile viewport. Covered authoring by textarea selection, IndexedDB persistence after reload, typed practice, serious/critical axe scan, and explicit `context.setOffline(true)` reload.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ …`: HTTP 200; title and `lang="en"`; exactly one `<h1>`; `<main>` present; zero missing image alt attributes; zero unlabeled buttons; zero page/console errors.
- Lighthouse 12.8.2, simulated mobile against the production preview: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.7 s, CLS 0, TBT 0 ms. INP is not produced for a no-interaction lab run; the Playwright author/practice flow supplies the interaction smoke test.
- `npm audit --audit-level=high`: zero vulnerabilities.
- Manual visual review completed at 1500 px desktop and 390 px mobile. Focus styling, 44 px controls, print pagination, reduced motion, and visible offline state are encoded in CSS.

## Known boundaries

- Answer checking intentionally allows case differences, surrounding punctuation, and repeated whitespace, but otherwise expects the authored answer. There are no synonym lists or fuzzy/AI grading.
- Data is per-browser and per-origin. JSON backup/import is the portability path; automatic multi-device sync is intentionally absent to preserve privacy and offline use.
- No copyrighted sentence corpus or prompt generation is bundled. Users must provide sentences they have the right to use.
- Browser storage can be removed by browser/device cleanup. The UI and terms direct users to make JSON backups for important banks.

## Next steps

After pilot use, measure whether authors reach 20 prompts and return after seven days using consented, aggregate research outside this no-analytics app. If exact matching proves too strict, add author-defined accepted alternatives before considering any fuzzy grading.

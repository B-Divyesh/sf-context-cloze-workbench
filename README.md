# Context Cloze

Context Cloze is a private, offline-first sentence workbench for vocabulary learners and teachers. It turns one or two selected words in a meaningful sentence into a typed-retrieval prompt—without flashcard syntax, accounts, or a bundled corpus.

Live site: <https://context-cloze-workbench.sociobot.in>

## What it does

- Authors a reusable bank from user-provided sentences, with one or two blanks and an optional definition, hint, or translation.
- Supports Unicode, `dir="auto"`, and explicit right-to-left prompts.
- Runs shuffled typed-answer practice with Unicode-aware normalization and persistent attempt history.
- Searches, edits, and safely deletes prompts, with immediate undo.
- Exports spreadsheet-friendly CSV, portable JSON backups, and print-ready worksheets with separate answer keys.
- Stores everything in browser IndexedDB and works after a first visit without a network connection.
- Installs as a PWA; there are no runtime CDNs, analytics, accounts, or remote student-text collection.

## Use it

1. Type or paste a sentence.
2. Select a word or phrase in the sentence field with a pointer or `Shift` + arrow keys, then choose **Mark selection as blank**. Repeat once if the prompt needs two blanks.
3. Add an optional note and save the prompt. `Ctrl`/`Cmd` + `Enter` also saves.
4. Open **Practice**, type each missing answer, and check it.
5. Use **Backup** regularly if the bank matters to you. Clearing browser site data also clears the local bank.

## Develop and verify

Requires Node.js 20.19+ and npm.

```bash
npm install
npm run dev
npm test
npm run build
npm run test:e2e
```

`npm test` runs the core behavior tests. `npm run test:e2e` starts the production preview and exercises authoring, IndexedDB persistence, practice, accessibility, desktop/mobile layouts, and a service-worker-backed offline reload in Playwright 1.58.2. The build command is exactly `npm run build`; deploy the generated `dist/` directory, whose root contains `index.html`.

## Architecture

The app is Vite + strict vanilla TypeScript. `src/core.ts` contains pure cloze, answer, backup, and CSV logic; `src/storage.ts` owns IndexedDB; `src/main.ts` renders and binds the hash-routed app. `public/sw.js` precaches the production shell and runtime assets. There is no backend.

The researched opportunity is in [`.factory/brief.json`](.factory/brief.json), the brutalist concrete-and-moss visual system and generated-image provenance are in [`.factory/design.md`](.factory/design.md), and verification details are in [`.factory/handoff.md`](.factory/handoff.md).

## Privacy and license

The in-app `#privacy` and `#terms` routes explain local storage and user responsibility for sentence rights. Context Cloze is released under the [MIT License](LICENSE).

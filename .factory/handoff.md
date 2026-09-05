# Context Cloze handoff — PASS

## Release

The deployed implementation is `eb4cac63ad3dcfb783d9eb4385baa5ea6c86aa6f` (`fix: declare PWA manifest MIME type`). Its functional repair commit is `0e70d2bdd4e9721036341ccb2fd6e74430329769` (`fix: add isolated demo and release-safe PWA`). The live product is https://context-cloze-workbench.sociobot.in.

Context Cloze is for vocabulary learners and teachers who need typed recall from meaningful sentences. The first action is **Try it with sample data**.

## What changed

- Added `/demo` and the first-screen **Try it with sample data** action. It seeds three original sample prompts in `context-cloze-demo` IndexedDB, separate from the `context-cloze-real` bank. The persistent banner, **Reset demo**, and **Start for real** are live.
- Added the required `.factory/claims.json`, eight outcome-based browser claims, and `.factory/demo.md`. Every claim runs from a clean browser context through the real demo URL.
- Added an empty-bank **Import backup** action, so a backup can restore into a fresh real bank. Invalid JSON now says to choose a valid Context Cloze backup JSON file instead of showing a parser exception.
- Versioned service-worker cache namespaces and the manifest start URL from the release SHA. The build regression test proves two release IDs emit different cache namespaces.
- Added `staticwebapp.config.json` to the generated `dist/`: immutable caching for hashed assets, no-cache service worker and manifest, CSP, Permissions-Policy, manifest MIME mapping, `/demo` rewrite, and a designed 404 response.
- Added route metadata, social image, standard legal-page navigation, skip-link focus behavior, route titles, and a responsive social crop from the existing original product art.
- Recorded the plain-words audit and a verb-first catalog description. The catalog description was copied to `/work/.evidence/catalog-description.txt`.

## Run and verify

```bash
npm ci
npm test
npm run build
npm run test:e2e
```

Run every declared claim command printed by:

```bash
node -e "for (const claim of require('./.factory/claims.json')) console.log(claim.test)"
```

## Verification performed

- Clean setup: `npm ci` passed with zero high-severity audit findings.
- Unit/release tests: `npm test` passed, 8 tests. This includes the release-output cache-version regression.
- Build: `npm run build` passed. Final emitted JS is 30.91 KB (10.70 KB gzip); CSS is 19.74 KB (4.95 KB gzip); initial Lighthouse transfer was 124,872 bytes.
- Browser suite: `npm run test:e2e` passed, 22 tests across desktop Chromium and 390 × 844 Chromium mobile. It covers authoring, persistence, practice, demo isolation/reset/exit, CSV, JSON restore into an empty bank, print, invalid import recovery, keyboard skip focus, populated-practice axe scan, privacy requests, and offline reload.
- Every one of the eight documented claim commands passed after the final implementation build.
- Accessibility: Playwright axe integration found no serious or critical issues on the empty workbench and populated demo practice. The URL checker found one title, `lang=en`, one h1, a main landmark, labelled controls, image alt text, and no console errors. `@axe-core/cli` could not run in this worker because its bundled ChromeDriver only supports Chrome 152 while the supplied browser is Chrome 145; the Playwright axe integration is the applicable substitute.
- Static Web Apps local runtime confirmed CSP and Permissions-Policy, immutable hashed-asset caching, no-cache `/sw.js`, manifest MIME type, `/demo`, and the designed HTTP 404.
- Lighthouse 12.8.2 against that runtime: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.65 s, CLS 0, TBT 0 ms.
- Live HTTPS after deployment: `verify-url.sh` passed without console errors. Live `index.html`, JS, CSS, service worker, and manifest match `dist` byte-for-byte. The manifest is `application/manifest+json`; hashed JS is `public, max-age=31536000, immutable`; the designed unknown route returns HTTP 404.
- Fresh live desktop and phone contexts confirmed the exact job, audience, and first action before scrolling. The demo shows its banner, visible sample preview, and three prompts; reset retains three sample prompts; Start for real returns to an empty real bank. The phone layout is 390 px wide with no horizontal overflow. A separate fresh live context reloaded `/demo` offline after service-worker activation and showed both the demo banner and offline label.

## Earlier verification disposition

The 2026-08-28 FAIL report remains historical evidence. Its claims-file, one-click demo, fixed-cache, non-immutable-cache, raw-import-error, missing-header, manifest-MIME, and first-read audience findings are all repaired and evidenced above. The byte-match identity check now applies to implementation `eb4cac6`, not the old `770da5a` candidate.

## Boundaries and next steps

- The brief is free. There is no paid offer, checkout, billing registration, backend, account, or external provider dependency.
- Data remains per browser and origin. JSON backup is the portability path; clearing site data removes the bank.
- Exact answer checking accepts case, surrounding punctuation, and repeated whitespace. It does not accept synonyms or grade essays.
- The pre-existing untracked `graphify-out/` changes were preserved and were not included in product commits.

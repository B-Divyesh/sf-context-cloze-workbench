# Build vocabulary practice from real sentences — verification 2

## Verdict

**FAIL — 4 findings, including 4 public claims without declared claim tests.**

Verified on 5 September 2026 against implementation candidate `eb4cac63ad3dcfb783d9eb4385baa5ea6c86aa6f`, documentation commit `660c837f4fd1c64f2a0c58fbd8e347aa786dcea2`, and https://context-cloze-workbench.sociobot.in. Current repository commit `7048b795fc74918686185f8d432b6c1077fc6f72` changes only Graphify output after the documentation commit.

The product works end to end, and every declared claim passes. It does not meet the zero-finding release rule because the public-claim list, touch targets, landing structure, and route structure remain incomplete.

## First screen before scrolling

- **Job:** Build vocabulary practice from real sentences.
- **Audience:** Vocabulary learners and teachers who need typed recall from meaningful sentence context.
- **First action:** Try it with sample data.

All three appear before scrolling at 1440 × 900 and 390 × 844. The three privacy/offline/price facts also fit in the initial phone viewport. There is no horizontal overflow.

## Findings

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| V2-1 | High | The claims inventory omits four public promises, so no declared `@claim:` command proves each one. | README says authors can select **one or two** words and that `Ctrl`/`Cmd` + `Enter` saves. A populated live bank says prompts are **editable**. README and Privacy say clearing site data removes the bank. `.factory/claims.json` has no corresponding claim entries. The two-blank limit has a unit test, and independent live checks found all four behaviors working, but the claims contract requires each public promise to have its own listed, tagged outcome test. Untested claim count under that contract: 4. |
| V2-2 | Medium | Several live interactive targets are smaller than the required 44 × 44 CSS px. | At 390 px, the two blank-removal chips measured 106 × 36 and 97 × 36. The wordmark home link measured 169 × 23. The footer Terms link measured 38 × 44. The nested invisible file input was excluded from this finding. |
| V2-3 | Medium | The required landing skeleton and footer handoff details are incomplete. | The landing page goes from the first screen directly into the workbench. It has no three-step **How it works** section and no **What it does not do / privacy** section. The app footer omits “Built by Param Factory” and a version/build ID; legal and 404 footers also omit the version/build ID. |
| V2-4 | Low | Practice and Print use hash routes for page-level states, and Demo keeps the home canonical URL. | Live links resolve to `/demo#practice` and `/demo#print`; each replaces the main page, changes the h1, and changes the title, so these are not in-page anchors. The site-structure contract requires real URLs for real places and reserves hashes for in-page anchors. `/demo` sets `Demo — Context Cloze` but its canonical remains `/`. Back/forward and route focus still worked. |

## Declared claim results

Every command was run separately from a clean detached worktree after `npm ci`.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-sandbox` | Pass | Three sample prompts, visible preview and persistent demo label; delete → 2, reset → 3, reload → 3; Start for real restored the untouched real prompt. |
| `author-practice` | Pass | A selected word became a prompt, survived reload, and accepted the normalized typed answer. |
| `offline-reload` | Pass | A dedicated context reloaded `/demo` offline with three prompts and the offline label. |
| `csv-export` | Pass | CSV had the declared header and one row per sample prompt. |
| `json-backup` | Pass | The downloaded demo backup restored all three prompts into an empty real bank. |
| `print-sheet` | Pass | Print view showed the worksheet and separate answer key. |
| `local-data` | Pass | Typed practice generated only same-origin requests and exposed no sign-in control. |
| `free-core` | Pass | Sample practice completed with no payment or checkout control. |

The complete Playwright suite also passed: 22/22 across desktop Chromium and 390 × 844 mobile Chromium.

## Functional, boundary, and recovery checks

- The sample is realistic and populated on entry: a field notebook, thermometer, and context-inference prompt, each with a note.
- The demo label remains present during practice. Reset restores the seed. Leaving the demo clears its changes and does not change real data.
- Empty save, empty selection, malformed JSON, wrong-shaped JSON, incorrect practice answers, no-result search, cancelled deletion, undo, and empty-bank return paths recover with clear controls or messages.
- Two non-overlapping blanks reach `2/2` and disable further marking. Unicode Arabic content saves with `dir="rtl"`.
- `Ctrl` + `Enter`, editing, search clearing, deletion cancellation, undo, persistence, and local-data clearing all worked in independent live checks.
- CSV, JSON, Print, answer checking, punctuation/case normalization, and reload persistence also passed the automated suites.
- This is a static PWA. Backend tenant isolation, server restart persistence, health endpoints, and 429/`Retry-After` checks do not apply.
- Automatic vocabulary generation is an explicit non-goal in the brief, so an AI feature is not missed leverage.

## Accessibility, privacy, and responsive checks

- `verify-url.sh` passed: title, `lang=en`, one h1, main landmark, labelled buttons, image alt text, and no unexpected console errors.
- Playwright axe-core scans found zero violations on the empty workbench, populated desktop and phone practice, Demo, Privacy, Terms, and the designed 404.
- The standalone axe CLI could not start its own Chrome binary in this worker. The pinned Playwright 1.58.2 Chromium and axe-core 4.10.3 integration supplied the equivalent rendered-page scan.
- Tab first reaches the skip link. Its visible focus outline is 3 px ochre with a 3 px offset. Enter focuses `main`. Practice navigation focuses its h1.
- Reduced motion computes a near-zero transition duration and `scroll-behavior: auto`.
- No live runtime request left `context-cloze-workbench.sociobot.in`. CSP blocked an attempted inline axe injection as expected; test-only CSP bypass was then used for the scans.
- The designed unknown route returns HTTP 404 with one h1, navigation back, and no axe violation. The expected browser 404 resource message is not a defect.

## PWA, deployment, and performance

- A fresh live `/demo` context activated the service worker, went offline, reloaded, and retained the shell, sample label, and three prompts.
- A local two-release check proved the update path: the second worker reached `waiting`, showed **A new version is ready**, activated from **Update**, and left only the second versioned cache.
- Live CSP, Permissions-Policy, Referrer-Policy, nosniff, frame denial, manifest MIME type, no-cache service worker, and immutable hashed-asset caching are present.
- Candidate and live `index.html`, JS, and CSS match byte for byte. Live `sw.js` and manifest differ only in the generated release token: live uses `7048b795fc74`; the candidate build uses `eb4cac63ad3d`. The later commit contains Graphify/report changes and no product implementation change, so this is not a product-image mismatch.
- Clean build output: JS 30.91 KB raw / 10.70 KB gzip; CSS 19.74 KB raw / 4.95 KB gzip. `dist/` is present.
- Live mobile Lighthouse 12.8.2: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.28 s, CLS 0, TBT 0 ms, transfer 88,279 bytes.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Missing claims file | Fixed for the eight listed claims; V2-1 records newly found omissions in the inventory. |
| No one-click sample and unclear audience | Fixed. The full first read and demo are visible on desktop and phone. |
| Fixed service-worker cache name | Fixed. Release IDs differ and the waiting-worker update flow passes. |
| Hashed assets not immutable | Fixed. Live assets return one-year immutable caching. |
| Raw JSON parser error | Fixed. Both malformed and wrong-shaped files produce clear recovery text. |
| Missing CSP and Permissions-Policy | Fixed. Both are live and CSP enforcement was observed. |
| Wrong manifest MIME type | Fixed. Live response is `application/manifest+json`. |

## Commands used

```bash
npm ci
npm test
npm run build
npm run test:e2e
# Then every test command from .factory/claims.json, one at a time.
VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh https://context-cloze-workbench.sociobot.in/ <evidence-dir>
npx lighthouse@12.8.2 https://context-cloze-workbench.sociobot.in/ ...
```

Product code was not changed during this verification.

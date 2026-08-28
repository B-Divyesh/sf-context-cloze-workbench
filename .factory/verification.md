# Independent verification — FAIL

**Verified 2026-08-28** against commit `770da5a2c9ca66d50727154ea2e078ec0fa8fa1b` and https://context-cloze-workbench.sociobot.in/. This is an independent verifier report; product source was not changed.

## Release decision

**FAIL — do not release this candidate.** The two explicit preflight gates below fail, regardless of the otherwise healthy authoring and practice flow.

| Severity | Finding | Evidence |
| --- | --- | --- |
| Blocker | Required claims contract is missing. | A fresh detached clone of the requested commit contains no `.factory/claims.json`. Per the work order, this makes the claims test impossible to run through the demo entry point and is itself release-blocking. |
| Blocker | No one-click “try it with sample data” demo. | Cold desktop and 390 px live-page reads show only blank authoring controls, “Write the first prompt”, and an empty sentence bank. There is no sample-data/demo control or preloaded example. The screen explains sentence typed-retrieval reasonably clearly, but does not explicitly identify vocabulary learners/teachers in plain words either. The supplied acceptance rule says absence of the one-click demo is a FAIL. |
| High | PWA cache is never versioned per build/release, so the required service-worker update path is not reliable across deployments. | Candidate and live `/sw.js` are identical and hard-code `const CACHE_NAME = 'context-cloze-v1'`; it is not derived from a build/release value. An app-only release can therefore retain the same cache namespace and cannot cause the registered worker to enter `waiting`, which is the only condition that displays the in-app update action. |
| High | Hashed production assets are not served with long-lived immutable caching. | Live `/assets/index-BwEfu4Sp.js` and `/assets/index-CaZsXVbA.css` both return `Cache-Control: public, must-revalidate, max-age=30`, rather than immutable cache headers. This misses the static/PWA caching contract and wastes repeat-load performance. |
| Medium | Invalid JSON import surfaces a raw parser exception rather than a plain-language recovery message. | Uploading `{broken` displays `Expected property name or '}' in JSON at position 1 (line 1 column 2)`. It does not explain that a Context Cloze backup JSON file is required or what the user should do next. |
| Low | Deployment response policy is incomplete for a user-data app. | Live responses include HSTS, `Referrer-Policy`, and `X-Content-Type-Options`, but no `Content-Security-Policy` or `Permissions-Policy`; `manifest.webmanifest` is sent as `application/octet-stream`. No exploit was demonstrated. |

## Required preflight and cold first read

I created a fresh detached clone at the requested SHA, before installing dependencies. The claims preflight reported:

```
RELEASE BLOCKER: .factory/claims.json is absent; no mandated claims test can be run via the demo entry point.
```

Cold live-page result, with a new browser context and no existing storage:

- It appears to be a private browser workbench for turning a sentence into one or two typed fill-in-the-blank prompts and then practising answers.
- It is not plainly addressed to the brief’s vocabulary learners and teachers on the first screen.
- The first actionable path is manual sentence entry/selection. There is no “try it with sample data” path, so a visitor cannot evaluate the product in one click.

## What passed

- Clean-install: `npm ci` completed with 0 audited vulnerabilities.
- Unit tests: `npm test` passed, 7/7 Vitest tests.
- Type check and exact production build: `npm run build` passed and produced `dist/`.
- Browser suite: `npm run test:e2e` passed, 6/6 Chromium desktop/mobile tests.
- Factory URL checker against the production preview: HTTP 200; title, `lang=en`, one `h1`, `main`, image alt text and labelled buttons present; no console/page errors.
- Independent functional exercise: empty-submit and empty-selection validation/recovery; a Unicode two-blank sentence; note and direction selection; persistence; CSV and JSON download; search/no-results/clear recovery; incorrect and punctuation/case-normalized correct practice; deletion/undo; printable worksheet/answer-key rendering. CSV correctly quoted sentence, cloze, answers, note, direction and timestamps.
- Accessibility: axe serious/critical findings were zero on the live workbench, `/privacy/`, and `/terms/`, plus the populated practice state locally. Keyboard Tab reached the skip link with a visible `rgb(115, 84, 14) solid 3px` focus outline; Enter moved focus to `#main`. Reduced-motion computed transition duration was `1e-05s`.
- Responsive review: 390 × 844 live page had `scrollWidth === innerWidth === 390`; visible buttons were 48 px high. Desktop and mobile screenshots were visually reviewed.
- Privacy/network: browser-observed runtime requests were same-origin only; no analytics, CDN font, account, or API request was made. The app stores the tested data locally and exposes privacy and terms pages. This static deployment has no server-side/API endpoint, so rate-limit and sign-in checks are not applicable.
- PWA offline baseline: after first live load and service-worker activation, `context.setOffline(true)` plus reload retained the application shell and displayed `Offline · work stays local`; no errors occurred.
- Deployment identity: SHA-256 comparisons of live `index.html`, JS, CSS, and `sw.js` exactly matched this commit’s `dist/` output.
- Performance: emitted JS is 26.58 KB (9.42 KB gzip), CSS 18.01 KB (4.65 KB gzip), with no downloaded webfont. Lighthouse 12.8.2 against production preview: Performance 90, Accessibility 100, Best Practices 100, SEO 100; LCP 1.7 s, CLS 0, TBT 390 ms, transfer 85 KiB.

## Reproduce

```bash
npm ci
npm test
npm run build
npm run test:e2e
npm run preview -- --port 4173
VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ /tmp/context-cloze-evidence
```

Then inspect the live site in a fresh browser profile, exercise authoring/practice/export/offline as above, and compare live files against `dist/`.

## Required next steps

1. Add `.factory/claims.json` and make every listed claim executable from the real demo entry point.
2. Add a clearly labelled, one-click “Try sample data” control that creates or loads a non-copyrighted illustrative sentence prompt, and explicitly name the intended learners/teachers in the first-read copy.
3. Generate a distinct service-worker cache version on each release/build and verify that a deployed update exposes the update toast and activates safely.
4. Configure immutable long-lived caching for hashed assets; add CSP/Permissions-Policy and correct manifest MIME type at deployment.
5. Replace raw import parser errors with a helpful validation message and retest the release gates.

# Context Cloze handoff — verification 2 FAIL

## Release reviewed

- Implementation candidate: `eb4cac63ad3dcfb783d9eb4385baa5ea6c86aa6f`
- Documentation commit: `660c837f4fd1c64f2a0c58fbd8e347aa786dcea2`
- Current repository/live build token: `7048b795fc74918686185f8d432b6c1077fc6f72` (later Graphify-only commit)
- Live URL: https://context-cloze-workbench.sociobot.in

The job is to build typed vocabulary practice from real sentences for learners and teachers. The first action is **Try it with sample data**.

## Verification result

**FAIL — 4 findings and 4 public claims without declared claim tests.** See [verification-2.md](verification-2.md).

The core product, demo isolation, all eight declared claims, offline reload, update activation, imports, exports, print view, keyboard flow, RTL content, legal pages, and designed 404 work. Clean install, 8 unit/release tests, build, all 22 browser tests, all eight individual claim commands, live axe scans, URL checks, and Lighthouse completed successfully.

Live Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100. LCP was 1.28 s, CLS 0, TBT 0 ms, and transfer 88,279 bytes.

## Findings to resolve

1. Add listed, tagged outcome claims for one/two blank authoring, keyboard save, editing, and clearing local data.
2. Raise all interactive targets to at least 44 × 44 CSS px, including the wordmark link, blank-removal chips, and short footer links.
3. Add the required three-step How it works and privacy/non-goals sections. Add Param Factory and version/build details to every footer.
4. Give Practice and Print real URLs instead of hash page routes, and give Demo route-specific canonical metadata.

## Run and verify

```bash
npm ci
npm test
npm run build
npm run test:e2e
node -e "for (const claim of require('./.factory/claims.json')) console.log(claim.test)"
```

Run each printed claim command separately. Product code was not modified by verification 2. The pre-existing `graphify-out/` working-tree changes remain untouched.

# Context Cloze

Context Cloze helps vocabulary learners and teachers make typed practice from meaningful sentences. Select one or two words in a sentence, then ask learners to retrieve them from context.

Live site: <https://context-cloze-workbench.sociobot.in> · Demo: <https://context-cloze-workbench.sociobot.in/demo>

## Start with the sample

Select **Try it with sample data**. It opens three ready-to-practice prompts in a separate demo workspace. The banner labels the sample, **Reset demo** restores it, and **Start for real** returns to a separate personal bank.

## What is verified

- Creates and checks typed prompts from selected sentence text.
- Works offline after the first visit.
- Exports the sentence bank as CSV.
- Exports and restores a JSON sentence-bank backup.
- Shows a printable practice sheet and answer key.
- Keeps sentence and practice data on this device with no sign-in.
- Lets visitors use sample practice free with no sign-in.

Each statement above has an outcome-based browser test in [`.factory/claims.json`](.factory/claims.json). The demo sample and its isolated storage are documented in [`.factory/demo.md`](.factory/demo.md).

## Use your own bank

1. Type or paste a sentence.
2. Select a word or phrase, then choose **Mark selection as blank**. A prompt has one or two blanks.
3. Add an optional note and save the prompt. `Ctrl`/`Cmd` + `Enter` also saves.
4. Open **Practice**, type each answer, and choose **Check answer**.
5. Use **CSV**, **Backup**, **Import**, or **Print** from the sentence bank as needed.

Important banks should have a JSON backup. Clearing browser site data also removes the bank from that browser.

## Develop and verify

Requires Node.js 20.19+ and npm.

```bash
npm ci
npm test
npm run build
npm run test:e2e
```

Run every public claim from a clean setup:

```bash
node -e "for (const claim of require('./.factory/claims.json')) console.log(claim.test)"
# Run each printed command.
```

`npm run build` writes the deployable static site to `dist/`, with `index.html` at its root. The release build writes a cache namespace and manifest start URL from the current release SHA, and copies `staticwebapp.config.json` into `dist/` for PWA caching, headers, routes, and the designed 404 page.

## Privacy and license

Context Cloze has no backend. The [Privacy page](https://context-cloze-workbench.sociobot.in/privacy/) and [Terms page](https://context-cloze-workbench.sociobot.in/terms/) explain local browser storage and sentence-rights responsibilities. It is released under the [MIT License](LICENSE).

The researched scope is in [`.factory/brief.json`](.factory/brief.json). The product-specific visual system and generated-image provenance are in [`.factory/design.md`](.factory/design.md).

import { expect, test, type Page } from '@playwright/test';

async function addPrompt(page: Page, sentenceText: string, answer: string): Promise<void> {
  const sentence = page.getByLabel('Sentence Required');
  await sentence.fill(sentenceText);
  const start = sentenceText.indexOf(answer);
  await sentence.evaluate((element, selection) => {
    const textarea = element as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(selection.start, selection.end);
  }, { start, end: start + answer.length });
  await page.getByRole('button', { name: 'Mark selection as blank' }).click();
  await page.getByRole('button', { name: 'Add to sentence bank' }).click();
}

test('@claim:demo-sandbox loads sample prompts without changing the real bank', async ({ page }) => {
  await page.goto('/');
  await addPrompt(page, 'Real work remains separate from the sample.', 'separate');
  await expect(page.getByText('Real work remains')).toBeVisible();

  await page.getByRole('button', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.demo-intro-preview')).toBeVisible();
  await expect(page.locator('.demo-intro-preview').getByText('A written record of observations made outdoors.')).toBeVisible();
  await expect(page.locator('.prompt-card')).toHaveCount(3);

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('.prompt-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Real work remains')).toBeVisible();
  await expect(page.getByText('field notebook', { exact: true })).toHaveCount(0);
});

test('@claim:csv-export downloads one CSV row for every sample prompt', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.locator('.prompt-card')).toHaveCount(3);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /CSV/ }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString('utf8');
  expect(text.split(/\r?\n/)).toHaveLength(4);
  expect(text).toContain('"sentence","cloze","answers","note","direction","created_at","updated_at"');
  expect(text).toContain('"A {{field notebook}} helps a gardener notice changes after rain."');
});

test('@claim:json-backup restores a downloaded sentence bank', async ({ page }) => {
  await page.goto('/demo');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Backup/ }).click();
  const backup = await downloadPromise;
  const stream = await backup.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));

  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page.locator('.prompt-card')).toHaveCount(0);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#import-json').setInputFiles({
    name: 'context-cloze-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.concat(chunks)
  });
  await expect(page.locator('.prompt-card')).toHaveCount(3);
  await expect(page.getByText('A written record of observations made outdoors.')).toBeVisible();
});

test('@claim:print-sheet shows a worksheet and answer key for the sentence bank', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('link', { name: /Print/ }).click();
  await expect(page.getByRole('heading', { name: 'Printable practice sheet' })).toBeVisible();
  await expect(page.locator('.print-sheet')).toHaveCount(2);
  await expect(page.getByText('ANSWER KEY', { exact: true })).toBeVisible();
});

test('@claim:local-data keeps the sample flow on this origin and requires no sign-in', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.getByRole('link', { name: 'Practice', exact: true }).click();
  const note = await page.locator('.practice-note').textContent();
  const answer = note?.includes('temperature') ? 'thermometer'
    : note?.includes('evidence') ? 'infer'
      : 'field notebook';
  await page.getByLabel('Blank 1').fill(answer);
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Retrieved.')).toBeVisible();

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
  await expect(page.getByLabel(/email|password|sign in|log in/i)).toHaveCount(0);
});

test('@claim:free-core completes sample practice without payment details', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('link', { name: 'Practice', exact: true }).click();
  const note = await page.locator('.practice-note').textContent();
  const answer = note?.includes('temperature') ? 'thermometer'
    : note?.includes('evidence') ? 'infer'
      : 'field notebook';
  await page.getByLabel('Blank 1').fill(answer);
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Retrieved.')).toBeVisible();
  await expect(page.locator('input[autocomplete*="cc"], input[name*="card" i], [data-testid*="checkout" i]')).toHaveCount(0);
});

test('shows a useful recovery message for invalid backup JSON', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#import-json').setInputFiles({
    name: 'broken-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken')
  });
  await expect(page.getByText('This file is not valid JSON. Choose a Context Cloze backup JSON file and try again.')).toBeVisible();
});

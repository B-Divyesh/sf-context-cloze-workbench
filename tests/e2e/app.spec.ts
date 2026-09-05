import { expect, test } from '@playwright/test';
import axe from 'axe-core';

test('@claim:author-practice creates and checks typed sentence prompts', async ({ page }) => {
  await page.goto('/#workbench');
  await expect(page).toHaveTitle(/Context Cloze/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build vocabulary practice from real sentences.');
  await expect(page.getByText('No prompts yet')).toBeVisible();

  const sentence = page.getByLabel('Sentence Required');
  await sentence.fill('The moss remembers every season.');
  await sentence.evaluate((element: HTMLTextAreaElement) => {
    element.focus();
    element.setSelectionRange(4, 8);
  });
  await page.getByRole('button', { name: 'Mark selection as blank' }).click();
  await page.getByLabel('Definition or note Optional').fill('a soft green plant');
  await page.getByRole('button', { name: 'Add to sentence bank' }).click();

  await expect(page.getByText('1 blank · not practiced yet')).toBeVisible();
  await page.reload();
  await expect(page.getByText('1 blank · not practiced yet')).toBeVisible();

  await page.getByRole('link', { name: /Practice/ }).first().click();
  await page.getByLabel('Blank 1').fill('MOSS!');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Retrieved.')).toBeVisible();
});

test('has no serious accessibility violations on the empty workbench', async ({ page }) => {
  await page.goto('/#workbench');
  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () => (await (window as typeof window & { axe: { run: () => Promise<{ violations: Array<{ impact: string | null; id: string }> }> } }).axe.run()).violations);
  const serious = violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  expect(serious).toEqual([]);
  await page.goto('/privacy/');
  await expect(page).toHaveTitle('Privacy — Context Cloze');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How Context Cloze stores your data.');
  await page.goto('/terms/');
  await expect(page).toHaveTitle('Terms — Context Cloze');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms for using Context Cloze.');
});

test('keeps keyboard skip navigation and populated demo practice accessible', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();

  await page.goto('/demo');
  await page.getByRole('link', { name: 'Practice', exact: true }).click();
  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () => (await (window as typeof window & { axe: { run: () => Promise<{ violations: Array<{ impact: string | null; id: string }> }> } }).axe.run()).violations);
  expect(violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('@claim:offline-reload loads the demo offline after the first visit', async ({ browser }) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto('/demo');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build vocabulary practice from real sentences.');
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
    await expect(page.getByText('Offline · work stays local')).toBeVisible();
  } finally {
    await context.close();
  }
});

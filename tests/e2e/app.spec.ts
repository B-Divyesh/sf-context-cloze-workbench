import { expect, test } from '@playwright/test';
import axe from 'axe-core';

test('authors, persists, and practices a typed sentence prompt', async ({ page }) => {
  await page.goto('/#workbench');
  await expect(page).toHaveTitle(/Context Cloze/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make the context do the teaching.');
  await expect(page.getByText('The bench is clear')).toBeVisible();

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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your words stay yours.');
  await page.goto('/terms/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A small tool with plain terms.');
});

test('loads its application shell offline after the first visit', async ({ page, context }) => {
  await page.goto('/#workbench');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make the context do the teaching.');
  await expect(page.getByText('Offline · work stays local')).toBeVisible();
});

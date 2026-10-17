import { selectGenre } from './ui';
import { expect, test } from '@playwright/test';
import fixture from './fixtures/catalog.json' with { type: 'json' };

test('ten four-minute placements total 35:30, timing edits update elapsed time, and invalid overlaps preserve the plan', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({ json: Array.from({ length: 10 }, (_, i) => ({ ...fixture[0], id: `timing:${i}`, title: `Timing ${i + 1}` })) }));
  await page.goto('/');
  await expect(page.getByLabel('Target duration (minutes)')).toHaveValue('120');
  await selectGenre(page, 'House');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(page.getByLabel('Estimated duration', { exact: true })).toHaveText('35:30');
  await expect(page.getByLabel('Difference from target')).toHaveText('84:30 short');
  await page.getByLabel('Play time for track 1 (seconds)').fill('180');
  await page.getByLabel('Play time for track 1 (seconds)').press('Tab');
  await expect(page.getByLabel('Estimated duration', { exact: true })).toHaveText('34:30');
  await expect(page.getByRole('table', { name: 'Tracklist' }).getByRole('row').nth(2)).toContainText('2:30');
  await page.getByLabel('Overlap before track 2 (seconds)').fill('999');
  await page.getByLabel('Overlap before track 2 (seconds)').press('Tab');
  await expect(page.getByRole('alert')).toContainText('Overlap');
  await expect(page.getByLabel('Estimated duration', { exact: true })).toHaveText('34:30');
});

test('a four-minute target selects one track with no overlap and caps a short recording', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({ json: [fixture[0], { ...fixture[0], id: 'short', durationSeconds: 150 }] }));
  await page.goto('/');
  await selectGenre(page, 'House');
  await page.getByLabel('Target duration (minutes)').fill('4');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Tracklist' }).getByRole('row')).toHaveCount(2);
  await expect(page.getByLabel('Estimated duration', { exact: true })).toHaveText('4:00');
  await expect(page.getByLabel('Overlap before track 1 (seconds)')).toHaveValue('0');
  await page.getByLabel('Target duration (minutes)').fill('10');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(page.getByLabel('Play time for track 2 (seconds)')).toHaveValue('150');
  await expect(page.getByLabel('Estimated duration', { exact: true })).toHaveText('6:00');
});

import { expect, test } from '@playwright/test';
import fixture from './fixtures/catalog.json' with { type: 'json' };
import { selectGenre } from './ui';

test('replacement is isolated, caps short play times, and reorder refreshes the visible plan', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({ json: Array.from({ length: 4 }, (_, i) => ({ ...fixture[0], id: `edit:${i}`, title: `Edit ${i + 1}`, durationSeconds: i === 3 ? 120 : 400 })) }));
  await page.goto('/'); await selectGenre(page, 'House');
  await page.getByLabel('Target duration (minutes)').fill('7');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await page.getByLabel('Replacement for track 1').selectOption('edit:3');
  await page.getByRole('button', { name: 'Replace track 1', exact: true }).click();
  const rows = page.getByRole('table', { name: 'Tracklist' }).getByRole('row');
  await expect(rows.nth(1)).toContainText('Edit 4');
  await expect(rows.nth(2)).toContainText('Edit 2');
  await expect(page.getByLabel('Play time for track 1 (seconds)')).toHaveValue('120');
  await expect(page.getByLabel('Estimated duration', { exact: true })).toHaveText('5:30');
  await page.getByRole('button', { name: 'Move track 2 up', exact: true }).click();
  await expect(rows.nth(1)).toContainText('Edit 2');
  await expect(rows.nth(2)).toContainText('Edit 4');
  await expect(rows.nth(1)).toContainText('Opening selection');
  await expect(page.getByRole('img', { name: 'Energy arc and track estimates' })).toBeVisible();
});

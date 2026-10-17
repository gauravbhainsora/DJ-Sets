import { expect, test } from '@playwright/test';
import fixture from './fixtures/catalog.json' with { type: 'json' };
import { selectGenre } from './ui';

test('locks retain inclusion, pins retain positions, and impossible requirements stay explicit', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({ json: fixture }));
  await page.goto('/'); await selectGenre(page, 'House');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  const rows = page.getByRole('table', { name: 'Tracklist' }).getByRole('row');
  const source = await rows.nth(1).getByRole('link').getAttribute('href');
  await page.getByLabel('Lock inclusion for track 1').check();
  await page.getByLabel('Pin position for track 1').fill('2');
  await page.getByLabel('Pin position for track 1').press('Tab');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(rows.nth(2).getByRole('link')).toHaveAttribute('href', source!);
  await expect(page.getByLabel('Lock inclusion for track 2')).toBeChecked();
  await page.getByLabel('Pin position for track 1').fill('2');
  await page.getByLabel('Pin position for track 1').press('Tab');
  await expect(page.getByLabel('Constraint assessment')).toContainText('Conflicting position pins');
  await page.getByText('Must-include tracks', { exact: true }).click();
  await page.getByLabel('Additional required recordings').fill('Missing artist — Missing version');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(page.getByLabel('Constraint assessment')).toContainText('Unavailable required recording');
});

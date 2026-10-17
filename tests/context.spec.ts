import { expect, test } from '@playwright/test';
import fixture from './fixtures/catalog.json' with { type: 'json' };

test('genre emphasis and performance context influence a multi-genre plan', async ({ page }) => {
  const tracks = ['House', 'Dance / Pop'].flatMap(genre => [118, 128].flatMap(bpm => Array.from({ length: 6 }, (_, index) => ({ ...fixture[0], id: `${genre}:${bpm}:${index}`, title: `${genre} ${bpm} ${index}`, genre, bpm, energyEstimate: { value: 6, basis: 'Illustrative rating', kind: 'curated', confidence: 'medium' } }))));
  await page.route('**/catalog.json', route => route.fulfill({ json: tracks }));
  await page.goto('/');
  await page.getByRole('checkbox', { name: 'Melodic House & Techno', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: 'House', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Dance / Pop', exact: true }).check();
  await page.getByLabel('Emphasis for House').fill('10');
  await page.getByLabel('Target duration (minutes)').fill('8');
  await page.getByLabel('Performance context').fill('Warm-up');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  const rows = page.getByRole('table', { name: 'Tracklist' }).getByRole('row');
  await expect(rows.nth(1)).toContainText('118');
  await expect(rows.nth(1)).toContainText('House');
  await expect(rows.nth(1)).toContainText('Warm-up');
  await page.getByLabel('Emphasis for House').fill('1');
  await page.getByLabel('Emphasis for Dance / Pop').fill('10');
  await page.getByLabel('Performance context').fill('Headline');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(rows.nth(1)).toContainText('128');
  await expect(rows.nth(1)).toContainText('Dance / Pop');
  await expect(rows.nth(1)).toContainText('Headline');
});

test('exhausting an emphasized genre explains the balance compromise even when duration is filled', async ({ page }) => {
  const tracks = Array.from({ length: 40 }, (_, index) => ({ ...fixture[0], id: `house:${index}`, title: `House ${index}` }));
  tracks.push({ ...fixture[0]!, id: 'one-pop', title: 'One pop', genre: 'Dance / Pop' });
  await page.route('**/catalog.json', route => route.fulfill({ json: tracks }));
  await page.goto('/');
  await page.getByRole('checkbox', { name: 'Melodic House & Techno', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: 'House', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Dance / Pop', exact: true }).check();
  await page.getByLabel('Emphasis for Dance / Pop').fill('10');
  await page.getByLabel('Emphasis for Dance / Pop').press('Tab');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(page.getByLabel('Constraint assessment')).toContainText('Dance / Pop');
  await expect(page.getByLabel('Constraint assessment')).toContainText('exhausted');
});

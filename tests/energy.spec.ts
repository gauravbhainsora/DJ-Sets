import { selectGenre } from './ui';
import { expect, test } from '@playwright/test';
import fixture from './fixtures/catalog.json' with { type: 'json' };

test('the editable arc scales to duration and separates target energy from unsupported estimates', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({ json: fixture }));
  await page.goto('/');
  await page.getByText('Edit energy arc', { exact: true }).click();
  await expect(page.getByLabel('End of Anchor (minutes)')).toHaveValue('15');
  await page.getByLabel('Target duration (minutes)').fill('60');
  await page.getByLabel('Target duration (minutes)').press('Tab');
  await expect(page.getByLabel('End of Anchor (minutes)')).toHaveValue('7.5');
  await page.getByLabel('End of Anchor (minutes)').fill('8');
  await page.getByLabel('End of Anchor (minutes)').press('Tab');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Energy arc and track estimates' })).toBeVisible();
  await expect(page.getByText(/Energy progression is unverified/)).toBeVisible();
  const row = page.getByRole('table', { name: 'Tracklist' }).getByRole('row').nth(1);
  await row.getByText('Correct estimate').click();
  await page.getByLabel('Energy estimate for track 1').fill('7');
  await page.getByLabel('Energy basis for track 1').fill('My listening assessment');
  await page.getByRole('button', { name: 'Apply energy for track 1', exact: true }).click();
  await expect(row).toContainText('My listening assessment');
  await expect(row).toContainText('medium confidence');
});

test('generation evaluates the phase at the actual overlapped start time', async ({ page }) => {
  const tracks = [6, 6, 6, 6, 10, 10, 10, 10].map((energy, index) => ({ ...fixture[0], id: `boundary:${index}`, title: `Boundary ${index}`, energyEstimate: { value: energy, basis: 'Illustrative fixture', confidence: 'medium', kind: 'curated' } }));
  await page.route('**/catalog.json', route => route.fulfill({ json: tracks }));
  await page.goto('/'); await selectGenre(page, 'House');
  await page.getByLabel('Target duration (minutes)').fill('20'); await page.getByLabel('Target duration (minutes)').press('Tab');
  await page.getByText('Edit energy arc', { exact: true }).click();
  for (const [label, value] of [['End of Anchor (minutes)', '4'], ['Start target for Build', '10'], ['End target for Build', '10']]) {
    await page.getByLabel(label!).fill(value!); await page.getByLabel(label!).press('Tab');
  }
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  const second = page.getByRole('table', { name: 'Tracklist' }).getByRole('row').nth(2);
  await expect(second.getByRole('cell').nth(8)).toHaveText('3:30');
  await expect(second.getByRole('cell').nth(6)).toContainText('6/10');
  await expect(second).not.toContainText('Energy compromise');
});

test('supported estimates produce peak relief, a larger breather, and an intentional landing', async ({ page }) => {
  const ratings = [5, 6, 7, 8, 9, 10];
  const tracks = Array.from({ length: 72 }, (_, index) => ({ ...fixture[0], id: `rated:${index}`, title: `Rated ${index}`, bpm: 124, key: 'A Minor', energyEstimate: { value: ratings[index % 6], basis: 'Illustrative fixture rating', kind: 'curated', confidence: 'medium' } }));
  await page.route('**/catalog.json', route => route.fulfill({ json: tracks }));
  await page.goto('/');
  await selectGenre(page, 'House');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  const rows = page.getByRole('table', { name: 'Tracklist' }).getByRole('row');
  const peak = rows.filter({ hasText: 'Peak: target energy' });
  const energies: number[] = [];
  for (const row of await peak.all()) energies.push(Number((await row.getByRole('cell').nth(6).innerText()).split('/')[0]));
  expect(energies.length).toBeGreaterThan(5);
  for (let i = 0; i + 2 < energies.length; i++) expect(Math.min(...energies.slice(i, i + 3))).toBeLessThan(9);
  await expect(rows.filter({ hasText: 'Breather: target energy' }).first().getByRole('cell').nth(6)).toContainText(/[67]\/10/);
  await expect(rows.last().getByRole('cell').nth(6)).toContainText('6/10');
  await expect(rows.last()).toContainText('land intentionally');
});

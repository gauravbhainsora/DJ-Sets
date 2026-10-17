import { selectGenre } from './ui';
import { expect, test } from '@playwright/test';
import fixtureCatalog from './fixtures/catalog.json' with { type: 'json' };

test('a DJ generates and reviews exact recording versions with honest metadata', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({ json: fixtureCatalog }));
  await page.goto('/');
  await selectGenre(page, 'House');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();

  const tracklist = page.getByRole('table', { name: 'Tracklist' });
  await expect(tracklist.getByRole('row')).toHaveCount(3);
  const original = tracklist.getByRole('row').filter({ hasText: 'Original Mix' });
  await expect(original).toContainText('Fixture groove');
  await expect(original).toContainText('Test artist');
  await expect(original).toContainText('124');
  await expect(original).toContainText('A Minor');
  await expect(original).toContainText('6:03');
  await expect(original.getByRole('link', { name: /source/i })).toHaveAttribute('href', 'https://example.com/house-original');
  const remix = tracklist.getByRole('row').filter({ hasText: 'Test Remix' });
  await expect(remix.getByText('Unknown', { exact: true })).toHaveCount(4);
  await expect(remix.getByRole('link', { name: /source/i })).toHaveAttribute('href', 'https://example.com/house-remix');
  await expect(page.getByText(/discovery is limited to this starter catalog/i)).toBeVisible();
  await expect(page.getByRole('status')).toContainText('2 tracks');
  await expect(page.getByRole('status')).toContainText('starting selection');
});

test('a genre with no candidates explains the empty result and lets the DJ choose another', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({ json: fixtureCatalog.filter(recording => recording.genre === 'House') }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('No recordings available for Melodic House & Techno');
  await expect(page.getByRole('status')).toContainText('Choose another genre');
  await expect(page.getByRole('table', { name: 'Tracklist' })).toBeHidden();

  await selectGenre(page, 'House');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Tracklist' }).getByRole('row')).toHaveCount(3);
  await expect(page.getByRole('status')).not.toContainText('No recordings');
});

test('an invalid catalog cannot present unsupported metadata as a set plan', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({
    json: [{ ...fixtureCatalog[0], bpm: -30, sourceUrl: 'javascript:alert(1)', energyEstimate: 10 }],
  }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('could not be loaded');
  await expect(page.getByRole('button', { name: 'Generate set plan', exact: true })).toBeDisabled();
  await expect(page.getByRole('table', { name: 'Tracklist' })).toBeHidden();
});

test('the DJ can generate each confirmed genre without mixing or relabeling an existing plan', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({ json: fixtureCatalog }));
  await page.goto('/');
  for (const { genre, title, rows } of [
    { genre: 'Melodic House & Techno', title: 'Fixture atmosphere', rows: 2 },
    { genre: 'House', title: 'Fixture groove', rows: 3 },
    { genre: 'Progressive House', title: 'Fixture journey', rows: 2 },
    { genre: 'Dance / Pop', title: 'Fixture chorus', rows: 2 },
  ]) {
    await selectGenre(page, genre);
    await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
    await expect(page.getByRole('heading', { name: `${genre} set plan`, exact: true })).toBeVisible();
    const tracklist = page.getByRole('table', { name: 'Tracklist' });
    await expect(tracklist.getByRole('row')).toHaveCount(rows);
    await expect(tracklist).toContainText(title);
    await expect(tracklist.getByRole('row').nth(1).getByRole('cell').first()).toHaveText('01');
  }
  await selectGenre(page, 'House');
  await expect(page.getByRole('heading', { name: 'Dance / Pop set plan', exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Tracklist' })).toContainText('Fixture chorus');
});

test('a fully empty catalog never invents a recording', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({ json: [] }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('No recordings available');
  await expect(page.getByRole('status')).toContainText('add verified recordings');
  await expect(page.getByRole('table', { name: 'Tracklist' })).toBeHidden();
});

test('a catalog load failure explains how to recover without offering a fabricated plan', async ({ page }) => {
  let failRequest = true;
  await page.route('**/catalog.json', route => failRequest
    ? route.fulfill({ status: 503, body: 'Unavailable' })
    : route.fulfill({ json: fixtureCatalog }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Reload to try again');
  await expect(page.getByRole('button', { name: 'Generate set plan', exact: true })).toBeDisabled();
  failRequest = false;
  await page.reload();
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('table', { name: 'Tracklist' })).toContainText('Fixture atmosphere');
});

test('conflicting recording identities cannot silently select the wrong version', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({
    json: [fixtureCatalog[0], { ...fixtureCatalog[1], id: 'fixture:house-original' }],
  }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('could not be loaded');
  await expect(page.getByRole('button', { name: 'Generate set plan', exact: true })).toBeDisabled();
});

import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import fixture from './fixtures/catalog.json' with { type: 'json' };
import { selectGenre } from './ui';

test('complete CSV and text downloads retain order, exact versions, unknowns, timing, and multiline notes', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({ json: fixture }));
  await page.goto('/'); await selectGenre(page, 'House');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Export CSV', exact: true })).toBeVisible();
  await page.getByLabel('Notes for track 1').fill('Prepare, "listen"\nThen blend');
  await page.getByLabel('Notes for track 1').press('Tab');
  await page.getByRole('button', { name: 'Move track 2 up', exact: true }).click();
  const sources = await page.getByRole('table', { name: 'Tracklist' }).getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href')!));
  for (const label of ['Export CSV', 'Export text']) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: label, exact: true }).click();
    const download = await pending;
    const text = await readFile((await download.path())!, 'utf8');
    expect(text).toContain('Original Mix'); expect(text).toContain('Test Remix');
    expect(text).toContain('Unknown'); expect(text).toContain('https://example.com/house-original');
    expect(text).toContain('Anchor');
    expect(text.indexOf(sources[0]!)).toBeLessThan(text.indexOf(sources[1]!));
    if (label === 'Export CSV') {
      expect(text).toContain('"Prepare, ""listen""\nThen blend"');
      expect(text).toContain('"play_seconds"');
    } else { expect(text).toContain('Prepare, "listen"\nThen blend'); expect(text).toContain('Planned play'); }
  }
});

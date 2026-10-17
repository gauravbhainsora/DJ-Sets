import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import fixture from './fixtures/catalog.json' with { type: 'json' };
import { selectGenre } from './ui';

test('playable-file exports report omissions, respect explicit ambiguity resolution, and follow edited order', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({ json: fixture }));
  await page.goto('/'); await selectGenre(page, 'House');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Export local playlist', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Export local playlist', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No recordings have confirmed local-library matches');
  const xml = `<DJ_PLAYLISTS><COLLECTION>
    <TRACK TrackID="1" Name="Fixture groove" Artist="Test artist" Mix="Original Mix" Location="file://localhost/Music/Original%20Mix.mp3" />
    <TRACK TrackID="2" Name="Fixture groove" Artist="Test artist" Mix="Test Remix" Location="file://localhost/Music/Test%20Remix.mp3" />
    <TRACK TrackID="3" Name="Fixture groove" Artist="Test artist" Mix="Test Remix" Location="file://localhost/Music/Duplicate.mp3" />
    </COLLECTION></DJ_PLAYLISTS>`;
  await page.getByLabel('Import Rekordbox XML').setInputFiles({ name: 'library.xml', mimeType: 'application/xml', buffer: Buffer.from(xml) });
  const partial = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export local playlist', exact: true }).click();
  const partialDownload = await partial;
  expect(partialDownload.suggestedFilename()).toContain('partial');
  const partialText = await readFile((await partialDownload.path())!, 'utf8');
  expect(partialText).toContain('/Music/Original Mix.mp3');
  expect(partialText).not.toContain('/Music/Test Remix.mp3');
  expect(partialText).not.toContain('https:');
  await expect(page.getByLabel('Local playlist export status')).toContainText('Partial');
  await expect(page.getByLabel('Local playlist export status')).toContainText('omitted');
  const rows = page.getByRole('table', { name: 'Tracklist' }).getByRole('row');
  await rows.filter({ hasText: 'Test Remix' }).getByLabel(/Resolve local match/).selectOption('2');
  await page.getByRole('button', { name: 'Move track 2 up', exact: true }).click();
  const full = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export local playlist', exact: true }).click();
  const fullDownload = await full;
  expect(fullDownload.suggestedFilename()).not.toContain('partial');
  const fullText = await readFile((await fullDownload.path())!, 'utf8');
  const paths = fullText.split('\n').filter(line => line && !line.startsWith('#'));
  expect(paths).toHaveLength(2);
  const firstVersion = await rows.nth(1).getByRole('cell').nth(2).innerText();
  expect(paths[0]).toContain(firstVersion === 'Original Mix' ? 'Original Mix.mp3' : 'Test Remix.mp3');
});

import { expect, test } from '@playwright/test';
import fixture from './fixtures/catalog.json' with { type: 'json' };
import { selectGenre } from './ui';

const xml = `<?xml version="1.0" encoding="UTF-8"?><DJ_PLAYLISTS Version="1.0.0"><COLLECTION Entries="4">
<TRACK TrackID="1" Name="Fixture groove" Artist="Test artist" Mix="Original Mix" Location="file://localhost/Music/original.mp3" />
<TRACK TrackID="2" Name="Fixture groove" Artist="Test artist" Mix="Test Remix" Location="file://localhost/Music/remix-one.mp3" />
<TRACK TrackID="3" Name="Fixture groove" Artist="Test artist" Mix="Test Remix" Location="file://localhost/Music/remix-two.mp3" />
<TRACK TrackID="4" Name="Fixture groove" Artist="Test artist" Mix="Radio Edit" Location="file://localhost/Music/radio.mp3" />
</COLLECTION></DJ_PLAYLISTS>`;

test('XML matching respects exact versions, leaves ambiguity unresolved, and preserves the plan on invalid input', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({ json: fixture }));
  await page.goto('/'); await selectGenre(page, 'House');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  await expect(page.getByLabel('Import Rekordbox XML')).toBeVisible();
  await page.getByLabel('Import Rekordbox XML').setInputFiles({ name: 'library.xml', mimeType: 'application/xml', buffer: Buffer.from(xml) });
  const rows = page.getByRole('table', { name: 'Tracklist' }).getByRole('row');
  await expect(rows.filter({ hasText: 'Original Mix' })).toContainText('Matched');
  await expect(rows.filter({ hasText: 'Test Remix' })).toContainText('Ambiguous');
  await expect(page.getByLabel('Library import status')).toContainText('availability is unverified');
  await page.getByLabel('Import Rekordbox XML').setInputFiles({ name: 'invalid.xml', mimeType: 'application/xml', buffer: Buffer.from('<not-xml>') });
  await expect(page.getByRole('alert')).toContainText('Invalid Rekordbox XML');
  await expect(rows.filter({ hasText: 'Original Mix' })).toContainText('Matched');
});

test('alternate mixes and unknown versions never become exact matches', async ({ page }) => {
  await page.route('**/catalog.json', route => route.fulfill({ json: fixture }));
  await page.goto('/'); await selectGenre(page, 'House');
  await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
  const otherMix = '<DJ_PLAYLISTS><COLLECTION><TRACK TrackID="1" Name="Fixture groove" Artist="Test artist" Mix="Radio Edit" Location="file://localhost/Music/radio.mp3" /><TRACK TrackID="2" Name="Fixture groove" Artist="Test artist" Location="file://localhost/Music/unknown.mp3" /></COLLECTION></DJ_PLAYLISTS>';
  await page.getByLabel('Import Rekordbox XML').setInputFiles({ name: 'versions.xml', mimeType: 'application/xml', buffer: Buffer.from(otherMix) });
  const rows = page.getByRole('table', { name: 'Tracklist' }).getByRole('row');
  await expect(rows.filter({ hasText: 'Original Mix' })).toContainText('Unmatched');
  await expect(rows.filter({ hasText: 'Test Remix' })).toContainText('Unmatched');
});

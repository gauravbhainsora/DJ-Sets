import { expect, test } from '@playwright/test';

// This exercises the real bundled data through the UI. It does not replace
// reviewing provider pages; that evidence lives in docs/catalog-verification.md.
test('the bundled starter catalog produces a real starting selection in every genre', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('12 recordings · 4 genres', { exact: true })).toBeVisible();

  for (const { genre, title, source } of [
    { genre: 'House', title: 'Love Is Love', source: 'https://www.beatport.com/track/love-is-love/21597402' },
    { genre: 'Progressive House', title: 'Aroma', source: 'https://www.beatport.com/track/aroma/14576351' },
    { genre: 'Dance / Pop', title: 'D.A.N.C.E.', source: 'https://www.beatport.com/track/dance/20599776' },
    { genre: 'Melodic House & Techno', title: 'Orpheon', source: 'https://www.beatport.com/track/orpheon/22764891' },
  ]) {
    await page.getByRole('radio', { name: genre, exact: true }).check();
    await page.getByRole('button', { name: 'Generate set plan', exact: true }).click();
    const tracklist = page.getByRole('table', { name: 'Tracklist' });
    await expect(tracklist.getByRole('row')).toHaveCount(4);
    await expect(tracklist.getByRole('row').filter({ hasText: title }).getByRole('link')).toHaveAttribute('href', source);
    await expect(tracklist.getByRole('cell', { name: 'Unknown', exact: true })).toHaveCount(3);
    await expect(page.getByRole('status')).toContainText('short starting selection');
  }

  const firstRecording = page.getByRole('table', { name: 'Tracklist' }).getByRole('row').filter({ hasText: 'Orpheon' });
  await firstRecording.getByText('Metadata provenance', { exact: true }).click();
  await expect(firstRecording).toContainText('Checked 2026-10-17');
  await expect(firstRecording).toContainText('source-reported metadata');
  await expect(firstRecording).toContainText('not audio analysis');
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('set-plan-desktop.png'), fullPage: true });
});

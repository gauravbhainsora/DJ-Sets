import type { Page } from '@playwright/test';

export async function selectGenre(page: Page, genre: string): Promise<void> {
  const genres = page.getByRole('group', { name: 'Choose genres' }).getByRole('checkbox');
  for (const checkbox of await genres.all()) await checkbox.uncheck();
  await page.getByRole('checkbox', { name: genre, exact: true }).check();
}

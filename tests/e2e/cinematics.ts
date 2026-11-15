import { expect, type Page } from '@playwright/test';

/** Real UI continuation only. No story dispatch, save injection or teleports. */
export async function skipAwakening(page: Page): Promise<void> {
  await expect(page.locator('#scene')).toHaveAttribute('data-mode', 'CINEMATIC');
  await expect(page.getByRole('heading', { name: /PROLOGUE.*THE AWAKENING/s })).toBeVisible();
  await page.getByRole('button', { name: 'Skip sequence', exact: true }).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-mode', 'PLAYING');
}
export async function finishSequence(page: Page, title: RegExp): Promise<void> {
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await page.getByRole('button', { name: 'Skip sequence', exact: true }).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-mode', 'PLAYING');
}
export async function reachMonologue(page: Page): Promise<void> {
  // Beacon response and the reflection are separate original-fiction sequences.
  for (let attempt=0;attempt<3;attempt++) {
    const heading=await page.locator('.panel h1').textContent();
    if (heading?.includes('EPILOGUE')) break;
    await page.getByRole('button', { name: 'Skip sequence', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: /EPILOGUE.*NOT FORGOTTEN/s })).toBeVisible();
  await expect(page.locator('.cinematic-line')).toHaveText('I used to think that silence meant the end.');
}

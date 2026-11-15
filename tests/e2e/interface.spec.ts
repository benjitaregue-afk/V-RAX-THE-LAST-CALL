import {test, expect} from '@playwright/test';

// An Enter-activated beat replaces its buttons; focus must remain in the dialog.
test('cinematic keyboard focus survives Continue and wraps within the dialog', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByText('Settings', {exact: true}).click();
  await page.getByLabel('Look mode', {exact: true}).selectOption('keyboard');
  await page.getByRole('button', {name: 'Enter archive', exact: true}).click();
  const panel = page.locator('.panel');
  const next = page.getByRole('button', {name: 'Continue', exact: true});
  const skip = page.getByRole('button', {name: 'Skip sequence', exact: true});
  await expect(panel).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(next).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(panel).toHaveAttribute('data-beat', '1');
  await expect(next).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(skip).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(next).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#scene')).toHaveAttribute('data-mode', 'PLAYING');
  expect(errors).toEqual([]);
});

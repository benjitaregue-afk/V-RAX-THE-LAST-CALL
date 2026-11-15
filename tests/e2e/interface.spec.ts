import {test, expect} from '@playwright/test';
import {skipAwakening} from './cinematics';

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

test('journal navigation preserves locked evidence and returns to exploration', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByText('Settings', {exact: true}).click();
  await page.getByLabel('Look mode', {exact: true}).selectOption('keyboard');
  await page.getByRole('button', {name: 'Enter archive', exact: true}).click();
  await skipAwakening(page);
  await page.keyboard.press('KeyJ');
  await expect(page.getByRole('heading', {name: 'Archive journal', exact: true})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Mission', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('figure', {name: 'Archive map', exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Records', exact: true}).click();
  await expect(page.getByText('Restore backup power to open the first mission records.', {exact: true})).toBeVisible();
  await expect(page.locator('.panel [data-record]')).toHaveCount(0);
  await page.getByRole('button', {name: 'Ship log', exact: true}).click();
  await expect(page.getByText('FICTIONAL SHIP RECORD: evacuation completed while the survivor was unconscious after an impact. Find power and send a distress signal.', {exact: true})).toBeVisible();
  await expect(page.locator('#scene')).toHaveAttribute('data-stage', 'ARRIVAL');
  await page.getByRole('button', {name: 'Return to archive', exact: true}).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-mode', 'PLAYING');
  await expect(page.locator('#scene')).toHaveAttribute('data-stage', 'ARRIVAL');
  expect(errors).toEqual([]);
});

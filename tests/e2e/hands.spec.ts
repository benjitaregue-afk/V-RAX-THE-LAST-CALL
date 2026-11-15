import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { finishSequence, skipAwakening } from './cinematics';

// Production assets and normal input only. Canvas data attributes are read-only
// observations; these scenarios never move the camera, set poses or inject saves.
const shots = 'output/playwright/overhaul/hands-gameplay';

async function enter(page: Page, reduced = false): Promise<void> {
  const delivered = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith('/assets/models/player-hands.glb'));
  await page.goto('/');
  const response = await delivered;
  expect(response.ok(), 'The authored hand GLB must actually be served').toBe(true);
  await response.finished();
  await page.getByText('Settings', { exact: true }).click();
  await page.getByLabel('Look mode', { exact: true }).selectOption('keyboard');
  if (reduced) await page.getByLabel('Reduced intensity', { exact: true }).check();
  await page.getByRole('button', { name: 'Enter archive', exact: true }).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-hand-asset', 'true', { timeout: 30_000 });
}

function runtimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  return errors;
}

async function shot(page: Page, name: string): Promise<void> {
  await mkdir(shots, { recursive: true });
  await page.screenshot({ path: `${shots}/${name}.png` });
}

test('authored hands awaken, blend through walking and sprinting, and hide while paused', async ({ page }) => {
  const errors = runtimeErrors(page);
  await enter(page);
  const canvas = page.locator('#scene');
  await expect(canvas).toHaveAttribute('data-cinematic', 'awakening');
  await expect(canvas).toHaveAttribute('data-hand-animation', 'Awaken');
  await page.waitForTimeout(1600);
  await shot(page, 'awakening');
  await expect(canvas).toHaveAttribute('data-hand-animation', 'StandUp', { timeout: 5000 });
  await page.waitForTimeout(300);
  await shot(page, 'standing');
  await skipAwakening(page);
  await expect(canvas).toHaveAttribute('data-hand-animation', 'Idle');
  await expect(canvas).toHaveAttribute('data-hand-asset', 'true');
  await page.waitForTimeout(300);
  await shot(page, 'idle');

  await page.keyboard.down('KeyW');
  await expect(canvas).toHaveAttribute('data-hand-animation', 'Walk');
  await page.waitForTimeout(250);
  await shot(page, 'walk');
  await page.keyboard.down('ShiftLeft');
  await expect(canvas).toHaveAttribute('data-hand-animation', 'Sprint');
  await page.waitForTimeout(180);
  await shot(page, 'sprint');
  await page.keyboard.up('ShiftLeft');
  await page.keyboard.up('KeyW');
  await expect(canvas).toHaveAttribute('data-hand-animation', 'Idle');

  // Pausing clears held keys, hides the model and freezes the pose transition.
  await page.keyboard.down('KeyS');
  await expect(canvas).toHaveAttribute('data-hand-animation', 'Walk');
  await page.keyboard.press('Escape');
  await page.keyboard.up('KeyS');
  await expect(canvas).toHaveAttribute('data-mode', 'PAUSED');
  await expect(canvas).toHaveAttribute('data-hand-asset', 'false');
  const before = await canvas.evaluate((element) => {
    const d = (element as HTMLCanvasElement).dataset;
    return { x: d.x, z: d.z, animation: d.handAnimation, blend: d.handBlend };
  });
  expect(before.blend).toBeDefined();
  await page.waitForTimeout(450);
  const after = await canvas.evaluate((element) => {
    const d = (element as HTMLCanvasElement).dataset;
    return { x: d.x, z: d.z, animation: d.handAnimation, blend: d.handBlend };
  });
  expect(after).toEqual(before);
  await shot(page, 'paused');
  await page.getByRole('button', { name: 'Return to archive', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-mode', 'PLAYING');
  await expect(canvas).toHaveAttribute('data-hand-asset', 'true');
  await expect(canvas).toHaveAttribute('data-hand-animation', 'Idle');
  await expect(canvas).toHaveAttribute('data-hand-blend', '1.000');
  expect(errors).toEqual([]);
});

test('journal and attributed science remain unobstructed after a real switch interaction', async ({ page }) => {
  const errors = runtimeErrors(page);
  await enter(page);
  await skipAwakening(page);
  const canvas = page.locator('#scene');
  // The spawn faces the backup switch. Use the same short physical approach as
  // the existing settings scenarios, then complete only the power tutorial.
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(800);
  await page.keyboard.up('KeyW');
  await expect(page.locator('.interaction')).toContainText('Backup power switch');
  await page.keyboard.press('KeyE');
  await expect(canvas).toHaveAttribute('data-mode', 'INTERACTING');
  await expect(canvas).toHaveAttribute('data-hand-animation', 'OperateSwitch');
  await expect(canvas).toHaveAttribute('data-hand-asset', 'true');
  await page.waitForTimeout(250);
  await shot(page, 'switch-anticipation');
  await expect(page.locator('.panel')).toHaveAttribute('data-puzzle', 'PZ-00');
  await expect(canvas).toHaveAttribute('data-hand-asset', 'false');
  await page.locator('.panel input[type="radio"][name="backup"][value="on"]').check();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-stage', 'ARCHIVE_OPEN');
  await page.getByRole('button', { name: 'Return to archive', exact: true }).click();
  await finishSequence(page, /CHAPTER I.*THE FORGOTTEN/s);

  await page.keyboard.press('KeyJ');
  await expect(page.getByRole('heading', { name: 'Archive journal', exact: true })).toBeVisible();
  await expect(canvas).toHaveAttribute('data-mode', 'TERMINAL');
  await expect(canvas).toHaveAttribute('data-hand-asset', 'false');
  await page.getByRole('button', { name: 'Records', exact: true }).click();
  await page.getByRole('button', { name: 'Opportunity rover — catalog record', exact: true }).click();
  const record = page.locator('[data-record="R-OPPORTUNITY"]');
  await expect(record).toBeVisible();
  await expect(record).toContainText('NASA ARCHIVAL RECORD');
  await expect(record).toContainText('2003-032A');
  await expect(record.locator('a').first()).toHaveAttribute('href', /nasa\.gov.*2003-032A/);
  await expect(record.locator('.credit')).toContainText('NASA');
  await record.locator('.credit').scrollIntoViewIfNeeded();
  await expect(record.locator('.credit')).toBeVisible();
  await shot(page, 'journal-science');
  await page.getByRole('button', { name: 'Return to archive', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-hand-asset', 'true');
  expect(errors).toEqual([]);
});

test('reduced intensity retains authored hands and working locomotion', async ({ page }) => {
  const errors = runtimeErrors(page);
  await enter(page, true);
  await skipAwakening(page);
  const canvas = page.locator('#scene');
  await expect(canvas).toHaveAttribute('data-hand-asset', 'true');
  await page.keyboard.down('KeyS');
  await expect(canvas).toHaveAttribute('data-hand-animation', 'Walk');
  await page.waitForTimeout(300);
  await shot(page, 'reduced-walk');
  await page.keyboard.up('KeyS');
  await expect(canvas).toHaveAttribute('data-hand-animation', 'Idle');
  await page.keyboard.press('Escape');
  await page.getByText('Settings', { exact: true }).click();
  await expect(page.getByLabel('Reduced intensity', { exact: true })).toBeChecked();
  await expect(canvas).toHaveAttribute('data-hand-asset', 'false');
  expect(errors).toEqual([]);
});

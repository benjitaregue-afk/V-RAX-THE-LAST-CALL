import { test, expect, type Page } from '@playwright/test';
import {skipAwakening,finishSequence} from './cinematics';

// Environment-failure injection only: progression still uses physical movement and
// real puzzle controls. No reducer access, imported saves or stage injection.
test.setTimeout(30_000);

async function openMenu(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Enter archive', exact: true })).toBeVisible();
  await page.getByText('Settings', { exact: true }).click();
}

async function enterKeyboard(page: Page): Promise<void> {
  await openMenu(page);
  await page.getByLabel('Look mode', { exact: true }).selectOption('keyboard');
  await page.getByLabel('Quality', { exact: true }).selectOption('low');
  await page.getByRole('button', { name: 'Enter archive', exact: true }).click();
  await skipAwakening(page);
}

async function restoreBackup(page: Page): Promise<void> {
  // Spawn is already facing the switch. Approach at the normal walking speed.
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(800);
  await page.keyboard.up('KeyW');
  await expect(page.locator('.interaction')).toContainText('Backup power switch');
  await page.keyboard.press('KeyE');
  await expect(page.locator('.panel')).toHaveAttribute('data-puzzle', 'PZ-00');
  await page.locator('.panel input[type="radio"][name="backup"][value="on"]').check();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-stage', 'ARCHIVE_OPEN');
}

test('settings changed through the real menu survive a fresh load', async ({ page }) => {
  await openMenu(page);
  await page.getByLabel('Reduced intensity', { exact: true }).check();
  await page.getByLabel('Invert mouse Y', { exact: true }).check();
  await page.getByLabel('Look mode', { exact: true }).selectOption('keyboard');
  await page.getByLabel('Quality', { exact: true }).selectOption('low');
  await page.getByLabel('Text size', { exact: true }).selectOption('1.5');
  await page.getByLabel('Field of view', { exact: true }).focus();
  await page.keyboard.press('End');
  await page.getByLabel('Master volume', { exact: true }).focus();
  await page.keyboard.press('Home');
  await page.reload();
  await page.getByText('Settings', { exact: true }).click();
  await expect(page.getByLabel('Reduced intensity', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Invert mouse Y', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Look mode', { exact: true })).toHaveValue('keyboard');
  await expect(page.getByLabel('Quality', { exact: true })).toHaveValue('low');
  await expect(page.getByLabel('Text size', { exact: true })).toHaveValue('1.5');
  await expect(page.getByLabel('Field of view', { exact: true })).toHaveValue('90');
  await expect(page.getByLabel('Master volume', { exact: true })).toHaveValue('0');
  await page.getByRole('button', { name: 'Enter archive', exact: true }).click();
  await skipAwakening(page);
});

test('denied pointer lock explains recovery and keyboard movement still works', async ({ page }) => {
  // Simulate the browser denying a real API request. We do not fake successful capture.
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.requestPointerLock = function (): Promise<void> {
      return Promise.reject(new DOMException('Injected browser permission denial', 'NotAllowedError'));
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter archive', exact: true }).click();
  await page.getByRole('button', {name:'Skip sequence',exact:true}).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-mode', 'PAUSED');
  await expect(page.getByText(/The pointer could not be captured/)).toBeVisible();
  await page.getByRole('button', { name: 'Use arrow keys to look', exact: true }).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-mode', 'PLAYING');
  const z = Number(await page.locator('#scene').getAttribute('data-z'));
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(450);
  await page.keyboard.up('KeyW');
  expect(Number(await page.locator('#scene').getAttribute('data-z'))).toBeGreaterThan(z + 0.2);
});

test('blocked storage warns but the player can restore backup power in memory', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function (): never {
      throw new DOMException('Injected storage quota failure', 'QuotaExceededError');
    };
  });
  await enterKeyboard(page);
  await expect(page.getByText('Progress could not be saved on this device. This session continues in memory.', { exact: true })).toBeVisible();
  await restoreBackup(page);
  await expect(page.getByText('Backup power restored. Door D0 is opening.', { exact: true })).toBeVisible();
});

test('missing NASA image keeps the attributed scientific text accessible', async ({ page }) => {
  await page.route('**/assets/nasa/pia05584.jpg', (route) => route.abort('failed'));
  await enterKeyboard(page);
  await restoreBackup(page);
  await page.getByRole('button', { name: 'Return to archive', exact: true }).click();
  await finishSequence(page,/CHAPTER I.*THE FORGOTTEN/s);
  await page.keyboard.press('KeyJ');
  await expect(page.getByRole('heading', { name: 'Archive journal', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Records', exact: true }).click();
  await page.getByRole('button', { name: "PIA05584 — 'Berries' and Rock Share Common Origins", exact: true }).click();
  const record = page.locator('[data-record="R-PIA05584"]');
  await expect(record.locator('.image-fallback')).toBeVisible();
  await expect(record.locator('.image-fallback')).toContainText('Image unavailable.');
  await expect(record).toContainText('NASA/JPL/Cornell');
  await expect(record.locator('a').first()).toHaveAttribute('href', /science\.nasa\.gov/);
  await expect(page.locator('#scene')).toHaveAttribute('data-stage', 'ARCHIVE_OPEN');
});

test('real Web Audio master gain follows mute and pause', async ({ page }) => {
  // Observe nodes created by the real browser AudioContext; no audio API is replaced
  // with a mock. ArchiveAudio creates its destination master before its channel buses.
  await page.addInitScript(() => {
    const scope = window as unknown as { __observedAudioGains: GainNode[] };
    scope.__observedAudioGains = [];
    const createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function (): GainNode {
      const gain = createGain.call(this);
      scope.__observedAudioGains.push(gain);
      return gain;
    };
  });
  const master = (): Promise<{ gain: number; state: string; count: number } | null> => page.evaluate(() => {
    const gains = (window as unknown as { __observedAudioGains: GainNode[] }).__observedAudioGains;
    return gains[0] ? { gain: gains[0].gain.value, state: gains[0].context.state, count: gains.length } : null;
  });
  await enterKeyboard(page);
  await expect.poll(async () => (await master())?.state).toBe('running');
  await expect.poll(async () => (await master())?.gain).toBeCloseTo(0.8);
  await page.keyboard.press('Escape');
  await expect(page.locator('#scene')).toHaveAttribute('data-mode', 'PAUSED');
  // Suspension is the actual pause mute. AudioParam automation stops advancing
  // while suspended, so its last sampled value need not update until resume.
  await expect.poll(async () => (await master())?.state).toBe('suspended');
  await page.getByText('Settings', { exact: true }).click();
  await page.getByLabel('Master volume', { exact: true }).focus();
  await page.keyboard.press('Home');
  await page.getByRole('button', { name: 'Return to archive', exact: true }).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-mode', 'PLAYING');
  await expect.poll(async () => (await master())?.state).toBe('running');
  await expect.poll(async () => (await master())?.gain).toBe(0);
});

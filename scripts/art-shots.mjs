// Art review tool (development only). Captures first-person views from the running dev server
// so lighting and materials are judged in the real engine, not in Blender.
//   npm run dev -- --host 127.0.0.1        (in another terminal)
//   node scripts/art-shots.mjs --profile=BACKUP --views=spawn,console --flash=1
// Output: output/playwright/art/<profile>_<view>.png (git-ignored QA evidence).
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? '1']; }));
const VIEWS = {
  spawn: { x: 0, z: -6, yaw: 0.733, pitch: 0.03 },
  console: { x: 0.4, z: -4.9, yaw: -1.5708, pitch: 0.0 },
  lock: { x: 0, z: -3.6, yaw: 3.1416, pitch: -0.04 },
  door0: { x: 0, z: -4.4, yaw: 0, pitch: -0.05 },
  switch: { x: 0.9, z: -5.0, yaw: 0.75, pitch: 0.12 },
  airlock_up: { x: 0, z: -5, yaw: 0.4, pitch: -0.75 },
  corridor: { x: 0, z: -1.9, yaw: 0, pitch: 0 },
  hub_south: { x: 0, z: 0.8, yaw: 0, pitch: -0.02 },
  hub_west: { x: 2.5, z: 6.5, yaw: -1.5708, pitch: 0 },
  hub_east: { x: -2.5, z: 6.5, yaw: 1.5708, pitch: 0 },
  hub_back: { x: 0, z: 8.8, yaw: 3.1416, pitch: 0 },
  insight: { x: -8, z: 6.5, yaw: -1.9, pitch: 0.02 },
  insight_term: { x: -10.4, z: 7, yaw: -1.5708, pitch: 0.1 },
  opportunity: { x: 8, z: 6.5, yaw: 1.9, pitch: 0.02 },
  relay: { x: 0, z: 13.6, yaw: 0, pitch: -0.05 },
  deck: { x: 0, z: 23.5, yaw: 0, pitch: -0.03 },
  hub_map: { x: 0, z: 0.9, yaw: 0, pitch: 0.55 },
  deck_window: { x: -1.5, z: 26.5, yaw: 0.25, pitch: -0.06 },
  opportunity_wall: { x: 11.5, z: 6.2, yaw: 1.5708, pitch: 0.02 },
  insight_wall: { x: -11.5, z: 6.5, yaw: -1.5708, pitch: 0.02 },
};
const profile = opt.profile ?? 'BACKUP';
const names = (opt.views ?? 'spawn,console').split(',');
const out = opt.out ?? 'output/playwright/art';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: opt.headed !== '1', args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: Number(opt.w ?? 1280), height: Number(opt.h ?? 720) }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(opt.url ?? 'http://127.0.0.1:5173/');
await page.waitForFunction(() => Boolean(window.__voraxArt), null, { timeout: 90_000 });
await page.evaluate(() => { document.querySelector('#ui').style.display = 'none'; });
const stats = {};
for (const name of names) {
  const v = VIEWS[name];
  if (!v) throw new Error(`unknown view ${name}`);
  await page.evaluate(({ v, profile, flash, open, rescue }) => {
    const { scene, art } = window.__voraxArt;
    art.preview(profile);
    const cam = scene.activeCamera;
    cam.position.set(v.x, 1.65, v.z);
    cam.rotation.set(v.pitch, v.yaw, 0);
    scene.getLightByName('PROVISIONAL-flashlight')?.setEnabled(flash);
    for (const node of scene.transformNodes) if (/door__leaf_[LR]$/.test(node.name)) node.setEnabled(!open);
    if (rescue) { // art review of the ending: place Rescue One at its final approach point with the searchlight on
      const ship = scene.getTransformNodeByName('anchor:rescue-one');
      const light = scene.getLightByName('RescueOne-searchlight');
      if (ship && light) {
        ship.setEnabled(true); ship.position.set(0, 2.5, 40);
        light.position.set(0, 3.3, 37.5); light.direction.copyFrom(cam.position.subtract(light.position).normalize()); light.intensity = 8;
      }
    }
  }, { v, profile, flash: opt.flash !== '0', open: opt.open === '1', rescue: opt.rescue === '1' });
  await page.waitForTimeout(Number(opt.wait ?? 2600));
  const file = join(out, `${profile.toLowerCase()}_${name}${opt.flash === '0' ? '_noflash' : ''}.png`);
  await page.locator('#scene').screenshot({ path: file });
  stats[name] = await page.evaluate(() => { const d = document.querySelector('#scene').dataset; return { fps: d.fps, triangles: d.triangles, meshes: d.meshes }; });
  console.log(name, JSON.stringify(stats[name]), file);
}
writeFileSync(join(out, `${profile.toLowerCase()}_stats.json`), JSON.stringify({ profile, stats, errors }, null, 1));
if (errors.length) console.log('PAGE ERRORS:', [...new Set(errors)].slice(0, 6));
await browser.close();

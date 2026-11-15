import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import {skipAwakening,finishSequence,reachMonologue} from './cinematics';

// All progression uses normal controls and UI. Canvas attributes are observation-only:
// no teleports, imported save stages, reducer dispatch, or mutable debug APIs.
type Pose = { t: number; x: number; z: number; yaw: number; pitch: number; stage: string; mode: string };
const shots = 'output/playwright';
const phaseShots = 'output/playwright/overhaul/phase3';
const angle = (value: number): number => Math.atan2(Math.sin(value), Math.cos(value));
async function pose(page: Page): Promise<Pose> {
  return page.locator('#scene').evaluate((element) => {
    const d = (element as HTMLCanvasElement).dataset;
    return { t: performance.now(), x: Number(d.x), z: Number(d.z), yaw: Number(d.yaw), pitch: Number(d.pitch), stage: d.stage ?? '', mode: d.mode ?? '' };
  });
}
async function start(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Enter archive', exact: true })).toBeVisible();
  await page.getByText('Settings', { exact: true }).click();
  await page.getByLabel('Look mode', { exact: true }).selectOption('keyboard');
  await page.getByLabel('Quality', { exact: true }).selectOption('low');
  await page.getByRole('button', { name: 'Enter archive', exact: true }).click();
  await skipAwakening(page);
}
async function turn(page: Page, target: number): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const p = await pose(page);
    const delta = angle(target - p.yaw);
    if (Math.abs(delta) < 0.035) return;
    const key = delta > 0 ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.down(key);
    await page.waitForTimeout(Math.max(18, Math.min(600, Math.abs(delta) / 1.5 * 850)));
    await page.keyboard.up(key);
  }
  throw new Error(`Cannot turn toward ${target}; observed ${JSON.stringify(await pose(page))}`);
}
async function walk(page: Page, x: number, z: number, allowRescue = false): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const p = await pose(page);
    if(allowRescue && p.stage==='RESCUE' && p.mode==='CINEMATIC')return;
    expect(p.mode, 'Navigation must remain in PLAYING mode').toBe('PLAYING');
    const distance = Math.hypot(x - p.x, z - p.z);
    if (distance < 0.14) return;
    await turn(page, Math.atan2(x - p.x, z - p.z));
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(Math.max(25, Math.min(800, distance / 1.8 * 800)));
    await page.keyboard.up('KeyW');
  }
  throw new Error(`Blocked walking toward ${x},${z}; observed ${JSON.stringify(await pose(page))}`);
}
async function path(page: Page, points: [number, number][]): Promise<void> {
  for (const [x, z] of points) await walk(page, x, z);
}
async function inspect(page: Page, x: number, z: number, puzzle: string): Promise<void> {
  const p = await pose(page);
  await turn(page, Math.atan2(x - p.x, z - p.z));
  await expect(page.locator('.interaction')).toContainText('E —');
  await page.keyboard.press('KeyE');
  await expect(page.locator('.panel')).toHaveAttribute('data-puzzle', puzzle);
  await expect(page.locator('#scene')).toHaveAttribute('data-mode', 'TERMINAL');
}
async function resume(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Return to archive', exact: true }).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-mode', 'PLAYING');
}
async function solve(page: Page, id: string, answers: Record<string, string>, label: string, stage: string): Promise<void> {
  if(id!=='PZ-00') await page.getByRole('button',{name:'Reconstruction',exact:true}).click();
  for (const [field, value] of Object.entries(answers)) {
    await page.locator('.panel').locator(`input[type="radio"][name="${field}"][value="${value}"]`).check();
  }
  await page.getByRole('button', { name: label, exact: true }).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-stage', stage);
}
function errors(page: Page): string[] {
  const result: string[] = [];
  page.on('pageerror', (error) => result.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') result.push(message.text()); });
  return result;
}

// Physical Opportunity-first route; story cannot end at the final scientific terminal.
test('survivor awakens, restores both missions, walks to observation and is rescued', async ({ page }) => {
  const runtimeErrors=errors(page);await mkdir(shots,{recursive:true});await mkdir(phaseShots,{recursive:true});
  await start(page);
  await page.screenshot({path:`${shots}/e2e-airlock.png`});
  await expect(page.locator('.interaction')).toBeEmpty();
  await page.keyboard.press('KeyE');
  await expect(page.locator('#scene')).toHaveAttribute('data-mode','PLAYING');
  await walk(page,1.15,-4.72);await inspect(page,1.8,-4,'PZ-00');
  await solve(page,'PZ-00',{backup:'on'},'Confirm','ARCHIVE_OPEN');
  await page.getByRole('button',{name:'Return to archive',exact:true}).click();
  await finishSequence(page,/CHAPTER I.*THE FORGOTTEN/s);
  await path(page,[[0,-3],[0,1],[0,6.5],[8.5,6.5],[10.9,7]]);
  await inspect(page,12,7,'PZ-02');
  await page.getByRole('button',{name:"PIA05584 — 'Berries' and Rock Share Common Origins",exact:true}).click();
  const record=page.locator('[data-record="R-PIA05584"]');const picture=record.locator('img');
  await expect(picture).toBeVisible();
  await expect.poll(async()=>picture.evaluate(image=>(image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(record).toContainText('NASA/JPL/Cornell');await expect(record).toContainText('False-color composite');
  await page.screenshot({path:`${shots}/e2e-opportunity-evidence.png`});
  await record.locator('figcaption').scrollIntoViewIfNeeded();await expect(record.locator('figcaption')).toBeVisible();
  await solve(page,'PZ-02',{camera:'pancam',minerals:'mb',conclusion:'water'},'Restore record','OPPORTUNITY_RESTORED');
  await page.getByRole('button',{name:'Return to archive',exact:true}).click();
  await expect(page.getByRole('heading',{name:/CHAPTER II.*BENEATH THE SILENCE/s})).toBeVisible();
  await expect(page.locator('#scene')).toHaveAttribute('data-cinematic','chapterTwo');
  await page.waitForTimeout(3200);
  expect(await page.locator('#ui').evaluate(e=>Number((e as HTMLElement).style.getPropertyValue('--recovery')))).toBeLessThan(0.2);
  await page.screenshot({path:`${shots}/e2e-chapter-two.png`});
  await finishSequence(page,/CHAPTER II.*BENEATH THE SILENCE/s);
  await expect(page.locator('#scene')).toHaveAttribute('data-stage','CHAPTER_TWO');
  await path(page,[[8.5,6.5],[0,6.5],[-8.5,6.5],[-10.9,7]]);
  await inspect(page,-12,7,'PZ-01');
  await page.getByRole('button',{name:"One of InSight's last images",exact:true}).click();
  const insightImage=page.locator('[data-record="R-INSIGHT-IMAGE"]');
  await expect(insightImage.locator('img')).toBeVisible();
  await expect.poll(async()=>insightImage.locator('img').evaluate(image=>(image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(insightImage).toContainText('PIA25680');
  await expect(insightImage.locator('figcaption')).toHaveText("One of InSight's last images, 11 December 2022 (sol 1436). Credit: NASA/JPL-Caltech.");
  await insightImage.locator('figcaption').scrollIntoViewIfNeeded();
  await expect(insightImage.locator('figcaption')).toBeVisible();
  await page.screenshot({path:`${phaseShots}/insight-image.png`});
  await page.getByRole('button',{name:'InSight lander — catalog record',exact:true}).click();
  await expect(page.locator('[data-record="R-INSIGHT"]')).toContainText('2018-042A');
  await expect(page.locator('[data-record="R-INSIGHT"] a').first()).toHaveAttribute('href',/2018-042A/);
  await solve(page,'PZ-01',{instrument:'solar',records:'energy',purpose:'power'},'Restore record','CHAPTER_TWO');
  await expect(page.getByText('Check the evidence and try again.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Hint (H)',exact:true}).click();await expect(page.locator('.hint')).toContainText('NASA catalog');
  await solve(page,'PZ-01',{instrument:'seis',records:'motion',purpose:'interior'},'Restore record','INSIGHT_RESTORED');
  await expect(page.locator('.panel [aria-invalid="true"]')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'InSight — what it leaves behind',exact:true})).toBeVisible();
  await page.reload();await page.getByRole('button',{name:'Continue saved game',exact:true}).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-stage','INSIGHT_RESTORED');expect((await pose(page)).x).toBeCloseTo(-9,1);
  await page.keyboard.press('KeyJ');
  await expect(page.getByRole('heading',{name:'Archive journal',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Records',exact:true}).click();
  await page.getByRole('button',{name:"About the 'sounds' of SEIS",exact:true}).click();
  const seisRecord=page.locator('[data-record="R-SEIS-SOUND"]');
  await expect(seisRecord).toContainText('Sped up and slightly processed to be audible (sonification)');
  const mechanism=seisRecord.getByText("MECHANISM: When NASA shares the 'sound' of a marsquake, it is a sonification: SEIS ground-motion data, sped up and processed until people can hear it.",{exact:true});
  await mechanism.scrollIntoViewIfNeeded();await expect(mechanism).toBeVisible();
  await expect(seisRecord).toContainText('A microphone recording of sound in the air');
  await expect(seisRecord).toContainText('This archive plays no NASA audio. Every sound in the station was synthesized for this fictional story.');
  await page.screenshot({path:`${phaseShots}/journal-seis.png`});
  const seisSource=seisRecord.getByRole('link',{name:'Primary source · N06',exact:true});
  await expect(seisSource).toHaveAttribute('href','https://www.jpl.nasa.gov/news/nasas-insight-hears-peculiar-sounds-on-mars/');
  await seisSource.scrollIntoViewIfNeeded();await expect(seisSource).toBeVisible();
  await seisRecord.getByText('Usage conditions and evidence IDs',{exact:true}).click();
  const usage=seisRecord.getByText('NASA content, used for factual educational purposes with credit. No NASA endorsement is implied. See NASA Images and Media Guidelines.',{exact:true});
  await usage.scrollIntoViewIfNeeded();await expect(usage).toBeVisible();
  await expect(seisRecord).toContainText('F08 · F13');
  await expect(page.locator('#scene')).toHaveAttribute('data-stage','INSIGHT_RESTORED');
  await page.screenshot({path:`${phaseShots}/journal-seis-source.png`});
  await resume(page);
  await path(page,[[-8.5,6.5],[0,6.5],[0,14.9]]);await inspect(page,0,16,'PZ-03');
  await expect(page.locator('.diagnostic')).toContainText('LOCAL QUEUE');
  await solve(page,'PZ-03',{'card-seis':'fact','card-queue':'fiction','card-alive':'unsupported'},'Check provenance','READY_TO_PRESERVE');
  await page.getByRole('button',{name:'Activate distress beacon',exact:true}).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-stage','EPILOGUE');
  await reachMonologue(page);
  // An interrupted reflection replays safely; it must never jump to THE END.
  await page.reload();await page.getByRole('button',{name:'Continue saved game',exact:true}).click();
  await reachMonologue(page);
  const monologue=[
    'I used to think that silence meant the end.',
    'That once a machine stopped moving, once its last signal faded into the dark, everything it had been was lost.',
    'But I was wrong.',
    'Opportunity left us the history of a world shaped by water. InSight taught us to listen to the depths of another planet.',
    'Their voices fell silent. Their discoveries did not.',
    "Perhaps being forgotten isn't the same as being left behind.",
    "And perhaps… I'm not as alone as I thought.",
  ];
  for(const line of monologue){await expect(page.locator('.cinematic-line')).toHaveText(line);await page.getByRole('button',{name:'Continue',exact:true}).click();}
  await expect(page.locator('#scene')).toHaveAttribute('data-stage','OBSERVATION');
  await expect(page.locator('#scene')).toHaveAttribute('data-mode','PLAYING');
  await expect(page.locator('.objective')).toHaveText('REACH THE OBSERVATION DECK.');
  await expect(page.getByRole('heading',{name:'THE END',exact:true})).not.toBeVisible();
  await path(page,[[2.7,15],[2.7,23.4]]);await walk(page,0,26,true);
  await expect(page.locator('#scene')).toHaveAttribute('data-stage','RESCUE');
  await expect(page.locator('#scene')).toHaveAttribute('data-mode','CINEMATIC');
  await expect(page.locator('#scene')).toHaveAttribute('data-rescue-visible','true');
  await expect(page.locator('#scene')).toHaveAttribute('data-searchlight','true');
  const rescueBefore=Number(await page.locator('#scene').getAttribute('data-rescue-z'));
  await page.waitForTimeout(1800);
  const rescueAfter=Number(await page.locator('#scene').getAttribute('data-rescue-z'));
  expect(Math.abs(rescueAfter-rescueBefore)).toBeGreaterThan(0.05);
  expect(Number(await page.locator('#scene').getAttribute('data-searchlight-direction-z'))).toBeLessThan(0);
  await page.screenshot({path:`${shots}/e2e-rescue-window.png`});
  await expect(page.locator('.cinematic-line')).toContainText('approaching spacecraft');
  const spokenBeforeRadio=Number(await page.locator('#scene').getAttribute('data-spoken-lines'));
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.locator('.cinematic-line')).toHaveText('Unidentified survivor aboard the vessel, this is Rescue One. We have visual confirmation. Hold your position.');
  // On this machine the headed run also verifies native speech's real onstart,
  // without substituting a mock voice. Captions remain required on every browser.
  if(process.env.VORAX_HEADED){
    const availableVoices=await page.evaluate(()=>window.speechSynthesis?.getVoices().length??0);
    expect(availableVoices,'The headed voice check requires an installed platform voice').toBeGreaterThan(0);
    await expect.poll(async()=>Number(await page.locator('#scene').getAttribute('data-spoken-lines'))).toBeGreaterThan(spokenBeforeRadio);
    await test.info().attach('rescue-radio-native-speech',{body:JSON.stringify({availableVoices,spokenBeforeRadio,spokenAfterRadio:await page.locator('#scene').getAttribute('data-spoken-lines'),status:await page.locator('#scene').getAttribute('data-speech')}),contentType:'application/json'});
  }
  const spokenBeforeReply=Number(await page.locator('#scene').getAttribute('data-spoken-lines'));
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.locator('.cinematic-line')).toHaveText("I'm here.");
  if(process.env.VORAX_HEADED)await expect.poll(async()=>Number(await page.locator('#scene').getAttribute('data-spoken-lines'))).toBeGreaterThan(spokenBeforeReply);
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.getByRole('heading',{name:'THE END',exact:true})).toBeVisible();
  await expect(page.locator('.overlay')).toHaveCSS('background-color','rgb(0, 0, 0)');
  await expect(page.locator('#scene')).toHaveAttribute('data-stage','COMPLETE');
  await page.screenshot({path:`${shots}/e2e-complete.png`});
  await page.getByRole('button',{name:'CREDITS',exact:true}).click();
  await expect(page.getByRole('heading',{name:'CREDITS',exact:true})).toBeVisible();
  await expect(page.getByText('Not an official NASA product. NASA does not endorse this project.',{exact:true})).toBeVisible();
  await expect(page.getByText('PIA05584 — NASA/JPL/Cornell. PIA25680 — NASA/JPL-Caltech. Credits, transformations and usage conditions are displayed with each record.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'RESTART',exact:true}).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-stage','ARRIVAL');
  await expect(page.getByRole('heading',{name:/PROLOGUE.*THE AWAKENING/s})).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test('real controls respect walls, locked door, pause, flashlight and journal', async ({ page }) => {
  const runtimeErrors = errors(page);
  await start(page);
  await turn(page, 0);
  // Sample while the key is held; normalize by timestamps from the browser,
  // rather than assuming protocol round trips lasted exactly waitForTimeout(500).
  await page.keyboard.down('KeyW');
  const walkingStart=await pose(page);
  await page.waitForTimeout(500);
  const walkingEnd=await pose(page);
  await page.keyboard.up('KeyW');
  await page.keyboard.down('KeyS');await page.waitForTimeout(500);await page.keyboard.up('KeyS');
  await page.keyboard.down('ShiftLeft');await page.keyboard.down('KeyW');
  await expect(page.locator('#scene')).toHaveAttribute('data-sprinting','true');
  const runningStart=await pose(page);
  await page.waitForTimeout(500);
  const runningEnd=await pose(page);
  await page.keyboard.up('KeyW');await page.keyboard.up('ShiftLeft');
  const walkingDistance=Math.hypot(walkingEnd.x-walkingStart.x,walkingEnd.z-walkingStart.z);
  const runningDistance=Math.hypot(runningEnd.x-runningStart.x,runningEnd.z-runningStart.z);
  const walkingSeconds=(walkingEnd.t-walkingStart.t)/1000;
  const runningSeconds=(runningEnd.t-runningStart.t)/1000;
  const walkingSpeed=walkingDistance/walkingSeconds;
  const runningSpeed=runningDistance/runningSeconds;
  await test.info().attach('observed-walk-sprint-speeds',{body:JSON.stringify({walkingDistance,runningDistance,walkingSeconds,runningSeconds,walkingSpeed,runningSpeed}),contentType:'application/json'});
  expect(walkingDistance).toBeGreaterThan(0.3);
  expect(runningDistance).toBeGreaterThan(0.3);
  expect(runningSpeed).toBeGreaterThan(1.3*walkingSpeed);
  await page.keyboard.down('ShiftLeft');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(1800);
  await page.keyboard.up('KeyW');await page.keyboard.up('ShiftLeft');
  const atDoor = await pose(page);
  expect(atDoor.z).toBeGreaterThan(-3);
  expect(atDoor.z).toBeLessThan(-1.4);
  await walk(page, 0, -6);
  await turn(page, -Math.PI / 2);
  await page.keyboard.down('KeyW');
  await page.keyboard.down('ShiftLeft');
  await page.waitForTimeout(3000);
  await page.keyboard.up('ShiftLeft');
  await page.keyboard.up('KeyW');
  const atWall = await pose(page);
  expect(atWall.x).toBeGreaterThan(-3);
  expect(atWall.x).toBeLessThan(-2.5);
  await expect(page.locator('.interaction')).toBeEmpty();
  await page.keyboard.press('KeyE');
  await expect(page.locator('#scene')).toHaveAttribute('data-mode', 'PLAYING');
  await expect(page.locator('#scene')).toHaveAttribute('data-stage', 'ARRIVAL');
  await page.keyboard.down('KeyA');
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(700);
  await page.keyboard.up('KeyA');
  await page.keyboard.up('KeyS');
  const moved = await pose(page);
  expect(Math.hypot(moved.x - atWall.x, moved.z - atWall.z)).toBeGreaterThan(0.2);
  await page.keyboard.press('KeyF');
  await expect(page.locator('#scene')).toHaveAttribute('data-flashlight', 'false');
  await page.keyboard.press('KeyF');
  await expect(page.locator('#scene')).toHaveAttribute('data-flashlight', 'true');
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(100);
  await page.keyboard.up('ArrowDown');
  await expect.poll(async () => (await pose(page)).pitch).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Archive paused', exact: true })).toBeVisible();
  const paused = await pose(page);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(300);
  await page.keyboard.up('KeyW');
  const after = await pose(page);
  expect(after.x).toBeCloseTo(paused.x, 3);
  expect(after.z).toBeCloseTo(paused.z, 3);
  await resume(page);
  await page.keyboard.press('KeyJ');
  await expect(page.getByRole('heading', { name: 'Archive journal', exact: true })).toBeVisible();
  const map=page.getByRole('figure',{name:'Archive map',exact:true});
  await expect(map).toBeVisible();
  await expect(map).toContainText('INSIGHT');
  await page.keyboard.press('Escape');
  await expect(page.locator('#scene')).toHaveAttribute('data-mode', 'PAUSED');
  expect(runtimeErrors).toEqual([]);
});

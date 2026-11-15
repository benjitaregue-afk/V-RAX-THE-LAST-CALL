import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {skipAwakening} from './cinematics';

test('native pointer capture and mouse-look, or explicit unsupported automation limit',async({page})=>{
  await page.goto('/');await page.bringToFront();
  await page.getByRole('button',{name:'Enter archive',exact:true}).click();
  await expect(page.getByRole('heading',{name:/PROLOGUE.*THE AWAKENING/s})).toBeVisible();
  await page.getByRole('button',{name:'Skip sequence',exact:true}).click();
  await page.waitForTimeout(300);
  const captured=await page.evaluate(()=>document.pointerLockElement?.id==='scene');
  test.skip(!captured,'Native pointer capture rejected by this automated browser; keyboard recovery is tested separately.');
  const before=Number(await page.locator('#scene').getAttribute('data-yaw'));
  await page.mouse.move(640,360);await page.mouse.move(770,390);await page.waitForTimeout(150);
  const after=Number(await page.locator('#scene').getAttribute('data-yaw'));
  expect(Math.abs(after-before)).toBeGreaterThan(0.01);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading',{name:'Archive paused',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.pointerLockElement)).toBeNull();
});

test('opening visibly raises a provisional hand and stands up while movement is locked',async({page})=>{
  await page.goto('/');
  await page.getByText('Settings',{exact:true}).click();
  await page.getByLabel('Look mode',{exact:true}).selectOption('keyboard');
  await page.getByRole('button',{name:'Enter archive',exact:true}).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-cinematic','awakening');
  await expect(page.locator('#scene')).toHaveAttribute('data-hand-animation','Awaken');
  const height=Number(await page.locator('#scene').getAttribute('data-eye-height'));
  expect(height).toBeLessThan(.5);
  const x=Number(await page.locator('#scene').getAttribute('data-x'));
  const z=Number(await page.locator('#scene').getAttribute('data-z'));
  await page.keyboard.down('KeyW');await page.waitForTimeout(500);await page.keyboard.up('KeyW');
  expect(Number(await page.locator('#scene').getAttribute('data-x'))).toBeCloseTo(x,3);
  expect(Number(await page.locator('#scene').getAttribute('data-z'))).toBeCloseTo(z,3);
  await expect(page.locator('#scene')).toHaveAttribute('data-hand-animation','StandUp',{timeout:5000});
  await page.waitForTimeout(1200);await page.screenshot({path:'output/playwright/e2e-awakening-stand.png'});
  await expect.poll(async()=>Number(await page.locator('#scene').getAttribute('data-eye-height')),{timeout:5000}).toBeGreaterThan(1.6);
  await page.getByRole('button',{name:'Skip sequence',exact:true}).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-mode','PLAYING');
  await expect(page.locator('#scene')).toHaveAttribute('data-hand-animation','Idle');
});

test('records a short real-render profile without claiming minimum-laptop acceptance',async({page,browserName})=>{
  await page.goto('/');
  await page.getByText('Settings',{exact:true}).click();
  await page.getByLabel('Look mode',{exact:true}).selectOption('keyboard');
  await page.getByLabel('Quality',{exact:true}).selectOption('low');
  await page.getByRole('button',{name:'Enter archive',exact:true}).click();
  await skipAwakening(page);
  await page.waitForTimeout(1000);
  const profile=await page.evaluate(async()=>{
    const canvas=document.querySelector<HTMLCanvasElement>('#scene')!;
    const gl=canvas.getContext('webgl2')!;
    const debug=gl.getExtension('WEBGL_debug_renderer_info');
    const samples:number[]=[];const began=performance.now();let last=began;
    await new Promise<void>(resolve=>{
      const frame=(now:number)=>{samples.push(now-last);last=now;if(now-began>=30000)resolve();else requestAnimationFrame(frame);};
      requestAnimationFrame(frame);
    });
    samples.sort((a,b)=>a-b);
    return {durationMs:last-began,frames:samples.length,medianFrameMs:samples[Math.floor(samples.length/2)],p95FrameMs:samples[Math.floor(samples.length*.95)],renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],quality:'low',zone:'stationary AIRLOCK',activeTriangles:Number(canvas.dataset.triangles),sceneMeshes:Number(canvas.dataset.meshes)};
  });
  await mkdir('output/playwright',{recursive:true});
  await writeFile('output/playwright/render-profile.json',JSON.stringify({browserName,...profile,scope:'30-second stationary smoke profile; not the 3-minute representative laptop acceptance test'},null,2));
  expect(profile.frames).toBeGreaterThan(0);
  await expect(page.locator('#scene')).toHaveAttribute('data-mode','PLAYING');
  await page.screenshot({path:'output/playwright/greybox-profile.png'});
});

import {test,expect} from '@playwright/test';

// A tiny test-only triangle GLB, served by interception. No production art is generated.
function fixture():Buffer{
  const bin=Buffer.alloc(44);
  [-0.5,0,0,0.5,0,0,0,1,0].forEach((n,i)=>bin.writeFloatLE(n,i*4));
  [0,1,2].forEach((n,i)=>bin.writeUInt16LE(n,36+i*2));
  const data={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name:'QA-triangle'}],meshes:[{primitives:[{attributes:{POSITION:0},indices:1}]}],buffers:[{byteLength:44}],bufferViews:[{buffer:0,byteOffset:0,byteLength:36},{buffer:0,byteOffset:36,byteLength:6}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-0.5,0,0],max:[0.5,1,0]},{bufferView:1,componentType:5123,count:3,type:'SCALAR'}]};
  const source=JSON.stringify(data);const json=Buffer.from(source.padEnd(Math.ceil(Buffer.byteLength(source)/4)*4,' '));
  const h=Buffer.alloc(12);h.writeUInt32LE(0x46546c67);h.writeUInt32LE(2,4);h.writeUInt32LE(12+8+json.length+8+bin.length,8);
  const jh=Buffer.alloc(8);jh.writeUInt32LE(json.length);jh.writeUInt32LE(0x4e4f534a,4);
  const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);
  return Buffer.concat([h,jh,json,bh,bin]);
}
test('actual GLB loader replaces a visual while the game stays at the same spawn/stage',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/visual-assets.json',route=>route.fulfill({json:{switch:'assets/models/qa-switch.glb'}}));
  await page.route('**/assets/models/qa-switch.glb',route=>route.fulfill({contentType:'model/gltf-binary',body:fixture()}));
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Enter archive',exact:true})).toBeVisible();
  await expect(page.locator('#scene')).toHaveAttribute('data-production-visuals','switch',{timeout:30000});
  await expect(page.locator('#scene')).toHaveAttribute('data-stage','ARRIVAL');
  await expect(page.locator('#scene')).toHaveAttribute('data-z','-6.0000');
  expect(errors).toEqual([]);
});
test('missing optional GLB keeps a playable greybox without blocking boot',async({page})=>{
  await page.route('**/visual-assets.json',route=>route.fulfill({json:{switch:'assets/models/missing.glb'}}));
  await page.route('**/assets/models/missing.glb',route=>route.abort());
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Enter archive',exact:true})).toBeVisible();
  await expect(page.getByRole('status')).toContainText('using provisional geometry');
  await expect(page.locator('#scene')).toHaveAttribute('data-production-visuals','');
});

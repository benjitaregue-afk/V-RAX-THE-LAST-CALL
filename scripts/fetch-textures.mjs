// Downloads the CC0 PBR texture sources used by the Blender art pipeline from Poly Haven
// (https://polyhaven.com/license — CC0) into assets/textures/polyhaven/ and records
// provenance (URL, author, SHA-256, size) in assets/textures/polyhaven/SOURCES.json.
// These are source files for Blender; the game only ships what the GLB export embeds.
//   node scripts/fetch-textures.mjs
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'assets/textures/polyhaven');
const IDS = ['blue_metal_plate', 'metal_plate', 'metal_grate_rusty', 'rusty_metal_02', 'green_metal_rust', 'metal_plate_02', 'container_side'];
const MAPS = { Diffuse: 'diff', nor_gl: 'nor_gl', arm: 'arm' };
const headers = { 'User-Agent': 'Mozilla/5.0 (texture fetch for an offline art build)' };

const getJson = async (url) => {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return r.json();
};

const records = [];
for (const id of IDS) {
  const [files, info] = await Promise.all([getJson(`https://api.polyhaven.com/files/${id}`), getJson(`https://api.polyhaven.com/info/${id}`)]);
  mkdirSync(join(outDir, id), { recursive: true });
  for (const [map, short] of Object.entries(MAPS)) {
    const entry = files[map]?.['1k']?.jpg;
    if (!entry) throw new Error(`${id}: no 1k jpg for ${map}`);
    const file = join(outDir, id, `${id}_${short}_1k.jpg`);
    if (!existsSync(file)) {
      const r = await fetch(entry.url, { headers });
      if (!r.ok) throw new Error(`${entry.url} -> HTTP ${r.status}`);
      writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    }
    const data = readFileSync(file);
    records.push({
      asset: id,
      map,
      file: `assets/textures/polyhaven/${id}/${id}_${short}_1k.jpg`,
      downloadUrl: entry.url,
      page: `https://polyhaven.com/a/${id}`,
      authors: Object.keys(info.authors ?? {}),
      license: 'CC0 1.0 (Poly Haven asset licence)',
      realWorldSizeMm: info.dimensions ?? null,
      bytes: data.length,
      sha256: createHash('sha256').update(data).digest('hex'),
    });
  }
  console.log(`${id}: ok (${Object.keys(info.authors ?? {}).join(', ')})`);
}
writeFileSync(join(outDir, 'SOURCES.json'), JSON.stringify({ retrievedAt: new Date().toISOString().slice(0, 10), licensePage: 'https://polyhaven.com/license', files: records }, null, 2) + '\n');
console.log(`${records.length} files, ${(records.reduce((n, r) => n + r.bytes, 0) / 1048576).toFixed(1)} MiB`);

// Writes src/content/asset-hashes.json: SHA-256 and size of every file served from public/assets.
// Run after exporting models or admitting an asset: `npm run assets:hash`.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

function walk(dir) {
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
}

const out = {};
for (const file of walk(join(publicDir, 'assets')).sort()) {
  const data = readFileSync(file);
  out[relative(publicDir, file).split(sep).join('/')] = {
    sha256: createHash('sha256').update(data).digest('hex'),
    bytes: data.length,
  };
}
writeFileSync(join(root, 'src/content/asset-hashes.json'), JSON.stringify(out, null, 2) + '\n');
const total = Object.values(out).reduce((n, v) => n + v.bytes, 0);
console.log(`${Object.keys(out).length} files, ${(total / 1024).toFixed(1)} KiB -> src/content/asset-hashes.json`);

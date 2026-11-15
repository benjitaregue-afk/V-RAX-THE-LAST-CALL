// Provenance record for every file served from public/assets (ASSET_MANIFEST.md rules).
// Hashes live in asset-hashes.json, written by `npm run assets:hash` and checked by tests.

import type { AssetRecord } from '../game/contracts';
import { MODEL_IDS } from '../world/layout';
import type { ModelId } from '../world/layout';
import { NASA_USAGE_TERMS, SOURCES } from './claims';

const ORIGINAL_RIGHTS =
  'Original work made for this project. MIT licence proposed by the team, not yet adopted. No NASA logo, flag, patch or mission branding.';
const ORIGINAL_CREDIT = 'VØRAX team — modelled procedurally in Blender 5.3 with AI assistance (Claude)';

const MODEL_TITLES: Record<ModelId, string> = {
  terminal: 'Archive terminal console',
  switch: 'Backup power cabinet with lever',
  door: 'Sliding bulkhead door and frame',
  rack: 'Archive storage rack',
  pedestal: 'Exhibit plinth',
  insight: 'Illustrative InSight display: stylized SEIS dome, tether and solar-panel fragment',
  opportunity: 'Illustrative Opportunity display: wheel, panel fragment and rock relief with spherules',
  relay: 'Fictional relay mechanism',
  arm: 'Ceiling maintenance arm',
  fan: 'Wall ventilation unit with fan',
  lamp: 'Ceiling lamp',
  rib: 'Wall rib',
  crate: 'Storage crate',
  tray: 'Ceiling cable tray',
  rescue: 'Fictional Rescue One spacecraft — future production model',
};

export const MODEL_ASSETS: AssetRecord[] = MODEL_IDS.map((id) => ({
  id: `GLB-${id}`,
  path: `assets/models/${id}.glb`,
  kind: 'model' as const,
  title: MODEL_TITLES[id],
  sourceUrl: 'assets/blender/vorax_kit.blend',
  rights: ORIGINAL_RIGHTS,
  credit: ORIGINAL_CREDIT,
  aiAssisted: true,
  derivedFrom: 'assets/blender/scripts/build_kit.py',
  transforms: ['Exported from Blender as binary glTF 2.0, +Y up, palette textures embedded'],
  fallback: 'Plain box of the same footprint; collision and interaction do not depend on the file.',
}));

export const IMAGE_ASSETS: AssetRecord[] = [
  {
    id: 'IMG01',
    path: 'assets/nasa/pia05584.jpg',
    kind: 'image',
    title: "PIA05584 — 'Berries' and Rock Share Common Origins",
    sourceUrl: SOURCES.N09!.url,
    rights: NASA_USAGE_TERMS,
    credit: 'NASA/JPL/Cornell',
    aiAssisted: false,
    derivedFrom: 'assets/research/nasa/PIA05584.jpg (895×726 JPEG, as published)',
    transforms: ['None. Byte-identical copy of the published JPEG; not cropped, recolored or resized.'],
    fallback: 'Reviewed text description with product ID, instrument and credit.',
  },
  {
    id: 'IMG02',
    path: 'assets/nasa/insight-pia25680.jpg',
    kind: 'image',
    title: "PIA25680 — One of InSight's Last Images",
    sourceUrl: SOURCES.N07!.url,
    rights: NASA_USAGE_TERMS,
    credit: 'NASA/JPL-Caltech',
    aiAssisted: false,
    derivedFrom: 'assets/research/nasa/PIA25680.png (1024×1024 PNG, as published)',
    transforms: ['Re-encoded from PNG to JPEG (quality 88) at the same 1024×1024 size to meet the 1 MiB budget. Not cropped or recolored.'],
    fallback: 'Reviewed text description with product ID, date and credit.',
  },
];

// MODEL_ASSETS preserves Claude's proposed exports, not files already delivered.
// Admit each GLB here only after export, rights review and assets:hash. Greybox
// rendering does not claim a missing production model has been generated.
export const ASSETS: AssetRecord[] = [...IMAGE_ASSETS];

export function assetById(id: string): AssetRecord {
  const a = ASSETS.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown asset ${id}`);
  return a;
}

/** SHA-256 of the unmodified research originals, kept outside the served bundle. */
export const RESEARCH_ORIGINALS: { file: string; sha256: string; bytes: number; downloadUrl: string }[] = [
  {
    file: 'assets/research/nasa/PIA05584.jpg',
    sha256: '3d2cedbae6dacee310823405f9f8fb30a08ac917dce93ba836565ae0cc2ff915',
    bytes: 155062,
    downloadUrl: 'https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia05/pia05584/PIA05584.jpg',
  },
  {
    file: 'assets/research/nasa/PIA25680.png',
    sha256: '5965dfad2c634f4397874b4d649cf18566e13837720cd0aca7e71297d8fdf491',
    bytes: 1257878,
    downloadUrl: 'https://assets.science.nasa.gov/content/dam/science/psd/mars/downloadable_items/4/7/47862_PIA25680.png',
  },
];

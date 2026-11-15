// Provenance record for every file served from public/assets (ASSET_MANIFEST.md rules).
// Hashes live in asset-hashes.json, written by `npm run assets:hash` and checked by tests.
// Only files that exist are listed: a record here is a claim that the export was delivered.

import type { AssetRecord } from '../game/contracts';
import { NASA_USAGE_TERMS, SOURCES } from './claims';

const ORIGINAL_RIGHTS =
  'Original work made for this project. MIT licence proposed by the team, not yet adopted. No NASA logo, flag, patch or mission branding.';
const ORIGINAL_CREDIT = 'VØRAX team — built procedurally in Blender 5.3 with AI assistance (Claude)';
const TEXTURE_NOTE =
  'Surface textures derive from Poly Haven CC0 materials (Rob Tuytel, Dimitrios Savva), colour-graded; see assets/textures/polyhaven/SOURCES.json.';
const BLEND = 'assets/blender/vorax_station.blend';
const PIPELINE = 'assets/blender/scripts/build_station.py';
/** Revision r2 (2026-11-15): observation window, deck exterior light and Rescue One are authored by this pass. */
const ENDING_PASS = 'assets/blender/scripts/station_ending.py';

/** Zones that have baked lighting and a reflection probe. */
export const ART_ZONES = ['airlock', 'hub', 'insight', 'opportunity', 'relay', 'observation'] as const;

const model = (file: string, title: string, transforms: string[], fallback: string): AssetRecord => ({
  id: `GLB-${file}`,
  path: `assets/models/${file}.glb`,
  kind: 'model',
  title,
  sourceUrl: BLEND,
  rights: ORIGINAL_RIGHTS,
  credit: ORIGINAL_CREDIT,
  aiAssisted: true,
  derivedFrom: PIPELINE,
  transforms,
  fallback,
});

export const MODEL_ASSETS: AssetRecord[] = [
  {
    ...model(
    'environment',
    'Station shell and set dressing: six zones and observation exterior depth',
    ['Exported from Blender as binary glTF 2.0, +Y up, textures embedded as WebP', TEXTURE_NOTE, `Observation deck window recomposed in revision r2 (${ENDING_PASS})`, 'Revision r3: exterior service boom, radiator and hull shoulder added through Blender MCP by Codex; 2,396 triangles, two materials, linked repeated meshes, tiled UVs and vertex paint. Source: assets/blender/scripts/station_exterior.py. Existing interior primitives and lightmaps preserved.'],
    'Greybox shell from the collision layout; the game stays fully playable without this file.',
  ),
    credit: `${ORIGINAL_CREDIT}; r3 exterior depth authored with Codex through Blender MCP`,
  },
  model('door', 'Sliding bulkhead door leaves and status lamp', ['Exported from Blender as binary glTF 2.0, +Y up'], 'Greybox door slab; doors open logically without the model.'),
  model('arm', 'Ceiling maintenance arm (moving part)', ['Exported from Blender as binary glTF 2.0, +Y up'], 'Greybox box on the ceiling.'),
  model('fan', 'Ventilation fan blades', ['Exported from Blender as binary glTF 2.0, +Y up'], 'Greybox box on the wall.'),
  model('relay', 'Fictional relay core and rings (moving parts)', ['Exported from Blender as binary glTF 2.0, +Y up'], 'Greybox box at the relay position.'),
  {
    ...model(
      'rescue-one',
      'Rescue One: fictional rescue craft seen from the observation deck',
      [
        'Exported from Blender as binary glTF 2.0, +Y up, one 1024² colour atlas and one 1024² self-light atlas embedded as WebP',
        'Atlases baked in Cycles: colour × ambient occlusion, and the craft’s own lamps as emission',
        TEXTURE_NOTE,
      ],
      'Greybox hull and wings.',
    ),
    derivedFrom: ENDING_PASS,
  },
  model(
    'empty',
    'Empty placeholder for props that are modelled as part of the station shell',
    ['Exported from Blender as binary glTF 2.0; contains one empty node'],
    'Greybox box of the prop footprint.',
  ),
];

const baked = (zone: string, layer: 'p' | 'e'): AssetRecord => ({
  id: `LM-${zone}-${layer}`,
  path: `assets/lightmaps/${zone}_${layer}.jpg`,
  kind: 'image',
  title: `Baked lighting, ${zone} zone, ${layer === 'p' ? 'main power' : 'emergency'} layer`,
  sourceUrl: BLEND,
  rights: ORIGINAL_RIGHTS,
  credit: ORIGINAL_CREDIT,
  aiAssisted: true,
  derivedFrom: PIPELINE,
  transforms: ['Cycles diffuse light bake of the fictional station at 2048², averaged to 1024², stored as irradiance / 2 with gamma 2.2, JPEG'],
  fallback: 'Without the file the zone is lit by dynamic lights only.',
});

const probe = (zone: string): AssetRecord => ({
  id: `ENV-${zone}`,
  path: `assets/env/${zone}.hdr`,
  kind: 'image',
  title: `Reflection probe rendered inside the ${zone} zone`,
  sourceUrl: BLEND,
  rights: ORIGINAL_RIGHTS,
  credit: ORIGINAL_CREDIT,
  aiAssisted: true,
  derivedFrom: PIPELINE,
  transforms: ['Cycles equirectangular render of the fictional station, 512×256 Radiance HDR'],
  fallback: 'Without the file metals in the zone show no environment reflection.',
});

export const BAKED_ASSETS: AssetRecord[] = ART_ZONES.flatMap((zone) => [baked(zone, 'p'), baked(zone, 'e'), probe(zone)]);

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

export const ASSETS: AssetRecord[] = [...MODEL_ASSETS, ...BAKED_ASSETS, ...IMAGE_ASSETS];

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

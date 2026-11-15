// Scientific records shown in terminals and the journal. Source values and the editorial
// summary are kept apart. Nothing fictional belongs in this file.

import type { ScientificRecord } from '../game/contracts';
import { NASA_USAGE_TERMS, RETRIEVED_AT, SOURCES } from './claims';

const nssdcaCredit = 'NASA Space Science Data Coordinated Archive (NSSDCA)';

export const RECORDS: ScientificRecord[] = [
  {
    id: 'R-INSIGHT',
    missionId: '2018-042A',
    title: 'InSight lander — catalog record',
    layer: 'NASA ARCHIVAL RECORD',
    sourceId: 'N02',
    sourceUrl: SOURCES.N02!.url,
    retrievedAt: RETRIEVED_AT,
    credit: `${nssdcaCredit}; mission results: NASA/JPL-Caltech`,
    usageTerms: NASA_USAGE_TERMS,
    claimIds: ['F07', 'F08', 'F09', 'F10', 'F11'],
    sourceFields: [
      { label: 'NSSDCA/COSPAR ID', value: '2018-042A', claimIds: ['F07'] },
      { label: 'Spacecraft', value: 'InSight — stationary lander on Mars', claimIds: ['F07'] },
      { label: 'Science goal', value: 'Investigate the interior structure and processes of Mars', claimIds: ['F07'] },
      { label: 'Instrument', value: 'SEIS — Seismic Experiment for Interior Structure, a seismometer', claimIds: ['F08'] },
      { label: 'What SEIS records', value: 'Ground motion (seismic vibrations)', claimIds: ['F08'] },
      { label: 'SEIS provided by', value: 'CNES (French space agency) and partners', claimIds: ['F08'] },
      { label: 'Power', value: 'Two solar panel arrays charging batteries', claimIds: ['F09'] },
      { label: 'Last transmission', value: '2022-12-15', claimIds: ['F09'] },
      { label: 'Mission declared over', value: '2022-12-21', claimIds: ['F09'] },
    ],
    editorialSummary: [
      { aspect: 'OBJECTIVE', text: 'InSight was a lander that stayed in one place. It was sent to find out what Mars is like deep inside.', claimIds: ['F07'] },
      {
        aspect: 'MECHANISM',
        text: 'Its key instrument, SEIS, is a seismometer — an instrument that measures ground motion. Vibrations travel through a planet as seismic waves, and the way they travel reveals the structure inside. SEIS is not a microphone. It does not hear voices.',
        claimIds: ['F08'],
      },
      {
        aspect: 'FINDING',
        text: "Seismometer data gave scientists a way to study Mars' crust, mantle and core. NASA reported 1,319 marsquakes detected by the end of the mission.",
        claimIds: ['F10'],
      },
      {
        aspect: 'END OF MISSION',
        text: "Dust built up on the solar panels and the lander's power fell. The last transmission arrived on 15 December 2022. NASA declared the mission over on 21 December 2022.",
        claimIds: ['F09', 'F10'],
      },
      { aspect: 'LIMIT', text: 'Not every goal was met: the HP³ heat probe did not reach the depth planned for its heat-flow measurement.', claimIds: ['F11'] },
    ],
  },
  {
    id: 'R-SEIS-SOUND',
    missionId: '2018-042A',
    title: "About the 'sounds' of SEIS",
    layer: 'NASA ARCHIVAL RECORD',
    sourceId: 'N06',
    sourceUrl: SOURCES.N06!.url,
    retrievedAt: RETRIEVED_AT,
    credit: 'NASA/JPL-Caltech',
    usageTerms: NASA_USAGE_TERMS,
    claimIds: ['F08', 'F13'],
    sourceFields: [
      { label: 'Signal type', value: 'Seismic signal, far below the range of human hearing', claimIds: ['F13'] },
      { label: 'Processing', value: 'Sped up and slightly processed to be audible (sonification)', claimIds: ['F13'] },
      { label: 'Not', value: 'A microphone recording of sound in the air', claimIds: ['F08', 'F13'] },
    ],
    editorialSummary: [
      {
        aspect: 'MECHANISM',
        text: "When NASA shares the 'sound' of a marsquake, it is a sonification: SEIS ground-motion data, sped up and processed until people can hear it.",
        claimIds: ['F13'],
      },
      {
        aspect: 'NOTE',
        text: 'This archive plays no NASA audio. Every sound in the station was synthesized for this fictional story.',
        claimIds: [],
      },
    ],
  },
  {
    id: 'R-INSIGHT-IMAGE',
    missionId: '2018-042A',
    title: "One of InSight's last images",
    layer: 'NASA ARCHIVAL RECORD',
    sourceId: 'N07',
    sourceUrl: SOURCES.N07!.url,
    retrievedAt: RETRIEVED_AT,
    credit: 'NASA/JPL-Caltech',
    usageTerms: NASA_USAGE_TERMS,
    claimIds: ['F12'],
    sourceFields: [
      { label: 'Product ID', value: 'PIA25680', claimIds: ['F12'] },
      { label: 'Captured', value: '2022-12-11 — sol 1436 of the mission', claimIds: ['F12'] },
      { label: 'Shows', value: "InSight's seismometer on the surface of Mars", claimIds: ['F12'] },
    ],
    editorialSummary: [
      {
        aspect: 'NOTE',
        text: 'The dome on the ground covers the seismometer. This is one of the last images InSight took — not its last transmission, which came four days later.',
        claimIds: ['F12', 'F09'],
      },
    ],
    image: {
      assetId: 'IMG02',
      alt: 'Dusty reddish ground seen through a wide-angle lens. A low dome, the cover of the seismometer, sits on the surface with a flat cable leading back towards the lander.',
      caption: "One of InSight's last images, 11 December 2022 (sol 1436). Credit: NASA/JPL-Caltech.",
      labels: ['InSight lander camera', 'PIA25680', 'Shown complete, re-encoded as JPEG'],
      fallbackText:
        "Image unavailable. Product PIA25680 shows InSight's dome-covered seismometer on dusty Martian ground, photographed on 11 December 2022 (sol 1436). Credit: NASA/JPL-Caltech.",
    },
  },
  {
    id: 'R-OPPORTUNITY',
    missionId: '2003-032A',
    title: 'Opportunity rover — catalog record',
    layer: 'NASA ARCHIVAL RECORD',
    sourceId: 'N01',
    sourceUrl: SOURCES.N01!.url,
    retrievedAt: RETRIEVED_AT,
    credit: `${nssdcaCredit}; key dates: NASA Science`,
    usageTerms: NASA_USAGE_TERMS,
    claimIds: ['F01', 'F02', 'F06'],
    sourceFields: [
      { label: 'NSSDCA/COSPAR ID', value: '2003-032A', claimIds: ['F01'] },
      { label: 'Spacecraft', value: 'Opportunity — Mars Exploration Rover B (MER-B)', claimIds: ['F01'] },
      { label: 'Science objective', value: 'Rocks and soils that hold clues to past water activity', claimIds: ['F01'] },
      { label: 'Power', value: 'Solar arrays; energy stored in rechargeable batteries', claimIds: ['F02'] },
      { label: 'Arm instruments', value: 'Mössbauer Spectrometer (MB), APXS, Microscopic Imager (MI)', claimIds: ['F02'] },
      { label: 'Last communication', value: '2018-06-10 (NASA Science, Key Dates)', claimIds: ['F06'] },
      { label: 'End of mission declared', value: '2019-02-13 (NASA Science, Key Dates)', claimIds: ['F06'] },
    ],
    editorialSummary: [
      { aspect: 'OBJECTIVE', text: 'Opportunity was a rover sent to study the geology of Mars and to look for clues to past water.', claimIds: ['F01'] },
      {
        aspect: 'MECHANISM',
        text: 'Solar arrays charged its batteries. A robotic arm held instruments against rocks and soil, including the Mössbauer Spectrometer, the APXS and the Microscopic Imager.',
        claimIds: ['F02'],
      },
      {
        aspect: 'END OF MISSION',
        text: 'A Mars-wide dust storm cut the energy reaching its solar panels. The last communication was on 10 June 2018. NASA declared the end of the mission on 13 February 2019. Losing contact and ending a mission are two different events.',
        claimIds: ['F06'],
      },
    ],
  },
  {
    id: 'R-MER-INSTRUMENTS',
    missionId: '2003-032A',
    title: 'Rover instruments — what each one does',
    layer: 'NASA ARCHIVAL RECORD',
    sourceId: 'N08',
    sourceUrl: SOURCES.N08!.url,
    retrievedAt: RETRIEVED_AT,
    credit: 'NASA/JPL-Caltech',
    usageTerms: NASA_USAGE_TERMS,
    claimIds: ['F03', 'F15'],
    sourceFields: [
      { label: 'Pancam', value: 'Panoramic Camera — pictures of the landscape around the rover', claimIds: ['F03'] },
      { label: 'Mössbauer Spectrometer (MB)', value: 'Determines the make-up of iron-bearing minerals', claimIds: ['F03'] },
      { label: 'APXS', value: 'Alpha Particle X-ray Spectrometer — elemental chemistry of rocks and soils', claimIds: ['F15'] },
    ],
    editorialSummary: [
      {
        aspect: 'MECHANISM',
        text: 'A camera shows what a rock looks like. A spectrometer tests what it is made of. They answer different questions.',
        claimIds: ['F03'],
      },
      { aspect: 'LIMIT', text: 'A photograph alone does not chemically identify a mineral.', claimIds: ['F03'] },
    ],
  },
  {
    id: 'R-PIA05584',
    missionId: '2003-032A',
    title: "PIA05584 — 'Berries' and Rock Share Common Origins",
    layer: 'NASA ARCHIVAL RECORD',
    sourceId: 'N09',
    sourceUrl: SOURCES.N09!.url,
    retrievedAt: RETRIEVED_AT,
    credit: 'NASA/JPL/Cornell',
    usageTerms: NASA_USAGE_TERMS,
    claimIds: ['F04', 'F16'],
    sourceFields: [
      { label: 'Product ID', value: 'PIA05584', claimIds: ['F04'] },
      { label: 'Spacecraft', value: 'Opportunity (Mars Exploration Rovers)', claimIds: ['F04'] },
      { label: 'Instrument', value: 'Panoramic Camera (Pancam)', claimIds: ['F04'] },
      { label: 'Image type', value: 'False-color composite — infrared, green and violet filters', claimIds: ['F04', 'F16'] },
      { label: 'Captured', value: 'Sol 50 of the mission', claimIds: ['F04'] },
      { label: 'Added to Photojournal', value: '2004-03-18', claimIds: ['F04'] },
    ],
    editorialSummary: [
      {
        aspect: 'NOTE',
        text: 'False color means these are not the colors a human eye would see. Nothing in this archive has recolored or cropped the picture.',
        claimIds: ['F04'],
      },
      {
        aspect: 'FINDING',
        text: 'The picture shows finely layered sediments and small spherules. The spherules line up with individual rock layers, which indicates they are concretions — grains that form in sediments that were already wet.',
        claimIds: ['F04', 'F16'],
      },
    ],
    image: {
      assetId: 'IMG01',
      alt: 'False-color view of pale, finely layered rock slabs split by dark sand-filled cracks. Dozens of small blue-grey spherules dot the rock and gather in the cracks.',
      caption: "PIA05584 — 'Berries' and Rock Share Common Origins. Credit: NASA/JPL/Cornell.",
      labels: ['Instrument: Pancam', 'False-color composite', 'Unmodified NASA file'],
      fallbackText:
        'Image unavailable. Product PIA05584 is a false-color composite from Opportunity’s Panoramic Camera (Pancam), taken on sol 50. It shows finely layered sediments and small spherules that line up with the rock layers. Credit: NASA/JPL/Cornell.',
    },
  },
  {
    id: 'R-WATER',
    missionId: '2003-032A',
    title: 'What the combined evidence supports',
    layer: 'NASA ARCHIVAL RECORD',
    sourceId: 'N10',
    sourceUrl: SOURCES.N10!.url,
    retrievedAt: RETRIEVED_AT,
    credit: 'NASA Astrobiology; NASA/JPL/Cornell',
    usageTerms: NASA_USAGE_TERMS,
    claimIds: ['F03', 'F05', 'F16'],
    sourceFields: [
      { label: 'Appearance (camera)', value: 'Spherules line up with rock layers — concretions formed in wet sediments', claimIds: ['F16'] },
      { label: 'Composition (spectrometer)', value: 'The Mössbauer Spectrometer is the instrument for iron-bearing minerals', claimIds: ['F03'] },
      { label: 'Supported conclusion', value: 'Evidence of past water at this site', claimIds: ['F05'] },
      { label: 'Not supported', value: 'Detection of life; liquid water flowing today', claimIds: ['F05'] },
    ],
    editorialSummary: [
      {
        aspect: 'FINDING',
        text: 'Scientists studied the spherules together with the minerals and layering of the rock around them. Taken together, that work provided evidence that water once affected these deposits.',
        claimIds: ['F05'],
      },
      { aspect: 'LIMIT', text: 'Evidence of past water is not evidence of life, and it does not show water flowing there now.', claimIds: ['F05'] },
    ],
  },
];

export function recordById(id: string): ScientificRecord {
  const r = RECORDS.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown record ${id}`);
  return r;
}

export const RECORD_IDS: string[] = RECORDS.map((r) => r.id);

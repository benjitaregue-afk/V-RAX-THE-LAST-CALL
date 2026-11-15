// Science register. IDs follow NASA_DATA_VALIDATION.md (F01–F14); F15–F16 were added after
// re-reading N08 and N09 on 2026-11-14. Every FACT cites the primary source it was read from.

import type { Claim, SourceRef } from '../game/contracts';

export const RETRIEVED_AT = '2026-11-14';

export const NASA_USAGE_TERMS =
  'NASA content, used for factual educational purposes with credit. No NASA endorsement is implied. See NASA Images and Media Guidelines.';

export const SOURCES: Record<string, SourceRef> = {
  N01: {
    id: 'N01',
    title: 'NSSDCA Master Catalog — Opportunity, 2003-032A',
    publisher: 'NASA Space Science Data Coordinated Archive',
    url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A',
  },
  N02: {
    id: 'N02',
    title: 'NSSDCA Master Catalog — InSight, 2018-042A',
    publisher: 'NASA Space Science Data Coordinated Archive',
    url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2018-042A',
  },
  N03: {
    id: 'N03',
    title: 'Opportunity — NASA Science',
    publisher: 'NASA',
    url: 'https://science.nasa.gov/mission/mer-opportunity/',
  },
  N05: {
    id: 'N05',
    title: 'NASA Retires InSight Mars Lander Mission After Years of Science',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/missions/insight/nasa-retires-insight-mars-lander-mission-after-years-of-science/',
  },
  N06: {
    id: 'N06',
    title: "NASA's InSight 'Hears' Peculiar Sounds on Mars",
    publisher: 'NASA Jet Propulsion Laboratory',
    url: 'https://www.jpl.nasa.gov/news/nasas-insight-hears-peculiar-sounds-on-mars/',
  },
  N07: {
    id: 'N07',
    title: "One of InSight's Last Images (PIA25680)",
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/resource/one-of-insights-last-images/',
  },
  N08: {
    id: 'N08',
    title: 'Mars Exploration Rovers — Science Instruments',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-instruments/',
  },
  N09: {
    id: 'N09',
    title: "PIA05584: 'Berries' and Rock Share Common Origins",
    publisher: 'NASA Photojournal',
    url: 'https://science.nasa.gov/photojournal/berries-and-rock-share-common-origins/',
  },
  N10: {
    id: 'N10',
    title: 'Iron Blueberries',
    publisher: 'NASA Astrobiology',
    url: 'https://astrobiology.nasa.gov/news/check-type-iron-blueberries/',
  },
  N11: {
    id: 'N11',
    title: 'Retroreflectors: From Apollo to Mars',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/image-article/retroreflectors-from-apollo-mars/',
  },
  C01: {
    id: 'C01',
    title: "NASA Space Apps 2026 challenge — NASA's Discarded Equipment Storytelling (Resources)",
    publisher: 'NASA International Space Apps Challenge',
    url: 'https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/?tab=resources',
  },
};

export const CLAIMS: Claim[] = [
  {
    id: 'F01',
    statementEn:
      'Opportunity is Mars Exploration Rover B (MER-B), NSSDCA ID 2003-032A. It was sent for geological investigations, including the search for clues to past water.',
    sourceIds: ['N01'],
    evidenceKind: 'FACT',
    usedInCore: true,
  },
  {
    id: 'F02',
    statementEn:
      "Opportunity's solar arrays charged rechargeable batteries. Its arm carried the Mössbauer Spectrometer (MB), the Alpha Particle X-ray Spectrometer (APXS) and the Microscopic Imager (MI).",
    sourceIds: ['N01'],
    evidenceKind: 'FACT',
    limit: 'Nominal power figures are not end-of-mission telemetry.',
    usedInCore: true,
  },
  {
    id: 'F03',
    statementEn:
      'The Mössbauer Spectrometer (MB) determines the make-up of iron-bearing minerals. Pancam, the Panoramic Camera, takes pictures of the landscape around the rover.',
    sourceIds: ['N08'],
    evidenceKind: 'FACT',
    limit: 'A photograph alone does not chemically identify a mineral.',
    usedInCore: true,
  },
  {
    id: 'F04',
    statementEn:
      "Image PIA05584 shows finely layered sediments and small spherules. It was taken by Opportunity's panoramic camera (Pancam) on sol 50 and is a false-color composite. It was added to the Photojournal on 2004-03-18.",
    sourceIds: ['N09'],
    evidenceKind: 'FACT',
    limit: 'Sol 50 is the capture; 2004-03-18 is the archive date. It is not a Microscopic Imager picture.',
    usedInCore: true,
  },
  {
    id: 'F05',
    statementEn:
      'Study of the spherules together with their mineral and sedimentary context provided evidence of past water. That is not the same as detecting life.',
    sourceIds: ['N10', 'N09'],
    evidenceKind: 'FACT',
    limit: 'Not every occurrence of hematite proves water.',
    usedInCore: true,
  },
  {
    id: 'F06',
    statementEn:
      'The last communication with Opportunity was on 2018-06-10, after a Mars-wide dust storm cut the energy reaching its solar panels. NASA declared the end of the mission on 2019-02-13.',
    sourceIds: ['N03'],
    evidenceKind: 'FACT',
    limit: 'Last contact and end of mission are two different events.',
    usedInCore: true,
  },
  {
    id: 'F07',
    statementEn: 'InSight, NSSDCA ID 2018-042A, was a stationary lander sent to investigate the interior structure of Mars.',
    sourceIds: ['N02'],
    evidenceKind: 'FACT',
    usedInCore: true,
  },
  {
    id: 'F08',
    statementEn:
      "SEIS, the Seismic Experiment for Interior Structure, is a seismometer: it records ground motion. Seismic waves moving through the planet reveal its interior structure. It is not a microphone that hears voices. SEIS was provided by the French space agency CNES and its partners.",
    sourceIds: ['N02', 'N06'],
    evidenceKind: 'FACT',
    usedInCore: true,
  },
  {
    id: 'F09',
    statementEn:
      'InSight was powered by two solar panel arrays charging batteries. Its last transmission was received on 2022-12-15, and the mission was declared over on 2022-12-21.',
    sourceIds: ['N02'],
    evidenceKind: 'FACT',
    usedInCore: true,
  },
  {
    id: 'F10',
    statementEn:
      "Dust on the solar panels reduced InSight's power. Seismometer data gave scientists a way to study Mars' crust, mantle and core. NASA reported 1,319 marsquakes detected by the end of the mission.",
    sourceIds: ['N05'],
    evidenceKind: 'FACT',
    limit: 'The count is a mission total, not a live detector reading.',
    usedInCore: true,
  },
  {
    id: 'F11',
    statementEn: 'The HP³ heat probe did not reach the depth planned for its heat-flow measurement.',
    sourceIds: ['N05'],
    evidenceKind: 'FACT',
    limit: "An instrument's purpose is not the same as the result it achieved.",
    usedInCore: true,
  },
  {
    id: 'F12',
    statementEn:
      "The image 'One of InSight's Last Images' was captured on 2022-12-11, sol 1436, and shows InSight's seismometer on the surface. Credit: NASA/JPL-Caltech.",
    sourceIds: ['N07'],
    evidenceKind: 'FACT',
    limit: 'It is one of the last images, not the last transmission.',
    usedInCore: true,
  },
  {
    id: 'F13',
    statementEn:
      'Public audio clips from SEIS are sonifications: signals far below human hearing that were sped up and slightly processed to be audible. They are not microphone recordings.',
    sourceIds: ['N06'],
    evidenceKind: 'FACT',
    usedInCore: true,
  },
  {
    id: 'F14',
    statementEn:
      'A lunar retroreflector returns laser pulses sent from Earth; the round-trip time measures distance. A device left behind can stay useful without transmitting.',
    sourceIds: ['N11'],
    evidenceKind: 'FACT',
    limit: 'Optional extension (P5). Not shown in the core game.',
    usedInCore: false,
  },
  {
    id: 'F15',
    statementEn: 'The Alpha Particle X-ray Spectrometer (APXS) reveals the elemental chemistry of rocks and soils.',
    sourceIds: ['N08'],
    evidenceKind: 'FACT',
    usedInCore: true,
  },
  {
    id: 'F16',
    statementEn:
      "In PIA05584 the spherules line up with individual rock layers. That indicates they are concretions, which form in pre-existing wet sediments. The picture was made from Pancam's infrared, green and violet filters.",
    sourceIds: ['N09'],
    evidenceKind: 'FACT',
    usedInCore: true,
  },
];

export function claimById(id: string): Claim {
  const c = CLAIMS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown claim ${id}`);
  return c;
}

// Level data from LEVEL_DESIGN.md. Pure TypeScript: no engine imports, so tests can check it.
// Metres, Y up, floor at Y=0, north = +Z. A yaw of 0 faces +Z; positive yaw turns towards +X.

import type { DoorId, PuzzleId, ZoneId } from '../game/contracts';

export const WALL_T = 0.25;
export const CEIL_H = 3.4;
export const EYE_H = 1.65;
export const BODY_R = 0.3;
export const BODY_HALF_H = 0.85;
export const REACH = 2.2;

export interface Rect {
  id: string;
  zone: ZoneId;
  kind: 'room' | 'connector';
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

export const RECTS: Rect[] = [
  { id: 'AIRLOCK', zone: 'AIRLOCK', kind: 'room', x0: -3, x1: 3, z0: -8, z1: -2 },
  { id: 'CONN_S', zone: 'HUB', kind: 'connector', x0: -1.5, x1: 1.5, z0: -2, z1: 0 },
  { id: 'HUB', zone: 'HUB', kind: 'room', x0: -5, x1: 5, z0: 0, z1: 10 },
  { id: 'CONN_W', zone: 'HUB', kind: 'connector', x0: -7, x1: -5, z0: 5, z1: 8 },
  { id: 'INSIGHT', zone: 'INSIGHT', kind: 'room', x0: -15, x1: -7, z0: 2, z1: 10 },
  { id: 'CONN_E', zone: 'HUB', kind: 'connector', x0: 5, x1: 7, z0: 5, z1: 8 },
  { id: 'OPPORTUNITY', zone: 'OPPORTUNITY', kind: 'room', x0: 7, x1: 15, z0: 2, z1: 10 },
  { id: 'CONN_N', zone: 'HUB', kind: 'connector', x0: -1.5, x1: 1.5, z0: 10, z1: 13 },
  { id: 'RELAY', zone: 'RELAY', kind: 'room', x0: -5, x1: 5, z0: 13, z1: 19 },
  { id: 'CONN_DECK', zone: 'OBSERVATION', kind: 'connector', x0:1.8,x1:4.8,z0:19,z1:22 },
  { id: 'OBSERVATION', zone:'OBSERVATION',kind:'room',x0:-6,x1:6,z0:22,z1:30 },
];

export function rectAt(x: number, z: number, margin = 0): Rect | null {
  for (const r of RECTS) {
    if (x >= r.x0 - margin && x <= r.x1 + margin && z >= r.z0 - margin && z <= r.z1 + margin) return r;
  }
  return null;
}

/** Zone used for lighting and triggers. Connectors count as HUB. Null means outside the level. */
export function zoneAt(x: number, z: number): ZoneId | null {
  // Rooms win over connectors on shared edges.
  const room = RECTS.find((r) => r.kind === 'room' && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1);
  return room ? room.zone : (rectAt(x, z)?.zone ?? null);
}

/** Oriented box footprint. w runs along local X, d along local Z. */
export interface OBox {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  yaw: number;
}

export interface WallSeg extends OBox {
  rect: string;
  zone: ZoneId;
  side: 'N' | 'S' | 'E' | 'W';
  /** Interval along the wall, on X for N/S walls and on Z for E/W walls. */
  a0: number;
  a1: number;
}

const EPS = 1e-6;

function subtract(a0: number, a1: number, cuts: [number, number][]): [number, number][] {
  let parts: [number, number][] = [[a0, a1]];
  for (const [c0, c1] of cuts) {
    const next: [number, number][] = [];
    for (const [p0, p1] of parts) {
      if (c1 <= p0 + EPS || c0 >= p1 - EPS) {
        next.push([p0, p1]);
        continue;
      }
      if (c0 > p0 + EPS) next.push([p0, c0]);
      if (c1 < p1 - EPS) next.push([c1, p1]);
    }
    parts = next;
  }
  return parts;
}

/** Walls run along every rectangle edge except where another rectangle opens onto it. */
export function computeWalls(rects: Rect[] = RECTS): WallSeg[] {
  const out: WallSeg[] = [];
  for (const r of rects) {
    const others = rects.filter((o) => o !== r);
    const sides: { side: WallSeg['side']; a0: number; a1: number; cuts: [number, number][] }[] = [
      { side: 'N', a0: r.x0, a1: r.x1, cuts: others.filter((o) => Math.abs(o.z0 - r.z1) < EPS).map((o) => [o.x0, o.x1]) },
      { side: 'S', a0: r.x0, a1: r.x1, cuts: others.filter((o) => Math.abs(o.z1 - r.z0) < EPS).map((o) => [o.x0, o.x1]) },
      { side: 'E', a0: r.z0, a1: r.z1, cuts: others.filter((o) => Math.abs(o.x0 - r.x1) < EPS).map((o) => [o.z0, o.z1]) },
      { side: 'W', a0: r.z0, a1: r.z1, cuts: others.filter((o) => Math.abs(o.x1 - r.x0) < EPS).map((o) => [o.z0, o.z1]) },
    ];
    for (const s of sides) {
      subtract(s.a0, s.a1, s.cuts).forEach(([a0, a1], i) => {
        const mid = (a0 + a1) / 2;
        const len = a1 - a0;
        const id = `wall-${r.id}-${s.side}${i}`;
        const base = { id, rect: r.id, zone: r.zone, side: s.side, a0, a1, yaw: 0 };
        if (s.side === 'N') out.push({ ...base, x: mid, z: r.z1 + WALL_T / 2, w: len, d: WALL_T });
        if (s.side === 'S') out.push({ ...base, x: mid, z: r.z0 - WALL_T / 2, w: len, d: WALL_T });
        if (s.side === 'E') out.push({ ...base, x: r.x1 + WALL_T / 2, z: mid, w: WALL_T, d: len });
        if (s.side === 'W') out.push({ ...base, x: r.x0 - WALL_T / 2, z: mid, w: WALL_T, d: len });
      });
    }
  }
  return out;
}

/** Horizontal distance from a point to an oriented box (0 inside). */
export function distanceToBox(px: number, pz: number, b: OBox): number {
  const dx = px - b.x;
  const dz = pz - b.z;
  const c = Math.cos(b.yaw);
  const s = Math.sin(b.yaw);
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  return Math.hypot(Math.max(Math.abs(lx) - b.w / 2, 0), Math.max(Math.abs(lz) - b.d / 2, 0));
}

// ---------------------------------------------------------------- doors

export interface DoorDef {
  id: DoorId;
  x: number;
  z: number;
  /** 0 when the passage runs along Z, PI/2 when it runs along X. */
  yaw: number;
  label: string;
  lockedText: string;
}

export const DOOR_OPENING_W = 2.0;
export const DOOR_OPENING_H = 2.5;

export const DOORS: DoorDef[] = [
  { id: 'D0', x: 0, z: -1, yaw: 0, label: 'Door D0 — Archive', lockedText: 'Restore backup power.' },
  { id: 'D1', x: 6, z: 6.5, yaw: Math.PI / 2, label: 'Door D1 — Witness in Stone', lockedText: 'Restore the listening record.' },
  { id: 'D2', x: 0, z: 11.5, yaw: 0, label: 'Door D2 — Relay', lockedText: 'Restore both mission records.' },
];

/** Open frames without a leaf (west archway) and the sealed exterior lock (decor only). */
export const FRAMES: { id: string; x: number; z: number; yaw: number; sealed: boolean }[] = [
  { id: 'ARCH_W', x: -6, z: 6.5, yaw: Math.PI / 2, sealed: false },
  { id: 'LOCK_EXT', x: 0, z: -7.9, yaw: 0, sealed: true },
];

function jambs(id: string, x: number, z: number, yaw: number): OBox[] {
  const off = DOOR_OPENING_W / 2 + 0.25;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [-1, 1].map((k) => ({ id: `${id}-jamb${k}`, x: x + k * off * c, z: z - k * off * s, w: 0.5, d: 0.55, yaw }));
}

export function doorBlocker(d: DoorDef): OBox {
  return { id: `blocker-${d.id}`, x: d.x, z: d.z, w: DOOR_OPENING_W, d: 0.3, yaw: d.yaw };
}

// ---------------------------------------------------------------- props

export type ModelId =
  | 'terminal'
  | 'switch'
  | 'door'
  | 'rack'
  | 'pedestal'
  | 'insight'
  | 'opportunity'
  | 'relay'
  | 'arm'
  | 'fan'
  | 'lamp'
  | 'rib'
  | 'crate'
  | 'tray'
  | 'rescue';

export const MODEL_IDS: ModelId[] = [
  'terminal',
  'switch',
  'door',
  'rack',
  'pedestal',
  'insight',
  'opportunity',
  'relay',
  'arm',
  'fan',
  'lamp',
  'rib',
  'crate',
  'tray',
  'rescue',
];

export interface Placement {
  id: string;
  model: ModelId;
  zone: ZoneId;
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** Solid footprints, relative to nothing: already in world space. */
  colliders: OBox[];
  /** Casts a shadow while its zone holds the accent light. */
  shadow: boolean;
  /** Visible height, used for the interaction proxy and the box fallback. */
  height: number;
}

const FOOT: Partial<Record<ModelId, { w: number; d: number; h: number }>> = {
  terminal: { w: 0.95, d: 0.6, h: 1.4 },
  switch: { w: 0.7, d: 0.45, h: 1.5 },
  rack: { w: 0.85, d: 0.52, h: 2.2 },
  crate: { w: 0.72, d: 0.52, h: 0.5 },
  relay: { w: 2.0, d: 2.0, h: 2.9 },
};

function place(id: string, model: ModelId, zone: ZoneId, x: number, z: number, yaw: number, opts: Partial<Placement> = {}): Placement {
  const f = FOOT[model];
  const colliders = opts.colliders ?? (f ? [{ id: `col-${id}`, x, z, w: f.w, d: f.d, yaw }] : []);
  return { id, model, zone, x, y: opts.y ?? 0, z, yaw, colliders, shadow: opts.shadow ?? false, height: opts.height ?? f?.h ?? 1 };
}

const E = Math.PI / 2; // faces east (+X)
const W = -Math.PI / 2; // faces west (-X)
const N = 0; // faces north (+Z)
const S = Math.PI; // faces south (-Z)

function pedestal(id: string, zone: ZoneId, x: number, z: number): Placement {
  return place(id, 'pedestal', zone, x, z, 0, {
    height: 1.7,
    shadow: true,
    colliders: [
      { id: `col-${id}-a`, x, z, w: 2.4, d: 2.4, yaw: 0 },
      { id: `col-${id}-b`, x, z, w: 2.4, d: 2.4, yaw: Math.PI / 4 },
    ],
  });
}

export const SWITCH_POS = { x: 1.8, z: -4 };
export const INSIGHT_EXHIBIT = { x: -12.2, z: 4.4, yaw: Math.atan2(2.7, 2.1) };
export const OPPORTUNITY_EXHIBIT = { x: 12.2, z: 4.4, yaw: Math.atan2(-2.7, 2.1) };
export const RELAY_CORE = { x: 0, z: 17.8 };

export const PLACEMENTS: Placement[] = [
  // AIRLOCK
  place('switch', 'switch', 'AIRLOCK', SWITCH_POS.x, SWITCH_POS.z, Math.atan2(-1.8, -2), { shadow: true }),
  place('airlock-crate-1', 'crate', 'AIRLOCK', -2.35, -7.3, 0.2),
  place('airlock-crate-2', 'crate', 'AIRLOCK', -2.45, -4.9, E),
  place('airlock-rack', 'rack', 'AIRLOCK', -2.68, -3.1, E),
  place('airlock-lamp', 'lamp', 'AIRLOCK', 0, -5, 0, { y: CEIL_H }),
  place('airlock-rib-e', 'rib', 'AIRLOCK', 3, -6.4, W),
  place('airlock-rib-w', 'rib', 'AIRLOCK', -3, -6.4, E),
  // HUB
  place('hub-arm', 'arm', 'HUB', -3.3, 8.3, Math.atan2(1, -1), { y: CEIL_H, shadow: true }),
  place('hub-rack-1', 'rack', 'HUB', -3.9, 0.32, N),
  place('hub-rack-2', 'rack', 'HUB', -2.95, 0.32, N),
  place('hub-rack-3', 'rack', 'HUB', 2.95, 0.32, N),
  place('hub-rack-4', 'rack', 'HUB', 3.9, 0.32, N),
  place('hub-rack-5', 'rack', 'HUB', 3.6, 9.68, S, { shadow: true }),
  place('hub-crate-1', 'crate', 'HUB', 4.2, 2.1, 0.3),
  place('hub-crate-2', 'crate', 'HUB', 4.35, 3.0, E),
  place('hub-crate-3', 'crate', 'HUB', -4.3, 9.2, 0.5, { shadow: true }),
  place('hub-lamp-1', 'lamp', 'HUB', 0, 1.6, 0, { y: CEIL_H }),
  place('hub-lamp-2', 'lamp', 'HUB', 0, 5.2, 0, { y: CEIL_H }),
  place('hub-lamp-3', 'lamp', 'HUB', 0, 8.6, 0, { y: CEIL_H }),
  place('hub-rib-w1', 'rib', 'HUB', -5, 2.6, E),
  place('hub-rib-w2', 'rib', 'HUB', -5, 9.1, E),
  place('hub-rib-e1', 'rib', 'HUB', 5, 2.6, W),
  place('hub-rib-e2', 'rib', 'HUB', 5, 9.1, W),
  place('hub-rib-n1', 'rib', 'HUB', -2.6, 10, S),
  place('hub-rib-n2', 'rib', 'HUB', 2.6, 10, S),
  place('hub-tray-1', 'tray', 'HUB', -4, 6.5, 0, { y: CEIL_H }),
  place('hub-tray-2', 'tray', 'HUB', -2, 6.5, 0, { y: CEIL_H }),
  place('hub-tray-3', 'tray', 'HUB', 0, 6.5, 0, { y: CEIL_H }),
  place('hub-tray-4', 'tray', 'HUB', 2, 6.5, 0, { y: CEIL_H }),
  place('hub-tray-5', 'tray', 'HUB', 4, 6.5, 0, { y: CEIL_H }),
  place('conn-w-tray', 'tray', 'HUB', -6, 6.5, 0, { y: CEIL_H }),
  place('conn-e-tray', 'tray', 'HUB', 6, 6.5, 0, { y: CEIL_H }),
  // INSIGHT
  place('terminal-insight', 'terminal', 'INSIGHT', -12, 7, E, { shadow: true }),
  pedestal('insight-pedestal', 'INSIGHT', INSIGHT_EXHIBIT.x, INSIGHT_EXHIBIT.z),
  place('insight-exhibit', 'insight', 'INSIGHT', INSIGHT_EXHIBIT.x, INSIGHT_EXHIBIT.z, INSIGHT_EXHIBIT.yaw, { y: 0.34, shadow: true }),
  place('insight-rack-1', 'rack', 'INSIGHT', -14.68, 8.9, E),
  place('insight-rack-2', 'rack', 'INSIGHT', -13.1, 9.68, S),
  place('insight-rack-3', 'rack', 'INSIGHT', -10.6, 9.68, S),
  place('insight-crate-1', 'crate', 'INSIGHT', -7.75, 2.55, 0.15),
  place('insight-crate-2', 'crate', 'INSIGHT', -8.7, 2.5, -0.3),
  place('insight-lamp-1', 'lamp', 'INSIGHT', -11.2, 7.2, E, { y: CEIL_H }),
  place('insight-lamp-2', 'lamp', 'INSIGHT', -9.2, 4, E, { y: CEIL_H }),
  place('insight-rib-n', 'rib', 'INSIGHT', -8.6, 10, S),
  place('insight-rib-s1', 'rib', 'INSIGHT', -10, 2, N),
  place('insight-rib-s2', 'rib', 'INSIGHT', -14.2, 2, N),
  place('insight-rib-w', 'rib', 'INSIGHT', -15, 6.2, E),
  // OPPORTUNITY
  place('terminal-opportunity', 'terminal', 'OPPORTUNITY', 12, 7, W, { shadow: true }),
  pedestal('opportunity-pedestal', 'OPPORTUNITY', OPPORTUNITY_EXHIBIT.x, OPPORTUNITY_EXHIBIT.z),
  place('opportunity-exhibit', 'opportunity', 'OPPORTUNITY', OPPORTUNITY_EXHIBIT.x, OPPORTUNITY_EXHIBIT.z, OPPORTUNITY_EXHIBIT.yaw, { y: 0.34, shadow: true }),
  place('opportunity-rack-1', 'rack', 'OPPORTUNITY', 14.68, 8.9, W),
  place('opportunity-rack-2', 'rack', 'OPPORTUNITY', 13.1, 9.68, S),
  place('opportunity-rack-3', 'rack', 'OPPORTUNITY', 10.6, 9.68, S),
  place('opportunity-crate-1', 'crate', 'OPPORTUNITY', 7.75, 2.55, -0.15),
  place('opportunity-crate-2', 'crate', 'OPPORTUNITY', 8.7, 2.5, 0.3),
  place('opportunity-lamp-1', 'lamp', 'OPPORTUNITY', 11.2, 7.2, E, { y: CEIL_H }),
  place('opportunity-lamp-2', 'lamp', 'OPPORTUNITY', 9.2, 4, E, { y: CEIL_H }),
  place('opportunity-rib-n', 'rib', 'OPPORTUNITY', 8.6, 10, S),
  place('opportunity-rib-s1', 'rib', 'OPPORTUNITY', 10, 2, N),
  place('opportunity-rib-s2', 'rib', 'OPPORTUNITY', 14.2, 2, N),
  place('opportunity-rib-e', 'rib', 'OPPORTUNITY', 15, 6.2, W),
  // RELAY
  place('terminal-relay', 'terminal', 'RELAY', 0, 16, S, { shadow: true }),
  place('relay-core', 'relay', 'RELAY', RELAY_CORE.x, RELAY_CORE.z, S, { shadow: true }),
  place('relay-fan', 'fan', 'RELAY', 0, 18.99, S, { y: 2.05, shadow: true }),
  place('relay-rack-1', 'rack', 'RELAY', -4.68, 14.3, E),
  place('relay-rack-2', 'rack', 'RELAY', -4.68, 15.4, E),
  place('relay-rack-3', 'rack', 'RELAY', 4.68, 14.3, W),
  place('relay-rack-4', 'rack', 'RELAY', 4.68, 15.4, W),
  place('relay-crate-1', 'crate', 'RELAY', 3.7, 18.3, 0.4),
  place('relay-crate-2', 'crate', 'RELAY', -3.9, 18.4, -0.2),
  place('relay-lamp', 'lamp', 'RELAY', 0, 14.4, 0, { y: CEIL_H }),
  place('relay-rib-w', 'rib', 'RELAY', -5, 17.2, E),
  place('relay-rib-e', 'rib', 'RELAY', 5, 17.2, W),
  place('conn-n-tray', 'tray', 'HUB', 0, 11.5, E, { y: CEIL_H }),
];

// ---------------------------------------------------------------- colliders

/** Everything solid except door leaves. */
export function staticColliders(): OBox[] {
  const out: OBox[] = [...computeWalls()];
  for (const d of DOORS) out.push(...jambs(d.id, d.x, d.z, d.yaw));
  for (const f of FRAMES) {
    if (f.sealed) out.push({ id: `col-${f.id}`, x: f.x, z: f.z, w: 3, d: 0.5, yaw: f.yaw });
    else out.push(...jambs(f.id, f.x, f.z, f.yaw));
  }
  for (const p of PLACEMENTS) out.push(...p.colliders);
  return out;
}

export function collidersFor(openDoors: Partial<Record<DoorId, boolean>>): OBox[] {
  return [...staticColliders(), ...DOORS.filter((d) => !openDoors[d.id]).map(doorBlocker)];
}

/** True when a player centre can stand here. */
export function isStandable(x: number, z: number, colliders: OBox[], clearance = BODY_R): boolean {
  if (!rectAt(x, z)) return false;
  return colliders.every((b) => distanceToBox(x, z, b) >= clearance - 1e-9);
}

// ---------------------------------------------------------------- interaction

export interface InteractableDef {
  id: string;
  kind: 'puzzle' | 'exhibit' | 'door';
  label: string;
  /** Placement id (puzzle/exhibit) or door id. */
  target: string;
  puzzleId?: PuzzleId;
  recordId?: string;
  doorId?: DoorId;
  /** A free spot from which the object is within reach. */
  stand: { x: number; z: number };
}

export const INTERACTABLES: InteractableDef[] = [
  { id: 'switch', kind: 'puzzle', label: 'Backup power switch', target: 'switch', puzzleId: 'PZ-00', stand: { x: 1.15, z: -4.72 } },
  { id: 'terminal-insight', kind: 'puzzle', label: 'Listening Station terminal', target: 'terminal-insight', puzzleId: 'PZ-01', stand: { x: -10.9, z: 7 } },
  { id: 'terminal-opportunity', kind: 'puzzle', label: 'Witness in Stone terminal', target: 'terminal-opportunity', puzzleId: 'PZ-02', stand: { x: 10.9, z: 7 } },
  { id: 'terminal-relay', kind: 'puzzle', label: 'Relay terminal', target: 'terminal-relay', puzzleId: 'PZ-03', stand: { x: 0, z: 14.9 } },
  { id: 'exhibit-insight', kind: 'exhibit', label: 'InSight display', target: 'insight-pedestal', recordId: 'R-INSIGHT-IMAGE', stand: { x: -10.54, z: 5.69 } },
  { id: 'exhibit-opportunity', kind: 'exhibit', label: 'Opportunity display', target: 'opportunity-pedestal', recordId: 'R-MER-INSTRUMENTS', stand: { x: 10.54, z: 5.69 } },
  { id: 'door-D0', kind: 'door', label: 'Door D0', target: 'D0', doorId: 'D0', stand: { x: 0, z: -2.3 } },
  { id: 'door-D1', kind: 'door', label: 'Door D1', target: 'D1', doorId: 'D1', stand: { x: 4.7, z: 6.5 } },
  { id: 'door-D2', kind: 'door', label: 'Door D2', target: 'D2', doorId: 'D2', stand: { x: 0, z: 10.2 } },
];

// ---------------------------------------------------------------- checkpoints, guides, lights, signs

export interface Pose {
  zone: ZoneId;
  x: number;
  z: number;
  yaw: number;
}

/** Safe points from LEVEL_DESIGN.md. The spawn frames the switch, not a wall. */
export const SAFE_POINTS: Record<ZoneId, Pose> = {
  AIRLOCK: { zone: 'AIRLOCK', x: 0, z: -6, yaw: Math.atan2(SWITCH_POS.x, SWITCH_POS.z + 6) },
  HUB: { zone: 'HUB', x: 0, z: 4, yaw: 0 },
  INSIGHT: { zone: 'INSIGHT', x: -9, z: 6, yaw: Math.atan2(-3, 1) },
  OPPORTUNITY: { zone: 'OPPORTUNITY', x: 9, z: 6, yaw: Math.atan2(3, 1) },
  RELAY: { zone: 'RELAY', x: 0, z: 14.5, yaw: 0 },
  OBSERVATION:{zone:'OBSERVATION',x:0,z:26,yaw:0},
};

export type GuideId = 'SWITCH' | 'INSIGHT' | 'OPPORTUNITY' | 'RELAY' | 'OBSERVATION';

/** Floor guide lines towards the active objective. Colour is paired with signs and text. */
export const GUIDES: Record<GuideId, { color: string; path: [number, number][] }> = {
  OBSERVATION:{color:'#D8C6A5',path:[[2.7,15],[2.7,23.4],[0,26.5]]},
  SWITCH: { color: '#E0A35A', path: [[0, -5.3], [1.0, -4.55]] },
  INSIGHT: { color: '#71D4D6', path: [[-0.35, 4.6], [-0.35, 6.5], [-8.6, 6.5], [-10.4, 6.9]] },
  OPPORTUNITY: { color: '#BA7652', path: [[0.35, 4.6], [0.35, 6.5], [8.6, 6.5], [10.4, 6.9]] },
  RELAY: { color: '#E0A35A', path: [[0, 7.1], [0, 14.2]] },
};

export interface ZoneLight {
  fill: { x: number; y: number; z: number; color: string; range: number };
  accent: { from: [number, number, number]; to: [number, number, number]; angle: number; color: string; range: number };
}

export const ZONE_LIGHTS: Record<ZoneId, ZoneLight> = {
  OBSERVATION:{fill:{x:0,y:2.9,z:25,color:'#627A93',range:12},accent:{from:[-3,3.1,25],to:[0,0,27],angle:1.5,color:'#C6D5E5',range:14}},
  AIRLOCK: {
    fill: { x: -0.4, y: 2.9, z: -5.2, color: '#E0A35A', range: 10 },
    accent: { from: [-0.9, 3.25, -6.6], to: [1.8, 0.7, -4], angle: 1.25, color: '#F2D2A6', range: 12 },
  },
  HUB: {
    fill: { x: 0, y: 2.9, z: 5, color: '#9FB4C4', range: 12 },
    accent: { from: [0.8, 3.25, 4.2], to: [-3.6, 0.6, 8.8], angle: 1.5, color: '#C9D6DE', range: 14 },
  },
  INSIGHT: {
    fill: { x: -10.2, y: 2.9, z: 7.4, color: '#71D4D6', range: 10 },
    accent: { from: [-10.3, 3.3, 6.1], to: [-12.3, 0.5, 4.3], angle: 1.35, color: '#D5F1F2', range: 12 },
  },
  OPPORTUNITY: {
    fill: { x: 10.2, y: 2.9, z: 7.4, color: '#BA7652', range: 10 },
    accent: { from: [10.3, 3.3, 6.1], to: [12.3, 0.5, 4.3], angle: 1.35, color: '#F3D9C6', range: 12 },
  },
  RELAY: {
    fill: { x: 0, y: 2.9, z: 14.6, color: '#E0A35A', range: 11 },
    accent: { from: [0, 2.35, 20.25], to: [0, 0.85, 14], angle: 1.2, color: '#F1DDB8', range: 16 },
  },
};

export interface SignDef {
  id: string;
  zone: ZoneId;
  text: string;
  sub?: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  w: number;
  h: number;
  color: string;
}

export const SIGNS: SignDef[] = [
  {id:'sign-deck',zone:'RELAY',text:'OBSERVATION DECK',sub:'NORTH · RESCUE VISUAL CONTACT',x:3.1,y:2.95,z:18.95,yaw:Math.PI,w:2.6,h:.4,color:'#D8C6A5'},
  { id: 'sign-airlock', zone: 'AIRLOCK', text: 'ARCHIVE ACCESS  D0', sub: 'FICTIONAL STATION · VØRAX', x: 0, y: 2.95, z: -2.03, yaw: S, w: 2.4, h: 0.5, color: '#E0A35A' },
  { id: 'sign-controls', zone: 'AIRLOCK', text: 'WASD MOVE · MOUSE LOOK', sub: 'E INTERACT · F LIGHT · J JOURNAL · ESC PAUSE', x: -2.97, y: 1.75, z: -5.6, yaw: E, w: 1.9, h: 0.5, color: '#C9D6DE' },
  { id: 'sign-exterior', zone: 'AIRLOCK', text: 'EXTERIOR LOCK', sub: 'SEALED', x: 0, y: 2.95, z: -7.6, yaw: N, w: 1.8, h: 0.45, color: '#BA7652' },
  { id: 'sign-west', zone: 'HUB', text: '◂ LISTENING STATION', sub: 'INSIGHT · WEST', x: -4.97, y: 2.95, z: 6.5, yaw: E, w: 2.7, h: 0.5, color: '#71D4D6' },
  { id: 'sign-east', zone: 'HUB', text: 'WITNESS IN STONE ▸', sub: 'OPPORTUNITY · EAST · D1', x: 4.97, y: 2.95, z: 6.5, yaw: W, w: 2.7, h: 0.5, color: '#BA7652' },
  { id: 'sign-north', zone: 'HUB', text: '▴ RELAY', sub: 'NORTH · D2', x: 0, y: 2.95, z: 9.97, yaw: S, w: 2.2, h: 0.5, color: '#E0A35A' },
  { id: 'sign-south', zone: 'HUB', text: 'AIRLOCK ▾', sub: 'SOUTH · D0', x: 0, y: 2.95, z: 0.03, yaw: N, w: 2.2, h: 0.5, color: '#C9D6DE' },
  { id: 'sign-insight', zone: 'INSIGHT', text: 'LISTENING STATION', sub: 'NASA RECORD 2018-042A · INSIGHT', x: -14.97, y: 2.6, z: 5.2, yaw: E, w: 3.0, h: 0.55, color: '#71D4D6' },
  { id: 'sign-opportunity', zone: 'OPPORTUNITY', text: 'WITNESS IN STONE', sub: 'NASA RECORD 2003-032A · OPPORTUNITY', x: 14.97, y: 2.6, z: 5.2, yaw: W, w: 3.0, h: 0.55, color: '#BA7652' },
  { id: 'sign-relay', zone: 'RELAY', text: 'RELAY · LOCAL QUEUE', sub: 'FICTIONAL ARCHIVE SYSTEM', x: -4.97, y: 2.6, z: 16.6, yaw: E, w: 2.8, h: 0.55, color: '#E0A35A' },
];

export const EXHIBIT_LABEL = 'Illustrative display — not recovered hardware';

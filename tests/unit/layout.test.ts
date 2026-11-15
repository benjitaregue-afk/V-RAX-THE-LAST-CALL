import { describe, expect, it } from 'vitest';
import { DOOR_IDS, ZONE_IDS } from '../../src/game/contracts';
import type { DoorId } from '../../src/game/contracts';
import {
  BODY_R,
  DOORS,
  DOOR_OPENING_W,
  GUIDES,
  INTERACTABLES,
  PLACEMENTS,
  REACH,
  RECTS,
  SAFE_POINTS,
  collidersFor,
  computeWalls,
  distanceToBox,
  doorBlocker,
  isStandable,
  rectAt,
  staticColliders,
  zoneAt,
} from '../../src/world/layout';
import type { OBox } from '../../src/world/layout';

const CELL = 0.1;

/** Cells reachable on foot from a start point, for a given set of open doors. */
function reachable(open: Partial<Record<DoorId, boolean>>, from: { x: number; z: number }): (x: number, z: number) => boolean {
  const colliders = collidersFor(open);
  const x0 = -16;
  const z0 = -9;
  const cols = Math.round(32 / CELL);
  const rows = Math.round(40 / CELL);
  const free = new Uint8Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (isStandable(x0 + i * CELL, z0 + j * CELL, colliders)) free[j * cols + i] = 1;
    }
  }
  const cell = (x: number, z: number): number => Math.round((z - z0) / CELL) * cols + Math.round((x - x0) / CELL);
  const seen = new Uint8Array(cols * rows);
  const queue = [cell(from.x, from.z)];
  expect(free[queue[0]!], 'start cell is free').toBe(1);
  seen[queue[0]!] = 1;
  while (queue.length) {
    const c = queue.pop()!;
    for (const n of [c - 1, c + 1, c - cols, c + cols]) {
      if (n >= 0 && n < free.length && free[n] && !seen[n]) {
        seen[n] = 1;
        queue.push(n);
      }
    }
  }
  return (x, z) => seen[cell(x, z)] === 1;
}

describe('level layout (LEVEL_DESIGN.md)', () => {
  it('has the six connected zones and connectors of at least 1.8 m', () => {
    expect(RECTS.filter((r) => r.kind === 'room').map((r) => r.zone)).toEqual(['AIRLOCK', 'HUB', 'INSIGHT', 'OPPORTUNITY', 'RELAY', 'OBSERVATION']);
    expect(RECTS.filter((r) => r.kind === 'connector')).toHaveLength(5);
    expect(DOOR_OPENING_W).toBeGreaterThanOrEqual(1.8);
    expect(zoneAt(0, -6)).toBe('AIRLOCK');
    expect(zoneAt(-12, 7)).toBe('INSIGHT');
    expect(zoneAt(12, 7)).toBe('OPPORTUNITY');
    expect(zoneAt(0, 16)).toBe('RELAY');
    expect(zoneAt(6, 6.5)).toBe('HUB');
    expect(zoneAt(40, 40)).toBeNull();
    expect(rectAt(0, 11.5)?.id).toBe('CONN_N');
  });

  it('builds walls that never intrude into a walkable rectangle', () => {
    const walls = computeWalls();
    expect(walls.length).toBeGreaterThan(20);
    for (const w of walls) {
      for (const r of RECTS) {
        const ox = Math.min(w.x + w.w / 2, r.x1) - Math.max(w.x - w.w / 2, r.x0);
        const oz = Math.min(w.z + w.d / 2, r.z1) - Math.max(w.z - w.d / 2, r.z0);
        expect(ox > 1e-6 && oz > 1e-6, `${w.id} intrudes into ${r.id}`).toBe(false);
      }
    }
  });

  it('leaves a real gap in the walls at every connector', () => {
    const walls = computeWalls();
    for (const c of RECTS.filter((r) => r.kind === 'connector')) {
      const cx = (c.x0 + c.x1) / 2;
      const cz = (c.z0 + c.z1) / 2;
      const alongZ = c.id === 'CONN_S' || c.id === 'CONN_N' || c.id === 'CONN_DECK';
      for (let t = -0.2; t <= 1.2001; t += 0.1) {
        const x = alongZ ? cx : c.x0 + t * (c.x1 - c.x0);
        const z = alongZ ? c.z0 + t * (c.z1 - c.z0) : cz;
        for (const w of walls) expect(distanceToBox(x, z, w), `${w.id} blocks ${c.id}`).toBeGreaterThan(BODY_R);
      }
    }
  });

  it('keeps safe points inside their zone and clear of every obstacle', () => {
    const all = collidersFor({});
    for (const zone of ZONE_IDS) {
      const p = SAFE_POINTS[zone];
      expect(zoneAt(p.x, p.z)).toBe(zone);
      for (const b of all) expect(distanceToBox(p.x, p.z, b), `${zone} safe point vs ${b.id}`).toBeGreaterThanOrEqual(0.75);
    }
  });

  it('gives every interactable a free standing spot within reach', () => {
    const all = collidersFor({});
    const boxes = new Map<string, OBox[]>();
    for (const p of PLACEMENTS) boxes.set(p.id, p.colliders);
    for (const d of DOORS) boxes.set(d.id, [doorBlocker(d)]);
    for (const it of INTERACTABLES) {
      expect(isStandable(it.stand.x, it.stand.z, all), `${it.id} stand is blocked`).toBe(true);
      const target = boxes.get(it.target);
      expect(target, `${it.id} target`).toBeDefined();
      const d = Math.min(...target!.map((b) => distanceToBox(it.stand.x, it.stand.z, b)));
      expect(d, `${it.id} is ${d.toFixed(2)} m away`).toBeLessThan(REACH - 0.6);
    }
  });

  it('puts the documented terminals where the level design says', () => {
    const pos = (id: string): [number, number] => {
      const p = PLACEMENTS.find((x) => x.id === id)!;
      return [p.x, p.z];
    };
    expect(pos('switch')).toEqual([1.8, -4]);
    expect(pos('terminal-insight')).toEqual([-12, 7]);
    expect(pos('terminal-opportunity')).toEqual([12, 7]);
    expect(pos('terminal-relay')).toEqual([0, 16]);
  });

  it('keeps props out of doorways and inside the level', () => {
    const solid = staticColliders();
    for (const p of PLACEMENTS) {
      expect(rectAt(p.x, p.z, 0.02), `${p.id} is outside the level`).not.toBeNull();
      expect(zoneAt(p.x, p.z) ?? p.zone, p.id).toBe(p.zone);
    }
    for (const d of DOORS) {
      const c = Math.cos(d.yaw);
      const s = Math.sin(d.yaw);
      for (const along of [-0.6, 0, 0.6]) {
        for (const across of [-1.6, -0.8, 0.8, 1.6]) {
          const x = d.x + along * c + across * s;
          const z = d.z - along * s + across * c;
          for (const b of solid) expect(distanceToBox(x, z, b), `${b.id} narrows ${d.id}`).toBeGreaterThanOrEqual(BODY_R);
        }
      }
    }
  });

  it('gates each area exactly as the story requires (no softlock, no shortcut)', () => {
    const stand = (id: string): { x: number; z: number } => INTERACTABLES.find((i) => i.id === id)!.stand;
    const spawn = SAFE_POINTS.AIRLOCK;
    const stages: { open: DoorId[]; can: string[]; cannot: string[] }[] = [
      { open: [], can: ['switch', 'door-D0'], cannot: ['terminal-insight', 'terminal-opportunity', 'terminal-relay'] },
      { open: ['D0'], can: ['switch', 'terminal-insight', 'exhibit-insight', 'door-D1', 'door-D2'], cannot: ['terminal-opportunity', 'terminal-relay'] },
      { open: ['D0', 'D1'], can: ['terminal-insight', 'terminal-opportunity', 'exhibit-opportunity'], cannot: ['terminal-relay'] },
      { open: ['D0', 'D1', 'D2'], can: INTERACTABLES.map((i) => i.id), cannot: [] },
    ];
    for (const stage of stages) {
      const open = Object.fromEntries(DOOR_IDS.map((d) => [d, stage.open.includes(d)]));
      const reach = reachable(open, spawn);
      for (const id of stage.can) expect(reach(stand(id).x, stand(id).z), `${id} with [${stage.open}]`).toBe(true);
      for (const id of stage.cannot) expect(reach(stand(id).x, stand(id).z), `${id} with [${stage.open}]`).toBe(false);
      if (stage.open.length === 3) {
        for (const zone of ZONE_IDS) expect(reach(SAFE_POINTS[zone].x, SAFE_POINTS[zone].z), `${zone} safe point`).toBe(true);
      }
    }
  });

  it('draws guide lines over free floor', () => {
    const solid = staticColliders();
    for (const [id, g] of Object.entries(GUIDES)) {
      for (const [x, z] of g.path) expect(isStandable(x, z, solid, 0.1), `${id} guide at ${x},${z}`).toBe(true);
    }
  });
});

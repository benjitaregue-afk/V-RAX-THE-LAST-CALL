# CLAUDE HANDOFF — Survivor narrative build

Updated 2026-11-14. Continue this checkout. **The current direction supersedes the former archive-loop ending.** Final meshes, materials, destruction, hand rig, recorded performances and cinematic polish remain Claude's responsibility. Codex has implemented the playable sequence using provisional geometry.

## Launch / verify

```sh
npm ci                       # only when dependencies are missing
npm run dev -- --host 127.0.0.1
npm test
npm run typecheck
npm run build
npm run test:e2e              # one invocation at a time
```

Dev: http://127.0.0.1:5173/. Production preview: `npm run preview -- --host 127.0.0.1` at 4173. Use the pinned lockfile. Do not upgrade Babylon during art integration. QA artifacts belong under output/playwright and are ignored by the dev watcher.

## Current playable arc

1. **PROLOGUE / THE AWAKENING:** black screen, muffled synthetic alarm/ringing/breath cue, internal thoughts, two-hand recovery and standing camera. The survivor was injured during evacuation. Controls remain locked until recovery completes or the player explicitly skips.
2. PZ-00 restores the fictional emergency bus. **CHAPTER I / THE FORGOTTEN:** Opportunity/PZ-02 restores auxiliary power and the evacuation manifest. Scientific questions/answers are unchanged.
3. Returning from that terminal triggers power return, metal strike, blackout and **CHAPTER II / BENEATH THE SILENCE**. Sensor failure explains the accidental abandonment. InSight/PZ-01 restores the listening/beacon route.
4. PZ-03 keeps the existing provenance exercise. Activate distress beacon triggers initial rescue contact and **EPILOGUE / NOT FORGOTTEN**, including the user's monologue.
5. Monologue completion enables **REACH THE OBSERVATION DECK.** The player must physically walk there; skip does not complete the game.
6. Rescue One approaches beyond the window, points its actual spotlight at the camera and broadcasts the requested fictional transmission. “I'm here.” → black fade → THE END / “Some missions never truly end.” Functional RESTART and CREDITS.

All emergencies, survivor thoughts, radio and ship systems are explicitly fiction. NASA evidence remains in the stable evidence panels, with original citations and credits.

## Ownership / systems to preserve

- `src/game/contracts.ts`, `reducer.ts`, `projection.ts`: ten-stage monotonic story, puzzle guards and doors.
- `src/save/save.ts`: content version `.2`, awakened flag, safe rehydration. Old `.1` saves are rejected with explanation, not silently migrated.
- `src/main.ts`: director, app modes, callbacks, checkpoint and rescue trigger.
- `src/player/player.ts`: WASD 1.8 m/s, Shift 3.2 m/s, fixed-step collision. Do not add a second controller.
- `src/player/hands.ts`: visual-only hand interface. Imported mesh/clip completion never advances story.
- `src/world/layout.ts`: authoritative placement, bounds, colliders and anchors.
- `src/world/visuals.ts`: data-driven GLB slots/fallback; `world/rescue.ts`: rescue actor, searchlight and provisional exterior.
- `src/ui/ui.ts`: menus, evidence, cinematic captions and Continue/Skip; `src/content/story.ts`: new fictional scenes. Preserve scientific content in claims/records/puzzles and its provenance. Only puzzle prerequisites changed.
- `src/audio/audio.ts`: provisional Web Audio effects/muffler; `audio/voice.ts`: provisional browser speech with captions and graceful unavailable-voice fallback.

Safe art changes: Blender files/exports, admitted visual files, the visual manifest, materials/lighting/styles and scene presentation in coordination with the integrator. Do not change puzzle answers, state guards, save format, collision layout or source identity to accommodate a mesh. Update tests for deliberate contract changes.

## Coordinate and scene contract

Metres; +Y up, +Z north/front, +X right; yaw 0 faces +Z. Floor Y=0, eye Y=1.65, ceiling 3.4. Player collision radius .3, body centre .85; flat-floor movement, no jumping.

Existing five rooms and their object anchors are preserved. New observation deck: X[-6,6], Z[22,30]. Offset connector X[1.8,4.8], Z[19,22] avoids the relay machinery. Walking route from relay console: (2.7,15) → (2.7,23.4) → (0,26). Do not centre this connector without checking the core collider.

Observation window: north plane Z=29.98, centre (0,1.65,29.98), width10.5m, height2.55m. Collision remains a sealed barrier even though the opaque wall visual is removed. Give the final shell a proper frame/sill and clear exterior sightline. Exterior is actual 3D in the same scene, not an ending webpage.

## GLB replacement

Place files in `public/assets/models/`. Activate only delivered files in `public/visual-assets.json`:

```json
{
  "environment": "assets/models/archive-shell.glb",
  "terminal": "assets/models/terminal.glb",
  "hands": "assets/models/player-hands.glb",
  "rescue": "assets/models/rescue-one.glb"
}
```

This is an example, not the current manifest. All existing slots remain supported: switch, door, rack, pedestal, insight, opportunity, relay, arm, fan, lamp, rib, crate, tray. Empty/missing slots retain greybox. No automatic fit-to-bounds scaling. No remote URLs/traversal.

Environment is a global (0,0,0) shell only; do not duplicate separately placed terminals/props/doors. Prop origins are bottom centre, front+Z unless mounting Y is specified. Ceiling-mounted arm/lamp/tray use the ceiling as mount origin. Existing Blender conventions Z-up/front−Y convert to Y-up/front+Z on glTF export; do not apply another conversion in engine.

Collision and interaction proxies are independent of GLB visuals. Do not enable collision or picking on imported render meshes. Preserve 2.2m reach and the free stand points in INTERACTABLES. Final meshes must fit existing envelopes, or require a deliberate collider/test update.

## First-person hand production contract

Path: `assets/models/player-hands.glb`. Root at camera/eye origin, unit scale; +X right, +Y up, +Z forward. Suggested wrists at ±.23,−.32,+.48 m in idle. Root + wrist_L/R + finger joints is sufficient; game does not refer to bone names. Remove lights/cameras and avoid world-space placement transforms.

Exact AnimationGroup names and runtime reference durations:

| Name | Seconds | Required action |
| --- | ---: | --- |
| Awaken | 3.2 | Right palm rises into view; left reaches for support |
| StandUp | 3.0 | Plant palms, weight/push against floor, recover upright |
| Idle | 1.8 loop | Restrained rest, no large camera bob |
| Reach | .72 | Reach at an inspectable object |
| PressTerminal | .9 | Reach and index/control press |
| OperateSwitch | 1.1 | Grip/pull fictional backup control |
| OperateDoor | .8 | Press/reach toward door control |

Clips may be authored at30/60fps; the runtime samples their from/to range to the reference duration. Missing clips retain procedural fallback. Render group2 is reserved for the viewmodel; keep meshes non-pickable/non-colliding. `play`, `update(dt)`, `setVisible`, `loadAsset`, `dispose` are the integration API. No game event waits for clip callbacks.

Awakening camera starts at Y=.24 with downward pitch .9 radians. At3.2s it begins a3s rise to1.65 and removes tilt; reduced intensity removes roll. Current hands are intentionally simple, not anatomical production work. Review support/contact visually with the authored final rig; animation and camera must align.

## Damage, atmosphere and chapter transition

Produce cracked/offline consoles, loose panels, exposed cable runs, restrained smoke/dust and emergency lights. Keep mandatory paths clear. Provisional debris is cosmetic and outside paths. None of these assets may corrupt/obscure NASA evidence.

Transition reference: 0–2.5s power briefly returns; at2.5s metal impact + power failure; darkness through5.5s; chapter title reveals and light recovers. `--recovery` controls world blackout, `--chapter-title-opacity` controls title. Avoid rapid strobe. All narrative timings have explicit Continue/Skip recovery and must remain independent from game-state guards.

## Rescue actor / searchlight

Optional `rescue` slot replaces anchor `anchor:rescue-one`, with ship origin at its base/centre and local front+Z. Actor yawπ faces the window. Provisional envelope is about3W×6D×2H, with wings extending to roughly9m total width. Do not bake approach offsets into the mesh.

On RESCUE the root moves with smooth interpolation from (8,4,60) to (0,2.5,40) over5s. Searchlight source is root+(0,.8,−2.5) in world space, tracks player camera, ramps intensity0→8 over4s, angle .48rad/range60. A warm emissive lens and low-opacity provisional scatter cone make the functional lighting readable. Replace these VFX deliberately, preserving actual spotlight targeting and visual confirmation.

The first rescue beat lasts5s; radio confirmation then8s, survivor reply3s, final fade1.4s. Continue/Skip can accelerate presentation. Use `data-rescue-*` and screenshot QA to verify actual geometry, not just text. Authored approach/spotlight animation may replace the interpolation, but never control the sole path to COMPLETE.

## Audio / dialogue assets

Current voice uses platform Web Speech, not NASA audio or final recorded acting. Caption and synthetic-radio fallback remains mandatory when speech/voices are unavailable. Final recordings should be original/licensed, with exact text in story.ts and accessible captions. Suggested future clips: awakening thoughts, chapter2 reflection, beacon contact, seven epilogue lines, RescueOneVisualConfirmation and SurvivorImHere. Add a reviewed audio loader/bus integration before enabling files; no arbitrary CDN embedding.

## Provenance and verification

Current observed checks: 85 unit tests PASS; production build/typecheck PASS; 12/12 browser scenarios PASS in headed Chrome 157. The final black ending-background adjustment was then rebuilt and the two gameplay scenarios (full survivor route plus controls) passed again. Real speech onstart was observed for the exact rescue radio and survivor reply; human listening/mix review remains pending. Build `dist/index.html` SHA-256: `77212aeee330305deced07fde81ce955234d41136d33b68200acc80ffc30747d`. Exact logs and remaining limits are in PROGRESS.md. Do not describe the automated accelerated route as a measured human 8–12 minute playthrough.

Admit actual exported files into ASSETS with exact rights/credit/transforms, run assets:hash and content tests. MODEL_ASSETS remains planned metadata, not proof that an export exists. Do not overwrite NASA originals. Runtime/AI disclosure must name the actual assets/tools used.

Existing `assets/blender/scripts/build_kit.py` is preserved. It purges and overwrites its scene/outputs, calls main unconditionally and references missing export_kit.py. Do not run it against hand-edited art. Create/use a non-destructive exporter.

See PROGRESS.md and output/playwright logs for observed checks. Before final release still test actual production GLBs/rig, perform human audio/comfort/duration review, test minimum laptop and Safari/Firefox, verify public URL without login and close team submission checks. Do not report these as passed from Chrome greybox tests.

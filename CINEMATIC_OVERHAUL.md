# Cinematic overhaul — production log

Date: 2026-11-15, America/La_Paz. User authorized sequential production and requires a visual review of the first authored hands/animations, then a review of the first mission/archive interface before wider rollout.

## Recovery checkpoint

`fe7c70b` preserves the complete pre-overhaul r3 checkout, including editable Blender source and all delivered GLBs. Existing staged deletion of build_kit.py was preserved. No regeneration of build_station.py was executed. Live scene pre-edit copy: assets/blender/backups/overhaul_before_phase1.blend.

## Reference separation

The two Desktop screenshots dated 05:09 are VØRAX defect evidence. Downloads/mano.webp is an external hand/framing reference. The two Dead_Space_Text_Log images and images (2).jpeg are external interface references. They are design references, not shipped textures, models, UI assets or source evidence. Original VØRAX art and stable NASA evidence remain distinct.

## Phase 1 — geometry defect, implemented

The served GLB and Blender source both put the steel trim's inner face on the structural jamb plane: portal-local x=±1.0. Affected faces in ENV_HUB are separate material primitives: textured struct and constant steel palette. They overlap by 1.231 m² per jamb. Header underside has a further 0.97 m² overlap at z=2.5, and gussets add coplanarity. The 6e-8 m coordinate difference is floating point noise, not a meaningful separation.

Reproduced from three camera angles at D0, with the door open in the development art viewer. This reproduces the angle-dependent black stipple/blocks in the user's screenshots. UV0 uses valid intentional tiling / constant palette swatches; both faces have valid parallel normals. Maps/filtering cannot resolve two differently shaded surfaces sharing depth. Duplicate faces elsewhere were inventoried but not globally removed. No broad deduplication, lighting concealment or basic replacement meshes were used.

Repair: translate only existing steel side trims and their hazard bands 15 mm toward the opening, and the steel header trim 15 mm down, at D0/D1/D2/ARCH_W. 632 ENV_HUB and 296 DET_HUB vertices moved. Topology, counts, both UV layers and material assignments preserved. Source generator dimensions corrected for future use without invoking it. Editable master and versioned r4 copy saved; environment GLB re-exported through the r3 exterior-aware exporter. No other zone geometry or Rescue One was rebuilt; no lightmaps/probes were rebaked.

Files: assets/blender/scripts/{station_arch,repair_portal_trim}.py, assets/blender/portal-repair-report.json, assets/blender/vorax_station.blend, public/assets/models/environment.glb, src/content/asset-hashes.json. Environment hash: d5d2589b1177cc5457f6b81aaf1032b746e31dbdaaaffd338d2cf53b508eadd0.

Evidence: output/playwright/overhaul/phase1_before/ and phase1_after/, jamb_inner / jamb_inner_oblique / jamb_inner_near.png. Actual Babylon.js dev scene, headless Chrome, 1280×720, INSIGHT profile, flashlight on, posed camera, no game progression claim. Observation: previously unstable patches are gone, steel/hazard trims remain detailed and stable. npm test: 85/85 PASS; npm run build (includes typecheck): PASS; assets:hash: 27 files. Automated camera posing is not a human playthrough or laptop performance acceptance.

## Phase 2 — in production

First original glove model, rig, authored animation set and first-person integration are in production. Visual review must use actual in-engine camera captures before extending this system. Detailed runtime geometry/animation claims are recorded only after export and verification.

## Phases 3–5

Interface rollout, white rescue finale and final whole-game QA remain pending. No phase is marked complete from a design plan or a mockup.

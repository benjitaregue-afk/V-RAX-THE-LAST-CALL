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

## Phase 2 — implemented and visually approved

User approved the first actual in-engine glove model and animation direction on 2026-11-15, answering “Aprobar y continuar” at the requested visual checkpoint. Approval covers this direction; further comfort/hardware review remains human work.

Original fully covered graphite work gloves with articulated unequal fingers, opposed thumbs, dorsal guards, glove seams, cuff equipment and weathered woven sleeves. Pair: 23,504 triangles, 35 bones, four shared materials, three original 1024² material maps. Maximum two skin influences per vertex; no unweighted vertices, open/non-manifold edges or degenerate faces. Source: assets/blender/scripts/build_hands.py; editable hands-only library: assets/blender/hands/vorax_hands_source.blend (append FP_HANDS); the open master also contains the parked, render-hidden FP_HANDS collection. Ten actual joint-animated GLB clips: Awaken, StandUp, Idle, Reach, PressTerminal, OperateSwitch, OperateDoor, Walk, Sprint, Inspect. Fixed-distance viewmodel, no world-distance LOD. No external reference pixels/meshes/branding were copied.

Runtime samples authored joint TRS on the game clock with 0.18 s quaternion/TRS blends, independent paused timing, restrained breathing/walking/sprint, bounded camera-local interaction direction and near-wall lowering. Sleeve rig now aims from anchored elbows and follows wrist supination roll, fixing floating endcaps and twisted cloth observed in the first iteration. Blender's exported white sheen was removed after identifying its incorrect glTF factor; graphite colour, woven normals, localized grime, scratches and guard-edge wear remain. Two camera-local lights affect only the hands. Text interfaces, pause and narrative dialogue hide the hands; awakening deliberately shows them.

Prologue choreography uses the actual camera inverse for planted support, measured finger clearance through both turn arcs, zero camera roll, and an exactly synchronized StandUp clock. Reveal now finishes with the raised-palm gesture. Deformed geometry sampled at authored frame times clears the floor: minimum Awaken 0.0002 m, StandUp 0.00348 m; assets/blender/hands/camera-audit.json records all samples. This is geometric verification, not a human comfort test.

Delivery: public/assets/models/player-hands.glb, 1,525,964 bytes, SHA-256 c17d52a85683ddfb21418eb98ab3ec7aa976ce3f9ed8fafb3c008ca7671b4ddc. Registry and visual manifest include only the real export. Both master and standalone library reopened in background Blender with all ten clips/35 bones and no missing images.

Executed final checks: npm test 90/90 PASS, npm run build/typecheck PASS, final npm run test:e2e 15/15 PASS in headless Chrome (3.0 min; output/playwright/overhaul/final-e2e.log). New real-input scenarios cover authored wake/stand, walk/sprint/idle, pause freezing, resume, switch anticipation, journal/source readability and reduced intensity. Binary tests check actual skin weights/joints and time-varying channels for all clips. Existing full survivor route reaches rescue/THE END and checks restart. This is an accelerated automated route, not a human first playthrough.

Evidence: output/playwright/overhaul/hands/ (posed in-engine clip review), hands-gameplay/ (normal controls/UI screenshots), hands-demo/first-person-hands.webm (native canvas recording of actual first-person play; no external encoding dependency). Camera-only capture excludes HTML overlays; real UI screenshots are separate. Original twelve regression scenarios also passed before the last presentation tuning; final fifteen include that tuning.


## Phase 3 — first interface prototype, awaiting visual approval

Original VØRAX survivor-link mission HUD and Opportunity-only local archive console implemented after the hands approval. Cyan/amber technical framing, real ship-layout rail, recovery progress, evidence/restore navigation, 240 ms opening and 220 ms decorative closing. Reduced intensity and OS reduced-motion remove interface motion; 125–150% text stacks the scientific content and form. Existing record text, PIA05584 pixels, credits, provenance labels, source links, IDs and puzzle answers are unchanged. Other archives, journal and dialogue have not yet received the design.

Executed: npm test 90/90 PASS; npm run build/typecheck PASS. Actual controls in Chrome 157 at 1440×900: solve PZ-00, physically walk to Opportunity, open PZ-02, inspect original image/credit/false-colour label, 18 Tab steps within dialog, pause/settings, 150% text with reduced intensity, return and solve PZ-02. Repeated against both development and production builds, zero runtime/console errors. Evidence: output/playwright/overhaul/interface/ and interface-production/ (screenshots and review.json). User has been shown the actual first console screenshot and asked for the second required visual approval. Wider rollout is pending that answer.

Independent keyboard review reproduced an existing cinematic focus defect: Enter on Continue replaced the focused button, moving focus to BODY; Shift+Tab could then reach the canvas. Narrow correction retains Continue/Skip or panel focus across beat replacement, recovers Tab from outside the modal, and excludes disabled native controls. New normal-input tests/e2e/interface.spec.ts failed on the original production build and passed after rebuilding (1/1, 2.4 s); production build/typecheck and 90 unit tests also pass. Evidence: interface/focus-review.json and interface-focus-{before,after,build,unit}.log. This fix does not extend the pending visual design.

## Phases 4–5

White rescue finale and final integrated QA remain pending. No phase is marked complete from a design plan or a mockup.

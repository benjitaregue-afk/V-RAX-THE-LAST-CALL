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


## Phase 3 — first interface prototype, rejected

Original VØRAX survivor-link mission HUD and Opportunity-only local archive console implemented after the hands approval. Cyan/amber technical framing, real ship-layout rail, recovery progress, evidence/restore navigation, 240 ms opening and 220 ms decorative closing. Reduced intensity and OS reduced-motion remove interface motion; 125–150% text stacks the scientific content and form. Existing record text, PIA05584 pixels, credits, provenance labels, source links, IDs and puzzle answers are unchanged. Other archives, journal and dialogue have not yet received the design.

Executed: npm test 90/90 PASS; npm run build/typecheck PASS. Actual controls in Chrome 157 at 1440×900: solve PZ-00, physically walk to Opportunity, open PZ-02, inspect original image/credit/false-colour label, 18 Tab steps within dialog, pause/settings, 150% text with reduced intensity, return and solve PZ-02. Repeated against both development and production builds, zero runtime/console errors. Evidence: output/playwright/overhaul/interface/ and interface-production/ (screenshots and review.json). User has been shown the actual first console screenshot and asked for the second required visual approval. Wider rollout is pending that answer.

Independent keyboard review reproduced an existing cinematic focus defect: Enter on Continue replaced the focused button, moving focus to BODY; Shift+Tab could then reach the canvas. Narrow correction retains Continue/Skip or panel focus across beat replacement, recovers Tab from outside the modal, and excludes disabled native controls. New normal-input tests/e2e/interface.spec.ts failed on the original production build and passed after rebuilding (1/1, 2.4 s); production build/typecheck and 90 unit tests also pass. Evidence: interface/focus-review.json and interface-focus-{before,after,build,unit}.log. This fix does not extend the pending visual design.

The user explicitly rejected this visual design: too opaque, too rectangular and too similar to a web dashboard. Recovery checkpoint `be5e342` preserves it and the accessibility fix. It was never approved for wider rollout.

## Phase 3 revision — Witness in Stone optical projection

Scope is ONLY PZ-02, including its four existing scientific records and reconstruction controls. New direct visual targets: the two supplied Desktop screenshots dated 06:55:54 and 06:56:01 are external Dead Space references, not VØRAX assets or instructions. They inform translucent material, compact density, layered fine cyan edges and log-left/image-right composition. No reference pixels, layout assets or branding are shipped.

`src/ui/hologram.css` supplies the original desaturated charcoal projection, offset corner frames, restrained perspective, soft cyan perimeter and decorative scan/carrier lines. These effects are behind the scientific content; the photograph has no filter, recolour, crop, glitch or animated opacity. Default body and catalog fields are 16 px. The full original 895×726 image is contained with caption (13.76 px), Pancam, false-colour and unmodified-file labels (12 px) visible initially at 1440×900. Measured device footprint is 77.6% viewport width / 81.1% height; header/navigation consume 22.1% of the device height. The ship remains visible around and through the projection. The existing HUD is hidden only while this projection is open, and its design is unchanged.

`src/ui/ui.ts` keeps the other interfaces unchanged and reuses the original record nodes. Archive log has four compact record controls and independent scientific scrolling. Reconstruction uses native keyboard-accessible radio cards in place of PZ-02 dropdowns, with the same question labels, option IDs, answers, hints, validation and legacy. Choices survive mode/record navigation within the open terminal. H opens the hint and retains focus. Opening uses the existing contextual hand gesture before the projection appears; closing restores first-person control immediately while a decorative frame dismisses. Reduced intensity or OS reduced-motion removes projection motion; large text uses a flat, stacked scrollable view.

Visual iteration evidence: output/playwright/overhaul/hologram/iteration-{1,2}.png. After comparison with the references, compressed the top navigation, removed the background HUD from this terminal, strengthened only the reading wash, enlarged scientific fields/captions and added a real key legend. A large-text QA case exposed retained outer scroll when switching from a long source to reconstruction; mode changes now reset that outer scroll without resetting answers.

Executed development QA in actual Chrome 157/Babylon using normal movement and UI: restored PZ-00, physically walked to PZ-02; all four rendered records matched every original source field, editorial explanation, source URL, credit, usage condition and claim ID. Incomplete/incorrect answers stayed at ARCHIVE_OPEN; radio arrow keys, persistent choices, H focus and Tab navigation passed. Reader metrics and screenshots are in hologram/reader-qa.log, archive-final.png, reconstruction.png and hand-opening.png. No stage/save injection or camera posing was used.

Final production candidate: npm test 90/90 PASS; npm run build/typecheck PASS; npm run test:e2e 16/16 PASS (3.1 min). The existing complete survivor route uses the new PZ-02 controls and still reaches the existing rescue/THE END and restarts; the new white finale is not implemented in this limited revision. Logs: hologram/{unit,build,e2e}.log. Independent fresh Chrome CLI session at http://127.0.0.1:4173 restored power and physically walked to the real terminal at x=10.8664, z=6.9932, yaw=1.5578, then captured production-archive.png at 1440×900. At 1280×720, real settings enabled 150% text/reduced intensity; both modal focus boundaries, source/image scrolling, mode scroll reset, closing/exploration cleanup and keyboard-only correct radio selections PASS, zero page errors (accessibility-qa.log, large-{image,source,solved}-1280.png). OS prefers-reduced-motion also disables perspective, deployment, carrier and scan (os-reduced-motion.log). Earlier QA harness assertions observed passive canvas state/focus before the next render frame; the final check waits for state publication. The actual scroll-carry defect was corrected in product code.

The result uses carefully bounded screen-space perspective rather than a world-anchored mesh. Compared with the references, the inclination and optical disturbance are deliberately shallower so long scientific text remains stable. Images remain unmodified and controls remain semantic HTML. No Blender source, GLB, NASA asset, scientific content, reducer, puzzle validator or world geometry changed. No new project dependency, remote font or acquired art asset was introduced. Human visual approval, comfort and Safari/Firefox remain unverified. Visual approval is pending: STOP here; do not extend to journal, mission UI or other terminals, or continue the finale before the required review.

## Approved continuation — 2026-11-15

The user answered “Aprobar esta dirección” to the optical projection visual checkpoint. Approval covers continuation of this direction. Recovery checkpoint `42edfe0` preserves the approved PZ-02 implementation and executed checks. Continue the original sequential overhaul: extend Phase 3, test it, implement the white rescue finale, then integrated QA. Do not rebuild completed environments or change science/puzzle logic. The earlier STOP language above records the fulfilled checkpoint, not a continuing gate.

## Phases 4–5

White rescue finale and final integrated QA remain pending. No phase is marked complete from a design plan or a mockup.

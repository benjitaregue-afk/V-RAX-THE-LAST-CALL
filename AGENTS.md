# VØRAX — repository instructions

## Current phase and authority

Implementation is now explicitly authorized by the user. The current game has a survivor prologue, Opportunity first, Chapter II/InSight, beacon/monologue, a physical observation-deck walk and Rescue One ending. Preserve all science; Claude retains final art ownership. The original planning-only instruction below is historical and has been lifted. The user explicitly requested: **do not begin game implementation; stop after planning and wait for approval**. Do not scaffold the app, install dependencies, produce production assets, deploy, or submit the project during this phase. A later user instruction explicitly approving implementation lifts this gate; no special wording or repeated approval is required.

Do not interpret the role list or the future collaboration design as an instruction to spawn agents now. Follow the current user/developer authorization for delegation and external actions.

## Read before working

Read README.md, PROJECT_BRIEF.md, GAME_DESIGN_DOCUMENT.md, NASA_DATA_VALIDATION.md and the document relevant to the task. ARCHITECTURE.md defines proposed contracts; COLLABORATION_PLAN.md defines file ownership. Check for more specific instructions before editing subdirectories.

## Product invariants

- One connected 3D first-person scene; WASD/mouse-look, collision, lighting/shadow, atmosphere and a complete ending.
- Current core: awakening, PZ-00, PZ-02 Opportunity, Chapter II, PZ-01 InSight, PZ-03 provenance, beacon/monologue, walk to observation deck, rescue and THE END. Keep IDs and prerequisites consistent across documents and code when it exists.
- English player-facing copy and submission materials; explain major decisions to the user in Spanish.
- No combat, enemy AI, multiple planetary levels, backend or runtime AI unless the user explicitly changes scope.
- Never use a timer, lost object, audio-only clue or animation callback as the sole route to completion.
- Performance and 8–12 minute duration are targets until measured. A planning review is not a gameplay test.

## Science and provenance

- Use the Fxx claims and primary sources in NASA_DATA_VALIDATION.md; read and register a primary source before adding a factual claim.
- Keep NASA archival evidence, educational models and fictional archive events visibly distinct.
- Do not fabricate mission telemetry, quotations, scientific findings or NASA approval. PIA05584 is Pancam and false-color; SEIS sonifications are processed seismic signals.
- Track license/conditions, exact credit, URL, transformations and hash per acquired asset. Do not treat all NASA-hosted material as unrestricted.
- No generated/modified NASA logos, flags, patches or mission branding. Preserve literal factual source identifiers separately from generated artwork, subject to the unresolved submission interpretation documented in P0.
- Keep AI_USE_DISCLOSURE.md accurate. Do not claim Claude or another tool was used unless it was actually used. The 2026 ideation restriction and human review remain material submission checks.

## Editing and collaboration

- One writer per file. Codex owns engine, controller, state, schemas, integration, configuration and tests; Claude owns assigned content and asset records. Review without concurrent edits.
- Request a contract change through the integrator; update affected GDD/level/architecture/QA documents together.
- Prefer the existing checkout for sequential work. If parallel work is later authorized, isolate assigned files/worktrees and integrate sequentially.
- Preserve user changes. Do not clean or reset unrelated work. No new dependencies merely for convenience.

## Verification

The application and package.json now exist. Run the existing test, typecheck, build and browser scripts; never infer their results. After authorized implementation establishes scripts, use the documented typecheck, content validation, unit tests and production build; add browser/manual checks appropriate to the changed behavior.

Report only executed results. Each gameplay test records build, environment, steps, observation and evidence. Mark NOT RUN/BLOCKED honestly. Headless WebGL does not prove laptop performance; a debug-stage jump does not prove a complete game; WebKit automation does not prove Safari.

Before release: real fresh-profile completion, walls/doors/focus/puzzles/save/audio/settings, science/credits, console and production URL without login. Never use the emergency recenter or text fallback to hide the defect that caused it.

## Stop condition

For this authorized implementation, finish the requested gameplay and verification, then report results and limitations in Spanish. Do not publish or submit merely because the build is ready.

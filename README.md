# VØRAX — THE LAST SIGNAL

A short, single-player first-person story set aboard a fictional damaged spacecraft. Restore the Opportunity and InSight archives, check the evidence, activate a distress beacon and reach the observation deck for rescue.

NASA mission records and photographs are archival evidence. The spacecraft, survivor, emergency and rescue are fiction; the puzzles are educational models rather than spacecraft operation.

## Play locally

Requires Node.js and npm. From this folder:

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173/. If dependencies are already installed, skip `npm ci`.

To play a production build:

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

Open http://127.0.0.1:4173/. Use the URL printed by the server when running on a different port.

## Controls

WASD moves; mouse or arrow keys look; Shift sprints; F toggles the flashlight; E interacts; J opens the journal; Esc pauses. Menus and terminals support Tab, arrow keys, Space and Enter. H offers a puzzle hint. Settings include keyboard look, reduced intensity, larger text, brightness and audio controls. Captions and explicit sequence controls are available.

## Sources and production files

- [NASA data validation](NASA_DATA_VALIDATION.md): scientific claims, source IDs and the evidence/fiction boundary.
- [Source register](SOURCES.md): primary references and research provenance.
- [Asset manifest](ASSET_MANIFEST.md): credits, transformations and rights records; runtime hashes are in `src/content/asset-hashes.json`.
- [AI use disclosure](AI_USE_DISCLOSURE.md): the recorded contributions of AI tools and human review still required.
- `src/`, `public/`, `tests/` and `scripts/`: game source, served assets, executable checks and tooling.
- `assets/`: editable Blender sources, texture provenance and unmodified NASA research originals. Use the saved station master when editing; `assets/blender/scripts/build_station.py` is an older generator and must not be used to regenerate the approved scene.

Internal planning notes, old previews, backups and generated QA outputs are not required to build or play the game. Credits and usage conditions remain separate for original work, NASA archival material and third-party assets. Consult the manifests; this README does not grant a blanket licence for those materials.

## Verification

```sh
npm run typecheck
npm run validate:content
npm test
npm run build
npm run test:e2e
```

The browser suite uses the production build in locally installed Chrome. Automated completion checks do not establish human comfort, first-play duration, minimum laptop performance or Safari/Firefox compatibility. Final human review and competition submission are separate from local verification. The project has not been published or submitted by this cleanup.

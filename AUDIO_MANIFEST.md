# AUDIO MANIFEST — dialogue for recording

Generated on 2026-11-15 from `src/content/story.ts` (the text there is authoritative; regenerate this file if a line changes).
Nothing here is recorded yet. The game currently speaks these lines with the browser's speech synthesis and always shows captions.
**No synthetic voice files were generated.** The protagonist's lines are reserved for your own recording.

## How to use

- Record each line as its own file. Suggested master: mono WAV, 48 kHz, 24-bit, peaks below −3 dBFS, 0.3 s of room tone before and after.
- Deliver for the game as `public/assets/audio/voice/<ID>.mp3` (mono, 128 kbps or better). Keep the WAV masters in `assets/audio/voice/source/<ID>.wav`.
- "Window" is the time the caption stays on screen. A take may be shorter; if it is longer, the caption duration in `story.ts` must be raised to match (Codex owns that file's runtime use).
- "Start" is the offset from the beginning of its sequence when the player does not press Continue or Skip.
- Lines in [brackets] are sound captions and are never voiced.
- The game has no audio-file loader for voice yet. Wiring these files into `src/audio/voice.ts` is a follow-up for the integrator; until then the files are inert.

| Role | Who records | Direction |
| --- | --- | --- |
| SURVIVOR | **You (protagonist)** | Close, quiet, injured at first; steadier from Chapter II; warm and relieved in the epilogue |
| SHIP | Any neutral voice, or keep synthetic | Flat system announcement; will be filtered in the mix |
| RADIO | A second voice | Calm rescue pilot; will be band-limited as radio in the mix |

## Prologue — The Awakening

| ID | Role | Start (s) | Window (s) | Line | File |
| --- | --- | ---: | ---: | --- | --- |
| — | caption | 0.0 | 3 | [Darkness. A distant alarm. Muffled breathing. A ringing in your ears.] | not voiced |
| VO-AWK-02 | SURVIVOR | 3.0 | 4 | My head… The impact. I remember the evacuation alarm. Then nothing. | `public/assets/audio/voice/VO-AWK-02.mp3` |
| VO-AWK-03 | SHIP | 7.0 | 4 | Emergency evacuation completed. Remaining vessel systems on reserve power. | `public/assets/audio/voice/VO-AWK-03.mp3` |
| VO-AWK-04 | SURVIVOR | 11.0 | 4 | The escape cradles are gone. How long was I lying here? | `public/assets/audio/voice/VO-AWK-04.mp3` |
| VO-AWK-05 | SURVIVOR | 15.0 | 5 | One hand. Then the other. Get up. Find power. Find a way to tell them I am still here. | `public/assets/audio/voice/VO-AWK-05.mp3` |
| VO-AWK-06 | SHIP | 20.0 | 4 | Movement: W A S D. Hold Shift to sprint. F: flashlight. E: interact. Esc: pause. | `public/assets/audio/voice/VO-AWK-06.mp3` |

Sequence length without skipping: 24.0 s.

## Chapter I — The Forgotten

| ID | Role | Start (s) | Window (s) | Line | File |
| --- | --- | ---: | ---: | --- | --- |
| VO-CH1-01 | SURVIVOR | 0.0 | 5 | A ship full of records of machines left behind. And now I am one more thing no one came back for. | `public/assets/audio/voice/VO-CH1-01.mp3` |
| VO-CH1-02 | SHIP | 5.0 | 5 | Archive authentication required. Restore the Opportunity record to recover the auxiliary power route. | `public/assets/audio/voice/VO-CH1-02.mp3` |

Sequence length without skipping: 10.0 s.

## Chapter II — Beneath the Silence

| ID | Role | Start (s) | Window (s) | Line | File |
| --- | --- | ---: | ---: | --- | --- |
| VO-CH2-01 | SHIP | 0.0 | 2.5 | Auxiliary power restored. Evacuation manifest recovered. | `public/assets/audio/voice/VO-CH2-01.mp3` |
| — | caption | 2.5 | 3 | [Power returns. A metallic impact echoes through the hull. The lights fail.] | not voiced |
| VO-CH2-03 | SURVIVOR | 5.5 | 3.5 | Who is there? … No. Just the ship. It has to be. | `public/assets/audio/voice/VO-CH2-03.mp3` |
| VO-CH2-04 | SHIP | 9.0 | 5 | Medical sensor offline during evacuation. Occupancy reconciliation incomplete. One berth incorrectly marked empty. | `public/assets/audio/voice/VO-CH2-04.mp3` |
| VO-CH2-05 | SURVIVOR | 14.0 | 4 | They thought everyone had made it out. They never knew I was on the floor. | `public/assets/audio/voice/VO-CH2-05.mp3` |
| VO-CH2-06 | SURVIVOR | 18.0 | 5 | InSight listened beneath a silent surface. Maybe this ship still has a way to listen for me. | `public/assets/audio/voice/VO-CH2-06.mp3` |

Sequence length without skipping: 23.0 s.

## Survivor channel — contact

| ID | Role | Start (s) | Window (s) | Line | File |
| --- | --- | ---: | ---: | --- | --- |
| VO-BCN-01 | SHIP | 0.0 | 4 | Distress beacon restored. Survivor channel open. Archive records preserved. | `public/assets/audio/voice/VO-BCN-01.mp3` |
| VO-BCN-02 | RADIO | 4.0 | 5 | Damaged vessel, Rescue One is receiving your beacon. Signal weak. Stand by for visual approach. | `public/assets/audio/voice/VO-BCN-02.mp3` |
| VO-BCN-03 | SURVIVOR | 9.0 | 3 | Someone heard it. Someone is coming. | `public/assets/audio/voice/VO-BCN-03.mp3` |

Sequence length without skipping: 12.0 s.

## Epilogue — Not Forgotten

| ID | Role | Start (s) | Window (s) | Line | File |
| --- | --- | ---: | ---: | --- | --- |
| VO-EPI-01 | SURVIVOR | 0.0 | 4 | I used to think that silence meant the end. | `public/assets/audio/voice/VO-EPI-01.mp3` |
| VO-EPI-02 | SURVIVOR | 4.0 | 8 | That once a machine stopped moving, once its last signal faded into the dark, everything it had been was lost. | `public/assets/audio/voice/VO-EPI-02.mp3` |
| VO-EPI-03 | SURVIVOR | 12.0 | 3 | But I was wrong. | `public/assets/audio/voice/VO-EPI-03.mp3` |
| VO-EPI-04 | SURVIVOR | 15.0 | 9 | Opportunity left us the history of a world shaped by water. InSight taught us to listen to the depths of another planet. | `public/assets/audio/voice/VO-EPI-04.mp3` |
| VO-EPI-05 | SURVIVOR | 24.0 | 4 | Their voices fell silent. Their discoveries did not. | `public/assets/audio/voice/VO-EPI-05.mp3` |
| VO-EPI-06 | SURVIVOR | 28.0 | 5 | Perhaps being forgotten isn't the same as being left behind. | `public/assets/audio/voice/VO-EPI-06.mp3` |
| VO-EPI-07 | SURVIVOR | 33.0 | 5 | And perhaps… I'm not as alone as I thought. | `public/assets/audio/voice/VO-EPI-07.mp3` |

Sequence length without skipping: 38.0 s.

## Rescue One — visual approach

| ID | Role | Start (s) | Window (s) | Line | File |
| --- | --- | ---: | ---: | --- | --- |
| — | caption | 0.0 | 5 | [An approaching spacecraft crosses the observation window. Its searchlight finds you.] | not voiced |
| VO-RSC-02 | RADIO | 5.0 | 8 | Unidentified survivor aboard the vessel, this is Rescue One. We have visual confirmation. Hold your position. | `public/assets/audio/voice/VO-RSC-02.mp3` |
| VO-RSC-03 | SURVIVOR | 13.0 | 3 | I'm here. | `public/assets/audio/voice/VO-RSC-03.mp3` |

Sequence length without skipping: 16.0 s.

## Outside the sequences

| ID | Role | Trigger | Line | File |
| --- | --- | --- | --- | --- |
| VO-OBS-01 | RADIO | When control returns after the epilogue, before the walk to the observation deck | Survivor, Rescue One is approaching. Move to the observation deck for visual confirmation. | `public/assets/audio/voice/VO-OBS-01.mp3` |

## Count

- SURVIVOR (yours): 16 lines
- SHIP: 6 lines
- RADIO: 3 lines (including VO-OBS-01)
- Sound captions, not voiced: 3

All lines are fiction written for this game. None is a NASA transmission or quotation.

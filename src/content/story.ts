// Original fictional story. These are not NASA transmissions, observations or quotations.
// Durations are seconds; every sequence also supports Continue and Skip.
export interface SceneBeat {
  speaker: string;
  text: string;
  duration: number;
}

const thought = (text: string, duration: number): SceneBeat => ({ speaker: 'SURVIVOR · FICTIONAL INTERNAL MONOLOGUE', text, duration });
const ship = (text: string, duration: number): SceneBeat => ({ speaker: 'SHIP SYSTEM · FICTIONAL RECORDING', text, duration });
const sound = (text: string, duration: number): SceneBeat => ({ speaker: 'FICTIONAL ENVIRONMENT · SOUND CAPTION', text, duration });
const radio = (text: string, duration: number): SceneBeat => ({ speaker: 'RESCUE ONE · FICTIONAL RADIO TRANSMISSION', text, duration });

export const STORY: Record<'awakening' | 'chapterOne' | 'chapterTwo' | 'beacon' | 'monologue' | 'rescue', SceneBeat[]> = {
  awakening: [
    sound('[Darkness. A distant alarm. Muffled breathing. A ringing in your ears.]', 3),
    thought('My head… The impact. I remember the evacuation alarm. Then nothing.', 4),
    ship('Emergency evacuation completed. Remaining vessel systems on reserve power.', 4),
    thought('The escape cradles are gone. How long was I lying here?', 4),
    thought('One hand. Then the other. Get up. Find power. Find a way to tell them I am still here.', 5),
    ship('Movement: W A S D. Hold Shift to sprint. F: flashlight. E: interact. Esc: pause.', 4),
  ],
  chapterOne: [
    thought('A ship full of records of machines left behind. And now I am one more thing no one came back for.', 5),
    ship('Archive authentication required. Restore the Opportunity record to recover the auxiliary power route.', 5),
  ],
  chapterTwo: [
    ship('Auxiliary power restored. Evacuation manifest recovered.', 2.5),
    sound('[Power returns. A metallic impact echoes through the hull. The lights fail.]', 3),
    thought('Who is there? … No. Just the ship. It has to be.', 3.5),
    ship('Medical sensor offline during evacuation. Occupancy reconciliation incomplete. One berth incorrectly marked empty.', 5),
    thought('They thought everyone had made it out. They never knew I was on the floor.', 4),
    thought('InSight listened beneath a silent surface. Maybe this ship still has a way to listen for me.', 5),
  ],
  beacon: [
    ship('Distress beacon restored. Survivor channel open. Archive records preserved.', 4),
    radio('Damaged vessel, Rescue One is receiving your beacon. Signal weak. Stand by for visual approach.', 5),
    thought('Someone heard it. Someone is coming.', 3),
  ],
  monologue: [
    thought('I used to think that silence meant the end.', 4),
    thought('That once a machine stopped moving, once its last signal faded into the dark, everything it had been was lost.', 8),
    thought('But I was wrong.', 3),
    thought('Opportunity left us the history of a world shaped by water. InSight taught us to listen to the depths of another planet.', 9),
    thought('Their voices fell silent. Their discoveries did not.', 4),
    thought("Perhaps being forgotten isn't the same as being left behind.", 5),
    thought("And perhaps… I'm not as alone as I thought.", 5),
  ],
  rescue: [
    sound('[An approaching spacecraft crosses the observation window. Its searchlight finds you.]', 5),
    radio('Unidentified survivor aboard the vessel, this is Rescue One. We have visual confirmation. Hold your position.', 8),
    thought("I'm here.", 3),
  ],
};

export const SHIP_CONTEXT: Record<string, string> = {
  'PZ-00': 'FICTIONAL SHIP SYSTEM: restore the emergency archive bus. The mission records inside it are real; this damaged spacecraft is not.',
  'PZ-02': 'FICTIONAL SHIP SYSTEM: authenticate the Opportunity record to recover auxiliary power and the evacuation manifest. The puzzle interprets archival evidence; it does not operate the real rover.',
  'PZ-01': 'FICTIONAL SHIP SYSTEM: authenticate the InSight record to recover the listening relay and distress-beacon route. No real instrument on Mars is being repaired.',
  'PZ-03': 'FICTIONAL SHIP SYSTEM: verify the provenance of the recovered records before opening the survivor distress channel. The emergency and Rescue One belong only to this story.',
};

export const SURVIVOR_PREMISE = 'You wake aboard a damaged spacecraft after the crew has evacuated. Injured, alone and overlooked, you must restore its archive systems and send one last signal for rescue.';

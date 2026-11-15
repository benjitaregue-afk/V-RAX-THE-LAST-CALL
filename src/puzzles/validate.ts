// Pure answer validation. No engine, no DOM. Answers are option ids, never translated text.

import type { PuzzleDefinition } from '../game/contracts';

export type FieldResult = 'correct' | 'incorrect' | 'missing';

export interface ValidationResult {
  /** Every field has a valid option selected. */
  complete: boolean;
  solved: boolean;
  fields: Record<string, FieldResult>;
  /** One line per wrong field, in field order. Empty while the answer is incomplete. */
  feedback: string[];
}

export function validateAnswers(def: PuzzleDefinition, answers: Readonly<Record<string, string | undefined>>): ValidationResult {
  const fields: Record<string, FieldResult> = {};
  const wrong: string[] = [];
  let complete = true;
  for (const field of def.fields) {
    const chosen = answers[field.id];
    if (chosen === undefined || !field.options.some((o) => o.id === chosen)) {
      fields[field.id] = 'missing';
      complete = false;
    } else if (chosen === def.solution[field.id]) {
      fields[field.id] = 'correct';
    } else {
      fields[field.id] = 'incorrect';
      wrong.push(field.feedback);
    }
  }
  const solved = complete && wrong.length === 0;
  return { complete, solved, fields, feedback: complete ? wrong : [] };
}

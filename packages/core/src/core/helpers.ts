import { fail, ok, Result } from "./Result";
import {
  Note,
  Pitch,
  Accidental,
  Sequence,
  noteEvent,
  NoteEvent,
  ScoreEvent,
  Duration,
  restEvent,
} from "../domain/Note";
import { noteGroups } from "../core/state";
import { generatorCommands } from "../commands/GeneratorCommands";
import { durationToNumber } from "./musicMath";
export const mod = (n: number, m: number): number => ((n % m) + m) % m;

export const pitchMap: Record<string, Pitch> = {
  C: Pitch.C,
  D: Pitch.D,
  E: Pitch.E,
  F: Pitch.F,
  G: Pitch.G,
  A: Pitch.A,
  B: Pitch.B,
};

export const accidentalMap: Record<string, Accidental> = {
  "": Accidental.Natural,
  b: Accidental.Flat,
  "#": Accidental.Sharp,
};

const parseNoteLiteral = (input: string): Result<Note> => {
  const match = input.match(/^([A-Gr])([#b]?)(\d+)$/);

  if (!match) {
    return fail(
      `Invalid note "${input}". Expected something like C4, C#4, or Bb3.`,
    );
  }

  const [, pitchStr, accidentalStr, octaveStr] = match;

  const pitch = pitchMap[pitchStr];

  const accidental = accidentalMap[accidentalStr];
  const octave = Number.parseInt(octaveStr, 10);

  if (!pitch) {
    return fail(`Invalid pitch "${pitchStr}".`);
  }

  if (accidental === undefined) {
    return fail(`Invalid accidental "${accidentalStr}".`);
  }

  if (Number.isNaN(octave)) {
    return fail(`Invalid octave "${octaveStr}".`);
  }

  return ok(new Note(pitch, accidental, octave));
};
export const isDuration = (input: string): input is Duration => {
  return ["w", "h", "q", "e", "s"].includes(input);
};
export const parseExcerpt = (
  input: string,
  group = "score",
): Result<Sequence> => {
  const [start, end] = input.replace("@", "").split("-");
  const regEx = /^\d{1,3}\/\d+(?:\.\d+)?$/;
  const result = regEx.test(start) && regEx.test(end);
  if (!result || !start || !end) {
    return fail("invalid score selection");
  }
  const score = group ? noteGroups.get(group)! : noteGroups.get("score")!;
  const [startBar, startBeat] = start.split("/");
  const startBarNumber = parseInt(startBar)!;
  const startBeatNumber = parseFloat(startBeat)!;
  const [endBar, endBeat] = end.split("/");
  const endBarNumber = parseInt(endBar)!;
  const endBeatNumber = parseFloat(endBeat)!;
  if (startBarNumber < 1 || endBarNumber < 1 || endBarNumber < startBarNumber) {
    return fail("invalid score selection");
  }
  const startIndex = getNoteIndex(score, startBarNumber, startBeatNumber);
  const endIndex = getNoteIndex(score, endBarNumber, endBeatNumber);
  if (startIndex == -1 || endIndex == -1) {
    return fail("invalid score selection");
  }
  return ok([...score.slice(startIndex, endIndex)]);
};

export const getNoteIndex = (
  sequence: Sequence,
  bar: number,
  beat: number,
): number => {
  const beatsPerBar = 4; // default to 4/4 for now
  const beatTarget = (bar - 1) * beatsPerBar + beat - 1;
  let currentBeat = 0;
  let sequenceIndex = 0;
  while (currentBeat < beatTarget) {
    if (sequenceIndex >= sequence.length) {
      return -1;
    }
    currentBeat += durationToNumber.get(sequence[sequenceIndex].duration!)!;
    sequenceIndex++;
  }
  return sequenceIndex;
};
const parseNoteColumn = (input: string): Result<ScoreEvent> => {
  const bracketsCorrect =
    input[0] == "[" &&
    (input[input.length - 1] == "]" || input[input.length - 3] == "]");
  if (!bracketsCorrect) {
    return fail("Could not resolve note column");
  }
  const resolvedNotes = input
    .split("")
    .map((c) => (["[", "]", ":", "w", "h", "q", "s", "e"].includes(c) ? "" : c))
    .join("")
    .split("-")
    .map(parseNoteLiteral);
  for (const rawNote of resolvedNotes) {
    if (!rawNote.ok) {
      return fail("Could not resolve note column");
    }
  }
  if (input[input.length - 1] == "]") {
    return ok(
      noteEvent(resolvedNotes.filter((rn) => rn.ok).map((rn) => rn.value)),
    );
  }
  const possibleDuration = input[input.length - 1];
  console.log("possible duration: " + possibleDuration);

  if (input[input.length - 2] == ":" && isDuration(possibleDuration)) {
    return ok(
      noteEvent(
        resolvedNotes.filter((rn) => rn.ok).map((rn) => rn.value),
        possibleDuration,
      ),
    );
  }
  return fail("could not parse note column");
};
const parseNoteList = (input: string): Result<Sequence> => {
  const events: Sequence = [];

  for (const rawNote of input.split(",")) {
    if (rawNote[0] == "[") {
      const noteColumn = parseNoteColumn(rawNote);
      if (!noteColumn.ok) {
        return fail("could not parse note column: " + noteColumn.errors);
      }
      events.push(noteColumn.value);
    } else if (rawNote[0] == "r") {
      if (rawNote.length == 3) {
        const possibleDuration = rawNote[2];
        const validDuration = isDuration(possibleDuration);
        if (rawNote[1] == ":" && validDuration) {
          events.push(restEvent(possibleDuration));
        } else {
          return fail("could not resolve rest event");
        }
      } else if (rawNote.length == 1) {
        events.push(restEvent());
      } else {
        return fail("could not parse rest");
      }
    } else {
      const [note, possibleDuration] = rawNote.split(":");
      const noteResult = parseNoteLiteral(note.trim());

      if (!noteResult.ok) {
        return noteResult;
      }
      if (isDuration(possibleDuration)) {
        events.push(noteEvent([noteResult.value], possibleDuration));
      }
      if (!possibleDuration) {
        events.push(noteEvent([noteResult.value]));
      }
      if (!isDuration(possibleDuration) && possibleDuration) {
        return fail("could not parse duration value");
      }
    }
  }

  return ok(events);
};
export const resolveSequence = (name: string): Result<Sequence> => {
  const existingGroup = noteGroups.get(name);

  if (existingGroup) {
    return ok(existingGroup);
  }

  const [possibleGeneratorCommand, ...args] = name.split("_");
  const possibleGenerator = generatorCommands.get(possibleGeneratorCommand);

  if (possibleGenerator) {
    const generatorResult = possibleGenerator(args);

    if (!generatorResult.ok) {
      return generatorResult;
    }

    return ok(generatorResult.value());
  }
  const possibleExcerpt = name[0] == "@";
  if (possibleExcerpt) {
    return parseExcerpt(name);
  }
  return parseNoteList(name);
};

export const parseRequiredInt = (
  value: string | undefined,
  cmd: string,
  arg: string,
): Result<number> => {
  if (!value) return fail(`${cmd} requires ${arg}.`);

  const n = Number.parseInt(value, 10);

  return Number.isNaN(n)
    ? fail(`${cmd} expected ${arg} to be a number, got "${value}".`)
    : ok(n);
};

export const parseOptionalInt = (
  value: string | undefined,
  cmd: string,
  arg: string,
): Result<number | undefined> => {
  if (value === undefined) return ok(undefined);

  const n = Number.parseInt(value, 10);

  return Number.isNaN(n)
    ? fail(`${cmd} expected ${arg} to be a number, got "${value}".`)
    : ok(n);
};

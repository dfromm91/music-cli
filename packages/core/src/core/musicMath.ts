import {
  Accidental,
  Duration,
  Note,
  Pitch,
  Sequence,
  ScoreEvent,
  pitchClass,
} from "../domain/Note";
import { TimeSignature } from "../core/types";
import { mod } from "./helpers";

const pitchSemitones: Record<Pitch, number> = {
  [Pitch.C]: 0,
  [Pitch.D]: 2,
  [Pitch.E]: 4,
  [Pitch.F]: 5,
  [Pitch.G]: 7,
  [Pitch.A]: 9,
  [Pitch.B]: 11,
};

const accidentalOffsets: Record<Accidental, number> = {
  [Accidental.Natural]: 0,
  [Accidental.Sharp]: 1,
  [Accidental.Flat]: -1,
};

const sharpSpellings: Record<number, readonly [Pitch, Accidental]> = {
  0: [Pitch.C, Accidental.Natural],
  1: [Pitch.C, Accidental.Sharp],
  2: [Pitch.D, Accidental.Natural],
  3: [Pitch.D, Accidental.Sharp],
  4: [Pitch.E, Accidental.Natural],
  5: [Pitch.F, Accidental.Natural],
  6: [Pitch.F, Accidental.Sharp],
  7: [Pitch.G, Accidental.Natural],
  8: [Pitch.G, Accidental.Sharp],
  9: [Pitch.A, Accidental.Natural],
  10: [Pitch.A, Accidental.Sharp],
  11: [Pitch.B, Accidental.Natural],
};

export const toSemitone = (n: Note): number =>
  n.octave * 12 + pitchSemitones[n.pitch] + accidentalOffsets[n.accidental];

export const fromSemitone = (abs: number): Note => {
  const octave = Math.floor(abs / 12);
  const semi = mod(abs, 12);
  const [pitch, accidental] = sharpSpellings[semi];

  return new Note(pitch, accidental, octave);
};
export const durationToNumber = new Map<Duration, number>([
  ["w", 4.0],
  ["h", 2.0],
  ["q", 1.0],
  ["e", 0.5],
  ["s", 0.25],
]);
export const divideSequenceIntoMeasures = (
  sequence: Sequence,
  ts: TimeSignature = { numerator: 4, denominator: 4 },
): Sequence[] => {
  const measures = [];
  const targetBeats = (ts.numerator / ts.denominator) * 4.0;
  let measure: Sequence = [];
  let runningTotal = 0.0;
  for (let i = 0; i < sequence.length; i++) {
    runningTotal += durationToNumber.get(sequence[i].duration)!;
    if (runningTotal <= targetBeats) {
      measure.push(sequence[i]);
    } else {
      measures.push([...measure]);
      measure = [sequence[i]];
      runningTotal = durationToNumber.get(sequence[i].duration)!;
    }
    if (i == sequence.length - 1) {
      measures.push([...measure]);
    }
  }
  return measures;
};
export const chromaticPitchClasses = [
  { pitch: Pitch.C, accidental: Accidental.Natural },
  { pitch: Pitch.C, accidental: Accidental.Sharp },
  { pitch: Pitch.D, accidental: Accidental.Natural },
  { pitch: Pitch.D, accidental: Accidental.Sharp },
  { pitch: Pitch.E, accidental: Accidental.Natural },
  { pitch: Pitch.F, accidental: Accidental.Natural },
  { pitch: Pitch.F, accidental: Accidental.Sharp },
  { pitch: Pitch.G, accidental: Accidental.Natural },
  { pitch: Pitch.G, accidental: Accidental.Sharp },
  { pitch: Pitch.A, accidental: Accidental.Natural },
  { pitch: Pitch.A, accidental: Accidental.Sharp },
  { pitch: Pitch.B, accidental: Accidental.Natural },
];
export type scaleType = "maj" | "min";
export const scaleIntervalPatterns: Record<scaleType, number[]> = {
  min: [2, 1, 2, 2, 1, 2],
  maj: [2, 2, 1, 2, 2, 2],
};
export const findPitchClass = (
  pitchClass: pitchClass,
  pitchClasses: pitchClass[],
): number =>
  pitchClasses.findIndex(
    (x) => x.pitch == pitchClass.pitch && x.accidental == pitchClass.accidental,
  );

const validScaleTypes = new Set(["maj", "min"]);

export function isScaleType(value: string): value is scaleType {
  return validScaleTypes.has(value);
}

export const computeScale = (
  root: pitchClass,
  scaleType: scaleType,
): pitchClass[] => {
  const intervalPattern = scaleIntervalPatterns[scaleType];
  const rootIndex = findPitchClass(root, chromaticPitchClasses);
  const scale = [root];
  let scaleIndex = rootIndex;
  for (let i = 0; i < intervalPattern.length; i++) {
    scaleIndex += intervalPattern[i];
    scale.push(chromaticPitchClasses[scaleIndex % 12]);
  }
  return scale;
};

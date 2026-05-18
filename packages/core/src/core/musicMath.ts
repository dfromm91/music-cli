import {
	Accidental,
	Duration,
	Note,
	Pitch,
	Sequence,
	ScoreEvent,
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
const durationToNumber = new Map<Duration, number>([
	["w", 4.0],
	["h", 2.0],
	["q", 1.0],
	["e", 0.5],
	["s", 0.25],
]);
export const divideSequenceIntoMeasures = (
	sequence: Sequence,
	ts: TimeSignature = { numerator: 4, denominator: 4 }
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

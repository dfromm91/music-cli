import { fail, ok, Result } from "./Result";
import { Note, Pitch, Accidental } from "../domain/Note";
import { noteGroups } from "../core/state";
export const mod = (n: number, m: number): number => ((n % m) + m) % m;

const pitchMap: Record<string, Pitch> = {
	C: Pitch.C,
	D: Pitch.D,
	E: Pitch.E,
	F: Pitch.F,
	G: Pitch.G,
	A: Pitch.A,
	B: Pitch.B,
};

const accidentalMap: Record<string, Accidental> = {
	"": Accidental.Natural,
	b: Accidental.Flat,
	"#": Accidental.Sharp,
};

const parseNote = (input: string): Result<Note> => {
	const match = input.match(/^([A-G])([#b]?)(\d+)$/);

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

export const resolveNoteGroup = (name: string): Result<Note[]> => {
	const existingGroup = noteGroups.get(name);

	if (existingGroup) {
		return ok(existingGroup);
	}

	const notes: Note[] = [];

	for (const rawNote of name.split(",")) {
		const noteResult = parseNote(rawNote.trim());

		if (!noteResult.ok) {
			return noteResult;
		}

		notes.push(noteResult.value);
	}

	return ok(notes);
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

import { fail, ok, Result } from "./Result";
import { Note, Pitch, Accidental } from "../domain/Note";
import { noteGroups } from "../core/state";
export const mod = (n: number, m: number): number => ((n % m) + m) % m;
export const resolveNoteGroup = (name: string): Result<Note[]> => {
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
		b: Accidental.Flat,
		"#": Accidental.Sharp,
	};
	const existingGroup = noteGroups.get(name);
	if (existingGroup) {
		return ok(existingGroup);
	}
	const result = name.split(",").map((n) => n.trim());
	const resolvedNoteGroup = [];
	for (let i: number = 0; i < result.length; i++) {
		if (result[i].length != 2 && result[i].length != 3) {
			return fail("invalid length: " + result[i].length);
		}
		const pitch = pitchMap[result[i][0]];
		const hasAccidental = result[i].length == 3;
		console.log("has accidental: " + hasAccidental);
		const accidental = hasAccidental
			? accidentalMap[result[i][1]]
			: Accidental.Natural;
		const octave = hasAccidental
			? parseInt(result[i][2])
			: parseInt(result[i][1]);
		if (pitch && octave) {
			resolvedNoteGroup.push(new Note(pitch, accidental, octave));
		} else {
			return fail(
				"could not resolve note: pitch: " +
					pitch +
					" accidental: " +
					accidental +
					" octave: " +
					octave,
			);
		}
	}
	return ok(resolvedNoteGroup);
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

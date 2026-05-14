import { fail, ok, Result } from "./Result";
import {
	Note,
	Pitch,
	Accidental,
	Sequence,
	noteEvent,
	NoteEvent,
} from "../domain/Note";
import { noteGroups } from "../core/state";
import { generatorCommands } from "../commands/GeneratorCommands";
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

const parseNoteLiteral = (input: string): Result<Note> => {
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
const parseNoteColumn = (input: string): Result<Sequence> => {
	const bracketsCorrect = input[0] == "[" && input[input.length - 1] == "]";
	if (!bracketsCorrect) {
		return fail("Could not resolve note column");
	}
	const resolvedNotes = input
		.slice(1, input.length - 1)
		.split("-")
		.map(parseNoteLiteral);
	for (const rawNote of resolvedNotes) {
		if (!rawNote.ok) {
			return fail("Could not resolve note column");
		}
	}
	return ok([
		noteEvent(resolvedNotes.filter((rn) => rn.ok).map((rn) => rn.value)),
	]);
};
const parseNoteList = (input: string): Result<Sequence> => {
	const events: Sequence = [];

	for (const rawNote of input.split(",")) {
		if (rawNote[0] == "[") {
			return parseNoteColumn(rawNote);
		}
		const noteResult = parseNoteLiteral(rawNote.trim());

		if (!noteResult.ok) {
			return noteResult;
		}

		events.push(noteEvent([noteResult.value]));
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

import { Generator } from "../core/types";
import { Result, ok, fail } from "../core/Result";
import {
	Note,
	Pitch,
	Accidental,
	Sequence,
	ScoreEvent,
	noteEvent,
} from "../domain/Note";
import { resolveSequence } from "../core/helpers";
import { toSemitone, fromSemitone } from "../core/musicMath";

export type GeneratorCommand = (args: string[]) => Result<Generator>;

const isNoteEvent = (
	event: ScoreEvent,
): event is Extract<ScoreEvent, { type: "NoteEvent" }> => {
	return event.type === "NoteEvent";
};

const notesToSequence = (notes: Note[]): Sequence => {
	return notes.map((note) => noteEvent([note]));
};

const resolveSingleNote = (value: string, label: string): Result<Note> => {
	const resolved = resolveSequence(value);

	if (!resolved.ok) return resolved;

	if (resolved.value.length !== 1) {
		return fail(`${label} must resolve to exactly one event.`);
	}

	const event = resolved.value[0];

	if (!isNoteEvent(event)) {
		return fail(`${label} must resolve to a note, not a rest.`);
	}

	if (event.notes.length !== 1) {
		return fail(`${label} must resolve to exactly one note.`);
	}

	return ok(event.notes[0]);
};

const chordMap = new Map<string, Note[]>([
	["cmaj", [new Note(Pitch.C), new Note(Pitch.E), new Note(Pitch.G)]],
	[
		"dmaj",
		[new Note(Pitch.D), new Note(Pitch.F, Accidental.Sharp), new Note(Pitch.A)],
	],
	[
		"emaj",
		[new Note(Pitch.E), new Note(Pitch.G, Accidental.Sharp), new Note(Pitch.B)],
	],
	[
		"fmaj",
		[
			new Note(Pitch.F),
			new Note(Pitch.A),
			new Note(Pitch.C, Accidental.Natural, 5),
		],
	],
	[
		"gmaj",
		[
			new Note(Pitch.G),
			new Note(Pitch.B),
			new Note(Pitch.D, Accidental.Natural, 5),
		],
	],
	[
		"amaj",
		[
			new Note(Pitch.A),
			new Note(Pitch.C, Accidental.Sharp, 5),
			new Note(Pitch.E, Accidental.Natural, 5),
		],
	],
	[
		"bmaj",
		[
			new Note(Pitch.B),
			new Note(Pitch.D, Accidental.Sharp, 5),
			new Note(Pitch.F, Accidental.Sharp, 5),
		],
	],
	[
		"cmin",
		[new Note(Pitch.C), new Note(Pitch.E, Accidental.Flat), new Note(Pitch.G)],
	],
	["dmin", [new Note(Pitch.D), new Note(Pitch.F), new Note(Pitch.A)]],
	["emin", [new Note(Pitch.E), new Note(Pitch.G), new Note(Pitch.B)]],
	[
		"fmin",
		[
			new Note(Pitch.F),
			new Note(Pitch.A, Accidental.Flat),
			new Note(Pitch.C, Accidental.Natural, 5),
		],
	],
	[
		"gmin",
		[
			new Note(Pitch.G),
			new Note(Pitch.B, Accidental.Flat),
			new Note(Pitch.D, Accidental.Natural, 5),
		],
	],
	[
		"amin",
		[
			new Note(Pitch.A),
			new Note(Pitch.C, Accidental.Natural, 5),
			new Note(Pitch.E, Accidental.Natural, 5),
		],
	],
	[
		"bmin",
		[
			new Note(Pitch.B),
			new Note(Pitch.D, Accidental.Natural, 5),
			new Note(Pitch.F, Accidental.Sharp, 5),
		],
	],
]);

const resolveChord = (chordName: string): Result<Note[]> => {
	const chord = chordMap.get(chordName.toLowerCase());

	if (!chord) {
		return fail(`Unknown chord "${chordName}".`);
	}

	return ok(chord);
};

const makeChordToneInOctave = (chordTone: Note, octave: number): Note =>
	new Note(chordTone.pitch, chordTone.accidental, octave);

const inRange = (note: Note, start: Note, end: Note): boolean => {
	const semi = toSemitone(note);
	return semi >= toSemitone(start) && semi <= toSemitone(end);
};

export const arpUp: GeneratorCommand = (args) => {
	const [start, end, chordName] = args;

	if (!start) return fail("arpUp requires a start note.");
	if (!end) return fail("arpUp requires an end note.");
	if (!chordName) return fail("arpUp requires a chord name.");

	const startRes = resolveSingleNote(start, "arpUp start");
	if (!startRes.ok) return startRes;

	const endRes = resolveSingleNote(end, "arpUp end");
	if (!endRes.ok) return endRes;

	const chordRes = resolveChord(chordName);
	if (!chordRes.ok) return chordRes;

	const startNote = startRes.value;
	const endNote = endRes.value;
	const chord = chordRes.value;

	return ok(() => {
		const notes: Note[] = [];

		for (let octave = startNote.octave; octave <= endNote.octave; octave++) {
			for (const chordTone of chord) {
				const next = makeChordToneInOctave(chordTone, octave);

				if (inRange(next, startNote, endNote)) {
					notes.push(next);
				}
			}
		}

		return notesToSequence(notes);
	});
};

export const arpDown: GeneratorCommand = (args) => {
	const up = arpUp(args);

	if (!up.ok) return up;

	return ok(() => [...up.value()].reverse());
};

export const chord: GeneratorCommand = (args) => {
	const [chordName, octaveArg] = args;

	if (!chordName) return fail("chord requires a chord name.");

	const chordRes = resolveChord(chordName);
	if (!chordRes.ok) return chordRes;

	const octave = octaveArg ? Number.parseInt(octaveArg, 10) : 4;

	if (Number.isNaN(octave)) {
		return fail(`chord expected octave to be a number, got "${octaveArg}".`);
	}

	return ok(() => [
		noteEvent(
			chordRes.value.map(
				(note) =>
					new Note(
						note.pitch,
						note.accidental,
						note.octave === 5 ? octave + 1 : octave,
					),
			),
		),
	]);
};

export const arpUpDown: GeneratorCommand = (args) => {
	const up = arpUp(args);

	if (!up.ok) return up;

	return ok(() => {
		const sequence = up.value();

		if (sequence.length <= 2) {
			return sequence;
		}

		return [...sequence, ...sequence.slice(1, -1).reverse()];
	});
};

export const chromaticUp: GeneratorCommand = (args) => {
	const [start, end] = args;

	if (!start) return fail("chromaticUp requires a start note.");
	if (!end) return fail("chromaticUp requires an end note.");

	const startRes = resolveSingleNote(start, "chromaticUp start");
	if (!startRes.ok) return startRes;

	const endRes = resolveSingleNote(end, "chromaticUp end");
	if (!endRes.ok) return endRes;

	return ok(() => {
		const notes: Note[] = [];

		for (
			let semi = toSemitone(startRes.value);
			semi <= toSemitone(endRes.value);
			semi++
		) {
			notes.push(fromSemitone(semi));
		}

		return notesToSequence(notes);
	});
};

export const chromaticDown: GeneratorCommand = (args) => {
	const [start, end] = args;

	if (!start) return fail("chromaticDown requires a start note.");
	if (!end) return fail("chromaticDown requires an end note.");

	const startRes = resolveSingleNote(start, "chromaticDown start");
	if (!startRes.ok) return startRes;

	const endRes = resolveSingleNote(end, "chromaticDown end");
	if (!endRes.ok) return endRes;

	return ok(() => {
		const notes: Note[] = [];

		for (
			let semi = toSemitone(startRes.value);
			semi >= toSemitone(endRes.value);
			semi--
		) {
			notes.push(fromSemitone(semi));
		}

		return notesToSequence(notes);
	});
};

export const intervalUp: GeneratorCommand = (args) => {
	const [start, end, intervalArg] = args;

	if (!start) return fail("intervalUp requires a start note.");
	if (!end) return fail("intervalUp requires an end note.");
	if (!intervalArg) return fail("intervalUp requires an interval.");

	const startRes = resolveSingleNote(start, "intervalUp start");
	if (!startRes.ok) return startRes;

	const endRes = resolveSingleNote(end, "intervalUp end");
	if (!endRes.ok) return endRes;

	const interval = Number.parseInt(intervalArg, 10);

	if (Number.isNaN(interval) || interval <= 0) {
		return fail(`intervalUp expected a positive number, got "${intervalArg}".`);
	}

	return ok(() => {
		const notes: Note[] = [];

		for (
			let semi = toSemitone(startRes.value);
			semi <= toSemitone(endRes.value);
			semi += interval
		) {
			notes.push(fromSemitone(semi));
		}

		return notesToSequence(notes);
	});
};

export const generatorCommands = new Map<string, GeneratorCommand>([
	["arpUp", arpUp],
	["arpDown", arpDown],
	["arpUpDown", arpUpDown],
	["chord", chord],
	["chromaticUp", chromaticUp],
	["chromaticDown", chromaticDown],
	["intervalUp", intervalUp],
]);

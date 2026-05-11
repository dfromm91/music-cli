import { Generator } from "../core/types";
import { Result, ok, fail } from "../core/Result";
import { Note, Pitch, Accidental } from "../domain/Note";
import { resolveNoteGroup } from "../core/helpers";
export type GeneratorCommand = (args: string[]) => Result<Generator>;
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
export const arpUp: GeneratorCommand = (args) => {
	const [start, end, chordName] = args;

	if (!start) return fail("arpUp requires a start note.");
	if (!end) return fail("arpUp requires an end note.");
	if (!chordName) return fail("arpUp requires a chord name.");

	const resolvedStart = resolveNoteGroup(start);
	if (!resolvedStart.ok) return resolvedStart;

	const resolvedEnd = resolveNoteGroup(end);
	if (!resolvedEnd.ok) return resolvedEnd;

	if (resolvedStart.value.length !== 1) {
		return fail("arpUp start must resolve to exactly one note.");
	}

	if (resolvedEnd.value.length !== 1) {
		return fail("arpUp end must resolve to exactly one note.");
	}

	const chord = chordMap.get(chordName.toLowerCase());

	if (!chord) {
		return fail(`Unknown chord "${chordName}".`);
	}

	const startNote = resolvedStart.value[0];
	const endNote = resolvedEnd.value[0];

	return ok(() => {
		const notes: Note[] = [];
		let octave = startNote.octave;

		while (octave <= endNote.octave) {
			for (const chordTone of chord) {
				const next = new Note(chordTone.pitch, chordTone.accidental, octave);

				notes.push(next);
			}

			octave++;
		}

		return notes;
	});
};
export const generatorCommands = new Map<string, GeneratorCommand>([
	["arpUp", arpUp],
]);

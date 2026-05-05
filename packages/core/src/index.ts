// =====================
// Core domain
// =====================

enum Pitch {
	C = "C",
	D = "D",
	E = "E",
	F = "F",
	G = "G",
	A = "A",
	B = "B",
}

enum Accidental {
	Natural = "",
	Sharp = "#",
	Flat = "b",
}

class Note {
	constructor(
		public readonly pitch: Pitch,
		public readonly accidental: Accidental = Accidental.Natural,
		public readonly octave: number = 4,
	) {}

	toString(): string {
		return `${this.pitch}${this.accidental}${this.octave}`;
	}
}

// =====================
// Result type (errors)
// =====================

type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = <T = never>(...errors: string[]): Result<T> => ({
	ok: false,
	errors,
});

// =====================
// Types
// =====================

type Transform = (notes: Note[]) => Note[];
type StateChange = (notes: Note[]) => void;
type Navigation = () => void;
type TransformCommand = (args: string[]) => Result<Transform>;
type StateCommand = (args: string[]) => Result<StateChange>;
type Pipeline = {
	stateChange: StateChange;
	transformations: Transform[];
	substitution: Note[];
};

// =====================
// Helpers
// =====================

const mod = (n: number, m: number): number => ((n % m) + m) % m;

const parseRequiredInt = (
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

const parseOptionalInt = (
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

// =====================
// Music math
// =====================

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

const toSemitone = (n: Note): number =>
	n.octave * 12 + pitchSemitones[n.pitch] + accidentalOffsets[n.accidental];

const fromSemitone = (abs: number): Note => {
	const octave = Math.floor(abs / 12);
	const semi = mod(abs, 12);
	const [pitch, accidental] = sharpSpellings[semi];
	return new Note(pitch, accidental, octave);
};

// =====================
// Transforms
// =====================

const transpose =
	(n: number): Transform =>
	(notes) =>
		notes.map((x) => fromSemitone(toSemitone(x) + n));

const octaveShift =
	(n: number): Transform =>
	(notes) =>
		notes.map((x) => new Note(x.pitch, x.accidental, x.octave + n));

const reverse: Transform = (notes) => [...notes].reverse();

const repeat =
	(times: number): Transform =>
	(notes) =>
		Array.from({ length: Math.max(0, times) }).flatMap(() => notes);

const rotate =
	(steps: number): Transform =>
	(notes) => {
		if (!notes.length) return notes;
		const n = mod(steps, notes.length);
		return [...notes.slice(n), ...notes.slice(0, n)];
	};

const take =
	(n: number): Transform =>
	(notes) =>
		notes.slice(0, n);
const drop =
	(n: number): Transform =>
	(notes) =>
		notes.slice(n);
const slice =
	(a: number, b?: number): Transform =>
	(notes) =>
		notes.slice(a, b);

const invert = (): Transform => (notes) => {
	if (!notes.length) return notes;
	const pivot = toSemitone(notes[0]);
	return notes.map((n) => fromSemitone(pivot - (toSemitone(n) - pivot)));
};

// =====================
// State
// =====================

const noteGroups = new Map<string, Note[]>([
	["score", []],
	["motif", [new Note(Pitch.C), new Note(Pitch.E), new Note(Pitch.G)]],
]);

const appendToGroup = (name: string, notes: Note[]) => {
	const g = noteGroups.get(name);
	if (g) noteGroups.set(name, [...g, ...notes]);
};

const setGroup = (name: string, notes: Note[]) => {
	noteGroups.set(name, [...notes]);
};

const clearGroup = (name: string) => {
	noteGroups.set(name, []);
};

// const assign = (name: string, notes:Note[]) =>{

// }

// =====================
// Commands
// =====================

const transformCommands = new Map<string, TransformCommand>([
	[
		"transpose",
		(args) => {
			const r = parseRequiredInt(args[0], "transpose", "semitones");
			return r.ok ? ok(transpose(r.value)) : r;
		},
	],
	[
		"octaveShift",
		(args) => {
			const r = parseRequiredInt(args[0], "octaveShift", "octaves");
			return r.ok ? ok(octaveShift(r.value)) : r;
		},
	],
	["reverse", () => ok(reverse)],
	[
		"repeat",
		(args) => {
			const r = parseRequiredInt(args[0], "repeat", "times");
			return r.ok ? ok(repeat(r.value)) : r;
		},
	],
	[
		"rotate",
		(args) => {
			const r = parseRequiredInt(args[0], "rotate", "steps");
			return r.ok ? ok(rotate(r.value)) : r;
		},
	],
	[
		"take",
		(args) => {
			const r = parseRequiredInt(args[0], "take", "count");
			return r.ok ? ok(take(r.value)) : r;
		},
	],
	[
		"drop",
		(args) => {
			const r = parseRequiredInt(args[0], "drop", "count");
			return r.ok ? ok(drop(r.value)) : r;
		},
	],
	[
		"slice",
		(args) => {
			const a = parseRequiredInt(args[0], "slice", "start");
			if (!a.ok) return a;
			const b = parseOptionalInt(args[1], "slice", "end");
			if (!b.ok) return b;
			return ok(slice(a.value, b.value));
		},
	],
	["invert", () => ok(invert())],
]);

const stateCommands = new Map<string, StateCommand>([
	[
		"append",
		(args) => {
			const g = args[0];
			if (!g) return fail("append requires group name.");
			if (!noteGroups.has(g)) return fail(`Unknown group "${g}".`);
			return ok((notes) => appendToGroup(g, notes));
		},
	],
	[
		"set",
		(args) => {
			const g = args[0];
			if (!g) return fail("set requires group name.");
			return ok((notes) => setGroup(g, notes));
		},
	],
	[
		"clear",
		(args) => {
			if (args.length != 1) {
				return fail("clear requires 1 note group");
			}
			const g = args[0];
			if (!g) return fail("clear requires group name.");
			return ok(() => clearGroup(g));
		},
	],
	[
		"print",
		(args) => {
			if (args.length != 1) {
				return fail("print requires 1 note group");
			}
			const g = args[0];
			if (!g) return fail("print requires group name.");
			return ok(() => printGroup(g));
		},
	],
]);
// =====================
// Navigation
// =====================

const printGroups: Navigation = () => {
	for (const [name, notes] of noteGroups) {
		console.log(`${name}: ${notes.map((n) => n.toString()).join(" ")}`);
	}
};

const printHelp: Navigation = () => {
	console.log(`
ScoreSketch REPL

Commands:
  append <group> <transform...> <source>
  set <group> <transform...> <source>
  clear <group>
  print <group>

Transforms:
  transpose <semitones>
  octaveShift <octaves>
  reverse
  repeat <times>
  rotate <steps>
  take <count>
  drop <count>
  slice <start> <end?>
  invert

Examples:
  append score motif
  append score octaveShift 1 motif
  append score octaveShift 1 motif | transpose 2 | reverse
  set motif transpose 7 motif
  print score
  clear score

Other:
  groups
  help
  exit
`);
};
const navCommands = new Map<string, Navigation>([
	["help", printHelp],
	["groups", printGroups],
]);

// =====================
// Utils
// =====================

const printGroup = (name: string) => {
	console.log((noteGroups.get(name) ?? []).map((n) => n.toString()).join(" "));
};

const compose = (ts: Transform[]): Transform =>
	ts.reduce(
		(acc, t) => (n) => t(acc(n)),
		(n) => n,
	);

// =====================
// Parser
// =====================

const parseScoreSelection = () => {};

const parseInput = (input: string): Result<Pipeline> => {
	const parts = input
		.split("|")
		.map((x) => x.trim())
		.filter(Boolean);
	if (!parts.length) return fail("Empty input.");
	if (parts.length == 1) {
		const navCommand = navCommands.get(parts[0]);
		if (navCommand) {
			return ok({
				stateChange: (notes: Note[]) => {
					navCommand();
				},
				transformations: [],
				substitution: [],
			});
		}
	}

	const [cmd, group, ...rest] = parts[0].split(/\s+/);
	const state = stateCommands.get(cmd);
	if (!state) {
		return fail(`Unknown state command "${cmd}".`);
	}

	const stateRes = state([group]);
	if (!stateRes.ok) return stateRes;

	if (rest.length == 0) {
		const possibleGroup = noteGroups.get(group);
		if (possibleGroup) {
			return ok({
				stateChange: stateRes.value,
				transformations: [],
				substitution: possibleGroup,
			});
		}
	}
	if (rest.length == 1) {
		const possibleGroup = rest[0];
		const group = noteGroups.get(possibleGroup);
		if (group) {
			return ok({
				stateChange: stateRes.value,
				transformations: [],
				substitution: group,
			});
		}
	}
	parts[0] = rest.join(" ");

	const tokens = parts[0].split(/\s+/).filter(Boolean);
	const subName = tokens.at(-1);
	if (!subName) return fail("Missing substitution group.");

	const sub = noteGroups.get(subName);
	if (!sub) return fail(`Unknown substitution group "${subName}".`);

	const errors: string[] = [];
	const transforms: Transform[] = [];

	for (const part of parts) {
		const [name, ...args] = part.split(/\s+/);
		const cmd = transformCommands.get(name);
		if (!cmd) {
			errors.push(`Unknown transform "${name}".`);
			continue;
		}
		const res = cmd(args);
		if (res.ok) transforms.push(res.value);
		else errors.push(...res.errors);
	}

	return errors.length
		? fail(...errors)
		: ok({
				stateChange: stateRes.value,
				transformations: transforms,
				substitution: sub,
			});
};

// =====================
// Runner
// =====================

const run = (input: string) => {
	const parsed = parseInput(input);

	if (!parsed.ok) {
		console.error("Errors:");
		parsed.errors.forEach((e) => console.error("-", e));
		return;
	}

	const { stateChange, transformations, substitution } = parsed.value;
	const result = compose(transformations)(substitution);
	stateChange(result);
};

// =====================
// Example
// =====================

// run("append score octaveShift 1 motif | transpose 2 | reverse | repeat 2");
// printGroup("score");

// try bad input:
// run("append score octShift foo motif | blah 2");

// =====================
// REPL
// =====================

import readline from "node:readline/promises";

const repl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: "scoresketch> ",
});

console.log("ScoreSketch REPL. Type help for commands, exit to quit.");
repl.prompt();

repl.on("line", (line) => {
	run(line);
	repl.prompt();
});

repl.on("close", () => {
	console.log("bye");
	process.exit(0);
});

import {
	Note,
	Pitch,
	ScoreEvent,
	noteEvent,
	Sequence,
	Accidental,
	restEvent,
} from "../domain/Note";

export const noteGroups = new Map<string, Sequence>([
	["score", []],
	[
		"motif",
		[
			restEvent(),
			noteEvent([new Note(Pitch.C), new Note(Pitch.C, Accidental.Sharp)]),
			noteEvent([new Note(Pitch.E)]),
			noteEvent([new Note(Pitch.G)]),
		],
	],
]);

export const appendToGroup = (name: string, events: Sequence): void => {
	const group = noteGroups.get(name);

	if (!group) {
		return;
	}

	noteGroups.set(name, [...group, ...events]);
};

export const setGroup = (name: string, events: Sequence): void => {
	noteGroups.set(name, [...events]);
};

export const clearGroup = (name: string): void => {
	noteGroups.set(name, []);
};

const eventToString = (event: ScoreEvent): string => {
	if (event.type === "RestEvent") {
		return `r:${event.duration}`;
	}

	const notes = event.notes.map((n) => n.toString()).join(",");

	if (event.notes.length > 1) {
		return `[${notes}]:${event.duration}`;
	}

	return `${notes}:${event.duration}`;
};

export const printGroup = (name: string, events?: Sequence): void => {
	const resolved = events ?? noteGroups.get(name);

	if (!resolved) {
		console.log(`Unknown group "${name}"`);
		return;
	}

	console.log(resolved.map(eventToString).join(" "));
};

export const printGroups = (): void => {
	for (const [name, events] of noteGroups) {
		console.log(`${name}: ${events.map(eventToString).join(" ")}`);
	}
};

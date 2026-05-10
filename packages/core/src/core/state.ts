import { Note, Pitch } from "../domain/Note";
import { resolveNoteGroup } from "./helpers";
import { ok } from "./Result";
export const noteGroups = new Map<string, Note[]>([
	["score", []],
	["motif", [new Note(Pitch.C), new Note(Pitch.E), new Note(Pitch.G)]],
]);

export const appendToGroup = (name: string, notes: Note[]) => {
	const group = noteGroups.get(name);

	if (group) {
		noteGroups.set(name, [...group, ...notes]);
	}
};

export const setGroup = (name: string, notes: Note[]) => {
	noteGroups.set(name, [...notes]);
};

export const clearGroup = (name: string) => {
	noteGroups.set(name, []);
};

export const printGroup = (name: string, notes: Note[] = []) => {
	const ng = notes.length ? ok(notes) : resolveNoteGroup(name);
	if (ng.ok) {
		console.log(ng.value.map((n) => n.toString()).join(" "));
	}
	//console.log((resolveNoteGroup(name).value ?? []).map((n) => n.toString()).join(" "));
};

export const printGroups = () => {
	for (const [name, notes] of noteGroups) {
		console.log(`${name}: ${notes.map((n) => n.toString()).join(" ")}`);
	}
};

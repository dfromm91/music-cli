import { Note, NoteEvent, ScoreEvent } from "../domain/Note";
import { mod } from "./helpers";
import { fromSemitone, toSemitone } from "./musicMath";
import { Transform } from "./types";

const isNoteEvent = (event: ScoreEvent): event is NoteEvent => {
	return event.type === "NoteEvent";
};

const mapNotes = (event: ScoreEvent, fn: (note: Note) => Note): ScoreEvent => {
	if (!isNoteEvent(event)) {
		return event;
	}

	return {
		...event,
		notes: event.notes.map(fn),
	};
};

export const transpose =
	(n: number): Transform =>
	(sequence) =>
		sequence.map((event) =>
			mapNotes(event, (note) => fromSemitone(toSemitone(note) + n)),
		);

export const octaveShift =
	(n: number): Transform =>
	(sequence) =>
		sequence.map((event) =>
			mapNotes(
				event,
				(note) => new Note(note.pitch, note.accidental, note.octave + n),
			),
		);

export const reverse: Transform = (sequence) => {
	return [...sequence].reverse();
};

export const repeat =
	(times: number): Transform =>
	(sequence) =>
		Array.from({ length: Math.max(0, times) }).flatMap(() => sequence);

export const rotate =
	(steps: number): Transform =>
	(sequence) => {
		if (!sequence.length) return sequence;

		const n = mod(steps, sequence.length);

		return [...sequence.slice(n), ...sequence.slice(0, n)];
	};

export const take =
	(n: number): Transform =>
	(sequence) =>
		sequence.slice(0, n);

export const drop =
	(n: number): Transform =>
	(sequence) =>
		sequence.slice(n);

export const slice =
	(a: number, b?: number): Transform =>
	(sequence) =>
		sequence.slice(a, b);

export const invert = (): Transform => (sequence) => {
	const firstNote = sequence
		.filter(isNoteEvent)
		.flatMap((event) => event.notes)
		.at(0);

	if (!firstNote) {
		return sequence;
	}

	const pivot = toSemitone(firstNote);

	return sequence.map((event) =>
		mapNotes(event, (note) => fromSemitone(pivot - (toSemitone(note) - pivot))),
	);
};

export const compose = (transforms: Transform[]): Transform =>
	transforms.reduce(
		(acc, transform) => (sequence) => transform(acc(sequence)),
		(sequence) => sequence,
	);

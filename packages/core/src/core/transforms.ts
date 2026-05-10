import { Note } from "../domain/Note";
import { mod } from "./helpers";
import { fromSemitone, toSemitone } from "./musicMath";
import { Transform } from "./types";

export const transpose =
	(n: number): Transform =>
	(notes) =>
		notes.map((x) => fromSemitone(toSemitone(x) + n));

export const octaveShift =
	(n: number): Transform =>
	(notes) =>
		notes.map((x) => new Note(x.pitch, x.accidental, x.octave + n));

export const reverse: Transform = (notes) => [...notes].reverse();

export const repeat =
	(times: number): Transform =>
	(notes) =>
		Array.from({ length: Math.max(0, times) }).flatMap(() => notes);

export const rotate =
	(steps: number): Transform =>
	(notes) => {
		if (!notes.length) return notes;

		const n = mod(steps, notes.length);
		return [...notes.slice(n), ...notes.slice(0, n)];
	};

export const take =
	(n: number): Transform =>
	(notes) =>
		notes.slice(0, n);

export const drop =
	(n: number): Transform =>
	(notes) =>
		notes.slice(n);

export const slice =
	(a: number, b?: number): Transform =>
	(notes) =>
		notes.slice(a, b);

export const invert = (): Transform => (notes) => {
	if (!notes.length) return notes;

	const pivot = toSemitone(notes[0]);

	return notes.map((n) => fromSemitone(pivot - (toSemitone(n) - pivot)));
};

export const compose = (transforms: Transform[]): Transform =>
	transforms.reduce(
		(acc, transform) => (notes) => transform(acc(notes)),
		(notes) => notes,
	);

import { Note } from "../domain/Note";

export type Transform = (notes: Note[]) => Note[];
export type StateChange = (notes: Note[]) => void;
export type Navigation = () => void;
export type Generator = () => Note[];
export type Pipeline = {
	stateChange: StateChange;
	transformations: Transform[];
	substitution: Note[];
};

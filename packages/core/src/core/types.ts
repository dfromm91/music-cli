import { Sequence } from "../domain/Note";

export type Transform = (notes: Sequence) => Sequence;
export type StateChange = (notes: Sequence) => void;
export type Navigation = () => void;
export type Generator = () => Sequence;
export type AppPort = {
	write: (m: string) => void;
	writeError: (e: string) => void;
};
export type Pipeline = {
	stateChange: StateChange;
	transformations: Transform[];
	substitution: Sequence;
};

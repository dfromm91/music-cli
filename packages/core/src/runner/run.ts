import { parseInput } from "../parser/parseInput";
import { compose } from "../core/transforms";

export const run = (input: string) => {
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

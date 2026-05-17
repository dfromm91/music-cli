// import { parseInput } from "../parser/parseInput";
import { compose } from "../core/transforms";
import { AppPort } from "../core/types";
import { buildStateCommands } from "../commands/stateCommands";
import { buildParseInput } from "../parser/parseInput";
export const consoleAdapter: AppPort = {
	write: (message) => console.log(message),
	writeError: (message) => console.error(message),
};

export const domAdapter: AppPort = {
	write: (message) => {
		const domConsole = document.querySelector(".console-output");
		if (domConsole) {
			domConsole.appendChild(document.createElement("<p>" + message + "</p>"));
		}
	},
	writeError: (message) => {
		console.error(message);
	},
};
export const createRunner = (port: AppPort) => {
	const parseInput = buildParseInput(port);
	return (input: string) => {
		const parsed = parseInput(input);

		if (!parsed.ok) {
			port.writeError("Errors:");
			parsed.errors.forEach((e) => port.writeError(`- ${e}`));
			return;
		}

		const { stateChange, transformations, substitution } = parsed.value;
		const result = compose(transformations)(substitution);

		stateChange(result);
	};
};

import readline from "node:readline/promises";
import { run } from "./runner/run";

export const startRepl = () => {
	const repl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: "scoresketch> ",
	});

	console.log("ScoreSketch REPL. Type help for commands, exit to quit.");
	repl.prompt();

	repl.on("line", (line) => {
		if (line.trim() === "exit") {
			repl.close();
			return;
		}

		run(line);
		repl.prompt();
	});

	repl.on("close", () => {
		console.log("bye");
		process.exit(0);
	});
};

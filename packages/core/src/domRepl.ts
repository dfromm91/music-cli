export const startDomRepl = () => {
	const form = document.querySelector<HTMLFormElement>("#console-form");
	const input = document.querySelector<HTMLInputElement>("#console-input");
	const output = document.querySelector<HTMLDivElement>("#console-output");

	if (!form || !input || !output) {
		throw new Error("Missing console elements.");
	}

	const appendLine = (text: string): void => {
		const line = document.createElement("p");
		line.textContent = text;
		output.appendChild(line);
		output.scrollTop = output.scrollHeight;
	};

	const appendCommand = (command: string): void => {
		const line = document.createElement("p");

		const prompt = document.createElement("span");
		prompt.className = "prompt";
		prompt.textContent = "scoresketch> ";

		line.appendChild(prompt);
		line.append(command);

		output.appendChild(line);
		output.scrollTop = output.scrollHeight;
	};

	form.addEventListener("submit", (event) => {
		event.preventDefault();

		const command = input.value.trim();

		if (!command) {
			return;
		}

		appendCommand(command);

		// Temporary fake behavior.
		appendLine(`received: ${command}`);

		// Later:
		// run(command);

		input.value = "";
		input.focus();
	});
};

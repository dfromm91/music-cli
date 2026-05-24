// import { parseInput } from "../parser/parseInput";
import { compose } from "../core/transforms";
import { AppPort, Subscriptions } from "../core/types";
import { buildStateCommands } from "../commands/stateCommands";
import { buildParseInput } from "../parser/parseInput";
import { macros } from "../commands/macros";
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
export const createRunner = (port: AppPort, subs?: Subscriptions) => {
  const parseInput = buildParseInput(port, subs);
  return (input: string) => {
    for (let i = 0; i < macros.length; i++) {
      const result = macros[i](input);
      if (result.apply) {
        input = result.sub;
      }
    }

    const lines = input.split(";");
    for (let i = 0; i < lines.length; i++) {
      const parsed = parseInput(lines[i]);

      if (!parsed.ok) {
        port.writeError("Errors:");
        parsed.errors.forEach((e) => port.writeError(`- ${e}`));
        return;
      }

      const { stateChange, transformations, substitution } = parsed.value;
      console.log(parsed.value);
      const result = compose(transformations)(substitution);

      stateChange(result);
    }
  };
};

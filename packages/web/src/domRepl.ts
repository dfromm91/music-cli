import { createRunner, type AppPort } from "@music-tool/core";
import { Subscriptions } from "@music-tool/core/dist/core/types";

export const startDomRepl = (subscriptions: Subscriptions) => {
  const form = document.querySelector<HTMLFormElement>("#console-form");
  const input = document.querySelector<HTMLInputElement>("#console-input");
  const output = document.querySelector<HTMLDivElement>("#console-output");

  if (!form || !input || !output) {
    throw new Error("Missing console elements.");
  }

  const adapter: AppPort = {
    write: (message) => {
      const line = document.createElement("p");
      line.textContent = message;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    },
    writeError: (message) => {
      const line = document.createElement("p");
      line.textContent = `Error: ${message}`;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    },
  };

  const run = createRunner(adapter, subscriptions);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const command = input.value.trim();

    if (!command) {
      return;
    }

    run(command);

    input.value = "";
    input.focus();
  });
};

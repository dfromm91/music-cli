import { fail, ok, Result } from "../core/Result";
import {
  appendToGroup,
  clearGroup,
  noteGroups,
  playSequence,
  printGroup,
  setGroup,
  showSequence,
} from "../core/state";
import { AppPort, StateChange, Subscriptions } from "../core/types";
import { Note, Sequence } from "../domain/Note";
import { resolveSequence } from "../core/helpers";

export type StateCommand = (args: string[]) => Result<StateChange>;

export const buildStateCommands = (
  ap: AppPort,
  subs?: Subscriptions,
): Map<string, StateCommand> => {
  return new Map<string, StateCommand>([
    [
      "append",
      (args) => {
        const groupName = args[0];

        if (!groupName) return fail("append requires group name.");
        if (!resolveSequence(groupName).ok)
          return fail(`Unknown group "${groupName}".`);

        return ok((notes) => appendToGroup(groupName, notes, subs));
      },
    ],
    [
      "set",
      (args) => {
        const groupName = args[0];

        if (!groupName) return fail("set requires group name.");

        return ok((notes) => setGroup(groupName, notes, subs));
      },
    ],
    [
      "clear",
      (args) => {
        if (args.length !== 1) return fail("clear requires 1 note group.");

        const groupName = args[0];

        if (!groupName) return fail("clear requires group name.");

        return ok(() => clearGroup(groupName, subs));
      },
    ],
    [
      "print",
      (args, notes: Sequence = []) => {
        if (args.length !== 1) return fail("print requires 1 note group.");

        const groupName = args[0];

        if (!groupName) return fail("print requires group name.");

        return ok((n = notes) => printGroup(groupName, ap, n));
      },
    ],
    [
      "play",
      (args) => {
        if (args.length != 1) return fail("play requires one note group");
        return ok((notes) => playSequence(ap, notes));
      },
    ],
    [
      "show",
      (args) => {
        if (args.length != 1) return fail("show requires one note group");
        return ok((notes) => showSequence(ap, notes));
      },
    ],
  ]);
};

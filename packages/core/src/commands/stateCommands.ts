import { fail, ok, Result } from "../core/Result";
import {
	appendToGroup,
	clearGroup,
	noteGroups,
	printGroup,
	setGroup,
} from "../core/state";
import { StateChange } from "../core/types";
import { resolveNoteGroup } from "../core/helpers";

export type StateCommand = (args: string[]) => Result<StateChange>;

export const stateCommands = new Map<string, StateCommand>([
	[
		"append",
		(args) => {
			const groupName = args[0];

			if (!groupName) return fail("append requires group name.");
			if (!resolveNoteGroup(groupName).ok)
				return fail(`Unknown group "${groupName}".`);

			return ok((notes) => appendToGroup(groupName, notes));
		},
	],
	[
		"set",
		(args) => {
			const groupName = args[0];

			if (!groupName) return fail("set requires group name.");

			return ok((notes) => setGroup(groupName, notes));
		},
	],
	[
		"clear",
		(args) => {
			if (args.length !== 1) return fail("clear requires 1 note group.");

			const groupName = args[0];

			if (!groupName) return fail("clear requires group name.");

			return ok(() => clearGroup(groupName));
		},
	],
	[
		"print",
		(args) => {
			if (args.length !== 1) return fail("print requires 1 note group.");

			const groupName = args[0];

			if (!groupName) return fail("print requires group name.");

			return ok(() => printGroup(groupName));
		},
	],
]);

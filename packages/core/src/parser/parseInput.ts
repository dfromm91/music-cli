import { navCommands } from "../commands/navCommands";
import { stateCommands } from "../commands/stateCommands";
import { transformCommands } from "../commands/transformCommands";
import { resolveSequence } from "../core/helpers";
import { fail, ok, Result } from "../core/Result";
import { noteGroups } from "../core/state";
import { Pipeline, Transform } from "../core/types";

export const parseInput = (input: string): Result<Pipeline> => {
	let parts = input
		.split("|")
		.map((x) => x.trim())
		.filter(Boolean);

	if (!parts.length) return fail("Empty input.");
	if (transformCommands.get(parts[0].split(" ")[0].trim())) {
		parts[0] = "print placeholder " + parts[0];
	}
	if (parts.length === 1) {
		const navCommand = navCommands.get(parts[0]);

		if (navCommand) {
			return ok({
				stateChange: () => navCommand(),
				transformations: [],
				substitution: [],
			});
		}
	}

	let [cmd, groupName, ...rest] = parts[0].split(/\s+/);

	const state = stateCommands.get(cmd);

	if (!state) {
		return fail(`Unknown state command "${cmd}".`);
	}

	const stateRes = state([groupName]);

	if (!stateRes.ok) return stateRes;

	if (rest.length === 0) {
		const possibleGroup = resolveSequence(groupName);
		// console.log(rest);
		if (possibleGroup.ok) {
			return ok({
				stateChange: stateRes.value,
				transformations: [],
				substitution: possibleGroup.value,
			});
		}
	}
	if (rest.length === 1) {
		const possibleGroupName = rest[0];
		// console.log("pgn: " + possibleGroupName);
		// console.log("cmd: " + cmd);
		// console.log("group name: " + groupName);
		const possibleGroup = resolveSequence(possibleGroupName);

		if (possibleGroup.ok) {
			if (transformCommands.get(groupName.trim())) {
				rest = [groupName, ...rest];
			} else {
				return ok({
					stateChange: stateRes.value,
					transformations: [],
					substitution: possibleGroup.value,
				});
			}
		}
	}

	parts[0] = rest.join(" ");
	// console.log(parts);
	const tokens = parts[0].split(/\s+/).filter(Boolean);
	const subName = tokens.at(-1);

	if (!subName) return fail("Missing substitution group.");

	const sub = resolveSequence(subName);

	if (!sub.ok) return fail(`Unknown substitution group "${subName}".`);

	const errors: string[] = [];
	const transforms: Transform[] = [];

	// Remove substitution group from first transform segment.
	// parts[0] = tokens.slice(0, -1).join(" ");

	for (const part of parts) {
		if (!part.trim()) continue;

		const [name, ...args] = part.split(/\s+/);
		const cmd = transformCommands.get(name);

		if (!cmd) {
			errors.push(`Unknown transform "${name}".`);
			continue;
		}

		const res = cmd(args);

		if (res.ok) {
			transforms.push(res.value);
		} else {
			errors.push(...res.errors);
		}
	}

	return errors.length
		? fail(...errors)
		: ok({
				stateChange: stateRes.value,
				transformations: transforms,
				substitution: sub.value,
			});
};

import { fail, ok, Result } from "./Result";

export const mod = (n: number, m: number): number => ((n % m) + m) % m;

export const parseRequiredInt = (
	value: string | undefined,
	cmd: string,
	arg: string,
): Result<number> => {
	if (!value) return fail(`${cmd} requires ${arg}.`);

	const n = Number.parseInt(value, 10);

	return Number.isNaN(n)
		? fail(`${cmd} expected ${arg} to be a number, got "${value}".`)
		: ok(n);
};

export const parseOptionalInt = (
	value: string | undefined,
	cmd: string,
	arg: string,
): Result<number | undefined> => {
	if (value === undefined) return ok(undefined);

	const n = Number.parseInt(value, 10);

	return Number.isNaN(n)
		? fail(`${cmd} expected ${arg} to be a number, got "${value}".`)
		: ok(n);
};

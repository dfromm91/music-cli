import { fail, ok, Result } from "../core/Result";
import {
  parseOptionalInt,
  parseRequiredInt,
  isDuration,
} from "../core/helpers";
import {
  drop,
  invert,
  octaveShift,
  repeat,
  reverse,
  rotate,
  slice,
  take,
  transpose,
  setDuration,
} from "../core/transforms";
import { Transform } from "../core/types";

export type TransformCommand = (args: string[]) => Result<Transform>;

export const transformCommands = new Map<string, TransformCommand>([
  [
    "transpose",
    (args) => {
      const r = parseRequiredInt(args[0], "transpose", "semitones");
      return r.ok ? ok(transpose(r.value)) : r;
    },
  ],
  [
    "octaveShift",
    (args) => {
      const r = parseRequiredInt(args[0], "octaveShift", "octaves");
      return r.ok ? ok(octaveShift(r.value)) : r;
    },
  ],
  ["reverse", () => ok(reverse)],
  [
    "repeat",
    (args) => {
      const r = parseRequiredInt(args[0], "repeat", "times");
      return r.ok ? ok(repeat(r.value)) : r;
    },
  ],
  [
    "rotate",
    (args) => {
      const r = parseRequiredInt(args[0], "rotate", "steps");
      return r.ok ? ok(rotate(r.value)) : r;
    },
  ],
  [
    "take",
    (args) => {
      const r = parseRequiredInt(args[0], "take", "count");
      return r.ok ? ok(take(r.value)) : r;
    },
  ],
  [
    "drop",
    (args) => {
      const r = parseRequiredInt(args[0], "drop", "count");
      return r.ok ? ok(drop(r.value)) : r;
    },
  ],
  [
    "slice",
    (args) => {
      const a = parseRequiredInt(args[0], "slice", "start");
      if (!a.ok) return a;

      const b = parseOptionalInt(args[1], "slice", "end");
      if (!b.ok) return b;

      return ok(slice(a.value, b.value));
    },
  ],
  ["invert", () => ok(invert())],
  [
    "setDuration",
    (args) => {
      const possibleDuration = args[0];
      if (isDuration(possibleDuration)) {
        return ok(setDuration(possibleDuration));
      }
      return fail("could not resolve duration symbol: " + possibleDuration);
    },
  ],
]);

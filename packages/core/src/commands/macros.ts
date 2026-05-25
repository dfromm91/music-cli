import { noteGroups } from "../core/state";
import { Duration } from "../domain/Note";

// export const macros = new Map<string, string>([
//   [
//     "u",
//     "set tmp reverse score | take 1 | transpose -1; set score drop 1 score; append score tmp;",
//   ],
//   [
//     "d",
//     "set tmp reverse score | take 1 | transpose 1; set score drop 1 score; append score tmp;",
//   ],
//   [
//     "+",
//     "set tmp reverse score | take 1 | setDuration " +
//       getNextDuration(1) +
//       "; set score drop 1 score; append score tmp",
//   ],
//   [
//     "-",
//     "set tmp reverse score | take 1 | setDuration " +
//       getNextDuration(-1) +
//       "; set score drop 1 score; append score tmp",
//   ],
// ]);
type macro = (input: string) => { apply: true; sub: string } | { apply: false };

export const macros: macro[] = [
  (input) =>
    input == "d"
      ? {
          apply: true,
          sub: "set tmp reverse score | take 1 | transpose -1; set score reverse score | drop 1 | reverse; append score tmp",
        }
      : { apply: false },

  (input) =>
    input == "u"
      ? {
          apply: true,
          sub: "set tmp reverse score | take 1 | transpose 1; set score reverse score | drop 1 | reverse; append score tmp",
        }
      : { apply: false },

  (input) =>
    input == "+"
      ? {
          apply: true,
          sub:
            "set tmp reverse score | take 1 | setDuration " +
            getNextDuration(1) +
            "; set score reverse score | drop 1 | reverse; append score tmp",
        }
      : { apply: false },

  (input) =>
    input == "-"
      ? {
          apply: true,
          sub:
            "set tmp reverse score | take 1 | setDuration " +
            getNextDuration(-1) +
            "; set score reverse score | drop 1 | reverse; append score tmp",
        }
      : { apply: false },
  (input) => {
    const match = input.match(/^up(-?\d+)$/);

    if (!match) {
      return { apply: false };
    }

    return {
      apply: true,
      sub: `set score transpose ${match[1]} score`,
    };
  },
  (input) => {
    const isNumber = /^-?\d+$/.test(input);
    if (!isNumber) {
      return { apply: false };
    }
    return {
      apply: true,
      sub:
        "set tmp reverse score | take 1 | transpose " +
        input +
        "; append score tmp",
    };
  },
  (input) => {
    const regex = /^\*@(\d+)\/(\d+(?:\.\d+)?)-(\d+)\/(\d+(?:\.\d+)?)$/;
    const isReplace = regex.test(input.split(" ")[0]);
    if (!isReplace) {
      return { apply: false };
    }
    return {
      apply: true,
      sub: "set score replace " + input.replace("*", "") + " score",
    };
  },
  (input) => {
    if (input != "<") {
      return { apply: false };
    }
    return {
      apply: true,
      sub: "set score reverse score | drop 1 | reverse",
    };
  },
];
function getNextDuration(step: number): Duration {
  const score = noteGroups.get("score");

  if (!score || score.length === 0) {
    return "q";
  }

  const lastEvent = score[score.length - 1];

  const durationArray: Duration[] = ["s", "e", "q", "h", "w"];
  const index = durationArray.indexOf(lastEvent.duration);

  if (index === -1) {
    return lastEvent.duration;
  }

  const nextIndex = index + step;
  const inBounds = nextIndex >= 0 && nextIndex < durationArray.length;

  return inBounds ? durationArray[nextIndex] : lastEvent.duration;
}

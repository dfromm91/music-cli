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
type Macro = () => string;

export const macros = new Map<string, Macro>([
  [
    "u",
    () =>
      "set tmp reverse score | take 1 | transpose -1; set score drop 1 score; append score tmp;",
  ],
  [
    "d",
    () =>
      "set tmp reverse score | take 1 | transpose 1; set score drop 1 score; append score tmp;",
  ],
  [
    "+",
    () =>
      "set tmp reverse score | take 1 | setDuration " +
      getNextDuration(1) +
      "; set score drop 1 score; append score tmp",
  ],
  [
    "-",
    () =>
      "set tmp reverse score | take 1 | setDuration " +
      getNextDuration(-1) +
      "; set score drop 1 score; append score tmp",
  ],
]);
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

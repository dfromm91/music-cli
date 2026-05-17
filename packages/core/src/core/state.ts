import {
  Note,
  Pitch,
  ScoreEvent,
  noteEvent,
  Sequence,
  Accidental,
  restEvent,
} from "../domain/Note";
import { AppPort, Subscriptions } from "./types";
const notifySubscriber = (name: string, s: Sequence, subs?: Subscriptions) => {
  const sub = subs?.get(name);
  if (sub) {
    sub(s);
  }
};
export const noteGroups = new Map<string, Sequence>([
  ["score", []],
  [
    "motif",
    [
      restEvent(),
      noteEvent([new Note(Pitch.C), new Note(Pitch.C, Accidental.Sharp)]),
      noteEvent([new Note(Pitch.E)]),
      noteEvent([new Note(Pitch.G)]),
    ],
  ],
]);

export const appendToGroup = (
  name: string,
  events: Sequence,
  subs?: Subscriptions,
): void => {
  const group = noteGroups.get(name);

  if (!group) {
    return;
  }

  noteGroups.set(name, [...group, ...events]);
  notifySubscriber(name, group, subs);
};

export const setGroup = (
  name: string,
  events: Sequence,
  subs?: Subscriptions,
): void => {
  noteGroups.set(name, [...events]);
  notifySubscriber(name, events, subs);
};

export const clearGroup = (name: string, subs?: Subscriptions): void => {
  noteGroups.set(name, []);
  notifySubscriber(name, [], subs);
};

export const eventToString = (event: ScoreEvent): string => {
  if (event.type === "RestEvent") {
    return `r:${event.duration}`;
  }

  const notes = event.notes.map((n) => n.toString()).join(",");

  if (event.notes.length > 1) {
    return `[${notes}]:${event.duration}`;
  }

  return `${notes}:${event.duration}`;
};

export const printGroup = (
  name: string,
  ap: AppPort,
  events?: Sequence,
): void => {
  const resolved = events ?? noteGroups.get(name);

  if (!resolved) {
    ap.writeError(`Unknown group "${name}"`);
    return;
  }

  ap.write(resolved.map(eventToString).join(" "));
};

export const printGroups = (ap: AppPort): void => {
  for (const [name, events] of noteGroups) {
    ap.write(`${name}: ${events.map(eventToString).join(" ")}`);
  }
};

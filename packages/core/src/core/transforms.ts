import { Sequence } from "tone";
import {
  Duration,
  Note,
  NoteEvent,
  pitchClass,
  ScoreEvent,
} from "../domain/Note";
import { mod } from "./helpers";
import {
  chromaticPitchClasses,
  computeScale,
  findPitchClass,
  fromSemitone,
  scaleType,
  toSemitone,
} from "./musicMath";
import { Transform } from "./types";

const isNoteEvent = (event: ScoreEvent): event is NoteEvent => {
  return event.type === "NoteEvent";
};

const mapNotes = (event: ScoreEvent, fn: (note: Note) => Note): ScoreEvent => {
  if (!isNoteEvent(event)) {
    return event;
  }

  return {
    ...event,
    notes: event.notes.map(fn),
  };
};

export const transpose =
  (n: number): Transform =>
  (sequence) =>
    sequence.map((event) =>
      mapNotes(event, (note) => fromSemitone(toSemitone(note) + n)),
    );

export const octaveShift =
  (n: number): Transform =>
  (sequence) =>
    sequence.map((event) =>
      mapNotes(
        event,
        (note) => new Note(note.pitch, note.accidental, note.octave + n),
      ),
    );
export const setDuration =
  (d: Duration): Transform =>
  (sequence) =>
    sequence.map((event) => {
      if (event.type == "NoteEvent") {
        return { type: "NoteEvent", notes: event.notes, duration: d };
      }
      return { type: "RestEvent", duration: d };
    });

export const reverse: Transform = (sequence) => {
  return [...sequence].reverse();
};

export const repeat =
  (times: number): Transform =>
  (sequence) =>
    Array.from({ length: Math.max(0, times) }).flatMap(() => sequence);

export const rotate =
  (steps: number): Transform =>
  (sequence) => {
    if (!sequence.length) return sequence;

    const n = mod(steps, sequence.length);

    return [...sequence.slice(n), ...sequence.slice(0, n)];
  };

export const take =
  (n: number): Transform =>
  (sequence) =>
    sequence.slice(0, n);

export const drop =
  (n: number): Transform =>
  (sequence) =>
    sequence.slice(n);

export const slice =
  (a: number, b?: number): Transform =>
  (sequence) =>
    sequence.slice(a, b);

export const invert = (): Transform => (sequence) => {
  const firstNote = sequence
    .filter(isNoteEvent)
    .flatMap((event) => event.notes)
    .at(0);

  if (!firstNote) {
    return sequence;
  }

  const pivot = toSemitone(firstNote);

  return sequence.map((event) =>
    mapNotes(event, (note) => fromSemitone(pivot - (toSemitone(note) - pivot))),
  );
};

export const transposeDiatonic = (
  shift: number,
  root: pitchClass,
  scaleType: scaleType,
): Transform => {
  const scale = computeScale(root, scaleType);
  return (sequence) => {
    return sequence.map((event) => {
      if (event.type == "RestEvent") {
        return event;
      }
      const shiftedNotes = mapNotes(event, (note) => {
        const noteIndex = findPitchClass(
          { pitch: note.pitch, accidental: note.accidental },
          scale,
        );
        let newIndex = (noteIndex + shift) % scale.length;
        if (newIndex < 0) newIndex = scale.length - Math.abs(newIndex);

        const shiftedPitchClass = scale[newIndex];
        const noteIndexChromatic = findPitchClass(
          { pitch: note.pitch, accidental: note.accidental },
          chromaticPitchClasses,
        );
        const shiftedNoteIndexChromatic = findPitchClass(
          shiftedPitchClass,
          chromaticPitchClasses,
        );
        const octaveShift =
          shift > 0
            ? Math.floor(shift / scale.length)
            : Math.ceil(shift / scale.length);
        const crossesCAbove =
          shift > 0 && noteIndexChromatic > shiftedNoteIndexChromatic;
        const crossesCBelow =
          shift < 0 && noteIndexChromatic < shiftedNoteIndexChromatic;

        const shiftedNote = new Note(
          shiftedPitchClass.pitch,
          shiftedPitchClass.accidental,
          note.octave +
            octaveShift +
            (crossesCAbove ? 1 : crossesCBelow ? -1 : 0),
        );
        return shiftedNote;
      });
      if (shiftedNotes.type == "NoteEvent") {
        return {
          type: "NoteEvent",
          notes: [...shiftedNotes.notes],
          duration: event.duration,
        };
      }
      return event;
    });
  };
};
export const harmonize = (
  shift: number,
  root: pitchClass,
  scaleType: scaleType,
): Transform => {
  return (sequence) => {
    const shifted = transposeDiatonic(shift, root, scaleType)(sequence);
    return sequence.map((event, i) =>
      event.type == "NoteEvent" && shifted[i].type == "NoteEvent"
        ? {
            type: "NoteEvent",
            notes: [...event.notes, ...shifted[i].notes],
            duration: event.duration,
          }
        : event,
    );
  };
};

export const replace =
  (
    replaceStart: number,
    replaceEnd: number,
    replacement: ScoreEvent[],
  ): Transform =>
  (sequence) => [
    ...sequence.slice(0, replaceStart),
    ...replacement,
    ...sequence.slice(replaceEnd, sequence.length),
  ];

export const compose = (transforms: Transform[]): Transform =>
  transforms.reduce(
    (acc, transform) => (sequence) => transform(acc(sequence)),
    (sequence) => sequence,
  );

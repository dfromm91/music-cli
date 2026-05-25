export enum Pitch {
  C = "C",
  D = "D",
  E = "E",
  F = "F",
  G = "G",
  A = "A",
  B = "B",
}

export enum Accidental {
  Natural = "",
  Sharp = "#",
  Flat = "b",
}

export type Duration = "w" | "h" | "q" | "e" | "s";

export class Note {
  public readonly type = "Note";

  constructor(
    public readonly pitch: Pitch,
    public readonly accidental: Accidental = Accidental.Natural,
    public readonly octave: number = 4,
  ) {}

  toString(): string {
    return `${this.pitch}${this.accidental}${this.octave}`;
  }
}

export type NoteEvent = {
  type: "NoteEvent";
  notes: Note[];
  duration: Duration;
};

export type RestEvent = {
  type: "RestEvent";
  duration: Duration;
};

export type ScoreEvent = NoteEvent | RestEvent;

export type Sequence = ScoreEvent[];

export const noteEvent = (
  notes: Note[],
  duration: Duration = "q",
): NoteEvent => ({
  type: "NoteEvent",
  notes,
  duration,
});

export const restEvent = (duration: Duration = "q"): RestEvent => ({
  type: "RestEvent",
  duration,
});
export type pitchClass = {
  pitch: Pitch;
  accidental: Accidental;
};

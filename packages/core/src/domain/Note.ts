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

export class Note {
	constructor(
		public readonly pitch: Pitch,
		public readonly accidental: Accidental = Accidental.Natural,
		public readonly octave: number = 4,
	) {}

	toString(): string {
		return `${this.pitch}${this.accidental}${this.octave}`;
	}
}

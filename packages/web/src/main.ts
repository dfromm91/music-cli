import vexflow from "vexflow";
import { startDomRepl } from "./domRepl";
import {
  type Sequence,
  type ScoreEvent,
} from "@music-tool/core/dist/domain/Note";
import { eventToString } from "@music-tool/core/dist/core/state";
import { divideSequenceIntoMeasures } from "@music-tool/core/src/core/musicMath";

type onUpdate = (s: Sequence) => void;

const STAFF_ELEMENT_ID = "staff-placeholder";
const MEASURE_WIDTH = 180;
const LEFT_MARGIN = 20;
const TOP_MARGIN = 40;

const noteToMidi = (note: string): number => {
  const match = note.match(/^([A-Ga-g])([#b]?)(\d+)$/);

  if (!match) {
    throw new Error(`Invalid note: ${note}`);
  }

  const [, letter, accidental, octaveString] = match;

  const pitchClasses: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };

  let midi =
    pitchClasses[letter.toUpperCase()] + (Number(octaveString) + 1) * 12;

  if (accidental === "#") {
    midi++;
  }

  if (accidental === "b") {
    midi--;
  }

  return midi;
};

const eventStemDirection = (event: ScoreEvent): "up" | "down" => {
  if (event.type === "RestEvent") {
    return "down";
  }

  const lowestNote = Math.min(
    ...event.notes.map((note) => noteToMidi(note.toString())),
  );

  return lowestNote < noteToMidi("C5") ? "up" : "down";
};
// hardcoded treble clef
export const renderScore = (sequence: Sequence): void => {
  const staffElement = document.getElementById(STAFF_ELEMENT_ID);
  const clef = "treble";

  if (!staffElement) {
    throw new Error("Missing staff element.");
  }

  staffElement.innerHTML = "";

  if (sequence.length === 0) {
    staffElement.textContent = "No score yet.";
    return;
  }
  const MeasuresPerLine = 4;
  let currentLine = 0;
  const measures = divideSequenceIntoMeasures(sequence, {
    numerator: 4,
    denominator: 4,
  });
  const buffer = 20;
  const rendererWidth = MeasuresPerLine * MEASURE_WIDTH + LEFT_MARGIN + buffer;
  const lineSpacing = 80;
  const STAFF_HEIGHT =
    Math.ceil(measures.length / MeasuresPerLine) * lineSpacing +
    buffer +
    TOP_MARGIN;
  const { Factory, Beam } = vexflow;

  const vf = new Factory({
    renderer: {
      elementId: STAFF_ELEMENT_ID,
      width: rendererWidth,
      height: STAFF_HEIGHT,
    },
  });

  const score = vf.EasyScore();
  const allBeams: InstanceType<typeof Beam>[] = [];

  try {
    for (let i = 0; i < measures.length; i++) {
      const notes = measures[i].flatMap((event) => {
        const noteString = eventToEasyScoreToken(event);

        return score.notes(noteString, {
          stem: eventStemDirection(event),
        });
      });
      if (i != 0 && i % MeasuresPerLine == 0) {
        currentLine++;
      }
      if (notes.length === 0) {
        continue;
      }

      const voice = score.voice(notes, { time: "4/4" });
      voice.setStrict(false);

      const beams = Beam.generateBeams(notes);
      allBeams.push(...beams);

      const system = vf.System({
        x: LEFT_MARGIN + (i % MeasuresPerLine) * MEASURE_WIDTH,
        y: TOP_MARGIN + lineSpacing * currentLine,
        width: MEASURE_WIDTH,
      });

      const stave = system.addStave({
        voices: [voice],
      });

      if (i === 0) {
        stave.addClef(clef).addTimeSignature("4/4");
      }
    }

    vf.draw();

    for (const beam of allBeams) {
      beam.setContext(vf.getContext()).draw();
    }
  } catch (error) {
    staffElement.textContent =
      error instanceof Error
        ? `Render error: ${error.message}`
        : "Unknown render error.";
  }
};

export const sequenceToEasyScoreString = (sequence: Sequence): string => {
  return sequence.map(eventToEasyScoreToken).join(", ");
};
const durationToEasyScore = (duration: string): string => {
  switch (duration) {
    case "w":
      return "w";
    case "h":
      return "h";
    case "q":
      return "q";
    case "e":
      return "8";
    case "s":
      return "16";
    default:
      return duration;
  }
};
const eventToEasyScoreToken = (event: ScoreEvent): string => {
  const duration = durationToEasyScore(event.duration);

  if (event.type === "RestEvent") {
    return `B4/${duration}/r`;
  }

  const notes = event.notes.map((note) => note.toString()).join(" ");

  if (event.notes.length > 1) {
    return `(${notes})/${duration}`;
  }

  return `${notes}/${duration}`;
};
export const subscriptions = new Map<string, onUpdate>([
  ["score", renderScore],
]);
const PRINT_PDF_BUTTON_ID = "print-pdf-button";

const printPdf = (): void => {
  window.print();
};

const wirePrintPdfButton = (): void => {
  const button = document.getElementById(PRINT_PDF_BUTTON_ID);

  if (!button) {
    throw new Error("Missing print PDF button.");
  }

  button.addEventListener("click", printPdf);
};

wirePrintPdfButton();
startDomRepl(subscriptions);

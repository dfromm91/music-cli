import vexflow from "vexflow";
import { startDomRepl } from "./domRepl";
import {
  type Sequence,
  type ScoreEvent,
} from "@music-tool/core/dist/domain/Note";
import { eventToString } from "@music-tool/core/dist/core/state";

type onUpdate = (s: Sequence) => void;

const STAFF_ELEMENT_ID = "staff-placeholder";

export const renderScore = (sequence: Sequence): void => {
  const staffElement = document.getElementById(STAFF_ELEMENT_ID);

  if (!staffElement) {
    throw new Error("Missing staff element.");
  }

  staffElement.innerHTML = "";

  const { Factory } = vexflow;

  const vf = new Factory({
    renderer: {
      elementId: STAFF_ELEMENT_ID,
      width: 900,
      height: 220,
    },
  });

  const score = vf.EasyScore();
  const system = vf.System();

  const noteString = sequenceToEasyScoreString(sequence);

  if (!noteString) {
    vf.draw();
    return;
  }

  system
    .addStave({
      voices: [score.voice(score.notes(noteString, { stem: "down" }))],
    })
    .addClef("treble")
    .addTimeSignature("4/4");

  vf.draw();
};

export const sequenceToEasyScoreString = (sequence: Sequence): string => {
  return sequence.map(eventToEasyScoreToken).join(", ");
};

const eventToEasyScoreToken = (event: ScoreEvent): string => {
  const raw = eventToString(event);

  return raw.replaceAll(":", "/").replaceAll("[", "(").replaceAll("]", ")");
};

export const subscriptions = new Map<string, onUpdate>([
  ["score", renderScore],
]);

startDomRepl(subscriptions);

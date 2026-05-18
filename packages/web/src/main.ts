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
const NOTES_PER_MEASURE = 4;
const MEASURE_WIDTH = 180;
const LEFT_MARGIN = 20;
const TOP_MARGIN = 40;
const STAFF_HEIGHT = 180;

export const renderScore = (sequence: Sequence): void => {
	const staffElement = document.getElementById(STAFF_ELEMENT_ID);

	if (!staffElement) {
		throw new Error("Missing staff element.");
	}

	staffElement.innerHTML = "";

	if (sequence.length === 0) {
		staffElement.textContent = "No score yet.";
		return;
	}

	const measures = divideSequenceIntoMeasures(sequence, {
		numerator: 4,
		denominator: 4,
	});
	console.log(measures);
	const rendererWidth = Math.max(
		900,
		measures.length * MEASURE_WIDTH + LEFT_MARGIN * 2
	);

	const { Factory } = vexflow;

	const vf = new Factory({
		renderer: {
			elementId: STAFF_ELEMENT_ID,
			width: rendererWidth,
			height: STAFF_HEIGHT,
		},
	});

	const score = vf.EasyScore();

	try {
		for (let i = 0; i < measures.length; i++) {
			const noteString = sequenceToEasyScoreString(measures[i]);

			if (!noteString) {
				continue;
			}

			const notes = score.notes(noteString, { stem: "down" });
			const voice = score.voice(notes, { time: "4/4" });

			voice.setStrict(false);

			const system = vf.System({
				x: LEFT_MARGIN + i * MEASURE_WIDTH,
				y: TOP_MARGIN,
				width: MEASURE_WIDTH,
			});

			const stave = system.addStave({
				voices: [voice],
			});

			if (i === 0) {
				stave.addClef("treble").addTimeSignature("4/4");
			}
		}

		vf.draw();
	} catch (error) {
		staffElement.textContent =
			error instanceof Error
				? `Render error: ${error.message}`
				: "Unknown render error.";
	}
};

// const chunkSequence = <T>(items: T[], size: number): T[][] => {
// 	const chunks: T[][] = [];

// 	for (let i = 0; i < items.length; i += size) {
// 		chunks.push(items.slice(i, i + size));
// 	}

// 	return chunks;
// };

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

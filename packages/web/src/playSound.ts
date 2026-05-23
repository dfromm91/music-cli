import * as Tone from "tone";
import { Duration, Sequence } from "@music-tool/core/dist/domain/Note";
import { noteGroups } from "@music-tool/core/dist/core/state";
type synthNote = { s: string; d: number };
const durationToSynthParam = new Map<Duration, synthNote>([
  ["e", { s: "8n", d: 0.5 }],
  ["h", { s: "2n", d: 2 }],
  ["q", { s: "4n", d: 1 }],
  ["w", { s: "1n", d: 4 }],
  ["s", { s: "16n", d: 0.25 }],
]);
const playNote = async (sequence: Sequence): Promise<void> => {
  await Tone.start();

  console.log("audio started");

  const synth = new Tone.PolySynth(Tone.Synth).toDestination();
  let now = Tone.now();
  for (let i: number = 0; i < sequence.length; i++) {
    const event = sequence[i];

    if (event.type == "NoteEvent") {
      const pitch = event.notes.toString().split(":")[0];
      console.log("pitch: " + pitch);
      const sn = durationToSynthParam.get(event.duration!)!;
      console.log(now);

      console.log("sn.s: " + sn.s);
      console.log("sn.d " + sn.d);
      synth.triggerAttackRelease(pitch, sn.s, now);
      now += sn.d;
    } else {
      now += durationToSynthParam.get(event.duration!)!.d;
    }
  }
  //synth.triggerAttackRelease(["C4", "E4", "G4"], "8n", now);
};

const button = document.createElement("button");

button.textContent = "Play Note";

button.addEventListener("click", () => {
  const score = noteGroups.get("score");
  if (score) {
    void playNote(score);
  }
});

document.body.appendChild(button);

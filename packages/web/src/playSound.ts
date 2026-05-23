import * as Tone from "tone";

const playNote = async (): Promise<void> => {
  await Tone.start();

  console.log("audio started");

  const synth = new Tone.Synth().toDestination();

  synth.triggerAttackRelease("C4", "8n");
};

const button = document.createElement("button");

button.textContent = "Play Note";

button.addEventListener("click", () => {
  void playNote();
});

document.body.appendChild(button);

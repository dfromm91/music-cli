import * as Tone from "tone";
import type { Duration, Sequence } from "@music-tool/core/dist/domain/Note";
import { noteGroups } from "@music-tool/core/dist/core/state";
let playbackFinishedTimeoutId: number | null = null;
type SynthDuration = {
  toneDuration: string;
  beats: number;
};

const PLAY_BUTTON_ID = "play-button";
const STOP_BUTTON_ID = "stop-button";
const TEMPO = 120;

const durationToSynthDuration = new Map<Duration, SynthDuration>([
  ["w", { toneDuration: "1n", beats: 4 }],
  ["h", { toneDuration: "2n", beats: 2 }],
  ["q", { toneDuration: "4n", beats: 1 }],
  ["e", { toneDuration: "8n", beats: 0.5 }],
  ["s", { toneDuration: "16n", beats: 0.25 }],
]);

let synth: Tone.PolySynth | null = null;
let scheduledEventIds: number[] = [];

const getSynth = (): Tone.PolySynth => {
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
  }

  return synth;
};

const getSynthDuration = (duration: Duration): SynthDuration => {
  const synthDuration = durationToSynthDuration.get(duration);

  if (!synthDuration) {
    throw new Error(`Unsupported duration: ${duration}`);
  }

  return synthDuration;
};

const getEventPitches = (event: Sequence[number]): string[] => {
  if (event.type !== "NoteEvent") {
    return [];
  }

  return event.notes.map((note) => note.toString().split(":")[0]);
};

const setPlaybackButtonState = (isPlaying: boolean): void => {
  const playButton = document.getElementById(PLAY_BUTTON_ID);
  const stopButton = document.getElementById(STOP_BUTTON_ID);

  playButton?.classList.toggle("is-active", isPlaying);
  stopButton?.classList.toggle("is-active", !isPlaying);
};

export const stopPlayback = (): void => {
  Tone.Transport.stop();
  Tone.Transport.position = 0;

  for (const eventId of scheduledEventIds) {
    Tone.Transport.clear(eventId);
  }

  scheduledEventIds = [];

  if (playbackFinishedTimeoutId !== null) {
    window.clearTimeout(playbackFinishedTimeoutId);
    playbackFinishedTimeoutId = null;
  }

  if (synth) {
    synth.releaseAll();
  }

  setPlaybackButtonState(false);
};

export const playSequence = async (
  sequence: Sequence,
  tempo = TEMPO,
): Promise<void> => {
  await Tone.start();

  stopPlayback();

  const currentSynth = getSynth();
  const secondsPerBeat = 60 / tempo;

  let startBeat = 0;

  for (const event of sequence) {
    const { beats } = getSynthDuration(event.duration);
    const pitches = getEventPitches(event);

    if (pitches.length > 0) {
      const startSeconds = startBeat * secondsPerBeat;
      const eventDurationSeconds = beats * secondsPerBeat;

      const eventId = Tone.Transport.schedule((time) => {
        currentSynth.triggerAttackRelease(pitches, eventDurationSeconds, time);
      }, startSeconds);

      scheduledEventIds.push(eventId);
    }

    startBeat += beats;
  }

  const totalDurationSeconds = startBeat * secondsPerBeat;

  setPlaybackButtonState(true);
  Tone.Transport.start();

  playbackFinishedTimeoutId = window.setTimeout(() => {
    Tone.Transport.stop();
    Tone.Transport.position = 0;

    for (const eventId of scheduledEventIds) {
      Tone.Transport.clear(eventId);
    }

    scheduledEventIds = [];

    if (synth) {
      synth.releaseAll();
    }

    setPlaybackButtonState(false);
    playbackFinishedTimeoutId = null;
  }, totalDurationSeconds * 1000);

  scheduledEventIds.push(playbackFinishedTimeoutId);

  setPlaybackButtonState(true);
  Tone.Transport.start();
};

const wirePlaybackButtons = (): void => {
  const playButton = document.getElementById(PLAY_BUTTON_ID);
  const stopButton = document.getElementById(STOP_BUTTON_ID);

  if (!playButton || !stopButton) {
    throw new Error("Missing playback buttons.");
  }

  playButton.addEventListener("click", () => {
    const score = noteGroups.get("score");

    if (!score) {
      console.warn("No score group found.");
      return;
    }

    void playSequence(score);
  });

  stopButton.addEventListener("click", stopPlayback);
};

wirePlaybackButtons();

# ScoreSketch

ScoreSketch is a TypeScript music notation CLI/DSL for building and transforming short musical sequences.

The project started as a terminal-based music transformation tool and now also includes a browser-based interface that renders note sequences to a staff using VexFlow.

## Current Features

- Terminal REPL for entering ScoreSketch commands
- Browser REPL UI using the same core engine
- Simple DSL for transforming note groups
- Support for:
  - notes
  - rests
  - chords
  - reusable note groups
- Transform commands including:
  - `transpose`
  - `octaveShift`
  - `reverse`
  - `repeat`
  - `rotate`
  - `take`
  - `drop`
  - `slice`
  - `invert`
- Basic VexFlow rendering for the `score` group
- Adapter-based architecture for running the same core logic in multiple environments

## Project Structure

```txt
music-cli/
  packages/
    core/   # Parser, transforms, state, command runner, CLI REPL
    web/    # Browser UI, DOM adapter, VexFlow rendering
```

## Architecture

ScoreSketch separates the core music engine from the environment it runs in.

The core package does not need to know whether it is running in a terminal or in the browser. Instead, runtime-specific behavior is passed in through an adapter object.

Basic data flow:

```txt
user input
  -> parser
  -> command resolution
  -> transformation pipeline
  -> state mutation
  -> subscriptions
  -> terminal output or browser rendering
```

The browser UI subscribes to updates on the special `score` group. When `score` changes, the web package re-renders the sequence using VexFlow.

## Commands

### State Commands

```txt
append <group> <transform...> <source>
set <group> <transform...> <source>
clear <group>
print <group>
```

### Transform Commands

```txt
transpose <semitones>
octaveShift <octaves>
reverse
repeat <times>
rotate <steps>
take <count>
drop <count>
slice <start> <end?>
invert
```

### Navigation Commands

```txt
groups
help
exit
```

## Examples

Print the default motif:

```txt
print motif
```

Set the main score to the motif:

```txt
set score motif
```

Append a reversed version of the motif:

```txt
append score reverse motif
```

Append a transposed version of the first four events:

```txt
append score transpose 2 | take 4 motif
```

Repeat a motif:

```txt
append score repeat 3 motif
```

## Running the Project

Install dependencies from the project root:

```bash
npm install
```

Run the terminal CLI:

```bash
npm run cli
```

Run the browser UI:

```bash
npm run web
```

Build both packages:

```bash
npm run build
```

## Current Limitations

This project is still early-stage.

The current notation renderer assumes simple quarter-note-oriented measure grouping. More complete notation support will require better handling of:

- rhythmic duration math
- measure splitting
- beaming
- rests
- wrapping systems across multiple lines
- layout and spacing
- export options

## Roadmap Ideas

Possible future improvements:

- Better parser structure
- Duration-aware measure splitting
- More complete VexFlow rendering
- MIDI export
- Playback
- Save/load support
- More transformation commands
- A richer browser editor
- Script files instead of only REPL input

## Tech Stack

- TypeScript
- Node.js
- Vite
- VexFlow
- Vitest
- npm workspaces

## Why This Project Exists

ScoreSketch is an experiment in using a small domain-specific language to manipulate musical ideas as data.

The goal is to explore the overlap between music theory, language design, functional transformations, and notation rendering.

# ScoreSketch

ScoreSketch is an experimental TypeScript music DSL for sketching, transforming, rendering, and eventually playing musical ideas as data.

It started as a terminal REPL for manipulating note groups, and now includes a browser interface that renders the `score` group to notation using VexFlow.

## What It Does

ScoreSketch lets you write small commands like this:

```txt
set score motif
append score transpose 2 motif
append score reverse motif
```

The basic idea is:

```txt
command -> source note group -> transform pipeline -> updated note group
```

Musical ideas are represented as sequences of score events. A score event can be a note, a chord, or a rest, and each event has a duration.

Examples of printed events:

```txt
C4:q
[C4,E4,G4]:h
r:e
```

## Current Features

- Terminal REPL
- Browser REPL
- Shared core runner for CLI and web
- Note groups stored in memory
- Notes, chords, rests, and durations
- Transform pipeline syntax using `|`
- Multi-command scripts using `;`
- VexFlow rendering for the `score` group
- Basic browser command history
- Print/export through the browser print dialog
- Experimental sound playback through the web adapter
- Small macro system for shortcut commands

## Commands

### State Commands

```txt
set <group> <transform...> <source>
append <group> <transform...> <source>
clear <group>
print <group>
play <group>
show <group>
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
setDuration <duration>
```

Supported duration symbols:

```txt
w  whole
h  half
q  quarter
e  eighth
s  sixteenth
```

### Navigation Commands

```txt
help
groups
exit
```

`exit` applies to the terminal REPL.

## Examples

Set the main score to the default motif:

```txt
set score motif
```

Append the motif transposed up two semitones:

```txt
append score transpose 2 motif
```

Append a reversed and transposed version of the motif:

```txt
append score reverse | transpose 7 motif
```

Take the first two events of a group:

```txt
set score take 2 motif
```

Change durations:

```txt
set score setDuration e motif
```

Run multiple commands in one line:

```txt
set score motif; append score transpose 12 motif; print score
```

Use a transform by itself to print the transformed result without changing state:

```txt
transpose 7 motif
```

## Macros

ScoreSketch includes a small experimental macro layer.

Current examples include:

```txt
u
d
+
-
up<number>
```

These are shorthand rewrites for common score-editing operations, such as moving the last event up/down or changing its duration.

This system is intentionally simple for now and may change as the language becomes more structured.

## Project Structure

```txt
music-cli/
  package.json

  packages/
    core/
      src/
        cli.ts
        repl.ts
        commands/
        core/
        domain/
        parser/
        runner/

    web/
      src/
        main.ts
        domRepl.ts
        playSound.ts
```

## Architecture

The project is split into two main packages:

### `@music-tool/core`

The core package owns the language/runtime pieces:

- score event types
- note groups
- transforms
- command parsing
- command execution
- CLI REPL
- adapter interfaces

### `@music-tool/web`

The web package provides browser-specific behavior:

- DOM REPL
- VexFlow rendering
- print/export button
- playback adapter
- command history

The core runner receives an adapter, so the same command engine can run in a terminal or in the browser.

## Running Locally

Install dependencies:

```bash
npm install
```

Run the terminal CLI:

```bash
npm run cli
```

Run the browser app:

```bash
npm run web
```

Run tests:

```bash
npm test
```

Build both packages:

```bash
npm run build
```

## Tech Stack

- TypeScript
- Node.js
- npm workspaces
- Vite
- VexFlow
- Tone.js
- Vitest

## Current Limitations

ScoreSketch is still early-stage and exploratory.

Some known limitations:

- State is currently in memory only.
- The parser is useful but still evolving.
- Rendering is currently focused on basic treble-clef notation.
- Measure/layout behavior is still limited.
- Playback is experimental.
- The language does not yet have a full AST.
- There is no save/load format yet.
- Error handling is improving but not final.
- The web package currently reaches into some core source/dist paths directly, which should be cleaned up later.

## Roadmap Ideas

Possible next steps:

- Better parser/AST structure
- Script files
- Save/load support
- MIDI export
- More complete playback
- Better rhythm and measure handling
- Better VexFlow layout
- More score-editing macros
- A richer browser editor
- Export to PDF, MusicXML, or MIDI
- User-defined motifs/macros
- Loops or conditionals for longer-form composition scripts

## Why This Exists

ScoreSketch is a personal exploration of the overlap between music theory, programming languages, functional transformations, notation rendering, and composition tools.

The goal is not just to build a notation app. The goal is to make musical ideas feel programmable.

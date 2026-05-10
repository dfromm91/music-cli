import { printGroups } from "../core/state";
import { Navigation } from "../core/types";

const printHelp: Navigation = () => {
	console.log(`
ScoreSketch REPL

Commands:
  append <group> <transform...> <source>
  set <group> <transform...> <source>
  clear <group>
  print <group>

Transforms:
  transpose <semitones>
  octaveShift <octaves>
  reverse
  repeat <times>
  rotate <steps>
  take <count>
  drop <count>
  slice <start> <end?>
  invert

Examples:
  append score motif
  append score octaveShift 1 motif
  append score octaveShift 1 motif | transpose 2 | reverse
  set motif transpose 7 motif
  print score
  clear score

Other:
  groups
  help
  exit
`);
};

export const navCommands = new Map<string, Navigation>([
	["help", printHelp],
	["groups", printGroups],
]);

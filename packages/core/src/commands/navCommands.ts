import { printGroups } from "../core/state";
import { AppPort, Navigation } from "../core/types";

const printHelp = (ap: AppPort) => {
	ap.write(`
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

export const buildNavCommands = (ap: AppPort): Map<string, Navigation> => {
	return new Map<string, Navigation>([
		[
			"help",
			() => {
				printHelp(ap);
			},
		],
		[
			"groups",
			() => {
				printGroups(ap);
			},
		],
	]);
};
// export const navCommands = new Map<string, Navigation>([
// 	["help", printHelp],
// 	["groups", printGroups],
// ]);

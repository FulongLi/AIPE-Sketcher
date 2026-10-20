// Text shown in the video, taken from the verification runs on 2026-10-20
// (see ../verified/ and ../../verification.md). Only two edits were made:
// throwaway CODEX_HOME / CLAUDE_CONFIG_DIR paths are shown as their default
// locations (~/.codex, ~/.claude), and long plugin-cache paths in the agent's
// commands are shortened to the script name.

export const VERSIONS = {
	sketcher: '0.2.0',
	codex: 'codex-cli 0.163.0-alpha.10.2',
	claude: 'Claude Code 2.1.299',
	date: '20 Oct 2026',
};

export type Line = {
	kind: 'cmd' | 'out' | 'ok' | 'dim' | 'agent' | 'step';
	text: string;
	// Right-hand annotation for 'step' lines (a value read from the JSON output).
	note?: string;
};

export const CODEX_INSTALL: Line[] = [
	{kind: 'cmd', text: 'codex plugin marketplace add FulongLi/AIPE-Sketcher'},
	{kind: 'out', text: 'Added marketplace `aipe-sketcher` from https://github.com/FulongLi/AIPE-Sketcher.git.'},
	{kind: 'cmd', text: 'codex plugin add aipe-sketcher@aipe-sketcher'},
	{kind: 'out', text: 'Added plugin `aipe-sketcher` from marketplace `aipe-sketcher`.'},
	{kind: 'dim', text: 'Installed plugin root: ~/.codex/plugins/cache/aipe-sketcher/aipe-sketcher/0.2.0'},
];

export const CLAUDE_INSTALL: Line[] = [
	{kind: 'cmd', text: 'claude plugin marketplace add FulongLi/AIPE-Sketcher'},
	{kind: 'dim', text: 'Cloning repository (timeout: 120s): https://github.com/FulongLi/AIPE-Sketcher.git'},
	{kind: 'ok', text: '✔ Successfully added marketplace: aipe-sketcher (declared in user settings)'},
	{kind: 'cmd', text: 'claude plugin install aipe-sketcher@aipe-sketcher'},
	{kind: 'ok', text: '✔ Successfully installed plugin: aipe-sketcher@aipe-sketcher (scope: user)'},
	{kind: 'cmd', text: 'claude plugin list'},
	{kind: 'out', text: '  ❯ aipe-sketcher@aipe-sketcher'},
	{kind: 'out', text: '    Version: 0.2.0'},
	{kind: 'out', text: '    Scope: user'},
	{kind: 'ok', text: '    Status: ✔ enabled'},
];

export const PROMPT =
	'Using AIPE Sketcher, generate a Dual Active Bridge converter schematic, validate its electrical connections, and export it as SVG.';

export const CODEX_RUN: Line[] = [
	{kind: 'agent', text: 'I’ll use the AIPE Sketcher schematic skill to generate the Dual Active Bridge, check its connections, and export an SVG.'},
	{kind: 'step', text: 'cat skills/schematic/SKILL.md'},
	{kind: 'step', text: 'cat skills/schematic/references/reference-circuits.md'},
	{kind: 'step', text: 'aipe_sketcher.py examples --list', note: '14 reference circuits'},
	{kind: 'step', text: 'aipe_sketcher.py examples dab --ir-only -o schematics', note: '→ schematics/dab.json'},
	{kind: 'step', text: 'aipe_sketcher.py validate schematics/dab.json --json', note: 'electrical_validation: passed'},
	{kind: 'step', text: 'aipe_sketcher.py render schematics/dab.json -o schematics --json', note: 'drawing_connectivity: passed'},
	{kind: 'agent', text: 'Generated the reference DAB schematic with AIPE Sketcher. Electrical validation, symbol support, and drawing connectivity all passed. Layout is acceptable, scoring 97/100, with two spacing warnings on PRI_B and SEC_A.'},
];

// From schematics/dab.report.json of the Codex run.
export const REPORT = {
	components: 23,
	nets: 16,
	candidates: 12,
	score: 97,
	electrical: 'passed',
	symbols: 'passed',
	connectivity: 'passed',
	layoutAcceptable: true,
	warnings: 2,
	svgSha: 'e3da9cc61263096bbb43a9d5c187023a7100fef3289fb7d8706f909dd7b3c452',
	limitation:
		'Connectivity validation proves the drawing matches the supplied Circuit IR; it does not establish that the circuit is correct, safe or fit for purpose.',
	outputs: ['schematics/dab.svg', 'schematics/dab.json', 'schematics/dab.report.json'],
};

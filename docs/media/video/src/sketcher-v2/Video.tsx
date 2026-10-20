import React from 'react';
import {Series} from 'remotion';
import {Intro, CodexInstall, ClaudeInstall, CODEX_INSTALL_FRAMES, CLAUDE_FRAMES} from './scenes';
import {Describe, Generate, Result, Closing, DESCRIBE_FRAMES, GENERATE_FRAMES, RESULT_FRAMES, CLOSING_FRAMES} from './usage';

export const SCENES_V2 = [
	{id: 'intro', component: Intro, frames: 190},
	{id: 'codex-open-and-install', component: CodexInstall, frames: CODEX_INSTALL_FRAMES},
	{id: 'claude-code-install', component: ClaudeInstall, frames: CLAUDE_FRAMES},
	{id: 'describe', component: Describe, frames: DESCRIBE_FRAMES},
	{id: 'generate', component: Generate, frames: GENERATE_FRAMES},
	{id: 'result', component: Result, frames: RESULT_FRAMES},
	{id: 'closing', component: Closing, frames: CLOSING_FRAMES},
];

export const TOTAL_FRAMES_V2 = SCENES_V2.reduce((n, s) => n + s.frames, 0);

export const QuickStartV2: React.FC = () => (
	<Series>
		{SCENES_V2.map(({id, component: Scene, frames}) => (
			<Series.Sequence key={id} name={id} durationInFrames={frames}>
				<Scene />
			</Series.Sequence>
		))}
	</Series>
);

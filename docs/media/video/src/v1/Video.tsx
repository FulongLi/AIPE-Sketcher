import React from 'react';
import {Series} from 'remotion';
import {Intro, InstallCodex, InstallClaude, Generate, Workflow, Result, Closing, installDuration, generateDuration, workflowDuration, RESULT_DURATION, CLOSING_DURATION} from './scenes';
import {CODEX_INSTALL, CLAUDE_INSTALL} from './verified';

export const SCENES = [
	{id: 'intro', component: Intro, frames: 240},
	{id: 'install-codex', component: InstallCodex, frames: installDuration(CODEX_INSTALL)},
	{id: 'install-claude', component: InstallClaude, frames: installDuration(CLAUDE_INSTALL)},
	{id: 'generate', component: Generate, frames: generateDuration},
	{id: 'workflow', component: Workflow, frames: workflowDuration},
	{id: 'result', component: Result, frames: RESULT_DURATION},
	{id: 'closing', component: Closing, frames: CLOSING_DURATION},
];

export const TOTAL_FRAMES = SCENES.reduce((n, s) => n + s.frames, 0);

export const QuickStart: React.FC = () => (
	<Series>
		{SCENES.map(({id, component: Scene, frames}) => (
			<Series.Sequence key={id} name={id} durationInFrames={frames}>
				<Scene />
			</Series.Sequence>
		))}
	</Series>
);

import React from 'react';
import {Img, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {C, FONT, MONO, SceneShell, StepHeader, Caption, SourceNote, Terminal, Check, fadeIn, rise, scheduleEnd} from './ui';
import {CODEX_INSTALL, CLAUDE_INSTALL, CODEX_RUN, PROMPT, REPORT, VERSIONS, type Line} from './verified';

const SCHEMATIC_RATIO = 187.821 / 50.006; // viewBox of dab.svg

const Schematic: React.FC<{width: number; pad?: number}> = ({width, pad = 36}) => (
	<div style={{background: '#FFFFFF', borderRadius: 18, border: `1.5px solid ${C.line}`, padding: pad, boxShadow: '0 18px 50px rgba(15,23,42,0.08)'}}>
		<Img src={staticFile('dab.svg')} style={{width: width - 2 * pad, height: (width - 2 * pad) / SCHEMATIC_RATIO, display: 'block'}} />
	</div>
);

const RECREATED = `Re-created from verified command output (${VERSIONS.date}) · not a screen recording`;

// ---------------------------------------------------------------- 1 Intro
export const Intro: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<SceneShell>
			<div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center'}}>
				<div style={{fontSize: 128, fontWeight: 700, letterSpacing: -3, opacity: fadeIn(frame, 6, 16), transform: `translateY(${rise(frame, 6, 18, 24)}px)`}}>AIPE Sketcher</div>
				<div style={{fontSize: 44, color: C.muted, marginTop: 10, opacity: fadeIn(frame, 18, 16)}}>AI-powered electrical schematic generation.</div>
			</div>
			<div style={{position: 'absolute', top: 470, left: 210, opacity: fadeIn(frame, 36, 20), transform: `translateY(${rise(frame, 36, 20, 30)}px)`}}>
				<Schematic width={1500} />
				<div style={{textAlign: 'center', marginTop: 22, fontSize: 24, color: C.muted}}>Dual Active Bridge, rendered by AIPE Sketcher {VERSIONS.sketcher}</div>
			</div>
		</SceneShell>
	);
};

// ---------------------------------------------------------------- 2 Install
const INSTALL_START = 16;
export const installDuration = (lines: Line[]) => scheduleEnd(lines, INSTALL_START) + 120;

const Requirement: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<div style={{position: 'absolute', left: 110, top: 146, fontSize: 24, color: C.muted, opacity: fadeIn(frame, 8)}}>
			Needs <span style={{fontFamily: MONO, color: C.ink}}>python3</span> 3.9 or newer on PATH. No API key, cloud service or pip install.
		</div>
	);
};

export const InstallCodex: React.FC = () => {
	const done = scheduleEnd(CODEX_INSTALL, INSTALL_START);
	return (
		<SceneShell>
			<StepHeader step="Install · OpenAI Codex" title="Add the marketplace, then the plugin" color={C.codex} tag={VERSIONS.codex} />
			<Requirement />
			<Terminal lines={CODEX_INSTALL} start={INSTALL_START} title="zsh — codex" accent={C.codex} top={220} minHeight={380} />
			<Caption start={done} text="Restart Codex (or the ChatGPT desktop app) so the skill is loaded." />
			<SourceNote text={RECREATED} />
		</SceneShell>
	);
};

export const InstallClaude: React.FC = () => {
	const done = scheduleEnd(CLAUDE_INSTALL, INSTALL_START);
	return (
		<SceneShell>
			<StepHeader step="Install · Anthropic Claude Code" title="Add the marketplace, then the plugin" color={C.claude} tag={VERSIONS.claude} />
			<Requirement />
			<Terminal lines={CLAUDE_INSTALL} start={INSTALL_START} title="zsh — claude" accent={C.claude} top={220} minHeight={560} fontSize={25} />
			<Caption start={done} text="The plugin is enabled and provides one skill: schematic." />
			<SourceNote text={RECREATED} />
		</SceneShell>
	);
};

// ---------------------------------------------------------------- 3 Generate
const RUN_START = 70;
const RUN_LINES: Line[] = [{kind: 'cmd', text: 'codex exec "Using AIPE Sketcher, generate a Dual Active Bridge converter…"'}, ...CODEX_RUN];
export const generateDuration = scheduleEnd(RUN_LINES, RUN_START, 2.4) + 150;

export const Generate: React.FC = () => {
	const frame = useCurrentFrame();
	const done = scheduleEnd(RUN_LINES, RUN_START, 2.4);
	return (
		<SceneShell>
			<StepHeader step="Use" title="Ask your agent for a schematic" tag="Codex shown · same skill in Claude Code" />
			<div style={{position: 'absolute', left: 110, right: 110, top: 160, display: 'flex', gap: 22, alignItems: 'flex-start', opacity: fadeIn(frame, 10), transform: `translateY(${rise(frame, 10)}px)`}}>
				<div style={{fontSize: 22, fontWeight: 700, color: '#fff', background: C.accent, borderRadius: 10, padding: '8px 14px', marginTop: 6}}>You</div>
				<div style={{fontSize: 35, lineHeight: 1.4, fontWeight: 500, background: '#FFFFFF', border: `1.5px solid ${C.line}`, borderRadius: 16, padding: '18px 28px'}}>“{PROMPT}”</div>
			</div>
			<Terminal lines={RUN_LINES} start={RUN_START} title={`codex exec — ${VERSIONS.codex}`} accent={C.codex} top={330} minHeight={540} fontSize={22} cps={2.4} />
			<Caption start={done} text="The agent loads the AIPE Sketcher skill and runs its bundled engine." />
			<SourceNote text={RECREATED} />
		</SceneShell>
	);
};

// ---------------------------------------------------------------- 4 Workflow
const STAGES = [
	{title: 'Natural language', sub: 'your request'},
	{title: 'Circuit IR', sub: `${REPORT.components} components · ${REPORT.nets} nets`},
	{title: 'Automatic layout', sub: `${REPORT.candidates} candidates · score ${REPORT.score}`},
	{title: 'Electrical validation', sub: 'drawn wires read back'},
	{title: 'SVG', sub: 'dab.svg + report.json'},
];
const STAGE_GAP = 34;
export const workflowDuration = 40 + STAGES.length * STAGE_GAP + 110;

export const Workflow: React.FC = () => {
	const frame = useCurrentFrame();
	const w = 290;
	const gap = (1700 - STAGES.length * w) / (STAGES.length - 1);
	return (
		<SceneShell>
			<StepHeader step="Under the hood" title="From request to validated drawing" />
			<div style={{position: 'absolute', top: 430, left: 110, width: 1700, height: 220}}>
				{STAGES.map((s, i) => {
					const t = 40 + i * STAGE_GAP;
					const lit = interpolate(frame, [t, t + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
					const x = i * (w + gap);
					return (
						<React.Fragment key={s.title}>
							{i > 0 ? (
								<div style={{position: 'absolute', left: x - gap + 12, top: 98, width: (gap - 24) * interpolate(frame, [t - 12, t], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), height: 4, background: C.accent, borderRadius: 2}} />
							) : null}
							<div
								style={{
									position: 'absolute',
									left: x,
									top: 0,
									width: w,
									height: 200,
									borderRadius: 18,
									background: '#FFFFFF',
									border: `2.5px solid ${lit > 0.5 ? C.accent : C.line}`,
									opacity: 0.25 + 0.75 * lit,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									textAlign: 'center',
									padding: '26px 16px 0',
									boxShadow: lit > 0.5 ? '0 16px 40px rgba(36,89,214,0.12)' : 'none',
								}}
							>
								<div style={{fontSize: 20, fontWeight: 600, color: C.accent}}>{i + 1}</div>
								<div style={{height: 84, display: 'flex', alignItems: 'center', fontSize: 31, fontWeight: 700, lineHeight: 1.15}}>{s.title}</div>
								<div style={{fontSize: i === 4 ? 19 : 21, color: C.muted, marginTop: 6, lineHeight: 1.3, fontFamily: i === 4 ? MONO : FONT}}>{s.sub}</div>
							</div>
						</React.Fragment>
					);
				})}
			</div>
			<Caption start={40 + STAGES.length * STAGE_GAP} text="No SVG is written unless the drawn wires match the Circuit IR." />
		</SceneShell>
	);
};

// ---------------------------------------------------------------- 5 Result
export const RESULT_DURATION = 540;

export const Result: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<SceneShell>
			<StepHeader step="Result" title="Validated Dual Active Bridge schematic" tag={`AIPE Sketcher ${VERSIONS.sketcher}`} />
			<div style={{position: 'absolute', top: 160, left: 110, opacity: fadeIn(frame, 8, 16), transform: `translateY(${rise(frame, 8, 16, 20)}px)`}}>
				<Schematic width={1700} pad={30} />
			</div>
			<div style={{position: 'absolute', top: 690, left: 110, width: 820}}>
				<div style={{fontSize: 22, fontWeight: 600, color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6, opacity: fadeIn(frame, 40)}}>Report · dab.report.json</div>
				<Check label="Electrical validation" value={REPORT.electrical} delay={50} />
				<Check label="Symbol support" value={REPORT.symbols} delay={62} />
				<Check label="Drawing connectivity" value={REPORT.connectivity} delay={74} />
				<Check label="Layout acceptable" value={`score ${REPORT.score}/100`} delay={86} />
			</div>
			<div style={{position: 'absolute', top: 690, left: 1010, width: 800, opacity: fadeIn(frame, 110), transform: `translateY(${rise(frame, 110)}px)`}}>
				<div style={{fontSize: 22, fontWeight: 600, color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14}}>Output location</div>
				<div style={{background: C.termBg, borderRadius: 14, padding: '18px 26px', fontFamily: MONO, fontSize: 25, lineHeight: 1.6, color: C.termInk}}>
					{REPORT.outputs.map((o, i) => (
						<div key={o} style={{display: 'flex'}}>
							<span style={{width: 500}}>
								<span style={{color: C.termDim}}>./</span>
								{o}
							</span>
							<span style={{color: C.termDim}}>{['schematic', 'Circuit IR', 'report'][i]}</span>
						</div>
					))}
				</div>
				<div style={{fontSize: 21, color: C.muted, marginTop: 18, lineHeight: 1.45}}>
					{REPORT.warnings} spacing warnings (nets PRI_B, SEC_A). The check proves the drawing matches the circuit; it does not establish ratings, safety or performance.
				</div>
			</div>
			<SourceNote text={`Actual output of the recorded Codex run · SVG sha256 ${REPORT.svgSha.slice(0, 12)}…`} />
		</SceneShell>
	);
};

// ---------------------------------------------------------------- 6 Closing
export const CLOSING_DURATION = 240;

export const Closing: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<SceneShell>
			<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
				<div style={{fontSize: 120, fontWeight: 700, letterSpacing: -3, opacity: fadeIn(frame, 4, 16), transform: `translateY(${rise(frame, 4, 18, 20)}px)`}}>AIPE Sketcher</div>
				<div style={{fontSize: 44, color: C.muted, marginTop: 8, opacity: fadeIn(frame, 18, 16)}}>From circuit description to validated schematic.</div>
				<div style={{width: 120, height: 4, background: C.accent, borderRadius: 2, margin: '56px 0 44px', opacity: fadeIn(frame, 30)}} />
				<div style={{fontSize: 38, fontWeight: 600, opacity: fadeIn(frame, 36)}}>AIPE Labs</div>
				<div style={{fontFamily: MONO, fontSize: 36, color: C.accent, marginTop: 16, opacity: fadeIn(frame, 44)}}>github.com/FulongLi/AIPE-Sketcher</div>
			</div>
		</SceneShell>
	);
};

// ---------------------------------------------------------------- Thumbnail (1280x720 still)
export const Thumbnail: React.FC = () => (
	<div style={{position: 'absolute', inset: 0, background: C.bg, fontFamily: FONT, color: C.ink}}>
		<div style={{position: 'absolute', top: 64, left: 0, right: 0, textAlign: 'center'}}>
			<div style={{fontSize: 30, fontWeight: 600, color: C.accent, letterSpacing: 2, textTransform: 'uppercase'}}>Quick Start</div>
			<div style={{fontSize: 84, fontWeight: 700, letterSpacing: -2, marginTop: 6}}>AIPE Sketcher</div>
			<div style={{fontSize: 34, color: C.muted, marginTop: 6}}>Install &amp; generate your first schematic</div>
		</div>
		<div style={{position: 'absolute', top: 288, left: 150}}>
			<Schematic width={980} pad={24} />
		</div>
		<div style={{position: 'absolute', bottom: 46, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18}}>
			{[
				['OpenAI Codex', C.codex],
				['Anthropic Claude Code', C.claude],
			].map(([t, c]) => (
				<div key={t} style={{fontSize: 26, fontWeight: 600, color: c, border: `2px solid ${c}`, borderRadius: 999, padding: '8px 24px', background: '#fff'}}>{t}</div>
			))}
		</div>
	</div>
);

import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import type {Line} from './verified';

const inter = loadInter('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']});
const mono = loadMono('normal', {weights: ['400', '600'], subsets: ['latin']});

export const C = {
	bg: '#F6F7F9',
	ink: '#0F172A',
	muted: '#5B6476',
	line: '#DDE1E8',
	accent: '#2459D6',
	codex: '#10A37F',
	claude: '#D97757',
	pass: '#15803D',
	termBg: '#0D1117',
	termInk: '#E6EDF3',
	termDim: '#8B949E',
	termPrompt: '#7EE787',
	termOk: '#56D364',
	termNote: '#79C0FF',
};

export const FONT = inter.fontFamily;
export const MONO = mono.fontFamily;

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);

export const fadeIn = (frame: number, start: number, dur = 12) =>
	interpolate(frame, [start, start + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

export const rise = (frame: number, start: number, dur = 14, px = 16) =>
	interpolate(frame, [start, start + dur], [px, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

// Fades the whole scene in and out so cuts are soft but quick.
export const SceneShell: React.FC<{children: React.ReactNode}> = ({children}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const opacity = Math.min(fadeIn(frame, 0, 10), interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	return (
		<div style={{position: 'absolute', inset: 0, background: C.bg, fontFamily: FONT, color: C.ink, opacity}}>
			{children}
		</div>
	);
};

export const StepHeader: React.FC<{step: string; title: string; color?: string; tag?: string}> = ({step, title, color = C.accent, tag}) => {
	const frame = useCurrentFrame();
	return (
		<div style={{position: 'absolute', left: 110, top: 72, right: 110, display: 'flex', alignItems: 'center', gap: 22, opacity: fadeIn(frame, 2), transform: `translateY(${rise(frame, 2)}px)`}}>
			<div style={{fontSize: 24, fontWeight: 600, color, letterSpacing: 1.5, textTransform: 'uppercase'}}>{step}</div>
			<div style={{width: 2, height: 34, background: C.line}} />
			<div style={{fontSize: 46, fontWeight: 700, letterSpacing: -0.5}}>{title}</div>
			<div style={{flex: 1}} />
			{tag ? <div style={{fontFamily: MONO, fontSize: 20, color: C.muted, border: `1.5px solid ${C.line}`, borderRadius: 8, padding: '6px 14px'}}>{tag}</div> : null}
		</div>
	);
};

export const Caption: React.FC<{text: string; start?: number}> = ({text, start = 0}) => {
	const frame = useCurrentFrame();
	return (
		<div style={{position: 'absolute', left: 0, right: 0, bottom: 64, display: 'flex', justifyContent: 'center', opacity: fadeIn(frame, start)}}>
			<div style={{fontSize: 32, fontWeight: 500, color: C.ink, background: '#FFFFFF', border: `1.5px solid ${C.line}`, borderRadius: 14, padding: '14px 30px', maxWidth: 1600, textAlign: 'center'}}>{text}</div>
		</div>
	);
};

// Small honest label: these terminals are re-created from logs, not screen captures.
export const SourceNote: React.FC<{text: string}> = ({text}) => (
	<div style={{position: 'absolute', right: 110, bottom: 22, fontSize: 18, color: C.muted, fontFamily: FONT}}>{text}</div>
);

type Scheduled = Line & {at: number; typed: number};

// Commands are typed at `cps` characters per frame; other lines appear in turn.
export const schedule = (lines: Line[], start: number, cps = 1.6, gap = 7): Scheduled[] => {
	let t = start;
	return lines.map((l) => {
		const at = t;
		const typed = l.kind === 'cmd' ? Math.ceil(l.text.length / cps) : 0;
		t += typed + (l.kind === 'cmd' ? 12 : l.kind === 'agent' ? 18 : gap);
		return {...l, at, typed};
	});
};

export const scheduleEnd = (lines: Line[], start: number, cps = 1.6, gap = 7) => {
	const s = schedule(lines, start, cps, gap);
	const last = s[s.length - 1];
	return last.at + last.typed + 12;
};

export const Terminal: React.FC<{
	lines: Line[];
	start: number;
	title: string;
	accent: string;
	fontSize?: number;
	width?: number;
	top?: number;
	minHeight?: number;
	cps?: number;
}> = ({lines, start, title, accent, fontSize = 26, width = 1700, top = 190, minHeight = 560, cps = 1.6}) => {
	const frame = useCurrentFrame();
	const items = schedule(lines, start, cps);
	const cursorOn = Math.floor(frame / 15) % 2 === 0;
	const activeIdx = items.findIndex((l) => l.kind === 'cmd' && frame >= l.at && frame < l.at + l.typed);
	return (
		<div
			style={{
				position: 'absolute',
				top,
				left: (1920 - width) / 2,
				width,
				minHeight,
				background: C.termBg,
				borderRadius: 16,
				boxShadow: '0 24px 60px rgba(15,23,42,0.18)',
				overflow: 'hidden',
				opacity: fadeIn(frame, 4),
				transform: `translateY(${rise(frame, 4, 16, 24)}px)`,
			}}
		>
			<div style={{height: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px', background: '#161B22', borderBottom: `3px solid ${accent}`}}>
				{['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
					<div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />
				))}
				<div style={{marginLeft: 16, fontFamily: MONO, fontSize: 19, color: C.termDim}}>{title}</div>
			</div>
			<div style={{padding: '26px 34px', fontFamily: MONO, fontSize, lineHeight: 1.55, color: C.termInk}}>
				{items.map((l, i) => {
					if (frame < l.at) return null;
					if (l.kind === 'cmd') {
						const n = Math.min(l.text.length, Math.floor((frame - l.at) * cps));
						return (
							<div key={i} style={{whiteSpace: 'pre', marginTop: i === 0 ? 0 : 10}}>
								<span style={{color: C.termPrompt}}>$ </span>
								{l.text.slice(0, n)}
								{i === activeIdx && cursorOn ? <span style={{background: C.termInk}}>&nbsp;</span> : null}
							</div>
						);
					}
					const o = fadeIn(frame, l.at, 6);
					if (l.kind === 'agent') {
						return (
							<div key={i} style={{opacity: o, display: 'flex', gap: 18, margin: '10px 0', fontFamily: FONT, fontSize: fontSize + 2, lineHeight: 1.45}}>
								<span style={{color: accent, fontWeight: 700, fontFamily: MONO}}>codex</span>
								<span style={{whiteSpace: 'pre-wrap'}}>{l.text}</span>
							</div>
						);
					}
					if (l.kind === 'step') {
						return (
							<div key={i} style={{opacity: o, display: 'flex', whiteSpace: 'pre'}}>
								<span style={{color: C.termDim}}>  ▸ </span>
								<span>{l.text}</span>
								<span style={{flex: 1}} />
								{l.note ? <span style={{color: l.note.includes('passed') ? C.termOk : C.termNote}}>{l.note}</span> : null}
							</div>
						);
					}
					const color = l.kind === 'ok' ? C.termOk : l.kind === 'dim' ? C.termDim : C.termInk;
					return (
						<div key={i} style={{opacity: o, whiteSpace: 'pre', color}}>
							{l.text}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export const Check: React.FC<{label: string; value: string; ok?: boolean; delay: number}> = ({label, value, ok = true, delay}) => {
	const frame = useCurrentFrame();
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: `1.5px solid ${C.line}`, opacity: fadeIn(frame, delay), transform: `translateX(${rise(frame, delay, 12, -14)}px)`}}>
			<div style={{width: 30, height: 30, borderRadius: 15, background: ok ? C.pass : C.muted, color: '#fff', fontSize: 19, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✓</div>
			<div style={{fontSize: 27, fontWeight: 500, flex: 1}}>{label}</div>
			<div style={{fontFamily: MONO, fontSize: 24, color: ok ? C.pass : C.muted, fontWeight: 600}}>{value}</div>
		</div>
	);
};

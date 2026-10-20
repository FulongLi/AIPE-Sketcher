// AIPE tutorial template: brand-level building blocks shared by all AIPE tool
// videos. Tool-specific content lives in its own folder (e.g. ../sketcher-v2).
import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {AIPE} from './tokens';

const ease = Easing.bezier(0.22, 1, 0.36, 1);

export const fade = (frame: number, start: number, dur = 14) =>
	interpolate(frame, [start, start + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

export const slide = (frame: number, start: number, dur = 18, px = 18) =>
	interpolate(frame, [start, start + dur], [px, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

export const tween = (frame: number, range: [number, number], out: [number, number]) =>
	interpolate(frame, range, out, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

// Page background: the website's cream with its warm top glow.
export const Stage: React.FC<{children: React.ReactNode; glow?: boolean; alt?: boolean}> = ({children, glow = true, alt = false}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const opacity = Math.min(fade(frame, 0, 12), interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	return (
		<div style={{position: 'absolute', inset: 0, background: alt ? AIPE.bgAlt : AIPE.bg, fontFamily: AIPE.font, color: AIPE.fg}}>
			{glow ? <div style={{position: 'absolute', inset: 0, background: AIPE.heroGlow}} /> : null}
			<div style={{position: 'absolute', inset: 0, opacity}}>{children}</div>
		</div>
	);
};

export const Logo: React.FC<{height?: number; style?: React.CSSProperties}> = ({height = 44, style}) => (
	<Img src={staticFile('brand/AIPE_logo_black.svg')} style={{height, width: (height * 337) / 120, display: 'block', ...style}} />
);

// "AIPE · AI FOR POWER ENGINEERING" style label.
export const Eyebrow: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div style={{fontSize: 22, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: AIPE.muted, ...style}}>{children}</div>
);

export const Display: React.FC<{children: React.ReactNode; size?: number; style?: React.CSSProperties}> = ({children, size = 120, style}) => (
	<div style={{fontFamily: AIPE.display, fontWeight: 800, fontSize: size, lineHeight: 0.98, letterSpacing: AIPE.displayTracking, color: AIPE.fg, ...style}}>{children}</div>
);

export const Pill: React.FC<{children: React.ReactNode; primary?: boolean; style?: React.CSSProperties}> = ({children, primary = true, style}) => (
	<div
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 10,
			borderRadius: AIPE.pill,
			padding: '16px 34px',
			fontWeight: 600,
			fontSize: 26,
			background: primary ? AIPE.black : AIPE.bgAlt,
			color: primary ? '#fff' : AIPE.fg,
			border: `1.5px solid ${primary ? AIPE.black : AIPE.border}`,
			...style,
		}}
	>
		{children}
	</div>
);

// Step marker shown at the top-left of each tutorial step.
export const StepChip: React.FC<{n: number; title: string; start?: number}> = ({n, title, start = 4}) => {
	const frame = useCurrentFrame();
	return (
		<div style={{position: 'absolute', left: 96, top: 64, display: 'flex', alignItems: 'center', gap: 18, opacity: fade(frame, start), transform: `translateY(${slide(frame, start)}px)`}}>
			<div style={{width: 52, height: 52, borderRadius: 26, background: AIPE.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: AIPE.display, fontWeight: 800, fontSize: 28, color: AIPE.fg}}>{n}</div>
			<div style={{display: 'flex', flexDirection: 'column'}}>
				<div style={{fontSize: 17, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: AIPE.muted}}>Step {n}</div>
				<div style={{fontFamily: AIPE.display, fontWeight: 800, fontSize: 40, letterSpacing: '-0.03em', lineHeight: 1.05}}>{title}</div>
			</div>
		</div>
	);
};

// Small top-right brand mark during tutorial steps.
export const CornerLogo: React.FC = () => (
	<div style={{position: 'absolute', right: 96, top: 78}}>
		<Logo height={36} />
	</div>
);

// Bottom caption: the narration of the tutorial (no voice-over).
export const Caption: React.FC<{children: React.ReactNode; from: number; to?: number}> = ({children, from, to}) => {
	const frame = useCurrentFrame();
	if (frame < from || (to !== undefined && frame >= to)) return null;
	const o = Math.min(fade(frame, from, 10), to === undefined ? 1 : interpolate(frame, [to - 8, to], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	return (
		<div style={{position: 'absolute', left: 0, right: 0, bottom: 56, display: 'flex', justifyContent: 'center', opacity: o, transform: `translateY(${slide(frame, from, 12, 10)}px)`}}>
			<div style={{fontSize: 34, fontWeight: 500, color: '#fff', background: AIPE.black, borderRadius: AIPE.pill, padding: '16px 36px', maxWidth: 1500, textAlign: 'center', letterSpacing: '-0.01em'}}>{children}</div>
		</div>
	);
};

// Honest marker for any recreated (non-recorded) application screen.
export const ReconstructedNote: React.FC<{children: React.ReactNode}> = ({children}) => (
	<div style={{position: 'absolute', right: 96, bottom: 22, fontSize: 18, color: AIPE.muted, display: 'flex', alignItems: 'center', gap: 8}}>
		<span style={{width: 8, height: 8, borderRadius: 4, background: AIPE.accent, display: 'inline-block'}} />
		{children}
	</div>
);

export const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div style={{background: AIPE.white, border: `1.5px solid ${AIPE.border}`, borderRadius: AIPE.radius, boxShadow: AIPE.shadowLg, ...style}}>{children}</div>
);

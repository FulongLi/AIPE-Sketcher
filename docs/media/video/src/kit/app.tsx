// Building blocks for *reconstructed* desktop-app screens (window, cursor,
// typing, toasts, camera). Neutral greys keep the app visually separate from
// the AIPE brand frame around it. Only labels read from the real apps belong
// inside these screens; see ../sketcher-v2/content.ts for the sources.
import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {AIPE} from '../brand/tokens';
import {fade, tween} from '../brand/components';

export const APP = {
	bg: '#ffffff',
	side: '#f7f7f8',
	line: '#e7e7ea',
	ink: '#1d1d1f',
	dim: '#6e6e73',
	faint: '#a1a1a6',
	field: '#f4f4f5',
	focus: '#0a84ff',
	font: "-apple-system, 'SF Pro Text', 'Inter', 'Helvetica Neue', sans-serif",
};

export const AppWindow: React.FC<{
	title: string;
	icon: string;
	children: React.ReactNode;
	width?: number;
	height?: number;
	sidebar?: React.ReactNode;
	sidebarWidth?: number;
}> = ({title, icon, children, width = 1600, height = 860, sidebar, sidebarWidth = 300}) => (
	<div style={{width, height, background: APP.bg, borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 80px rgba(36,28,16,.18), 0 0 0 1px rgba(36,28,16,.10)', fontFamily: APP.font, color: APP.ink, display: 'flex', flexDirection: 'column'}}>
		<div style={{height: 52, flex: 'none', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${APP.line}`, background: APP.side, position: 'relative'}}>
			{['#ff5f57', '#febc2e', '#28c840'].map((c) => (
				<div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c, marginRight: 9}} />
			))}
			<div style={{position: 'absolute', left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, fontSize: 19, fontWeight: 600, color: APP.dim}}>
				<Img src={staticFile(icon)} style={{width: 24, height: 24, borderRadius: 6}} />
				{title}
			</div>
		</div>
		<div style={{flex: 1, display: 'flex', minHeight: 0}}>
			{sidebar ? <div style={{width: sidebarWidth, flex: 'none', background: APP.side, borderRight: `1px solid ${APP.line}`, padding: '22px 16px'}}>{sidebar}</div> : null}
			<div style={{flex: 1, position: 'relative', minWidth: 0}}>{children}</div>
		</div>
	</div>
);

export const SideItem: React.FC<{label: string; icon: string; active?: boolean; hot?: boolean}> = ({label, icon, active, hot}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 10, fontSize: 22, fontWeight: active ? 600 : 500, background: active ? '#e9e9ec' : hot ? '#efeff1' : 'transparent', color: APP.ink, marginBottom: 4}}>
		<span style={{width: 24, textAlign: 'center', color: APP.dim}}>{icon}</span>
		{label}
	</div>
);

export type CursorKey = {f: number; x: number; y: number; click?: boolean};

// Pointer that glides between keyframes (window coordinates) and pulses on clicks.
export const Cursor: React.FC<{keys: CursorKey[]}> = ({keys}) => {
	const frame = useCurrentFrame();
	if (frame < keys[0].f) return null;
	let x = keys[keys.length - 1].x;
	let y = keys[keys.length - 1].y;
	for (let i = 0; i < keys.length - 1; i++) {
		const a = keys[i];
		const b = keys[i + 1];
		if (frame >= a.f && frame <= b.f) {
			const moveStart = Math.max(a.f, b.f - 22);
			x = tween(frame, [moveStart, b.f], [a.x, b.x]);
			y = tween(frame, [moveStart, b.f], [a.y, b.y]);
		}
	}
	const click = keys.find((k) => k.click && frame >= k.f && frame < k.f + 14);
	const r = click ? interpolate(frame - click.f, [0, 14], [8, 34]) : 0;
	const ro = click ? interpolate(frame - click.f, [0, 14], [0.45, 0]) : 0;
	const press = click ? interpolate(frame - click.f, [0, 4, 9], [1, 0.86, 1], {extrapolateRight: 'clamp'}) : 1;
	return (
		<div style={{position: 'absolute', left: x, top: y, pointerEvents: 'none', zIndex: 50, opacity: fade(frame, keys[0].f, 8)}}>
			{click ? <div style={{position: 'absolute', left: -r, top: -r, width: r * 2, height: r * 2, borderRadius: r, background: AIPE.accent, opacity: ro}} /> : null}
			<svg width="34" height="40" viewBox="0 0 17 20" style={{transform: `scale(${press})`, transformOrigin: '0 0', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.25))'}}>
				<path d="M1 1 L1 16 L5 12.4 L7.6 18.4 L10.2 17.3 L7.7 11.4 L13 11.4 Z" fill="#111" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
			</svg>
		</div>
	);
};

// Text typed at a calm, readable pace (characters per frame).
export const typed = (frame: number, start: number, text: string, cps = 0.9) => text.slice(0, Math.max(0, Math.min(text.length, Math.floor((frame - start) * cps))));
export const typedDone = (start: number, text: string, cps = 0.9) => start + Math.ceil(text.length / cps);

export const Caret: React.FC = () => {
	const frame = useCurrentFrame();
	return <span style={{display: 'inline-block', width: 2, height: '1.05em', background: APP.focus, marginLeft: 2, verticalAlign: 'text-bottom', opacity: Math.floor(frame / 15) % 2 ? 0 : 1}} />;
};

export const Toast: React.FC<{from: number; to?: number; children: React.ReactNode; action?: string}> = ({from, to, children, action}) => {
	const frame = useCurrentFrame();
	if (frame < from || (to !== undefined && frame >= to)) return null;
	const o = Math.min(fade(frame, from, 10), to === undefined ? 1 : interpolate(frame, [to - 8, to], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	return (
		<div style={{position: 'absolute', left: '50%', bottom: 36, transform: `translate(-50%, ${tween(frame, [from, from + 12], [16, 0])}px)`, opacity: o, zIndex: 40}}>
			<div style={{display: 'flex', alignItems: 'center', gap: 18, background: '#1d1d1f', color: '#fff', borderRadius: 14, padding: '16px 24px', fontSize: 22, fontWeight: 500, boxShadow: '0 12px 30px rgba(0,0,0,.25)', whiteSpace: 'nowrap'}}>
				<span style={{width: 26, height: 26, borderRadius: 13, background: '#30d158', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700}}>✓</span>
				{children}
				{action ? <span style={{marginLeft: 10, fontWeight: 600, color: '#9fd0ff'}}>{action}</span> : null}
			</div>
		</div>
	);
};

export const Modal: React.FC<{from: number; to?: number; width: number; children: React.ReactNode}> = ({from, to, width, children}) => {
	const frame = useCurrentFrame();
	if (frame < from || (to !== undefined && frame >= to)) return null;
	const o = Math.min(fade(frame, from, 10), to === undefined ? 1 : interpolate(frame, [to - 8, to], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	return (
		<div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.18 * o})`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30}}>
			<div style={{width, background: '#fff', borderRadius: 18, boxShadow: '0 24px 70px rgba(0,0,0,.25)', opacity: o, transform: `scale(${tween(frame, [from, from + 12], [0.96, 1])})`, padding: 34}}>{children}</div>
		</div>
	);
};

export const Button: React.FC<{children: React.ReactNode; primary?: boolean; hot?: boolean; style?: React.CSSProperties}> = ({children, primary, hot, style}) => (
	<div style={{display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 10, fontSize: 21, fontWeight: 600, background: primary ? (hot ? '#3a3a3c' : '#1d1d1f') : hot ? '#ececee' : '#fff', color: primary ? '#fff' : APP.ink, border: primary ? 'none' : `1px solid ${APP.line}`, ...style}}>{children}</div>
);

export const Field: React.FC<{label: string; value?: string; placeholder: string; focused?: boolean; caret?: boolean}> = ({label, value, placeholder, focused, caret}) => (
	<div style={{marginBottom: 20}}>
		<div style={{fontSize: 19, fontWeight: 600, marginBottom: 8}}>{label}</div>
		<div style={{fontSize: 22, padding: '14px 16px', borderRadius: 10, background: APP.field, border: `2px solid ${focused ? APP.focus : 'transparent'}`, color: value ? APP.ink : APP.faint, minHeight: 30}}>
			{value || (caret ? '' : placeholder)}
			{caret ? <Caret /> : null}
		</div>
	</div>
);

// Grey placeholder card: stands in for other plugins without inventing them.
export const SkeletonCard: React.FC = () => (
	<div style={{border: `1px solid ${APP.line}`, borderRadius: 14, padding: 20, display: 'flex', gap: 16, alignItems: 'center'}}>
		<div style={{width: 52, height: 52, borderRadius: 12, background: '#ededf0'}} />
		<div style={{flex: 1}}>
			<div style={{height: 16, width: '55%', borderRadius: 8, background: '#ededf0', marginBottom: 12}} />
			<div style={{height: 13, width: '80%', borderRadius: 7, background: '#f2f2f4'}} />
		</div>
	</div>
);

// Zooms the "camera" onto part of a screen: keys are {f, scale, x, y} with x/y
// the focus point in screen coordinates.
export const Camera: React.FC<{keys: {f: number; s: number; x: number; y: number}[]; children: React.ReactNode}> = ({keys, children}) => {
	const frame = useCurrentFrame();
	let k = keys[0];
	let s = k.s, x = k.x, y = k.y;
	for (let i = 0; i < keys.length - 1; i++) {
		const a = keys[i];
		const b = keys[i + 1];
		if (frame >= a.f && frame <= b.f) {
			const st = Math.max(a.f, b.f - 24);
			s = tween(frame, [st, b.f], [a.s, b.s]);
			x = tween(frame, [st, b.f], [a.x, b.x]);
			y = tween(frame, [st, b.f], [a.y, b.y]);
		}
		if (frame > b.f) {
			s = b.s; x = b.x; y = b.y;
		}
	}
	return (
		<div style={{position: 'absolute', inset: 0, transformOrigin: `${x}px ${y}px`, transform: `scale(${s})`}}>{children}</div>
	);
};

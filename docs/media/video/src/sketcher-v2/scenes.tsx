import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {AIPE} from '../brand/tokens';
import {Stage, Logo, Eyebrow, Display, Pill, StepChip, CornerLogo, Caption, ReconstructedNote, Card, fade, slide, tween} from '../brand/components';
import {APP, AppWindow, SideItem, Cursor, typed, typedDone, Caret, Toast, Modal, Button, Field, SkeletonCard, Camera} from '../kit/app';
import {CODEX, CLAUDE, PLUGIN, PROMPT, REPLY_START, REPLY_FINAL, REPORT, SOURCES_NOTE} from './content';

// Window placement on the 1920x1080 frame; cursor keys use frame coordinates.
const WIN = {x: 160, y: 176, w: 1600, h: 760};
const MAIN = {x: WIN.x + 300, y: WIN.y + 52, w: WIN.w - 300, h: WIN.h - 52};
const SVG_RATIO = 187.821 / 50.006;

const Schematic: React.FC<{width: number; pad?: number; reveal?: number}> = ({width, pad = 28, reveal = 1}) => (
	<div style={{background: AIPE.white, borderRadius: AIPE.radius, border: `1.5px solid ${AIPE.border}`, padding: pad, boxShadow: AIPE.shadowLg}}>
		<div style={{clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`}}>
			<Img src={staticFile('dab.svg')} style={{width: width - 2 * pad, height: (width - 2 * pad) / SVG_RATIO, display: 'block'}} />
		</div>
	</div>
);

const PluginIcon: React.FC<{size?: number}> = ({size = 52}) => (
	<div style={{width: size, height: size, borderRadius: size * 0.24, background: AIPE.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
		<svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke={AIPE.fg} strokeWidth="1.8" strokeLinecap="round">
			<path d="M2 12h4l2-5 3 10 3-10 2 5h6" />
		</svg>
	</div>
);

const CodexSidebar: React.FC<{active?: 'plugins' | 'chat' | null; hotPlugins?: boolean}> = ({active, hotPlugins}) => (
	<>
		<SideItem label={CODEX.newChat} icon="✎" active={active === 'chat'} />
		<SideItem label={CODEX.plugins} icon="⌘" active={active === 'plugins'} hot={hotPlugins} />
		<SideItem label={CODEX.skills} icon="◇" />
	</>
);

const Composer: React.FC<{text?: string; caret?: boolean; working?: boolean; left?: number; right?: number}> = ({text, caret, working, left = 150, right = 150}) => (
	<div style={{position: 'absolute', left, right, bottom: 34, minHeight: 104, borderRadius: 22, border: `1px solid ${APP.line}`, boxShadow: '0 6px 24px rgba(0,0,0,.06)', background: '#fff', padding: '20px 24px', fontSize: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20}}>
		<div style={{color: text ? APP.ink : APP.faint, lineHeight: 1.4}}>
			{working ? CODEX.working : text || (caret ? '' : CODEX.composerPlaceholder)}
			{caret ? <Caret /> : null}
		</div>
		<div style={{width: 46, height: 46, borderRadius: 23, background: text ? '#1d1d1f' : '#d9d9de', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flex: 'none', alignSelf: 'flex-end'}}>↑</div>
	</div>
);

// ------------------------------------------------------------------ Intro
export const Intro: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<Stage>
			<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 150}}>
				<div style={{opacity: fade(f, 4), transform: `translateY(${slide(f, 4)}px)`}}>
					<Logo height={64} />
				</div>
				<Eyebrow style={{marginTop: 46, opacity: fade(f, 14)}}>AIPE Labs · Quick start</Eyebrow>
				<Display size={150} style={{marginTop: 18, opacity: fade(f, 20), transform: `translateY(${slide(f, 20, 20, 26)}px)`}}>AIPE Sketcher</Display>
				<div style={{fontSize: 40, color: AIPE.fgDim, marginTop: 26, opacity: fade(f, 34)}}>Electrical schematics, powered by AI.</div>
				<div style={{marginTop: 64, opacity: fade(f, 52, 20), transform: `translateY(${slide(f, 52, 22, 30)}px)`}}>
					<Schematic width={1180} pad={26} />
				</div>
			</div>
		</Stage>
	);
};

// ------------------------------------------------------------------ Codex: open + install
const T = {
	step2: 150,
	clickPlugins: 190,
	clickArrow: 250,
	clickMenu: 290,
	typeStart: 330,
	clickAdd: 410,
	added: 420,
	clickCard: 520,
	clickInstall: 640,
	installed: 676,
	end: 900,
};
export const CODEX_INSTALL_FRAMES = T.end;

const CodexPluginsPage: React.FC = () => {
	const f = useCurrentFrame();
	const added = f >= T.added + 6;
	const installed = f >= T.installed;
	const menuOpen = f >= T.clickArrow && f < T.clickMenu + 6;
	const recTop = added ? tween(f, [T.added + 6, T.added + 26], [140, 330]) : 140;
	return (
		<div style={{position: 'absolute', inset: 0, padding: '36px 44px'}}>
			<div style={{fontSize: 40, fontWeight: 700}}>{CODEX.pluginsTitle}</div>
			<div style={{fontSize: 21, color: APP.dim, marginTop: 6}}>{CODEX.pluginsSubtitle}</div>
			<div style={{position: 'absolute', right: 44, top: 40, display: 'flex', gap: 16}}>
				<div style={{width: 300, height: 52, borderRadius: 12, background: APP.field, display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 20, color: APP.faint, boxSizing: 'border-box'}}>⌕&nbsp;&nbsp;{CODEX.searchPlugins}</div>
				<div style={{display: 'flex', height: 52, borderRadius: 12, overflow: 'hidden', border: `1px solid ${APP.line}`}}>
					<div style={{width: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600}}>{CODEX.createPlugin}</div>
					<div style={{width: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${APP.line}`, background: menuOpen ? '#ececee' : '#fff', fontSize: 18}}>▾</div>
				</div>
			</div>
			{menuOpen ? (
				<div style={{position: 'absolute', right: 44, top: 100, width: 300, background: '#fff', borderRadius: 14, boxShadow: '0 14px 40px rgba(0,0,0,.16)', border: `1px solid ${APP.line}`, padding: 8, zIndex: 20, opacity: fade(f, T.clickArrow, 6)}}>
					<div style={{padding: '14px 16px', borderRadius: 10, fontSize: 21, fontWeight: 500, background: f >= T.clickMenu - 18 ? '#efeff1' : 'transparent'}}>{CODEX.addMarketplaceMenu}</div>
				</div>
			) : null}
			{added ? (
				<div style={{position: 'absolute', left: 44, right: 44, top: 140, opacity: fade(f, T.added + 6, 16)}}>
					<div style={{fontSize: 22, fontWeight: 600, display: 'flex', gap: 14, alignItems: 'baseline'}}>
						aipe-sketcher <span style={{fontSize: 18, color: APP.dim, fontWeight: 500}}>{CODEX.pluginCount}</span>
					</div>
					<div style={{marginTop: 16, width: 660, border: `1.5px solid ${f >= T.clickCard - 24 && f < T.clickCard + 20 ? '#c7c7cc' : APP.line}`, borderRadius: 14, padding: 20, display: 'flex', gap: 16, alignItems: 'center', background: '#fff'}}>
						<PluginIcon />
						<div style={{flex: 1}}>
							<div style={{fontSize: 22, fontWeight: 600}}>{PLUGIN.displayName}</div>
							<div style={{fontSize: 18, color: APP.dim, marginTop: 4}}>{PLUGIN.short}</div>
						</div>
						{installed ? <div style={{fontSize: 17, fontWeight: 600, color: '#248a3d', background: '#e8f6ec', padding: '6px 12px', borderRadius: 8}}>{CODEX.installedBadge}</div> : null}
					</div>
				</div>
			) : null}
			<div style={{position: 'absolute', left: 44, right: 44, top: recTop}}>
				<div style={{height: 22, width: 160, borderRadius: 8, background: '#ededf0'}} />
				<div style={{marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24}}>
					{Array.from({length: 6}).map((_, i) => (
						<SkeletonCard key={i} />
					))}
				</div>
			</div>
		</div>
	);
};

const AddMarketplaceDialog: React.FC = () => {
	const f = useCurrentFrame();
	const value = typed(f, T.typeStart, CODEX.source, 0.55);
	const typing = f >= T.typeStart - 8 && f < typedDone(T.typeStart, CODEX.source, 0.55) + 10;
	return (
		<Modal from={T.clickMenu + 6} to={T.clickAdd + 10} width={720}>
			<div style={{fontSize: 30, fontWeight: 700}}>{CODEX.dialogTitle}</div>
			<div style={{fontSize: 20, color: APP.dim, marginTop: 8, marginBottom: 28}}>
				{CODEX.dialogSubtitle} <span style={{color: APP.focus}}>Learn more</span>
			</div>
			<Field label={CODEX.sourceLabel} placeholder={CODEX.sourcePlaceholder} value={value} focused={f >= T.typeStart - 8} caret={typing} />
			<Field label={CODEX.refLabel} placeholder={CODEX.refPlaceholder} />
			<Field label={CODEX.sparseLabel} placeholder={CODEX.sparsePlaceholder} />
			<div style={{display: 'flex', justifyContent: 'flex-end', gap: 14, marginTop: 10}}>
				<Button>{CODEX.cancel}</Button>
				<Button primary hot={f >= T.clickAdd - 18}>{CODEX.submit}</Button>
			</div>
		</Modal>
	);
};

const InstallModal: React.FC = () => {
	const f = useCurrentFrame();
	const busy = f >= T.clickInstall;
	return (
		<Modal from={T.clickCard + 6} to={T.installed} width={760}>
			<div style={{display: 'flex', gap: 20, alignItems: 'center'}}>
				<PluginIcon size={72} />
				<div>
					<div style={{fontSize: 30, fontWeight: 700}}>{CODEX.installTitle}</div>
					<div style={{fontSize: 19, color: APP.dim, marginTop: 4}}>{CODEX.developedBy}</div>
				</div>
			</div>
			<div style={{fontSize: 19, fontWeight: 600, marginTop: 28}}>{CODEX.about}</div>
			<div style={{fontSize: 20, color: APP.dim, lineHeight: 1.45, marginTop: 6}}>{PLUGIN.about}</div>
			<div style={{display: 'flex', gap: 40, marginTop: 22}}>
				<div>
					<div style={{fontSize: 19, fontWeight: 600}}>{CODEX.includes}</div>
					<div style={{fontSize: 20, color: APP.dim, marginTop: 6}}>{CODEX.includesSkills}: {PLUGIN.skill}</div>
				</div>
				<div>
					<div style={{fontSize: 19, fontWeight: 600}}>&nbsp;</div>
					<div style={{fontSize: 20, color: APP.dim, marginTop: 6}}>{CODEX.category}</div>
				</div>
			</div>
			<Button primary hot={f >= T.clickInstall - 18} style={{marginTop: 30, width: '100%', justifyContent: 'center', boxSizing: 'border-box', padding: '16px 22px', fontSize: 22}}>
				{busy ? CODEX.installing : CODEX.installTitle}
			</Button>
		</Modal>
	);
};

export const CodexInstall: React.FC = () => {
	const f = useCurrentFrame();
	const onPlugins = f >= T.clickPlugins + 4;
	const zoomDialog = 1.08;
	return (
		<Stage>
			{f < T.step2 ? <StepChip n={1} title="Open Codex" /> : <StepChip n={2} title="Install AIPE Sketcher" start={T.step2} />}
			<CornerLogo />
			<Camera
				keys={[
					{f: 0, s: 1, x: 1110, y: 300},
					{f: T.clickMenu + 10, s: 1, x: 1110, y: 300},
					{f: T.clickMenu + 34, s: zoomDialog, x: 1110, y: 300},
					{f: T.clickAdd + 6, s: zoomDialog, x: 1110, y: 300},
					{f: T.clickAdd + 30, s: 1, x: 1110, y: 300},
					{f: T.clickCard + 10, s: 1, x: 1110, y: 300},
					{f: T.clickCard + 34, s: zoomDialog, x: 1110, y: 300},
					{f: T.installed, s: zoomDialog, x: 1110, y: 300},
					{f: T.installed + 24, s: 1, x: 1110, y: 300},
				]}
			>
				<div style={{position: 'absolute', left: WIN.x, top: WIN.y, opacity: fade(f, 8, 16), transform: `translateY(${slide(f, 8, 20, 30)}px)`}}>
					<AppWindow title={CODEX.appTitle} icon="apps/codex.png" width={WIN.w} height={WIN.h} sidebar={<CodexSidebar active={onPlugins ? 'plugins' : 'chat'} hotPlugins={f >= T.clickPlugins - 20} />}>
						{onPlugins ? <CodexPluginsPage /> : <Composer />}
						<AddMarketplaceDialog />
						<InstallModal />
						<Toast from={T.added} to={T.added + 100}>{CODEX.marketplaceAdded}</Toast>
						<Toast from={T.installed + 6} action={CODEX.tryNow}>{CODEX.installed}</Toast>
					</AppWindow>
				</div>
				<Cursor
					keys={[
						{f: 60, x: 1000, y: 700},
						{f: T.clickPlugins, x: 250, y: 330, click: true},
						{f: T.clickArrow, x: 1690, y: 296, click: true},
						{f: T.clickMenu, x: 1590, y: 372, click: true},
						{f: T.typeStart - 10, x: 1250, y: 520},
						{f: T.clickAdd, x: 1330, y: 806, click: true},
						{f: T.added + 30, x: 1000, y: 640},
						{f: T.clickCard, x: 760, y: 462, click: true},
						{f: T.clickInstall, x: 1110, y: 818, click: true},
						{f: T.installed + 40, x: 1250, y: 700},
					]}
				/>
			</Camera>
			<Caption from={24} to={T.step2}>Open the Codex app (Codex in the ChatGPT desktop app works too).</Caption>
			<Caption from={T.step2 + 10} to={T.clickArrow}>Go to Plugins.</Caption>
			<Caption from={T.clickArrow} to={T.typeStart}>Open the menu next to Create plugin and choose Add a marketplace.</Caption>
			<Caption from={T.typeStart} to={T.added}>Enter the AIPE Sketcher repository: FulongLi/AIPE-Sketcher</Caption>
			<Caption from={T.added} to={T.clickCard + 10}>AIPE Sketcher now appears in your plugins. Select it.</Caption>
			<Caption from={T.clickCard + 10} to={T.installed}>Click Install.</Caption>
			<Caption from={T.installed + 10} to={T.installed + 120}>Installed. Start a new chat to use it.</Caption>
			<Caption from={T.installed + 120}>It runs on your computer with Python 3.9 or newer. No API key needed.</Caption>
			<ReconstructedNote>{SOURCES_NOTE}</ReconstructedNote>
		</Stage>
	);
};

// ------------------------------------------------------------------ Claude Code alternative
const C = {plus: 60, add: 105, card: 175, end: 330};
export const CLAUDE_FRAMES = C.end;

export const ClaudeInstall: React.FC = () => {
	const f = useCurrentFrame();
	const menu = f >= C.plus + 4 && f < C.add + 8;
	const browser = f >= C.add + 8;
	return (
		<Stage alt>
			<div style={{position: 'absolute', left: 96, top: 64, opacity: fade(f, 4)}}>
				<Eyebrow style={{fontSize: 17}}>Prefer Claude Code?</Eyebrow>
				<div style={{fontFamily: AIPE.display, fontWeight: 800, fontSize: 40, letterSpacing: '-0.03em', marginTop: 4}}>Install from the Code tab</div>
			</div>
			<CornerLogo />
			<div style={{position: 'absolute', left: WIN.x, top: WIN.y, opacity: fade(f, 8, 16), transform: `translateY(${slide(f, 8, 20, 30)}px)`}}>
				<AppWindow title={CLAUDE.appTitle} icon="apps/claude.png" width={WIN.w} height={WIN.h}>
					<div style={{position: 'absolute', left: 300, right: 300, bottom: 40, height: 120, borderRadius: 20, border: `1px solid ${APP.line}`, boxShadow: '0 6px 24px rgba(0,0,0,.06)', background: '#fff', padding: '18px 22px', boxSizing: 'border-box'}}>
						<div style={{fontSize: 22, color: APP.faint}}>&nbsp;</div>
						<div style={{position: 'absolute', left: 18, bottom: 16, width: 42, height: 42, borderRadius: 21, border: `1px solid ${APP.line}`, background: menu ? '#ececee' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: APP.dim}}>+</div>
					</div>
					{menu ? (
						<div style={{position: 'absolute', left: 300, bottom: 176, width: 280, background: '#fff', borderRadius: 14, border: `1px solid ${APP.line}`, boxShadow: '0 14px 40px rgba(0,0,0,.16)', padding: 8, opacity: fade(f, C.plus + 4, 6)}}>
							<div style={{padding: '14px 16px', borderRadius: 10, fontSize: 21, fontWeight: 500, background: f >= C.add - 18 ? '#efeff1' : 'transparent'}}>{CLAUDE.addPlugins}</div>
						</div>
					) : null}
					{browser ? (
						<div style={{position: 'absolute', left: 240, right: 240, top: 50, opacity: fade(f, C.add + 8, 12)}}>
							<div style={{fontSize: 30, fontWeight: 700}}>{CLAUDE.addPlugins}</div>
							<div style={{marginTop: 22, border: `1.5px solid ${f >= C.card ? '#c7c7cc' : APP.line}`, background: f >= C.card ? '#f7f7f8' : '#fff', borderRadius: 14, padding: 22, display: 'flex', gap: 18, alignItems: 'center'}}>
								<PluginIcon />
								<div style={{flex: 1}}>
									<div style={{fontSize: 23, fontWeight: 600}}>
										{PLUGIN.claudeName}
									</div>
									<div style={{fontSize: 19, color: APP.dim, marginTop: 4}}>{PLUGIN.claudeDescription}</div>
								</div>
							</div>
							<div style={{marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
								<SkeletonCard />
								<SkeletonCard />
							</div>
						</div>
					) : null}
				</AppWindow>
			</div>
			<Cursor
				keys={[
					{f: 30, x: 900, y: 600},
					{f: C.plus, x: 499, y: 875, click: true},
					{f: C.add, x: 600, y: 808, click: true},
					{f: C.card, x: 900, y: 335, click: true},
					{f: C.end, x: 960, y: 420},
				]}
			/>
			<Caption from={20} to={C.add + 10}>In a Code tab session, click + next to the prompt box, then Add plugins.</Caption>
			<Caption from={C.add + 10} to={C.card + 60}>Select AIPE Sketcher and install it for your user account.</Caption>
			<Caption from={C.card + 60}>First time? Add the marketplace FulongLi/AIPE-Sketcher once, as the README shows.</Caption>
			<ReconstructedNote>Simplified reconstruction · Claude desktop 2.42304 · menu label from the app</ReconstructedNote>
		</Stage>
	);
};

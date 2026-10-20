import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {AIPE} from '../brand/tokens';
import {Stage, Logo, Eyebrow, Display, Pill, StepChip, CornerLogo, Caption, ReconstructedNote, Card, fade, slide, tween} from '../brand/components';
import {APP, AppWindow, SideItem, Cursor, typed, typedDone, Caret} from '../kit/app';
import {CODEX, PROMPT, REPLY_START, REPLY_FINAL, REPORT, SOURCES_NOTE} from './content';

const WIN = {x: 160, y: 176, w: 1600, h: 760};
const SVG_RATIO = 187.821 / 50.006;

const Schematic: React.FC<{width: number; pad?: number; reveal?: number}> = ({width, pad = 28, reveal = 1}) => (
	<div style={{background: AIPE.white, borderRadius: AIPE.radius, border: `1.5px solid ${AIPE.border}`, padding: pad, boxShadow: AIPE.shadowLg}}>
		<div style={{clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`}}>
			<Img src={staticFile('dab.svg')} style={{width: width - 2 * pad, height: (width - 2 * pad) / SVG_RATIO, display: 'block'}} />
		</div>
	</div>
);

const Sidebar: React.FC = () => (
	<>
		<SideItem label={CODEX.newChat} icon="✎" active />
		<SideItem label={CODEX.plugins} icon="⌘" />
		<SideItem label={CODEX.skills} icon="◇" />
	</>
);

const UserBubble: React.FC<{text: string; from: number}> = ({text, from}) => {
	const f = useCurrentFrame();
	return (
		<div style={{display: 'flex', justifyContent: 'flex-end', opacity: fade(f, from, 10), transform: `translateY(${slide(f, from, 12, 12)}px)`}}>
			<div style={{maxWidth: 760, background: '#f0f0f2', borderRadius: 22, padding: '18px 24px', fontSize: 25, lineHeight: 1.45}}>{text}</div>
		</div>
	);
};

const Highlight: React.FC<{children: React.ReactNode; from: number}> = ({children, from}) => {
	const f = useCurrentFrame();
	const w = tween(f, [from, from + 16], [0, 100]);
	return (
		<span style={{backgroundImage: `linear-gradient(${AIPE.accent}, ${AIPE.accent})`, backgroundRepeat: 'no-repeat', backgroundSize: `${w}% 40%`, backgroundPosition: '0 88%'}}>{children}</span>
	);
};

const Composer: React.FC<{text?: string; caret?: boolean; working?: boolean}> = ({text, caret, working}) => (
	<div style={{position: 'absolute', left: 150, right: 150, bottom: 34, minHeight: 104, borderRadius: 22, border: `1px solid ${APP.line}`, boxShadow: '0 6px 24px rgba(0,0,0,.06)', background: '#fff', padding: '20px 24px', fontSize: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, boxSizing: 'border-box'}}>
		<div style={{color: text ? APP.ink : APP.faint, lineHeight: 1.4}}>
			{working ? CODEX.working : text || (caret ? '' : CODEX.composerPlaceholder)}
			{caret ? <Caret /> : null}
		</div>
		<div style={{width: 46, height: 46, borderRadius: 23, background: text ? '#1d1d1f' : '#d9d9de', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flex: 'none', alignSelf: 'flex-end'}}>↑</div>
	</div>
);

// ------------------------------------------------------------------ Step 3: describe
const D = {type: 40, cps: 1.0, send: 0, start: 0, end: 420};
D.send = typedDone(D.type, PROMPT, D.cps) + 14;
D.start = D.send + 36;
export const DESCRIBE_FRAMES = D.end;

export const Describe: React.FC = () => {
	const f = useCurrentFrame();
	const sent = f >= D.send;
	return (
		<Stage>
			<StepChip n={3} title="Describe your circuit" />
			<CornerLogo />
			<div style={{position: 'absolute', left: WIN.x, top: WIN.y, opacity: fade(f, 4, 14)}}>
				<AppWindow title={CODEX.appTitle} icon="apps/codex.png" width={WIN.w} height={WIN.h} sidebar={<Sidebar />}>
					<div style={{position: 'absolute', left: 150, right: 150, top: 44, display: 'flex', flexDirection: 'column', gap: 30}}>
						{sent ? <UserBubble text={PROMPT} from={D.send} /> : null}
						{f >= D.start ? (
							<div style={{fontSize: 25, lineHeight: 1.55, opacity: fade(f, D.start, 12), maxWidth: 980}}>
								I’ll use the <Highlight from={D.start + 30}>AIPE Sketcher schematic skill</Highlight> to draw the Dual Active Bridge converter and export a connectivity-checked SVG.
							</div>
						) : null}
					</div>
					<Composer text={sent ? undefined : typed(f, D.type, PROMPT, D.cps)} caret={!sent && f >= D.type - 10} working={sent} />
				</AppWindow>
			</div>
			<Cursor keys={[{f: 20, x: 960, y: 860, click: true}, {f: D.send - 2, x: 1538, y: 892, click: true}, {f: D.end, x: 1400, y: 700}]} />
			<Caption from={16} to={D.send + 6}>In a new chat, describe the circuit you want, in plain English.</Caption>
			<Caption from={D.send + 6}>Codex recognises the request and uses AIPE Sketcher.</Caption>
			<ReconstructedNote>{SOURCES_NOTE} · agent reply from a real run</ReconstructedNote>
		</Stage>
	);
};

// ------------------------------------------------------------------ Generate (illustration)
export const GENERATE_FRAMES = 330;

export const Generate: React.FC = () => {
	const f = useCurrentFrame();
	const box = (i: number) => ({opacity: fade(f, 14 + i * 26, 14), transform: `translateY(${slide(f, 14 + i * 26, 16, 18)}px)`});
	const arrow = (i: number) => tween(f, [30 + i * 26, 46 + i * 26], [0, 1]);
	const reveal = tween(f, [96, 200], [0, 1]);
	const checked = f >= 214;
	return (
		<Stage>
			<div style={{position: 'absolute', left: 0, right: 0, top: 86, textAlign: 'center', opacity: fade(f, 2)}}>
				<Eyebrow>What happens next</Eyebrow>
				<Display size={64} style={{marginTop: 12}}>From your words to a validated drawing</Display>
			</div>
			<div style={{position: 'absolute', left: 120, right: 120, top: 300, display: 'flex', alignItems: 'center', gap: 0}}>
				<div style={{...box(0), width: 380}}>
					<Card style={{padding: 30, height: 300, boxSizing: 'border-box'}}>
						<Eyebrow style={{fontSize: 16}}>Your request</Eyebrow>
						<div style={{fontSize: 27, lineHeight: 1.4, marginTop: 16}}>“Draw a Dual Active Bridge converter schematic and export it as SVG.”</div>
					</Card>
				</div>
				<div style={{width: 70, height: 3, background: AIPE.fg, transformOrigin: 'left', transform: `scaleX(${arrow(0)})`, margin: '0 10px'}} />
				<div style={{...box(1), width: 330}}>
					<Card style={{padding: 30, height: 300, boxSizing: 'border-box', background: AIPE.black, border: 'none'}}>
						<Eyebrow style={{fontSize: 16, color: AIPE.accent}}>AIPE Sketcher</Eyebrow>
						<div style={{fontFamily: AIPE.display, fontWeight: 800, fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', marginTop: 16}}>Draws the circuit and checks every connection</div>
					</Card>
				</div>
				<div style={{width: 70, height: 3, background: AIPE.fg, transformOrigin: 'left', transform: `scaleX(${arrow(1)})`, margin: '0 10px'}} />
				<div style={{...box(2), flex: 1}}>
					<Eyebrow style={{fontSize: 16, marginBottom: 14}}>Electrical schematic</Eyebrow>
					<Schematic width={780} pad={20} reveal={reveal} />
				</div>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 680, display: 'flex', justifyContent: 'center', opacity: fade(f, 214, 12), transform: `translateY(${slide(f, 214, 14, 10)}px)`}}>
				{checked ? (
					<div style={{display: 'flex', alignItems: 'center', gap: 14, background: AIPE.okBg, color: AIPE.ok, borderRadius: AIPE.pill, padding: '14px 30px', fontSize: 28, fontWeight: 600}}>
						<span style={{width: 34, height: 34, borderRadius: 17, background: AIPE.ok, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20}}>✓</span>
						Drawing connectivity passed
					</div>
				) : null}
			</div>
			<Caption from={20} to={150}>AIPE Sketcher draws the schematic on your computer…</Caption>
			<Caption from={150}>…and refuses to save a drawing whose wires differ from the circuit.</Caption>
		</Stage>
	);
};

// ------------------------------------------------------------------ Result
const R = {reply: 0, ready: 200, end: 540};
export const RESULT_FRAMES = R.end;

const Reply: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<div style={{position: 'absolute', left: WIN.x, top: WIN.y, opacity: Math.min(fade(f, 0, 12), interpolate(f, [R.ready - 14, R.ready], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}}>
			<AppWindow title={CODEX.appTitle} icon="apps/codex.png" width={WIN.w} height={WIN.h} sidebar={<Sidebar />}>
				<div style={{position: 'absolute', left: 150, right: 150, top: 44, display: 'flex', flexDirection: 'column', gap: 26}}>
					<UserBubble text={PROMPT} from={-30} />
					<div style={{fontSize: 24, lineHeight: 1.55, color: APP.dim}}>{REPLY_START}</div>
					<div style={{fontSize: 25, lineHeight: 1.55, opacity: fade(f, 16, 12)}}>
						{REPLY_FINAL.lead.map((p, i) =>
							typeof p === 'string' ? (
								<span key={i}>{p}</span>
							) : (
								<span key={i} style={{color: APP.focus, textDecoration: 'underline', textUnderlineOffset: 4, background: i === 1 && f >= 90 ? AIPE.accentSoft : 'transparent', borderRadius: 4}}>
									{p.link}
								</span>
							),
						)}
					</div>
					<div style={{fontSize: 25, lineHeight: 1.55, opacity: fade(f, 28, 12)}}>{REPLY_FINAL.checks}</div>
					<div style={{fontSize: 25, lineHeight: 1.55, opacity: fade(f, 40, 12)}}>{REPLY_FINAL.limit}</div>
				</div>
			</AppWindow>
		</div>
	);
};

const Status: React.FC<{label: string; value: string; delay: number}> = ({label, value, delay}) => {
	const f = useCurrentFrame();
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: `1.5px solid ${AIPE.border}`, opacity: fade(f, delay), transform: `translateX(${slide(f, delay, 14, -12)}px)`}}>
			<span style={{width: 30, height: 30, borderRadius: 15, background: AIPE.ok, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700}}>✓</span>
			<span style={{fontSize: 27, fontWeight: 500, flex: 1}}>{label}</span>
			<span style={{fontSize: 22, fontWeight: 600, color: AIPE.ok, background: AIPE.okBg, borderRadius: AIPE.pill, padding: '6px 16px'}}>{value}</span>
		</div>
	);
};

export const Result: React.FC = () => {
	const f = useCurrentFrame();
	const r = f - R.ready;
	return (
		<Stage>
			{f < R.ready ? (
				<>
					<StepChip n={4} title="Get your schematic" />
					<CornerLogo />
					<Reply />
					<Caption from={20} to={R.ready - 4}>Codex replies with the SVG and the validation result.</Caption>
					<ReconstructedNote>{SOURCES_NOTE} · reply text from a real run</ReconstructedNote>
				</>
			) : (
				<>
					<div style={{position: 'absolute', left: 120, top: 84, opacity: fade(r, 0)}}>
						<Eyebrow>Done</Eyebrow>
						<Display size={76} style={{marginTop: 10}}>Your schematic is ready.</Display>
					</div>
					<CornerLogo />
					<div style={{position: 'absolute', left: 120, top: 290, opacity: fade(r, 10, 16), transform: `translateY(${slide(r, 10, 18, 20)}px)`}}>
						<Schematic width={1680} pad={28} />
					</div>
					<div style={{position: 'absolute', left: 120, top: 800, width: 820}}>
						<Status label="Electrical validation" value={REPORT.electrical} delay={R.ready + 50} />
						<Status label="Drawing connectivity" value={REPORT.connectivity} delay={R.ready + 64} />
						<Status label="Layout quality" value={`${REPORT.score}/100`} delay={R.ready + 78} />
					</div>
					<div style={{position: 'absolute', left: 1010, top: 812, width: 790, opacity: fade(f, R.ready + 100), transform: `translateY(${slide(f, R.ready + 100)}px)`}}>
						<Card style={{padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 20, boxShadow: AIPE.shadow}}>
							<div style={{width: 58, height: 70, borderRadius: 8, background: AIPE.accentSoft, border: `1.5px solid ${AIPE.border}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8, boxSizing: 'border-box', fontSize: 14, fontWeight: 700, color: AIPE.fgDim}}>SVG</div>
							<div style={{flex: 1}}>
								<div style={{fontFamily: AIPE.mono, fontSize: 25, fontWeight: 600}}>{REPORT.svg}</div>
								<div style={{fontSize: 21, color: AIPE.fgDim, marginTop: 6}}>Saved in your project folder · {REPORT.svgSize}</div>
							</div>
						</Card>
					</div>
				</>
			)}
		</Stage>
	);
};

// ------------------------------------------------------------------ Closing
export const CLOSING_FRAMES = 270;

export const Closing: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<Stage>
			<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
				<div style={{opacity: fade(f, 4), transform: `translateY(${slide(f, 4)}px)`}}>
					<Logo height={58} />
				</div>
				<Display size={136} style={{marginTop: 46, opacity: fade(f, 14), transform: `translateY(${slide(f, 14, 20, 22)}px)`}}>AIPE Sketcher</Display>
				<div style={{fontSize: 44, color: AIPE.fgDim, marginTop: 24, opacity: fade(f, 28)}}>Describe it. Generate it. Validate it.</div>
				<div style={{display: 'flex', gap: 18, marginTop: 64, opacity: fade(f, 44), transform: `translateY(${slide(f, 44)}px)`}}>
					<Pill>github.com/FulongLi/AIPE-Sketcher</Pill>
					<Pill primary={false}>aipel.co.uk</Pill>
				</div>
				<div style={{fontSize: 24, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: AIPE.muted, marginTop: 70, opacity: fade(f, 58)}}>AIPE Labs</div>
			</div>
		</Stage>
	);
};

// ------------------------------------------------------------------ Thumbnail (1280x720)
export const ThumbnailV2: React.FC = () => (
	<div style={{position: 'absolute', inset: 0, background: AIPE.bg, fontFamily: AIPE.font, color: AIPE.fg}}>
		<div style={{position: 'absolute', inset: 0, background: AIPE.heroGlow}} />
		<div style={{position: 'absolute', left: 72, top: 64}}>
			<Logo height={40} />
		</div>
		<div style={{position: 'absolute', right: 72, top: 70, display: 'flex', gap: 12}}>
			{['Codex', 'Claude Code'].map((t) => (
				<div key={t} style={{fontSize: 22, fontWeight: 600, borderRadius: AIPE.pill, padding: '8px 20px', background: AIPE.bgAlt, border: `1.5px solid ${AIPE.border}`}}>{t}</div>
			))}
		</div>
		<div style={{position: 'absolute', left: 72, top: 170}}>
			<Eyebrow style={{fontSize: 20}}>Quick start tutorial</Eyebrow>
			<Display size={104} style={{marginTop: 10}}>AIPE Sketcher</Display>
			<div style={{fontSize: 34, color: AIPE.fgDim, marginTop: 14}}>Install it. Describe a circuit. Get a schematic.</div>
		</div>
		<div style={{position: 'absolute', left: 170, top: 408}}>
			<Schematic width={940} pad={22} />
		</div>
	</div>
);

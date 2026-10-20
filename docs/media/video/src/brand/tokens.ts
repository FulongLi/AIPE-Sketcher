// AIPE Labs design tokens, copied from https://aipel.co.uk/assets/style.css
// (:root custom properties, read 2026-10-20). Reuse these for every AIPE tool
// tutorial (Sketcher, Magnetics, PCB, ...) so videos match the website.
import {loadFont as loadBricolage} from '@remotion/google-fonts/BricolageGrotesque';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';

const bricolage = loadBricolage('normal', {weights: ['600', '700', '800'], subsets: ['latin']});
const inter = loadInter('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']});

export const AIPE = {
	bg: '#fdfcf9',
	bgAlt: '#f6f3ec',
	white: '#ffffff',
	cardAlt: '#faf8f3',
	fg: '#241c10',
	fgDim: '#6b6355',
	muted: '#9a9284',
	black: '#141310',
	accent: '#f5d54a',
	accentSoft: '#fdf3cd',
	border: 'rgba(36, 28, 16, 0.09)',
	borderHover: 'rgba(36, 28, 16, 0.22)',
	ok: '#1f6b33',
	okBg: '#e4f2e6',
	radius: 20,
	radiusSm: 12,
	pill: 999,
	shadow: '0 1px 3px rgba(36,28,16,.05)',
	shadowLg: '0 16px 48px rgba(36,28,16,.10)',
	// .home-hub-hero background
	heroGlow: 'radial-gradient(1500px 560px at 50% -150px, rgba(245,213,74,.28), transparent 70%)',
	display: bricolage.fontFamily,
	font: inter.fontFamily,
	mono: "'SF Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
	// .home-hub-hero h1: 800 weight, line-height .98, letter-spacing -.045em
	displayTracking: '-0.045em',
};

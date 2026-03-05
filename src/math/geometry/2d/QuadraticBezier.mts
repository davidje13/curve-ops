import type { Line } from './Line.mts';
import {
	ptAdd,
	ptDist,
	ptLerp,
	ptMad,
	ptMid,
	ptMul,
	ptSub,
	ptSVG,
	type Pt,
} from './Pt.mts';

export interface QuadraticBezier {
	readonly p0: Pt;
	readonly c1: Pt;
	readonly p2: Pt;
}

export const bezier2FromPts = (p0: Pt, c1: Pt, p2: Pt): QuadraticBezier => ({
	p0,
	c1,
	p2,
});

export const bezier2FromLine = ({ p0, p1 }: Line): QuadraticBezier => ({
	p0: p0,
	c1: ptMid(p0, p1),
	p2: p1,
});

export function bezier2At({ p0, c1, p2 }: QuadraticBezier, t: number): Pt {
	const T = 1 - t;
	return ptMad(ptMad(p0, T, ptMul(c1, 2 * t)), T, ptMul(p2, t * t));
}

export function bezier2XAt({ p0, c1, p2 }: QuadraticBezier, t: number): number {
	const T = 1 - t;
	return p0.x * T * T + (2 * c1.x * T + p2.x * t) * t;
}

export function bezier2YAt({ p0, c1, p2 }: QuadraticBezier, t: number): number {
	const T = 1 - t;
	return p0.y * T * T + (2 * c1.y * T + p2.y * t) * t;
}

export const bezier2Derivative = ({ p0, c1, p2 }: QuadraticBezier): Line => ({
	p0: ptSub(c1, p0),
	p1: ptSub(p2, c1),
});

export const bezier2Translate = (
	{ p0, c1, p2 }: QuadraticBezier,
	shift: Pt,
): QuadraticBezier => ({
	p0: ptAdd(p0, shift),
	c1: ptAdd(c1, shift),
	p2: ptAdd(p2, shift),
});

export function bezier2LengthEstimate(
	curve: QuadraticBezier,
	maxError = Number.POSITIVE_INFINITY,
	recursionLimit = 20,
): LengthEstimate {
	// thanks, Adaptive subdivision and the length and energy of Bézier curves [Jens Gravesen]

	const chord = ptDist(curve.p2, curve.p0);
	const polygon = ptDist(curve.p0, curve.c1) + ptDist(curve.c1, curve.p2);

	const err = (polygon - chord) * (2 / 3);
	if (err > maxError && recursionLimit > 0) {
		const [s0, s1] = bezier2Bisect(curve);
		const se = maxError * 0.5;
		const sr = recursionLimit - 1;
		const l1 = bezier2LengthEstimate(s0, se, sr);
		const l2 = bezier2LengthEstimate(s1, maxError - l1.maxError, sr);
		return {
			best: l1.best + l2.best,
			maxError: l1.maxError + l2.maxError,
		};
	}

	return {
		best: (2 * chord + polygon) * (1 / 3),
		maxError: err,
	};
}

export function bezier2Bisect(
	{ p0, c1, p2 }: QuadraticBezier,
	t = 0.5,
): [QuadraticBezier, QuadraticBezier] {
	// thanks, https://en.wikipedia.org/wiki/De_Casteljau's_algorithm
	const i0 = ptLerp(p0, c1, t);
	const i1 = ptLerp(c1, p2, t);
	const p = ptLerp(i0, i1, t);
	return [
		{ p0: p0, c1: i0, p2: p },
		{ p0: p, c1: i1, p2: p2 },
	];
}

export function bezier2Split(
	{ p0, c1, p2 }: QuadraticBezier,
	splits: number[],
	minRange = 1e-6,
): QuadraticBezier[] {
	// thanks, https://en.wikipedia.org/wiki/De_Casteljau's_algorithm
	let pp0 = p0;
	let pc1 = c1;
	const pEnd = p2;
	let pt = 0;
	const r = [];
	for (const t of splits.filter((t) => t > 0 && t < 1).sort()) {
		if (t <= pt + minRange) {
			continue;
		}
		const st = (t - pt) / (1 - pt);
		const i0 = ptLerp(pp0, pc1, st);
		const i1 = ptLerp(pc1, pEnd, st);
		const p = ptLerp(i0, i1, st);
		r.push({ p0: pp0, c1: i0, p2: p });
		pp0 = p;
		pc1 = i1;
		pt = t;
	}
	r.push({ p0: pp0, c1: pc1, p2: pEnd });
	return r;
}

export const bezier2SVG = (
	{ p0, c1, p2 }: QuadraticBezier,
	precision?: number | undefined,
	prefix = 'M',
	mode = 'Q',
) =>
	`${prefix}${ptSVG(p0, precision)}${mode}${ptSVG(c1, precision)} ${ptSVG(
		p2,
		precision,
	)}`;

interface LengthEstimate {
	best: number;
	maxError: number;
}

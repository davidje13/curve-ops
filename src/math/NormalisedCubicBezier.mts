import { type CubicBezier } from './CubicBezier.mts';
import { lineAt, lineScaledNormalisation } from './Line.mts';
import { PT0, ptCross, ptLen, ptMad, ptMul, ptSub, type Pt } from './Pt.mts';
import {
	bezier2At,
	bezier2Derivative,
	type QuadraticBezier,
} from './QuadraticBezier.mts';
import { solveQuadratic } from './roots.mts';

export interface NormalisedCubicBezier extends CubicBezier {
	readonly p0: { readonly x: 0; readonly y: 0 };
	readonly p3: { readonly x: number; readonly y: 0 };
}

export function bezier3Normalise({ p0, c1, c2, p3 }: CubicBezier): {
	scale2: number;
	curve: NormalisedCubicBezier;
	fn: (pt: Pt) => Pt;
} {
	const norm =
		lineScaledNormalisation({ p0, p1: p3 }) ??
		lineScaledNormalisation({ p0, p1: c1 }) ??
		lineScaledNormalisation({ p0, p1: c2 });
	if (!norm) {
		return {
			scale2: 1,
			curve: { p0: PT0, c1: PT0, c2: PT0, p3: PT0 },
			fn: (pt) => ptSub(pt, p0),
		};
	}
	return {
		...norm,
		curve: {
			p0: PT0,
			c1: norm.fn(c1),
			c2: norm.fn(c2),
			p3: { x: norm.fn(p3).x, y: 0 },
		},
	};
}

export function nBezier3At(
	{ c1, c2, p3 }: NormalisedCubicBezier,
	t: number,
): Pt {
	const T = 1 - t;
	return ptMad(
		ptMad(c1, 3 * t * T, ptMul(c2, 3 * t * t)),
		T,
		ptMul(p3, t * t * t),
	);
}

export function nBezier3XAt(
	{ c1, c2, p3 }: NormalisedCubicBezier,
	t: number,
): number {
	const T = 1 - t;
	return (3 * T * (c1.x * T + c2.x * t) + p3.x * t * t) * t;
}

export function nBezier3YAt(
	{ c1, c2 }: NormalisedCubicBezier,
	t: number,
): number {
	const T = 1 - t;
	return 3 * T * (c1.y * T + c2.y * t) * t;
}

export const nBezier3Derivative = ({
	c1,
	c2,
	p3,
}: NormalisedCubicBezier): QuadraticBezier => ({
	p0: ptMul(c1, 3),
	c1: ptMul(ptSub(c2, c1), 3),
	p2: ptMul(ptSub(p3, c2), 3),
});

export function nBezier3Curvature(
	curve: NormalisedCubicBezier,
): (t: number) => number {
	// curve(t) = (dx/dt * d^2(y)/dt^2 - d^2(x)/dt^2 * dy/dt) / ((dx/dt)^2 + (dy/dt)^2)^(3/2)
	const d1f = nBezier3Derivative(curve);
	const d2f = bezier2Derivative(d1f);
	return (t) => {
		const d1 = bezier2At(d1f, t);
		const d2 = lineAt(d2f, t);
		const len = ptLen(d1);
		return ptCross(d1, d2) / (len * len * len);
	};
}

export function nBezier3InflectionTs({ c1, c2, p3 }: NormalisedCubicBezier) {
	// thanks, https://pomax.github.io/bezierinfo/
	// note: curve function is simplified by skipping denominator - this form only used for finding zeros
	// [scaled] curve(t) = (3*s+2*c1y-c2y)*t^2 + (-3*s-c1y)*t + s
	// s = c1x*c2y - c2x*c1y
	const s = ptCross(c1, c2);
	return solveQuadratic(
		3 * s + (2 * c1.y - c2.y) * p3.x,
		-3 * s - c1.y * p3.x,
		s,
	);
}

export function nBezier3Area({ c1, c2, p3 }: NormalisedCubicBezier) {
	// thanks, https://raphlinus.github.io/curves/2021/03/11/bezier-fitting.html
	return 0.15 * ((p3.x + c2.x) * c1.y + (2 * p3.x - c1.x) * c2.y);
}

export function nBezier3Moment({ c1, c2, p3 }: NormalisedCubicBezier) {
	// thanks, https://raphlinus.github.io/curves/2021/03/11/bezier-fitting.html
	const l = p3.x;
	const x1 = c1.x;
	const y1 = c1.y;
	const x2 = l - c2.x;
	const y2 = c2.y;
	return (
		(+(34 * y1 + 50 * y2) * l * l +
			(15 * (x1 * y1 - x2 * y2) + 9 * x1 * y2 - 33 * y1 * x2) * l +
			9 * (y1 * x2 + x1 * y2) * (x2 - x1)) *
		(1 / 280)
	);
}

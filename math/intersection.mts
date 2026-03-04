import type { AxisAlignedBox } from './AxisAlignedBox.mts';
import type { Circle } from './Circle.mts';
import {
	bezier3Bounds,
	bezier3Derivative,
	bezier3TsAtXEq,
	bezier3TsAtYEq,
	bezier3XAt,
	bezier3YAt,
	type CubicBezier,
} from './CubicBezier.mts';
import { lineScaledNormalisation, type Line } from './Line.mts';
import { bezier3Normalise } from './NormalisedCubicBezier.mts';
import type { Rectangle } from './Rectangle.mjs';
import { ptAdd, ptDot, ptLen2, type Pt } from './Pt.mts';
import { solveO6 } from './roots.mts';
import { bezier2XAt, bezier2YAt } from './QuadraticBezier.mts';

export const isOverlapAABoxCircle = /*@__PURE__*/ (
	aaBox: AxisAlignedBox,
	{ c, r }: Circle,
) => isOverlapAABoxCircleR2(aaBox, c, r * r);

function isOverlapAABoxCircleR2(
	{ l, h }: AxisAlignedBox,
	c: Pt,
	r2: number,
): boolean {
	const dx = Math.max(0, l.x - c.x, c.x - h.x);
	const dy = Math.max(0, l.y - c.y, c.y - h.y);
	return dx * dx + dy * dy <= r2;
}

/*@__PURE__*/ export function intersectBezier3Line(
	{ p0, c1, c2, p3 }: CubicBezier,
	line: Line,
): { t1: number; t2: number }[] {
	// thanks, https://pomax.github.io/bezierinfo/#intersections
	const norm = lineScaledNormalisation(line);
	if (!norm) {
		return [];
	}
	const curve = {
		p0: norm.fn(p0),
		c1: norm.fn(c1),
		c2: norm.fn(c2),
		p3: norm.fn(p3),
	};
	const ts = bezier3TsAtYEq(curve, 0);
	const r: { t1: number; t2: number }[] = [];
	for (const t1 of ts) {
		if (t1 >= 0 && t1 <= 1) {
			const t2 = bezier3XAt(curve, t1);
			if (t2 >= 0 && t2 <= 1) {
				r.push({ t1, t2 });
			}
		}
	}
	return r;
}

/*@__PURE__*/ export function intersectBezier3Rect(
	{ p0, c1, c2, p3 }: CubicBezier,
	{ c, d, aspect }: Rectangle,
): { t1: number; d1: Sign }[] {
	const norm = lineScaledNormalisation({ p0: c, p1: ptAdd(c, d) });
	if (!norm) {
		return [];
	}
	const curve = {
		p0: norm.fn(p0),
		c1: norm.fn(c1),
		c2: norm.fn(c2),
		p3: norm.fn(p3),
	};
	const grad = bezier3Derivative(curve);
	const ry = 0.5 * aspect;

	const r: { t1: number; d1: Sign }[] = [];
	for (const t1 of bezier3TsAtYEq(curve, -ry)) {
		const x = bezier3XAt(curve, t1);
		if (t1 >= 0 && t1 <= 1 && x >= -0.5 && x <= 0.5) {
			r.push({ t1, d1: sign(-bezier2YAt(grad, t1)) });
		}
	}
	for (const t1 of bezier3TsAtYEq(curve, ry)) {
		const x = bezier3XAt(curve, t1);
		if (t1 >= 0 && t1 <= 1 && x >= -0.5 && x <= 0.5) {
			r.push({ t1, d1: sign(bezier2YAt(grad, t1)) });
		}
	}
	for (const t1 of bezier3TsAtXEq(curve, -0.5)) {
		const y = bezier3YAt(curve, t1);
		if (t1 >= 0 && t1 <= 1 && y >= -ry && y <= ry) {
			r.push({ t1, d1: sign(-bezier2XAt(grad, t1)) });
		}
	}
	for (const t1 of bezier3TsAtXEq(curve, 0.5)) {
		const y = bezier3YAt(curve, t1);
		if (t1 >= 0 && t1 <= 1 && y >= -ry && y <= ry) {
			r.push({ t1, d1: sign(bezier2XAt(grad, t1)) });
		}
	}
	return r;
}

export const intersectBezier3Circle = /*@__PURE__*/ (
	curve: CubicBezier,
	circle: Circle,
	maxError?: number | undefined,
) => intersectBezier3CircleFn(curve)(circle.c, circle.r * circle.r, maxError);

/*@__PURE__*/ export function intersectBezier3CircleFn(curve: CubicBezier) {
	const norm = bezier3Normalise(curve);
	const normed = intersectNBezier3CircleFn(norm.curve);
	return (center: Pt, rad2: number, maxError?: number | undefined) =>
		normed(norm.fn(center), rad2 / norm.scale2, maxError);
}

export const intersectNBezier3Circle = /*@__PURE__*/ (
	curve: CubicBezier,
	circle: Circle,
	maxError?: number | undefined,
) => intersectNBezier3CircleFn(curve)(circle.c, circle.r * circle.r, maxError);

/*@__PURE__*/ export function intersectNBezier3CircleFn(
	curve: CubicBezier,
): (
	center: Pt,
	rad2: number,
	maxError?: number | undefined,
) => { t1: number; d1: Sign }[] {
	const bounds = bezier3Bounds(curve);

	// distance equation:
	// A = c1x, B = c1y, C = c2x, D = c2y, E = p3x, X = center.x, Y = center.y
	// r2 = (
	//   (3A*t(1-t)^2+3C*(1-t)t^2+E*t^3-X)^2 +
	//   (3B*t(1-t)^2+3D*(1-t)t^2+F*t^3-Y)^2
	// )

	const { c1, c2, p3 } = curve;
	const a = ptLen2(c1) * 9;
	const b = ptDot(c1, c2) * 18;
	const c = ptDot(c1, p3) * 6 + ptLen2(c2) * 9;
	const d = ptDot(c2, p3) * 6;

	const f6 = a - b + c - d + ptLen2(p3);
	const f5 = -4 * a + 3 * b - 2 * c + d;
	const f4 = 6 * a - 3 * b + c;
	const f3 = -4 * a + b;

	return (center, rad2, maxError) => {
		if (!isOverlapAABoxCircleR2(bounds, center, rad2)) {
			return [];
		}
		const c1c = ptDot(c1, center) * 6;
		const c2c = ptDot(c2, center) * 6;

		// terms for t^n in distance equation
		return solveO6(
			f6,
			f5,
			f4,
			f3 - c1c + c2c - 2 * ptDot(p3, center),
			a + 2 * c1c - c2c,
			-c1c,
			ptLen2(center) - rad2,
			{ min: 0, max: 1, maxError },
		).map(([t1, d1]) => ({ t1, d1 }));
	};
}

type Sign = -1 | 0 | 1;

const sign = (x: number) => Math.sign(x) as Sign;

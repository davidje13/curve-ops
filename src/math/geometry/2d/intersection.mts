import type { Sign } from '../../../types/numeric.mts';
import {
	polynomial4SignedRoots,
	polynomial7SignedRoots,
} from '../../Polynomial.mts';
import type { AxisAlignedBox2D } from './AxisAlignedBox2D.mts';
import { circleContains, type Circle } from './Circle.mts';
import {
	bezier3Bounds,
	bezier3PolynomialX,
	bezier3PolynomialY,
	bezier3Split,
	bezier3TsAtYEq,
	bezier3XAt,
	type CubicBezier,
} from './CubicBezier.mts';
import { bezier3Normalise } from './NormalisedCubicBezier.mts';
import { rectContains, type Rectangle } from './Rectangle.mts';
import { ptAdd, ptDot, ptLen2, type Point2D } from './Point2D.mts';
import { internalLineSeg2Normalisation } from './LineSegment2D.mts';
import type { Line2D } from './Line2D.mts';

export const isOverlapAABox2 = (a: AxisAlignedBox2D, b: AxisAlignedBox2D) =>
	a.l.x < b.h.x && b.l.x < a.h.x && a.l.y < b.h.y && b.l.y < a.h.y;

export const isOverlapAABox2Circle = (
	aaBox: AxisAlignedBox2D,
	{ c, r }: Circle,
) => isOverlapAABox2CircleR2(aaBox, c, r * r);

export function isOverlapAABox2CircleR2(
	{ l, h }: AxisAlignedBox2D,
	c: Point2D,
	r2: number,
): boolean {
	const dx = Math.max(0, l.x - c.x, c.x - h.x);
	const dy = Math.max(0, l.y - c.y, c.y - h.y);
	return dx * dx + dy * dy <= r2;
}

export function intersectBezier3LineSeg2(
	{ p0, c1, c2, p3 }: CubicBezier,
	line: Line2D,
): { t1: number; t2: number }[] {
	// thanks, https://pomax.github.io/bezierinfo/#intersections
	const norm = internalLineSeg2Normalisation(line);
	if (!norm) {
		return [];
	}
	const curve = {
		p0: norm.fn(p0),
		c1: norm.fn(c1),
		c2: norm.fn(c2),
		p3: norm.fn(p3),
	};
	const r: { t1: number; t2: number }[] = [];
	for (const t1 of bezier3TsAtYEq(curve, 0)) {
		if (t1 >= 0 && t1 <= 1) {
			const t2 = bezier3XAt(curve, t1);
			if (t2 >= 0 && t2 <= 1) {
				r.push({ t1, t2 });
			}
		}
	}
	return r;
}

export function intersectBezier3Rect(
	{ p0, c1, c2, p3 }: CubicBezier,
	rect: Rectangle,
	maxError?: number | undefined,
): { t1: number; d1: Sign }[] {
	const { c, d, aspect } = rect;
	const norm = internalLineSeg2Normalisation({ p0: c, p1: ptAdd(c, d) });
	if (!norm) {
		return [];
	}
	const curve = {
		p0: norm.fn(p0),
		c1: norm.fn(c1),
		c2: norm.fn(c2),
		p3: norm.fn(p3),
	};
	const ry = 0.5 * aspect;

	const range = { min: 0, max: 1, maxError };
	const xFn = bezier3PolynomialX(curve);
	const yFn = bezier3PolynomialY(curve);
	const crossings: { t1: number; d1: 1 | -1; y: boolean }[] = [];
	for (const [t1, d1] of polynomial4SignedRoots(yFn, -ry, range)) {
		crossings.push({ t1, d1: -d1 as 1 | -1, y: true });
	}
	for (const [t1, d1] of polynomial4SignedRoots(yFn, ry, range)) {
		crossings.push({ t1, d1, y: true });
	}
	for (const [t1, d1] of polynomial4SignedRoots(xFn, -0.5, range)) {
		crossings.push({ t1, d1: -d1 as 1 | -1, y: false });
	}
	for (const [t1, d1] of polynomial4SignedRoots(xFn, 0.5, range)) {
		crossings.push({ t1, d1, y: false });
	}
	if (!crossings.length) {
		return [];
	}
	const r: { t1: number; d1: Sign }[] = [];
	let prevT = -1;
	let inX = curve.p0.x > -0.5 && curve.p0.x < 0.5;
	let inY = curve.p0.y > -ry && curve.p0.y < ry;
	for (const { t1, d1, y } of crossings.sort((a, b) => a.t1 - b.t1)) {
		const newIn = d1 < 0;
		if (y) {
			if (newIn === inY) {
				continue;
			}
			inY = newIn;
			if (!inX) {
				continue;
			}
		} else {
			if (newIn === inX) {
				continue;
			}
			inX = newIn;
			if (!inY) {
				continue;
			}
		}
		if (t1 !== prevT) {
			r.push({ t1, d1 });
		} else {
			r.pop();
		}
		prevT = t1;
	}
	return r;
}

export const intersectBezier3Circle = (
	curve: CubicBezier,
	circle: Circle,
	maxError?: number | undefined,
) => intersectBezier3CircleFn(curve)(circle.c, circle.r * circle.r, maxError);

export type CircleIntersectionFn = (
	center: Point2D,
	rad2: number,
	maxError?: number | undefined,
) => { t1: number; d1: Sign }[];

export function intersectBezier3CircleFn(
	curve: CubicBezier,
): CircleIntersectionFn {
	const norm = bezier3Normalise(curve);
	const normed = intersectNBezier3CircleFn(norm.curve);
	return (center, rad2, maxError) =>
		normed(norm.fn(center), rad2 / norm.scale2, maxError);
}

export const intersectNBezier3Circle = (
	curve: CubicBezier,
	circle: Circle,
	maxError?: number | undefined,
) => intersectNBezier3CircleFn(curve)(circle.c, circle.r * circle.r, maxError);

export function intersectNBezier3CircleFn(
	curve: CubicBezier,
): CircleIntersectionFn {
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
		if (!isOverlapAABox2CircleR2(bounds, center, rad2)) {
			return [];
		}
		const c1c = ptDot(c1, center) * 6;
		const c2c = ptDot(c2, center) * 6;

		// terms for t^n in distance equation
		return polynomial7SignedRoots(
			[
				ptLen2(center),
				-c1c,
				a + 2 * c1c - c2c,
				f3 - c1c + c2c - 2 * ptDot(p3, center),
				f4,
				f5,
				f6,
			],
			rad2,
			{ min: 0, max: 1, maxError },
		).map(([t1, d1]) => ({ t1, d1 }));
	};
}

export function cutBezier3Rect(
	curve: CubicBezier,
	rect: Rectangle,
): (CubicBezier & { inside: boolean })[] {
	const intersections = intersectBezier3Rect(curve, rect);
	if (!intersections.length) {
		return [{ ...curve, inside: rectContains(rect, curve.p0) }];
	}
	const phase = intersections[0]!.d1 > 0 ? 0 : 1;
	return bezier3Split(
		curve,
		intersections.map((i) => i.t1),
		0,
	).map((curve, i) => ({ ...curve, inside: (i & 1) === phase }));
}

export function cutBezier3Circle(
	curve: CubicBezier,
	circle: Circle,
	fn: CircleIntersectionFn,
): (CubicBezier & { inside: boolean })[] {
	const rr = circle.r * circle.r;
	const intersections = fn(circle.c, rr);
	if (!intersections.length) {
		return [{ ...curve, inside: circleContains(circle, curve.p0) }];
	}
	const phase = intersections[0]!.d1 > 0 ? 0 : 1;
	return bezier3Split(
		curve,
		intersections.map((i) => i.t1),
		0,
	).map((curve, i) => ({ ...curve, inside: (i & 1) === phase }));
}

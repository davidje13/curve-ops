import type { Sign } from '../../../types/numeric.mts';
import type { Ball } from '../Ball.mts';
import type { AxisAlignedBox2D } from './AxisAlignedBox2D.mts';
import { line2At, line2TNearestPt, type Line2D } from './Line2D.mts';
import {
	ptAdd,
	ptDist2,
	ptFromVec,
	ptMad,
	ptMul,
	ptRot90,
	ptSub,
	ptSVG,
	vecFromPt,
	type Point2D,
} from './Point2D.mts';

export interface Circle {
	readonly c: Point2D;
	readonly r: number;
}

export const circleFromBall = ({ c, r }: Ball<2>): Circle => ({
	c: ptFromVec(c),
	r,
});

export const ballFromCircle = ({ c, r }: Circle): Ball<2> => ({
	c: vecFromPt(c),
	r,
});

export const circleArea = ({ r }: Circle) => Math.PI * r * r;
export const circleCircumference = ({ r }: Circle) => 2 * Math.PI * r;

export const circleBounds = ({ c, r }: Circle): AxisAlignedBox2D => ({
	l: { x: c.x - r, y: c.y - r },
	h: { x: c.x + r, y: c.y + r },
});

export const circleContains = ({ c, r }: Circle, pt: Point2D) =>
	ptDist2(c, pt) < r * r;

export function intersectCircleCircle(a: Circle, b: Circle): Point2D[] {
	const d2 = ptDist2(a.c, b.c);
	if (d2 > (a.r + b.r) * (a.r + b.r) || d2 < (a.r - b.r) * (a.r - b.r)) {
		return [];
	}
	const d = Math.sqrt(d2);
	const p = (d2 + a.r * a.r - b.r * b.r) * (0.5 / d);
	const t2 = a.r * a.r - p * p;
	const ab = ptSub(b.c, a.c);
	const c = ptMad(ab, p / d, a.c);
	if (t2 <= 0) {
		return [c];
	}
	const n = ptRot90(ptMul(ab, Math.sqrt(t2) / d));
	return [ptAdd(c, n), ptSub(c, n)];
}

export function intersectLine2Circle(
	line: Line2D,
	{ c, r }: Circle,
): { t1: number; d1: Sign }[] {
	const t = line2TNearestPt(line, c);
	const s = r * r - ptDist2(c, line2At(line, t));
	if (s < 0) {
		return [];
	}
	if (!s) {
		return [{ t1: t, d1: 0 }];
	}
	const dt = Math.sqrt(s / ptDist2(line.p0, line.p1));
	return [
		{ t1: t - dt, d1: -1 },
		{ t1: t + dt, d1: 1 },
	];
}

export const intersectLineSeg2Circle = (line: Line2D, circle: Circle) =>
	intersectLine2Circle(line, circle).filter(({ t1 }) => t1 >= 0 && t1 <= 1);

export const circleSVG = ({ c, r }: Circle, precision?: number | undefined) =>
	`M${ptSVG({ x: c.x, y: c.y - r }, precision)}a${r} ${r} 0 0 0 0 ${
		r * 2
	}a${r} ${r} 0 0 0 0 ${-r * 2}Z`;

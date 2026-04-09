import { polynomial2Roots, type Polynomial } from '../../Polynomial.mts';
import type { Bezier } from '../Bezier.mts';
import type { AxisAlignedBox2D } from './AxisAlignedBox2D.mts';
import {
	matFromPts,
	ptAdd,
	ptCross,
	ptDot,
	ptLen2,
	ptLerp,
	ptNorm,
	ptRot90,
	ptsFromMat,
	ptSub,
	ptSVG,
	type Point2D,
} from './Point2D.mts';

export interface Line2D {
	readonly p0: Point2D;
	readonly p1: Point2D;
}

export const line2FromPts = (p0: Point2D, p1: Point2D): Line2D => ({
	p0,
	p1,
});

export const line2FromBezier = (curve: Bezier<2, 2>): Line2D =>
	line2FromPts(...ptsFromMat(curve));

export const bezierFromLine2 = ({ p0, p1 }: Line2D): Bezier<2, 2> =>
	matFromPts([p0, p1]);

export const line2At = ({ p0, p1 }: Line2D, t: number) => ptLerp(p0, p1, t);

export const line2XAt = ({ p0, p1 }: Line2D, t: number) =>
	p0.x + (p1.x - p0.x) * t;

export const line2YAt = ({ p0, p1 }: Line2D, t: number) =>
	p0.y + (p1.y - p0.y) * t;

export const line2PolynomialX = ({ p0, p1 }: Line2D): Polynomial<2> => [
	p0.x,
	p1.x - p0.x,
];

export const line2PolynomialY = ({ p0, p1 }: Line2D): Polynomial<2> => [
	p0.y,
	p1.y - p0.y,
];

export const line2Derivative = ({ p0, p1 }: Line2D) => ptSub(p1, p0);

export const line2Tangent = (line: Line2D): Point2D =>
	ptNorm(line2Derivative(line));

export const line2Normal = (line: Line2D): Point2D =>
	ptRot90(line2Tangent(line));

export const line2Transform = (
	{ p0, p1 }: Line2D,
	transform: (pt: Point2D) => Point2D,
): Line2D => ({
	p0: transform(p0),
	p1: transform(p1),
});

export const line2Scale = (
	{ p0, p1 }: Line2D,
	scaleX: number,
	scaleY = scaleX,
): Line2D => ({
	p0: { x: p0.x * scaleX, y: p0.y * scaleY },
	p1: { x: p1.x * scaleX, y: p1.y * scaleY },
});

export const line2Translate = ({ p0, p1 }: Line2D, shift: Point2D): Line2D => ({
	p0: ptAdd(p0, shift),
	p1: ptAdd(p1, shift),
});

export const line2TsAtXEq = (line: Line2D, x: number) =>
	polynomial2Roots(line2PolynomialX(line), x);

export const line2TsAtYEq = (line: Line2D, y: number) =>
	polynomial2Roots(line2PolynomialY(line), y);

export const line2Bounds = (line: Line2D): AxisAlignedBox2D => ({
	l: { x: Math.min(line.p0.x, line.p1.x), y: Math.min(line.p0.y, line.p1.y) },
	h: { x: Math.max(line.p0.x, line.p1.x), y: Math.max(line.p0.y, line.p1.y) },
});

export function line2TNearestPt({ p0, p1 }: Line2D, pt: Point2D): number {
	const lineD = ptSub(p1, p0);
	return ptDot(ptSub(pt, p0), lineD) / ptLen2(lineD);
}

export function intersectLine2Line2(
	a: Line2D,
	b: Line2D,
): { t1: number; t2: number }[] {
	const ab = ptSub(b.p0, a.p0);
	const aD = ptSub(a.p1, a.p0);
	const bD = ptSub(b.p1, b.p0);

	const den = ptCross(aD, bD);
	return den ? [{ t1: ptCross(ab, bD) / den, t2: ptCross(ab, aD) / den }] : [];
}

export const line2SVG = (
	{ p0, p1 }: Line2D,
	precision?: number | undefined,
	prefix = 'M',
) => `${prefix}${ptSVG(p0, precision)}L${ptSVG(p1, precision)}`;

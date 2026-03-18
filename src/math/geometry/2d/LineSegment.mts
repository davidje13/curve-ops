import { polynomial2Roots, type Polynomial } from '../../Polynomial.mts';
import type { Bezier } from '../Bezier.mts';
import type { AxisAlignedBox } from './AxisAlignedBox.mts';
import {
	matFromPts,
	ptAdd,
	ptCross,
	ptDist,
	ptLen,
	ptLen2,
	ptLerp,
	ptMid,
	ptMul,
	ptNorm,
	ptRot90,
	ptsFromMat,
	ptSub,
	ptSVG,
	ptTransform,
	type Pt,
} from './Pt.mts';

export interface LineSegment {
	readonly p0: Pt;
	readonly p1: Pt;
}

export const lineFromPts = (p0: Pt, p1: Pt): LineSegment => ({ p0, p1 });

export const lineFromBezier = (curve: Bezier<2, 2>): LineSegment =>
	lineFromPts(...ptsFromMat(curve));

export const bezierFromLine = ({ p0, p1 }: LineSegment): Bezier<2, 2> =>
	matFromPts([p0, p1]);

export const lineAt = ({ p0, p1 }: LineSegment, t: number) => ptLerp(p0, p1, t);

export const lineXAt = ({ p0, p1 }: LineSegment, t: number) =>
	p0.x + (p1.x - p0.x) * t;

export const lineYAt = ({ p0, p1 }: LineSegment, t: number) =>
	p0.y + (p1.y - p0.y) * t;

export const linePolynomialX = ({ p0, p1 }: LineSegment): Polynomial<2> => [
	p0.x,
	p1.x - p0.x,
];

export const linePolynomialY = ({ p0, p1 }: LineSegment): Polynomial<2> => [
	p0.y,
	p1.y - p0.y,
];

export const lineMidpoint = ({ p0, p1 }: LineSegment) => ptMid(p0, p1);

export const lineDerivative = ({ p0, p1 }: LineSegment) => ptSub(p1, p0);

export const lineTangent = (line: LineSegment): Pt =>
	ptNorm(lineDerivative(line));

export const lineNormal = (line: LineSegment): Pt => ptRot90(lineTangent(line));

export const lineTranslate = (
	{ p0, p1 }: LineSegment,
	shift: Pt,
): LineSegment => ({
	p0: ptAdd(p0, shift),
	p1: ptAdd(p1, shift),
});

export const lineTsAtXEq = (line: LineSegment, x: number) =>
	polynomial2Roots(linePolynomialX(line), x);

export const lineTsAtYEq = (line: LineSegment, y: number) =>
	polynomial2Roots(linePolynomialY(line), y);

export const lineBounds = (line: LineSegment): AxisAlignedBox => ({
	l: { x: Math.min(line.p0.x, line.p1.x), y: Math.min(line.p0.y, line.p1.y) },
	h: { x: Math.max(line.p0.x, line.p1.x), y: Math.max(line.p0.y, line.p1.y) },
});

export const lineLength = ({ p0, p1 }: LineSegment) => ptDist(p1, p0);

export function internalLineScaledNormalisation({ p0, p1 }: LineSegment) {
	const d = ptSub(p1, p0);
	const scale2 = ptLen2(d);
	if (!scale2) {
		return null;
	}
	const s = ptMul(d, 1 / scale2);
	const fn = ptTransform(
		s.x,
		s.y,
		-p0.x * s.x - p0.y * s.y,
		-s.y,
		s.x,
		p0.x * s.y - p0.y * s.x,
	);
	return { scale2, fn };
}

export function internalLineUnscaledNormalisation({ p0, p1 }: LineSegment) {
	const d = ptSub(p1, p0);
	const l = ptLen(d);
	if (!l) {
		return { l: 0, fn: (pt: Pt) => ptSub(pt, p0) };
	}
	const s = ptMul(d, 1 / l);
	const fn = ptTransform(
		s.x,
		s.y,
		-p0.x * s.x - p0.y * s.y,
		-s.y,
		s.x,
		p0.x * s.y - p0.y * s.x,
	);
	return { l, fn };
}

export function lineBisect(
	{ p0, p1 }: LineSegment,
	t = 0.5,
): [LineSegment, LineSegment] {
	const mid = ptLerp(p0, p1, t);
	return [
		{ p0, p1: mid },
		{ p0: mid, p1 },
	];
}

export function lineSplit(
	{ p0, p1 }: LineSegment,
	splits: readonly number[],
	minRange = 1e-6,
): LineSegment[] {
	let pp0 = p0;
	let pt = 0;
	const r = [];
	for (const t of splits.filter((t) => t > 0 && t < 1).sort()) {
		if (t <= pt + minRange) {
			continue;
		}
		const mid = ptLerp(p0, p1, t);
		r.push({ p0: pp0, p1: mid });
		pp0 = mid;
		pt = t;
	}
	r.push({ p0: pp0, p1 });
	return r;
}

export const lineSVG = (
	{ p0, p1 }: LineSegment,
	precision?: number | undefined,
	prefix = 'M',
) => `${prefix}${ptSVG(p0, precision)}L${ptSVG(p1, precision)}`;

export function intersectLineLine(
	a: LineSegment,
	b: LineSegment,
): { t1: number; t2: number }[] {
	const ab = ptSub(b.p0, a.p0);
	const aD = ptSub(a.p1, a.p0);
	const bD = ptSub(b.p1, b.p0);

	const den = ptCross(aD, bD);
	if (den) {
		const t1 = ptCross(ab, bD) / den;
		const t2 = ptCross(ab, aD) / den;
		if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
			return [{ t1, t2 }];
		}
	}
	return [];
}

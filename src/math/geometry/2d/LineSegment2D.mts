import { line2TNearestPt, type Line2D } from './Line2D.mts';
import {
	ptCross,
	ptDist,
	ptLen2,
	ptLerp,
	ptMid,
	ptMul,
	ptSub,
	ptTransform,
	type Point2D,
} from './Point2D.mts';

export const lineSeg2Midpoint = ({ p0, p1 }: Line2D) => ptMid(p0, p1);

// open area functions compute the area of the shape from 0,0 to the start of the curve,
// along the curve, and back to 0,0. They can be added together to compute the volume of
// shapes with edges made of multiple curves.
export const lineSeg2OpenArea = ({ p0, p1 }: Line2D) => 0.5 * ptCross(p1, p0);

export const lineSeg2Length = ({ p0, p1 }: Line2D) => ptDist(p1, p0);

export function lineSeg2Bisect({ p0, p1 }: Line2D, t = 0.5): [Line2D, Line2D] {
	const mid = ptLerp(p0, p1, t);
	return [
		{ p0, p1: mid },
		{ p0: mid, p1 },
	];
}

export function lineSeg2Split(
	{ p0, p1 }: Line2D,
	splits: readonly number[],
	minRange = 1e-6,
): Line2D[] {
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

export function intersectLineSeg2LineSeg2(
	a: Line2D,
	b: Line2D,
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

export const lineSeg2TNearestPt2 = (line: Line2D, pt: Point2D) =>
	Math.max(0, Math.min(1, line2TNearestPt(line, pt)));

export function internalLineSeg2Normalisation({ p0, p1 }: Line2D) {
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

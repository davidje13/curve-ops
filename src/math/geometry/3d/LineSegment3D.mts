import { line3TNearestPt3, type Line3D } from './Line3D.mts';
import { pt3Dist, pt3Lerp, pt3Mid, type Point3D } from './Point3D.mts';

export const lineSeg3Midpoint = ({ p0, p1 }: Line3D) => pt3Mid(p0, p1);

export const lineSeg3Length = ({ p0, p1 }: Line3D) => pt3Dist(p1, p0);

export function lineSeg3Bisect({ p0, p1 }: Line3D, t = 0.5): [Line3D, Line3D] {
	const mid = pt3Lerp(p0, p1, t);
	return [
		{ p0, p1: mid },
		{ p0: mid, p1 },
	];
}

export function lineSeg3Split(
	{ p0, p1 }: Line3D,
	splits: readonly number[],
	minRange = 1e-6,
): Line3D[] {
	let pp0 = p0;
	let pt = 0;
	const r = [];
	for (const t of splits.filter((t) => t > 0 && t < 1).sort()) {
		if (t <= pt + minRange) {
			continue;
		}
		const mid = pt3Lerp(p0, p1, t);
		r.push({ p0: pp0, p1: mid });
		pp0 = mid;
		pt = t;
	}
	r.push({ p0: pp0, p1 });
	return r;
}

export const lineSeg3TNearestPt3 = (line: Line3D, pt: Point3D) =>
	Math.max(0, Math.min(1, line3TNearestPt3(line, pt)));

import { vecDist, vecLerp, vecMid, type Vector } from '../Vector.mts';
import { lineTNearestVec, type Line } from './Line.mts';

export const lineSegMidpoint = <Dim extends number>({ p0, p1 }: Line<Dim>) =>
	vecMid(p0, p1);

export const lineSegLength = <Dim extends number>({ p0, p1 }: Line<Dim>) =>
	vecDist(p1, p0);

export function lineSegBisect<Dim extends number>(
	{ p0, p1 }: Line<Dim>,
	t = 0.5,
): [Line<Dim>, Line<Dim>] {
	const mid = vecLerp(p0, p1, t);
	return [
		{ p0, p1: mid },
		{ p0: mid, p1 },
	];
}

export function lineSegSplit<Dim extends number>(
	{ p0, p1 }: Line<Dim>,
	splits: readonly number[],
	minRange = 1e-6,
): Line<Dim>[] {
	let pp0 = p0;
	let pt = 0;
	const r = [];
	for (const t of splits.filter((t) => t > 0 && t < 1).sort()) {
		if (t <= pt + minRange) {
			continue;
		}
		const mid = vecLerp(p0, p1, t);
		r.push({ p0: pp0, p1: mid });
		pp0 = mid;
		pt = t;
	}
	r.push({ p0: pp0, p1 });
	return r;
}

export const lineSegTNearestVec = <Dim extends number>(
	line: Line<Dim>,
	pt: Vector<Dim>,
) => Math.max(0, Math.min(1, lineTNearestVec(line, pt)));

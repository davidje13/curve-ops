import type { Sign } from '../../types/numeric.mts';
import { vecAddScalar, vecDist2, type Vector } from '../Vector.mts';
import type { AxisAlignedBox } from './AxisAlignedBox.mts';
import { lineAt, lineTNearestVec, type Line } from './Line.mts';

export interface Ball<Dim extends number> {
	readonly c: Vector<Dim>;
	readonly r: number;
}

export const ballBounds = <Dim extends number>({
	c,
	r,
}: Ball<Dim>): AxisAlignedBox<Dim> => ({
	l: vecAddScalar(c, -r),
	h: vecAddScalar(c, r),
});

export const ballContains = <Dim extends number>(
	{ c, r }: Ball<Dim>,
	pt: Vector<Dim>,
) => vecDist2(c, pt) < r * r;

export function intersectLineBall<Dim extends number>(
	line: Line<Dim>,
	{ c, r }: Ball<Dim>,
): { t1: number; d1: Sign }[] {
	const t = lineTNearestVec(line, c);
	const s = r * r - vecDist2(c, lineAt(line, t));
	if (s < 0) {
		return [];
	}
	if (!s) {
		return [{ t1: t, d1: 0 }];
	}
	const dt = Math.sqrt(s / vecDist2(line.p0, line.p1));
	return [
		{ t1: t - dt, d1: -1 },
		{ t1: t + dt, d1: 1 },
	];
}

export const intersectLineSegBall = <Dim extends number>(
	line: Line<Dim>,
	ball: Ball<Dim>,
) => intersectLineBall(line, ball).filter(({ t1 }) => t1 >= 0 && t1 <= 1);

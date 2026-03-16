import type { SizedArray, SizeOf } from '../../../util/SizedArray.mts';
import { internalMatFromFlat, type Matrix } from '../../Matrix.mts';
import type { Vector } from '../../Vector.mts';

export interface Pt {
	readonly x: number;
	readonly y: number;
	z?: never;
}

export function ptsFromMat<N extends number>({
	v,
	m,
}: Matrix<N, 2>): SizedArray<Pt, N> {
	const r: Pt[] = [];
	for (let i = 0; i < m; ++i) {
		r.push({ x: v[i * 2]!, y: v[i * 2 + 1]! });
	}
	return r as SizedArray<Pt, N>;
}

export function matFromPts<const T extends readonly Pt[]>(pts: T) {
	const v: number[] = [];
	for (const pt of pts) {
		v.push(pt.x, pt.y);
	}
	return internalMatFromFlat(v, pts.length as SizeOf<T>, 2);
}

export const ptFromVec = ({ v: [x, y] }: Vector<2>): Pt => ({ x, y });

export const vecFromPt = ({ x, y }: Pt): Vector<2> =>
	internalMatFromFlat([x, y], 1, 2);

export const PT0: { readonly x: 0; readonly y: 0 } = { x: 0, y: 0 };

export const ptDot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;
export const ptCross = (a: Pt, b: Pt) => a.x * b.y - a.y * b.x;
export const ptReflect = (v: Pt, surfaceNorm: Pt) =>
	ptMad(surfaceNorm, -2 * ptDot(v, surfaceNorm), v);

export const ptLen2 = ({ x, y }: Pt) => x * x + y * y;
export const ptLen = ({ x, y }: Pt) => Math.hypot(x, y);

export const ptDist2 = (a: Pt, b: Pt) =>
	(a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
export const ptDist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

export const ptNorm = (pt: Pt, length = 1) => ptMul(pt, length / ptLen(pt));
export const ptRot90 = ({ x, y }: Pt) => ({ x: -y, y: x });

export const ptAngle = (a: Pt, b: Pt) =>
	Math.acos(
		Math.max(-1, Math.min(1, ptDot(a, b) / Math.sqrt(ptLen2(a) * ptLen2(b)))),
	);

export const ptSignedAngle = (a: Pt, b: Pt) =>
	Math.atan2(ptCross(a, b), ptDot(a, b));

export const ptAdd = (a: Pt, b: Pt): Pt => ({
	x: a.x + b.x,
	y: a.y + b.y,
});
export const ptMul = (pt: Pt, m: number): Pt => ({
	x: pt.x * m,
	y: pt.y * m,
});
export const ptMad = (a: Pt, m: number, b: Pt): Pt => ({
	x: a.x * m + b.x,
	y: a.y * m + b.y,
});
export const ptSub = (a: Pt, b: Pt): Pt => ({
	x: a.x - b.x,
	y: a.y - b.y,
});

export const ptLerp = (a: Pt, b: Pt, t: number): Pt => ({
	x: a.x + (b.x - a.x) * t,
	y: a.y + (b.y - a.y) * t,
});

export const ptMid = (a: Pt, b: Pt): Pt => ({
	x: (a.x + b.x) * 0.5,
	y: (a.y + b.y) * 0.5,
});

export const ptTransform =
	(
		mxx: number,
		mxy: number,
		dx: number,
		myx: number,
		myy: number,
		dy: number,
	) =>
	(pt: Pt): Pt => ({
		x: pt.x * mxx + pt.y * mxy + dx,
		y: pt.x * myx + pt.y * myy + dy,
	});

export const ptSVG = (pt: Pt, precision = 6) =>
	`${pt.x.toFixed(precision)} ${pt.y.toFixed(precision)}`;

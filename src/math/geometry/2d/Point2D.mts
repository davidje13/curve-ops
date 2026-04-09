import type { SizedArray, SizeOf } from '../../../util/SizedArray.mts';
import { internalMatFromFlat, type Matrix } from '../../Matrix.mts';
import type { Vector } from '../../Vector.mts';

export interface Point2D {
	readonly x: number;
	readonly y: number;
	z?: never;
}

export function ptsFromMat<N extends number>({
	v,
	m,
}: Matrix<N, 2>): SizedArray<Point2D, N> {
	const r: Point2D[] = [];
	for (let i = 0; i < m; ++i) {
		r.push({ x: v[i * 2]!, y: v[i * 2 + 1]! });
	}
	return r as SizedArray<Point2D, N>;
}

export function matFromPts<const T extends readonly Point2D[]>(pts: T) {
	const v: number[] = [];
	for (const pt of pts) {
		v.push(pt.x, pt.y);
	}
	return internalMatFromFlat(v, pts.length as SizeOf<T>, 2);
}

export const ptFromVec = ({ v: [x, y] }: Vector<2>): Point2D => ({ x, y });

export const vecFromPt = ({ x, y }: Point2D): Vector<2> =>
	internalMatFromFlat([x, y], 1, 2);

export const PT00: { readonly x: 0; readonly y: 0 } = { x: 0, y: 0 };

export const ptDot = (a: Point2D, b: Point2D) => a.x * b.x + a.y * b.y;
export const ptCross = (a: Point2D, b: Point2D) => a.x * b.y - a.y * b.x;
export const ptReflect = (v: Point2D, surfaceNorm: Point2D) =>
	ptMad(surfaceNorm, -2 * ptDot(v, surfaceNorm), v);

export const ptLen2 = ({ x, y }: Point2D) => x * x + y * y;
export const ptLen = ({ x, y }: Point2D) => Math.hypot(x, y);

export const ptDist2 = (a: Point2D, b: Point2D) =>
	(a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
export const ptDist = (a: Point2D, b: Point2D) =>
	Math.hypot(a.x - b.x, a.y - b.y);

export const ptNorm = (pt: Point2D, length = 1) =>
	ptMul(pt, length / ptLen(pt));
export const ptRot90 = ({ x, y }: Point2D) => ({ x: -y, y: x });

export const ptAngle = (a: Point2D, b: Point2D) =>
	Math.acos(
		Math.max(-1, Math.min(1, ptDot(a, b) / Math.sqrt(ptLen2(a) * ptLen2(b)))),
	);

export const ptSignedAngle = (a: Point2D, b: Point2D) =>
	Math.atan2(ptCross(a, b), ptDot(a, b));

export const ptAdd = (a: Point2D, b: Point2D): Point2D => ({
	x: a.x + b.x,
	y: a.y + b.y,
});
export const ptMul = (pt: Point2D, m: number): Point2D => ({
	x: pt.x * m,
	y: pt.y * m,
});
export const ptMad = (a: Point2D, m: number, b: Point2D): Point2D => ({
	x: a.x * m + b.x,
	y: a.y * m + b.y,
});
export const ptSub = (a: Point2D, b: Point2D): Point2D => ({
	x: a.x - b.x,
	y: a.y - b.y,
});

export const ptLerp = (a: Point2D, b: Point2D, t: number): Point2D => ({
	x: a.x + (b.x - a.x) * t,
	y: a.y + (b.y - a.y) * t,
});

export const ptMid = (a: Point2D, b: Point2D): Point2D => ({
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
	(pt: Point2D): Point2D => ({
		x: pt.x * mxx + pt.y * mxy + dx,
		y: pt.x * myx + pt.y * myy + dy,
	});

export const ptSVG = (pt: Point2D, precision = 6) =>
	`${pt.x.toFixed(precision)} ${pt.y.toFixed(precision)}`;

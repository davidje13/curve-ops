import type { Polyline } from '../Polyline.mts';
import { ptCross, ptDist, ptSVG, type Point2D } from './Point2D.mts';

export interface PointWithDist2D extends Point2D {
	readonly d: number;
}

export type Polyline2D = readonly PointWithDist2D[];

export function polyline2DFromPts(points: readonly Point2D[]): Polyline2D {
	if (!points.length) {
		return [];
	}
	let distance = 0;
	let prev = points[0]!;
	const r: PointWithDist2D[] = [{ ...prev, d: 0 }];
	for (let i = 1; i < points.length; ++i) {
		const pt = points[i]!;
		distance += ptDist(prev, pt);
		r.push({ ...pt, d: distance });
		prev = pt;
	}
	return r;
}

export function polyline2DOpenArea(points: readonly Point2D[]): number {
	if (points.length < 2) {
		return 0;
	}

	let sum = 0;
	let prev = points[points.length - 1]!;
	for (const cur of points) {
		sum += ptCross(cur, prev);
		prev = cur;
	}
	return sum * 0.5;
}

export const polyline2DSVG = (
	poly: readonly Point2D[],
	precision?: number | undefined,
	prefix = 'M',
) => prefix + poly.map((pt) => ptSVG(pt, precision)).join('L');

export const polyline2DFromPolyline = (poly: Polyline<2>): Polyline2D =>
	poly.map((pt) => ({ x: pt.v[0], y: pt.v[1], d: pt.d }));

export const polylineFromPolyline2D = (poly: Polyline2D): Polyline<2> =>
	poly.map(({ x, y, d }) => ({ v: [x, y], m: 1, n: 2, d }));

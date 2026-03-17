import type { Polyline } from '../Polyline.mts';
import { ptDist, ptSVG, type Pt } from './Pt.mts';

export interface PtWithDist extends Pt {
	readonly d: number;
}

export type Polyline2D = readonly PtWithDist[];

export function polyline2DFromPts(points: readonly Pt[]): Polyline2D {
	if (!points.length) {
		return [];
	}
	let distance = 0;
	let prev = points[0]!;
	const r: PtWithDist[] = [{ ...prev, d: 0 }];
	for (let i = 1; i < points.length; ++i) {
		const pt = points[i]!;
		distance += ptDist(prev, pt);
		r.push({ ...pt, d: distance });
		prev = pt;
	}
	return r;
}

export const polyline2DSVG = (
	poly: readonly Pt[],
	precision?: number | undefined,
	prefix = 'M',
) => prefix + poly.map((pt) => ptSVG(pt, precision)).join('L');

export const polyline2DFromPolyline = (poly: Polyline<2>): Polyline2D =>
	poly.map((pt) => ({ x: pt.v[0], y: pt.v[1], d: pt.d }));

export const polylineFromPolyline2D = (poly: Polyline2D): Polyline<2> =>
	poly.map(({ x, y, d }) => ({ v: [x, y], m: 1, n: 2, d }));

import { bezierAtMulti, type Bezier } from '../Bezier.mts';
import { bezier3FromPts, type CubicBezier } from './CubicBezier.mts';
import { lineFromPts, type LineSegment } from './LineSegment.mts';
import { matFromPts, ptsFromMat, ptSVG } from './Pt.mts';
import { bezier2FromPts, type QuadraticBezier } from './QuadraticBezier.mts';

export const bezierFromLine = ({ p0, p1 }: LineSegment): Bezier<2, 2> =>
	matFromPts([p0, p1]);

export const bezierFromBezier2 = ({
	p0,
	c1,
	p2,
}: QuadraticBezier): Bezier<3, 2> => matFromPts([p0, c1, p2]);

export const bezierFromBezier3 = ({
	p0,
	c1,
	c2,
	p3,
}: CubicBezier): Bezier<4, 2> => matFromPts([p0, c1, c2, p3]);

export const lineFromBezier = (curve: Bezier<2, 2>): LineSegment =>
	lineFromPts(...ptsFromMat(curve));

export const bezier2FromBezier = (curve: Bezier<3, 2>): QuadraticBezier =>
	bezier2FromPts(...ptsFromMat(curve));

export const bezier3FromBezier = (curve: Bezier<4, 2>): CubicBezier =>
	bezier3FromPts(...ptsFromMat(curve));

export function bezierSVG(
	curve: Bezier<number, 2>,
	precision?: number | undefined,
	prefix = 'M',
	controlLines = false,
): string {
	const pts = ptsFromMat(curve).map((pt) => ptSVG(pt, precision));
	if (controlLines || curve.m < 3) {
		return prefix + pts.join('L');
	}
	switch (curve.m) {
		case 3:
			return `${prefix}${pts[0]}Q${pts[1]} ${pts[2]}`;
		case 4:
			return `${prefix}${pts[0]}C${pts[1]} ${pts[2]} ${pts[3]}`;
		default:
			const n = 30; // TODO: pick dynamically and/or pick smarter t values
			const ts: number[] = [];
			for (let i = 0; i <= n; ++i) {
				ts.push(i / n);
			}
			return (
				prefix +
				ptsFromMat(bezierAtMulti(curve, ts))
					.map((pt) => ptSVG(pt, precision))
					.join('L')
			);
	}
}

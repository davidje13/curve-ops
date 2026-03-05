import type { Bezier } from '../Bezier.mts';
import { bezier3FromPts, type CubicBezier } from './CubicBezier.mts';
import { lineFromPts, type Line } from './Line.mts';
import { matFromPts, ptsFromMat } from './Pt.mts';
import { bezier2FromPts, type QuadraticBezier } from './QuadraticBezier.mts';

export const bezierFromLine = ({ p0, p1 }: Line): Bezier<2, 2> =>
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

export const lineFromBezier = (curve: Bezier<2, 2>): Line =>
	lineFromPts(...ptsFromMat(curve));

export const bezier2FromBezier = (curve: Bezier<3, 2>): QuadraticBezier =>
	bezier2FromPts(...ptsFromMat(curve));

export const bezier3FromBezier = (curve: Bezier<4, 2>): CubicBezier =>
	bezier3FromPts(...ptsFromMat(curve));

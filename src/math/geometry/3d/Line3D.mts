import { polynomial2Roots, type Polynomial } from '../../Polynomial.mts';
import type { Bezier } from '../Bezier.mts';
import type { Line } from '../Line.mts';
import {
	matFromPt3s,
	pt3Add,
	pt3Dot,
	pt3FromVec,
	pt3Len2,
	pt3Lerp,
	pt3Norm,
	pt3sFromMat,
	pt3Sub,
	vecFromPt3,
	type Point3D,
} from './Point3D.mts';

export interface Line3D {
	readonly p0: Point3D;
	readonly p1: Point3D;
}

export const line3FromPt3s = (p0: Point3D, p1: Point3D): Line3D => ({
	p0,
	p1,
});

export const line3FromLine = ({ p0, p1 }: Line<3>): Line3D => ({
	p0: pt3FromVec(p0),
	p1: pt3FromVec(p1),
});

export const lineFromLine3 = ({ p0, p1 }: Line3D): Line<3> => ({
	p0: vecFromPt3(p0),
	p1: vecFromPt3(p1),
});

export const line3FromBezier = (curve: Bezier<2, 3>): Line3D =>
	line3FromPt3s(...pt3sFromMat(curve));

export const bezierFromLine3 = ({ p0, p1 }: Line3D): Bezier<2, 3> =>
	matFromPt3s([p0, p1]);

export const line3At = ({ p0, p1 }: Line3D, t: number) => pt3Lerp(p0, p1, t);

export const line3XAt = ({ p0, p1 }: Line3D, t: number) =>
	p0.x + (p1.x - p0.x) * t;

export const line3YAt = ({ p0, p1 }: Line3D, t: number) =>
	p0.y + (p1.y - p0.y) * t;

export const line3ZAt = ({ p0, p1 }: Line3D, t: number) =>
	p0.z + (p1.z - p0.z) * t;

export const line3PolynomialX = ({ p0, p1 }: Line3D): Polynomial<2> => [
	p0.x,
	p1.x - p0.x,
];

export const line3PolynomialY = ({ p0, p1 }: Line3D): Polynomial<2> => [
	p0.y,
	p1.y - p0.y,
];

export const line3PolynomialZ = ({ p0, p1 }: Line3D): Polynomial<2> => [
	p0.z,
	p1.z - p0.z,
];

export const line3Derivative = ({ p0, p1 }: Line3D) => pt3Sub(p1, p0);

export const line3Tangent = (line: Line3D): Point3D =>
	pt3Norm(line3Derivative(line));

export const line3Scale = (
	{ p0, p1 }: Line3D,
	scaleX: number,
	scaleY = scaleX,
	scaleZ = scaleX,
): Line3D => ({
	p0: { x: p0.x * scaleX, y: p0.y * scaleY, z: p0.z * scaleZ },
	p1: { x: p1.x * scaleX, y: p1.y * scaleY, z: p1.z * scaleZ },
});

export const line3Translate = ({ p0, p1 }: Line3D, shift: Point3D): Line3D => ({
	p0: pt3Add(p0, shift),
	p1: pt3Add(p1, shift),
});

export const line3TsAtXEq = (line: Line3D, x: number) =>
	polynomial2Roots(line3PolynomialX(line), x);

export const line3TsAtYEq = (line: Line3D, y: number) =>
	polynomial2Roots(line3PolynomialY(line), y);

export const line3TsAtZEq = (line: Line3D, y: number) =>
	polynomial2Roots(line3PolynomialZ(line), y);

export function line3TNearestPt3({ p0, p1 }: Line3D, pt: Point3D): number {
	const lineD = pt3Sub(p1, p0);
	return pt3Dot(pt3Sub(pt, p0), lineD) / pt3Len2(lineD);
}

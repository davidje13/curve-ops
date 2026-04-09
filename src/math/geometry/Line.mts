import {
	matFromVecArray,
	vecAdd,
	vecArrayFromMat,
	vecDot,
	vecLen2,
	vecLerp,
	vecMul,
	vecSub,
	type Vector,
} from '../Vector.mts';
import type { Bezier } from './Bezier.mts';

export interface Line<Dim extends number> {
	readonly p0: Vector<Dim>;
	readonly p1: Vector<Dim>;
}

export const lineFromVecs = <Dim extends number>(
	p0: Vector<Dim>,
	p1: Vector<Dim>,
): Line<Dim> => ({ p0, p1 });

export const lineFromBezier = <Dim extends number>(
	curve: Bezier<2, Dim>,
): Line<Dim> =>
	lineFromVecs(...(vecArrayFromMat(curve) as [Vector<Dim>, Vector<Dim>]));

export const bezierFromLine = <Dim extends number>({
	p0,
	p1,
}: Line<Dim>): Bezier<2, Dim> => matFromVecArray([p0, p1]);

export const lineAt = <Dim extends number>({ p0, p1 }: Line<Dim>, t: number) =>
	vecLerp(p0, p1, t);

export const lineDerivative = <Dim extends number>({ p0, p1 }: Line<Dim>) =>
	vecSub(p1, p0);

export const lineScale = <Dim extends number>(
	{ p0, p1 }: Line<Dim>,
	scale: number,
): Line<Dim> => ({ p0: vecMul(p0, scale), p1: vecMul(p1, scale) });

export const lineTranslate = <Dim extends number>(
	{ p0, p1 }: Line<Dim>,
	shift: Vector<Dim>,
): Line<Dim> => ({
	p0: vecAdd(p0, shift),
	p1: vecAdd(p1, shift),
});

export function lineTNearestVec<Dim extends number>(
	{ p0, p1 }: Line<Dim>,
	pt: Vector<Dim>,
): number {
	const lineD = vecSub(p1, p0);
	return vecDot(vecSub(pt, p0), lineD) / vecLen2(lineD);
}

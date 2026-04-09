import type { SizedArray, SizeOf } from '../../../util/SizedArray.mts';
import { internalMatFromFlat, type Matrix } from '../../Matrix.mts';
import type { Vector } from '../../Vector.mts';

export interface Point3D {
	readonly x: number;
	readonly y: number;
	readonly z: number;
}

export function pt3sFromMat<N extends number>({
	v,
	m,
}: Matrix<N, 3>): SizedArray<Point3D, N> {
	const r: Point3D[] = [];
	for (let i = 0; i < m; ++i) {
		r.push({ x: v[i * 3]!, y: v[i * 3 + 1]!, z: v[i * 3 + 2]! });
	}
	return r as SizedArray<Point3D, N>;
}

export function matFromPt3s<const T extends readonly Point3D[]>(pts: T) {
	const v: number[] = [];
	for (const pt of pts) {
		v.push(pt.x, pt.y, pt.z);
	}
	return internalMatFromFlat(v, pts.length as SizeOf<T>, 3);
}

export const pt3FromVec = ({ v: [x, y, z] }: Vector<3>): Point3D => ({
	x,
	y,
	z,
});

export const vecFromPt3 = ({ x, y, z }: Point3D): Vector<3> =>
	internalMatFromFlat([x, y, z], 1, 3);

export const PT000: { readonly x: 0; readonly y: 0; readonly z: 0 } = {
	x: 0,
	y: 0,
	z: 0,
};

export const pt3Dot = (a: Point3D, b: Point3D) =>
	a.x * b.x + a.y * b.y + a.z * b.z;
export const pt3Cross = (a: Point3D, b: Point3D): Point3D => ({
	x: a.y * b.z - a.z * b.y,
	y: a.z * b.x - a.x * b.z,
	z: a.x * b.y - a.y * b.x,
});
export const pt3Reflect = (v: Point3D, surfaceNorm: Point3D) =>
	pt3Mad(surfaceNorm, -2 * pt3Dot(v, surfaceNorm), v);

export const pt3Len2 = ({ x, y, z }: Point3D) => x * x + y * y + z * z;
export const pt3Len = ({ x, y, z }: Point3D) => Math.hypot(x, y, z);

export const pt3Dist2 = (a: Point3D, b: Point3D) =>
	(a.x - b.x) * (a.x - b.x) +
	(a.y - b.y) * (a.y - b.y) +
	(a.z - b.z) * (a.z - b.z);
export const pt3Dist = (a: Point3D, b: Point3D) =>
	Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export const pt3Norm = (pt: Point3D, length = 1) =>
	pt3Mul(pt, length / pt3Len(pt));

export const pt3Angle = (a: Point3D, b: Point3D) =>
	Math.acos(
		Math.max(
			-1,
			Math.min(1, pt3Dot(a, b) / Math.sqrt(pt3Len2(a) * pt3Len2(b))),
		),
	);

export const pt3Add = (a: Point3D, b: Point3D): Point3D => ({
	x: a.x + b.x,
	y: a.y + b.y,
	z: a.z + b.z,
});
export const pt3Mul = (pt: Point3D, m: number): Point3D => ({
	x: pt.x * m,
	y: pt.y * m,
	z: pt.z * m,
});
export const pt3Mad = (a: Point3D, m: number, b: Point3D): Point3D => ({
	x: a.x * m + b.x,
	y: a.y * m + b.y,
	z: a.z * m + b.z,
});
export const pt3Sub = (a: Point3D, b: Point3D): Point3D => ({
	x: a.x - b.x,
	y: a.y - b.y,
	z: a.z - b.z,
});

export const pt3Lerp = (a: Point3D, b: Point3D, t: number): Point3D => ({
	x: a.x + (b.x - a.x) * t,
	y: a.y + (b.y - a.y) * t,
	z: a.z + (b.z - a.z) * t,
});

export const pt3Mid = (a: Point3D, b: Point3D): Point3D => ({
	x: (a.x + b.x) * 0.5,
	y: (a.y + b.y) * 0.5,
	z: (a.z + b.z) * 0.5,
});

import { matFrom, type Matrix } from './Matrix.mts';

export interface Quaternion {
	readonly x: number;
	readonly y: number;
	readonly z: number;
	readonly w: number;
}

export function mat3FromQuatNorm({ x, y, z, w }: Quaternion): Matrix<3, 3> {
	// thanks, http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToMatrix/
	const xx = x * x;
	const xy = x * y;
	const xz = x * z;
	const xw = x * w;
	const yy = y * y;
	const yz = y * z;
	const yw = y * w;
	const zz = z * z;
	const zw = z * w;
	const ww = w * w;
	const m = 1 / (xx + yy + zz + ww);
	return matFrom([
		[(xx - yy - zz + ww) * m, 2 * (xy - zw) * m, 2 * (xz + yw) * m],
		[2 * (xy + zw) * m, (-xx + yy - zz + ww) * m, 2 * (yz - xw) * m],
		[2 * (xz - yw) * m, 2 * (yz + xw) * m, (-xx - yy + zz + ww) * m],
	]);
}

export function mat3FromQuatNoNorm({ x, y, z, w }: Quaternion): Matrix<3, 3> {
	// thanks, http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToMatrix/
	const xx = x * x;
	const xy = x * y;
	const xz = x * z;
	const xw = x * w;
	const yy = y * y;
	const yz = y * z;
	const yw = y * w;
	const zz = z * z;
	const zw = z * w;
	const ww = w * w;
	return matFrom([
		[xx - yy - zz + ww, 2 * (xy - zw), 2 * (xz + yw)],
		[2 * (xy + zw), -xx + yy - zz + ww, 2 * (yz - xw)],
		[2 * (xz - yw), 2 * (yz + xw), -xx - yy + zz + ww],
	]);
}

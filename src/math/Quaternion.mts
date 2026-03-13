import { mat4Eigenvalues, mat4Eigenvector } from './eigen.mts';
import { matFrom, type Matrix } from './Matrix.mts';

export interface Quaternion {
	readonly w: number;
	readonly x: number;
	readonly y: number;
	readonly z: number;
}

export const quatFrom = (w: number, x = 0, y = 0, z = 0): Quaternion => ({
	w,
	x,
	y,
	z,
});

export function quatFromMat3Exact({
	v: [v00, v01, v02, v10, v11, v12, v20, v21, v22],
}: Matrix<3, 3>): Quaternion {
	// thanks, https://en.wikipedia.org/wiki/Rotation_matrix#Quaternion
	const trace = v00 + v11 + v22;
	if (trace >= 0) {
		const r = Math.sqrt(1 + trace);
		const m = 0.5 / r;
		return {
			w: 0.5 * r,
			x: (v21 - v12) * m,
			y: (v02 - v20) * m,
			z: (v10 - v01) * m,
		};
	} else if (v00 > v11 && v00 > v22) {
		const r = Math.sqrt(1 + v00 - v11 - v22);
		const m = 0.5 / r;
		return {
			w: (v21 - v12) * m,
			x: 0.5 * r,
			y: (v10 + v01) * m,
			z: (v02 + v20) * m,
		};
	} else if (v11 > v22) {
		const r = Math.sqrt(1 - v00 + v11 - v22);
		const m = 0.5 / r;
		return {
			w: (v02 - v20) * m,
			x: (v10 + v01) * m,
			y: 0.5 * r,
			z: (v21 + v12) * m,
		};
	} else {
		const r = Math.sqrt(1 - v00 - v11 + v22);
		const m = 0.5 / r;
		return {
			w: (v10 - v01) * m,
			x: (v02 + v20) * m,
			y: (v21 + v12) * m,
			z: 0.5 * r,
		};
	}
}

export function quatFromMat3BestFit({
	v: [v00, v01, v02, v10, v11, v12, v20, v21, v22],
}: Matrix<3, 3>): Quaternion {
	// thanks, https://en.wikipedia.org/wiki/Rotation_matrix#Quaternion
	const t01 = v21 - v12;
	const t02 = v02 - v20;
	const t03 = v10 - v01;
	const t12 = v10 + v01;
	const t13 = v02 + v20;
	const t23 = v21 + v12;
	const M = matFrom([
		[v00 + v11 + v22, t01, t02, t03],
		[t01, v00 - v11 - v22, t12, t13],
		[t02, t12, v11 - v00 - v22, t23],
		[t03, t13, t23, v22 - v00 - v11],
	]);

	let largestEigenvalue = 0;
	for (const eigenvalue of mat4Eigenvalues(M)) {
		if (Math.abs(eigenvalue) > Math.abs(largestEigenvalue)) {
			largestEigenvalue = eigenvalue;
		}
	}
	const eigenvector = mat4Eigenvector(M, largestEigenvalue);
	return quatUnit({
		w: eigenvector.v[0],
		x: eigenvector.v[1],
		y: eigenvector.v[2],
		z: eigenvector.v[3],
	});
}

export function mat3FromQuat({ w, x, y, z }: Quaternion): Matrix<3, 3> {
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
	const m = 2 / (xx + yy + zz + w * w);
	return matFrom([
		[1 - (yy + zz) * m, (xy - zw) * m, (xz + yw) * m],
		[(xy + zw) * m, 1 - (xx + zz) * m, (yz - xw) * m],
		[(xz - yw) * m, (yz + xw) * m, 1 - (xx + yy) * m],
	]);
}

export function mat3FromUnitQuat({ w, x, y, z }: Quaternion): Matrix<3, 3> {
	// thanks, https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation#From_a_quaternion_to_an_orthogonal_matrix
	const xx = x * x;
	const xy = x * y;
	const xz = x * z;
	const xw = x * w;
	const yy = y * y;
	const yz = y * z;
	const yw = y * w;
	const zz = z * z;
	const zw = z * w;
	return matFrom([
		[1 - (yy + zz) * 2, (xy - zw) * 2, (xz + yw) * 2],
		[(xy + zw) * 2, 1 - (xx + zz) * 2, (yz - xw) * 2],
		[(xz - yw) * 2, (yz + xw) * 2, 1 - (xx + yy) * 2],
	]);
}

export const quatMul = (a: Quaternion, b: Quaternion): Quaternion => ({
	w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
	x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
	y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
	z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
});

export const quatDiv = (a: Quaternion, b: Quaternion) => quatMul(a, quatInv(b));

export const quatAdd = (a: Quaternion, b: Quaternion): Quaternion => ({
	w: a.w + b.w,
	x: a.x + b.x,
	y: a.y + b.y,
	z: a.z + b.z,
});

export const quatMad = (
	a: Quaternion,
	m: number,
	b: Quaternion,
): Quaternion => ({
	w: a.w * m + b.w,
	x: a.x * m + b.x,
	y: a.y * m + b.y,
	z: a.z * m + b.z,
});

export const quatSub = (a: Quaternion, b: Quaternion): Quaternion => ({
	w: a.w - b.w,
	x: a.x - b.x,
	y: a.y - b.y,
	z: a.z - b.z,
});

export const quatScale = (
	{ w, x, y, z }: Quaternion,
	m: number,
): Quaternion => ({
	w: w * m,
	x: x * m,
	y: y * m,
	z: z * m,
});

export const quatNorm = ({ w, x, y, z }: Quaternion) => Math.hypot(w, x, y, z);
export const quatNorm2 = ({ w, x, y, z }: Quaternion) =>
	w * w + x * x + y * x + z * z;
export const quatVectorNorm = ({ x, y, z }: Quaternion) => Math.hypot(x, y, z);

export const quatDot = (a: Quaternion, b: Quaternion) =>
	a.w * b.w + a.x * b.x + a.y * b.y + a.z * b.z;

export const quatDist = (a: Quaternion, b: Quaternion) =>
	quatNorm(quatSub(a, b));
export const quatDist2 = (a: Quaternion, b: Quaternion) =>
	quatNorm2(quatSub(a, b));

export const quatUnit = (quat: Quaternion, length = 1) =>
	quatScale(quat, length / quatNorm(quat));

export const quatNearest = (quat: Quaternion, reference: Quaternion) =>
	quatScale(quat, Math.sign(quatDot(quat, reference)));

export const quatLerp = (
	a: Quaternion,
	b: Quaternion,
	t: number,
): Quaternion => ({
	w: a.w + (b.w - a.w) * t,
	x: a.x + (b.x - a.x) * t,
	y: a.y + (b.y - a.y) * t,
	z: a.z + (b.z - a.z) * t,
});

export const quatLerpShortestPath = (
	a: Quaternion,
	b: Quaternion,
	t: number,
): Quaternion => quatLerp(quatNearest(a, b), b, t);

export const quatLerpUnit = (
	a: Quaternion,
	b: Quaternion,
	t: number,
): Quaternion => quatUnit(quatLerp(a, b, t));

export const quatLerpShortestPathUnit = (
	a: Quaternion,
	b: Quaternion,
	t: number,
): Quaternion => quatUnit(quatLerpShortestPath(a, b, t));

export function quatSlerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
	const dot = quatDot(a, b);
	const halfAngle = Math.acos(dot);
	const m = Math.sin(t * halfAngle);
	const M = Math.sin((1 - t) * halfAngle);
	return {
		w: a.w * m + b.w * M,
		x: a.x * m + b.x * M,
		y: a.y * m + b.y * M,
		z: a.z * m + b.z * M,
	};
}

export function quatSlerpShortestPath(
	a: Quaternion,
	b: Quaternion,
	t: number,
): Quaternion {
	const dot = quatDot(a, b);
	const halfAngle = Math.acos(Math.abs(dot));
	const m = Math.sin(t * halfAngle) * Math.sign(dot);
	const M = Math.sin((1 - t) * halfAngle);
	return {
		w: a.w * m + b.w * M,
		x: a.x * m + b.x * M,
		y: a.y * m + b.y * M,
		z: a.z * m + b.z * M,
	};
}

export const quatSlerpUnit = (
	a: Quaternion,
	b: Quaternion,
	t: number,
): Quaternion => quatUnit(quatSlerp(a, b, t));

export const quatSlerpShortestPathUnit = (
	a: Quaternion,
	b: Quaternion,
	t: number,
): Quaternion => quatUnit(quatSlerpShortestPath(a, b, t));

export const quatConjugate = ({ w, x, y, z }: Quaternion) => ({
	w: w,
	x: -x,
	y: -y,
	z: -z,
});

export const quatInv = (quat: Quaternion) =>
	quatScale(quatConjugate(quat), 1 / quatNorm2(quat));

export const quatExp = (quat: Quaternion): Quaternion => {
	const vecNorm = quatVectorNorm(quat);
	const exp = Math.exp(quat.w);
	const m = (exp * Math.sin(vecNorm)) / vecNorm;
	return {
		w: Math.cos(vecNorm) * exp,
		x: quat.x * m,
		y: quat.y * m,
		z: quat.z * m,
	};
};

export const quatLog = (quat: Quaternion): Quaternion => {
	const norm = quatNorm(quat);
	const m = Math.acos(quat.w / norm) / quatVectorNorm(quat);
	return {
		w: Math.log(norm),
		x: quat.x * m,
		y: quat.y * m,
		z: quat.z * m,
	};
};

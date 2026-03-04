import type { Pt } from './Pt.mts';

export interface Matrix<M extends number = number, N extends number = number> {
	readonly v: ReadonlyArray<number>; // row major
	readonly m: M; // rows
	readonly n: N; // columns
}

export const matFrom = <const V extends number[][]>(
	...v: V
): Matrix<V['length'], V[number]['length']> => ({
	v: v.flat(),
	m: v.length as V['length'],
	n: (v[0]?.length ?? 0) as V[number]['length'],
});

export const matDiag = <const D extends number[]>(
	...diag: D
): Matrix<D['length'], D['length']> => {
	const s = diag.length as D['length'];
	const v = new Array<number>(s * s).fill(0);
	for (let i = 0; i < s; ++i) {
		v[i * (s + 1)] = diag[i]!;
	}
	return { v, m: s, n: s };
};

export function matPrint(
	mat: Matrix | null,
	precision = 3,
	width = precision + 5,
) {
	if (!mat) {
		return '(null)';
	}
	const { v, m, n } = mat;
	let r = [];
	for (let i = 0; i < m; ++i) {
		const row = [];
		for (let j = 0; j < n; ++j) {
			row.push(v[i * n + j]!.toFixed(precision).padStart(width, ' '));
		}
		r.push(row.join(' '));
	}
	return `[ ${r.join('\n  ')} ] (${m}x${n})`;
}

export function matToPtArray<N extends number>({
	v,
	m,
}: Matrix<N, 2>): SizedArray<Pt, N> {
	const r: Pt[] = [];
	for (let i = 0; i < m; ++i) {
		r.push({ x: v[i * 2]!, y: v[i * 2 + 1]! });
	}
	return r as SizedArray<Pt, N>;
}

export function ptArrayToMat<const T extends Pt[]>(
	pts: T,
): Matrix<T['length'], 2> {
	const v: number[] = [];
	for (const pt of pts) {
		v.push(pt.x, pt.y);
	}
	return { v, m: pts.length, n: 2 };
}

export function arrayToMat<Dim extends number>(
	values: number[],
	dim: Dim,
): Matrix<number, Dim> {
	if (values.length % dim) {
		throw new Error('invalid array length for matrix');
	}
	return { v: values, m: values.length / dim, n: dim };
}

export function array2DToMat<const V extends number[][]>(
	values: V,
): Matrix<V['length'], V[number]['length']> {
	const expanded = values.flat();
	if (expanded.length % values.length) {
		throw new Error('inconsistent matrix size');
	}
	return {
		v: expanded,
		m: values.length,
		n: expanded.length / values.length,
	};
}

export const fnToMat = <const I extends unknown[], const V extends number[]>(
	values: I,
	fn: (x: I[number]) => V,
): Matrix<I['length'], V['length']> => array2DToMat(values.map(fn));

export function matReshape<Dim extends number>(
	{ v, m, n }: Matrix,
	newN: Dim,
): Matrix<number, Dim> {
	const total = m * n;
	if (total % newN) {
		throw new Error('invalid matrix reshaping');
	}
	return { v, m: total / newN, n: newN };
}

export const matScale = <M extends number, N extends number>(
	{ v, m, n }: Matrix<M, N>,
	s: number,
): Matrix<M, N> => ({ v: v.map((x) => x * s), m, n });

export function matMul<
	M extends number,
	N extends number,
	S1 extends number,
	S2 extends S1 = S1,
>(a: Matrix<M, S1>, b: Matrix<S2, N>): Matrix<M, N> {
	const m = a.m;
	const n = b.n;
	const s = a.n;
	if (b.m !== s) {
		throw new Error(
			`invalid matrix multiplication (${a.m} x ${a.n}) * (${b.m} x ${b.n})`,
		);
	}
	const v: number[] = [];
	for (let i = 0; i < m; ++i) {
		for (let j = 0; j < n; ++j) {
			let sum = 0;
			for (let k = 0; k < s; ++k) {
				sum += a.v[i * s + k]! * b.v[k * n + j]!;
			}
			v.push(sum);
		}
	}
	return { v, m, n };
}

export function matMulATransposeB<
	M extends number,
	N extends number,
	S1 extends number,
	S2 extends S1 = S1,
>(aT: Matrix<S1, M>, b: Matrix<S2, N>): Matrix<M, N> {
	const m = aT.n;
	const n = b.n;
	const s = aT.m;
	if (b.m !== s) {
		throw new Error(
			`invalid matrix multiplication (${aT.n} x ${aT.m}) * (${b.m} x ${b.n})`,
		);
	}
	const v: number[] = [];
	for (let i = 0; i < m; ++i) {
		for (let j = 0; j < n; ++j) {
			let sum = 0;
			for (let k = 0; k < s; ++k) {
				sum += aT.v[k * m + i]! * b.v[k * n + j]!;
			}
			v.push(sum);
		}
	}
	return { v, m, n };
}

export function matInv<N extends number>(
	mat: Matrix<N, NoInfer<N>>,
): Matrix<N, N> | null {
	const s = mat.m;
	if (s !== mat.n) {
		throw new Error('matrix is not square');
	}
	switch (s) {
		case 1:
			return mat1Inv(mat as Matrix<1, 1>) as Matrix<N, N>;
		case 2:
			return mat2Inv(mat as Matrix<2, 2>) as Matrix<N, N>;
		case 3:
			return mat3Inv(mat as Matrix<3, 3>) as Matrix<N, N>;
		case 4:
			return mat4Inv(mat as Matrix<4, 4>) as Matrix<N, N>;
		default:
			throw new Error('unsupported matrix size');
	}
}

export function mat1Inv({ v: [v00] }: Matrix<1, 1>): Matrix<1, 1> | null {
	if (Math.abs(v00!) < 1e-8) {
		return null;
	}
	return { v: [1 / v00!], m: 1, n: 1 };
}

export function mat2Inv({
	v: [v00, v01, v10, v11],
}: Matrix<2, 2>): Matrix<2, 2> | null {
	const det = v00! * v11! - v10! * v01!;
	if (Math.abs(det) < 1e-8) {
		return null;
	}

	const m = 1 / det;
	return { v: [v11! * m, -v10! * m, -v01! * m, v00! * m], m: 2, n: 2 };
}

export function mat3Inv({
	v: [v00, v01, v02, v10, v11, v12, v20, v21, v22],
}: Matrix<3, 3>): Matrix<3, 3> | null {
	// thanks, https://en.wikipedia.org/wiki/Inverse_matrix#Inversion_of_3_%C3%97_3_matrices

	const A = v22! * v11! - v12! * v21!;
	const B = v12! * v20! - v22! * v10!;
	const C = v21! * v10! - v11! * v20!;

	const det = v00! * A + v01! * B + v02! * C;
	if (Math.abs(det) < 1e-8) {
		return null;
	}

	const m = 1 / det;
	return {
		v: [
			A * m,
			(v02! * v21! - v22! * v01!) * m,
			(v12! * v01! - v02! * v11!) * m,
			B * m,
			(v22! * v00! - v02! * v20!) * m,
			(v02! * v10! - v12! * v00!) * m,
			C * m,
			(v01! * v20! - v21! * v00!) * m,
			(v11! * v00! - v01! * v10!) * m,
		],
		m: 3,
		n: 3,
	};
}

export function mat4Inv({
	v: [
		v00,
		v01,
		v02,
		v03,
		v10,
		v11,
		v12,
		v13,
		v20,
		v21,
		v22,
		v23,
		v30,
		v31,
		v32,
		v33,
	],
}: Matrix<4, 4>): Matrix<4, 4> | null {
	// thanks, https://github.com/toji/gl-matrix/blob/accefb6ddf1897a0dc443bbc7664c90e67af6455/src/mat4.js#L293
	// gl-matrix license: MIT

	const c0101 = v00! * v11! - v01! * v10!;
	const c0102 = v00! * v12! - v02! * v10!;
	const c0103 = v00! * v13! - v03! * v10!;
	const c0112 = v01! * v12! - v02! * v11!;
	const c0113 = v01! * v13! - v03! * v11!;
	const c0123 = v02! * v13! - v03! * v12!;

	const c2301 = v20! * v31! - v21! * v30!;
	const c2302 = v20! * v32! - v22! * v30!;
	const c2303 = v20! * v33! - v23! * v30!;
	const c2312 = v21! * v32! - v22! * v31!;
	const c2313 = v21! * v33! - v23! * v31!;
	const c2323 = v22! * v33! - v23! * v32!;

	const det =
		c0101 * c2323 -
		c0102 * c2313 +
		c0103 * c2312 +
		c0112 * c2303 -
		c0113 * c2302 +
		c0123 * c2301;
	if (Math.abs(det) < 1e-8) {
		return null;
	}

	const m = 1 / det;

	return {
		v: [
			(v11! * c2323 - v12! * c2313 + v13! * c2312) * m,
			(v02! * c2313 - v01! * c2323 - v03! * c2312) * m,
			(v31! * c0123 - v32! * c0113 + v33! * c0112) * m,
			(v22! * c0113 - v21! * c0123 - v23! * c0112) * m,
			(v12! * c2303 - v10! * c2323 - v13! * c2302) * m,
			(v00! * c2323 - v02! * c2303 + v03! * c2302) * m,
			(v32! * c0103 - v30! * c0123 - v33! * c0102) * m,
			(v20! * c0123 - v22! * c0103 + v23! * c0102) * m,
			(v10! * c2313 - v11! * c2303 + v13! * c2301) * m,
			(v01! * c2303 - v00! * c2313 - v03! * c2301) * m,
			(v30! * c0113 - v31! * c0103 + v33! * c0101) * m,
			(v21! * c0103 - v20! * c0113 - v23! * c0101) * m,
			(v11! * c2302 - v10! * c2312 - v12! * c2301) * m,
			(v00! * c2312 - v01! * c2302 + v02! * c2301) * m,
			(v31! * c0102 - v30! * c0112 - v32! * c0101) * m,
			(v20! * c0112 - v21! * c0102 + v22! * c0101) * m,
		],
		m: 4,
		n: 4,
	};
}

type SizedArray<T, N extends number> = N extends 0
	? []
	: N extends 1
		? [T]
		: N extends 2
			? [T, T]
			: N extends 3
				? [T, T, T]
				: N extends 4
					? [T, T, T, T]
					: T[];

import type { DivideWhole, Multiply } from '../types/numeric.mts';
import { zeros, type SizedArray } from '../util/SizedArray.mts';

export interface Matrix<M extends number = number, N extends number = number> {
	readonly v: Readonly<SizedArray<number, Multiply<M, N>>>; // row major
	readonly m: M; // rows
	readonly n: N; // columns
}

export const internalMatFromFlat = <M extends number, N extends number>(
	v: readonly number[],
	m: M,
	n: N,
): Matrix<M, N> => ({ v: v as any, m, n });

export const matFrom = <const V extends ReadonlyArray<ReadonlyArray<number>>>(
	v: V,
) => {
	const expanded = v.flat();
	if (expanded.length % v.length) {
		throw new Error('inconsistent matrix size');
	}
	return internalMatFromFlat(
		expanded,
		v.length as V['length'],
		(v[0]?.length ?? 0) as V[number]['length'],
	);
};

export const matFromDiag = <const D extends ReadonlyArray<number>>(diag: D) => {
	const s = diag.length as D['length'];
	const v = zeros(s * s);
	for (let i = 0; i < s; ++i) {
		v[i * (s + 1)] = diag[i]!;
	}
	return internalMatFromFlat(v, s, s);
};

export function matFromArray<Dim extends number>(values: number[], dim: Dim) {
	if (values.length % dim) {
		throw new Error('invalid array length for matrix');
	}
	return internalMatFromFlat(values, values.length / dim, dim);
}

export const matFromArrayFn = <
	const I extends unknown[],
	const V extends number[],
>(
	values: I,
	fn: (x: I[number]) => V,
): Matrix<I['length'], V['length']> => matFrom(values.map(fn));

export const matZero = <M extends number, N extends number>(m: M, n: N) =>
	internalMatFromFlat(zeros(m * n), m, n);

export const matIdent = <S extends number>(s: S) => {
	const v = zeros(s * s);
	for (let i = 0; i < s; ++i) {
		v[i * (s + 1)] = 1;
	}
	return internalMatFromFlat(v, s, s);
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

export function matReshape<
	M extends number,
	N extends number,
	Dim extends number,
>(
	{ v, m, n }: Matrix<M, N>,
	newN: Dim,
): Matrix<DivideWhole<Multiply<M, N>, Dim>, Dim> {
	const total = m * n;
	if (total % newN) {
		throw new Error('invalid matrix reshaping');
	}
	return internalMatFromFlat(v, total / newN, newN);
}

export function matTranspose<M extends number, N extends number>({
	v,
	m,
	n,
}: Matrix<M, N>): Matrix<N, M> {
	if (m <= 1 || n <= 1) {
		return internalMatFromFlat(v, n, m);
	}
	const vT: number[] = [];
	for (let i = 0; i < n; ++i) {
		for (let j = 0; j < m; ++j) {
			vT.push(v[j * n + i]!);
		}
	}
	return internalMatFromFlat(vT, n, m);
}

export const matUnaryOp = <M extends number, N extends number>(
	{ v, m, n }: Matrix<M, N>,
	op: (v: number, i: number) => number,
): Matrix<M, N> => internalMatFromFlat(v.map(op), m, n);

export function matBinaryOp<M extends number, N extends number>(
	a: Matrix<M, N>,
	b: Matrix<M, N>,
	op: (a: number, b: number, i: number) => number,
	opName = '+',
) {
	assertMatSizeSame(a, b, opName);
	return internalMatFromFlat(
		a.v.map((x, i) => op(x, b.v[i]!, i)),
		a.m,
		a.n,
	);
}

export const matAdd = <M extends number, N extends number>(
	a: Matrix<M, N>,
	b: Matrix<M, N>,
) => matBinaryOp(a, b, (a, b) => a + b, '+');

export const matSub = <M extends number, N extends number>(
	a: Matrix<M, N>,
	b: Matrix<M, N>,
) => matBinaryOp(a, b, (a, b) => a - b, '-');

export const matScale = <M extends number, N extends number>(
	mat: Matrix<M, N>,
	s: number,
): Matrix<M, N> => matUnaryOp(mat, (x) => x * s);

export const matScaleAdd = <M extends number, N extends number>(
	a: Matrix<M, N>,
	s: number,
	b: Matrix<M, N>,
) => matBinaryOp(a, b, (a, b) => a * s + b);

export function matLerp<M extends number, N extends number>(
	a: Matrix<M, N>,
	b: Matrix<M, N>,
	t: number,
): Matrix<M, N> {
	const T = 1 - t;
	return matBinaryOp(a, b, (a, b) => a * T + b * t);
}

export const matMid = <M extends number, N extends number>(
	a: Matrix<M, N>,
	b: Matrix<M, N>,
) => matBinaryOp(a, b, (a, b) => (a + b) * 0.5);

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
	return internalMatFromFlat(v, m, n);
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
	return internalMatFromFlat(v, m, n);
}

export function matMulABTranspose<
	M extends number,
	N extends number,
	S1 extends number,
	S2 extends S1 = S1,
>(a: Matrix<M, S1>, bT: Matrix<N, S2>): Matrix<M, N> {
	const m = a.m;
	const n = bT.m;
	const s = a.n;
	if (bT.n !== s) {
		throw new Error(
			`invalid matrix multiplication (${a.m} x ${a.n}) * (${bT.n} x ${bT.m})`,
		);
	}
	const v: number[] = [];
	for (let i = 0; i < m; ++i) {
		for (let j = 0; j < n; ++j) {
			let sum = 0;
			for (let k = 0; k < s; ++k) {
				sum += a.v[i * s + k]! * bT.v[j * s + k]!;
			}
			v.push(sum);
		}
	}
	return internalMatFromFlat(v, m, n);
}

export function matDeterminant<N extends number>(
	mat: Matrix<N, NoInfer<N>>,
): number {
	assertMatSquare(mat);
	switch (mat.m) {
		case 0:
			return 0;
		case 1:
			return mat1Determinant(mat as Matrix as Matrix<1, 1>);
		case 2:
			return mat2Determinant(mat as Matrix as Matrix<2, 2>);
		case 3:
			return mat3Determinant(mat as Matrix as Matrix<3, 3>);
		case 4:
			return mat4Determinant(mat as Matrix as Matrix<4, 4>);
		default: {
			const { m, n, v } = mat;
			let ret = 1;
			const dat: number[][] = [];
			for (let i = 0; i < m; ++i) {
				dat.push(v.slice(i * n, i * n + n));
			}
			for (let a = 0; a < m; ++a) {
				if (!dat[a]![a]) {
					for (let b = a + 1; ; ++b) {
						if (b >= m) {
							return 0;
						}
						if (dat[b]![a]) {
							ret = -ret;
							[dat[a], dat[b]] = [dat[b]!, dat[a]!];
							break;
						}
					}
				}
				const rowA = dat[a]!;
				const d = rowA[a]!;
				for (let b = a + 1; b < m; ++b) {
					rowA[b]! /= d;
				}
				ret *= d;
				for (let b = 0; b < m; ++b) {
					if (b !== a) {
						const rowB = dat[b]!;
						const d = rowB[a];
						if (d) {
							for (let c = a + 1; c < m; ++c) {
								rowB[c]! -= rowA[c]! * d;
							}
						}
					}
				}
			}
			return ret;
		}
	}
}

export function matInverse<N extends number>(
	mat: Matrix<N, NoInfer<N>>,
): Matrix<N, N> | null {
	assertMatSquare(mat);
	switch (mat.m) {
		case 0:
			return mat;
		case 1:
			return mat1Inverse(mat as Matrix as Matrix<1, 1>) as Matrix<N, N> | null;
		case 2:
			return mat2Inverse(mat as Matrix as Matrix<2, 2>) as Matrix<N, N> | null;
		case 3:
			return mat3Inverse(mat as Matrix as Matrix<3, 3>) as Matrix<N, N> | null;
		case 4:
			return mat4Inverse(mat as Matrix as Matrix<4, 4>) as Matrix<N, N> | null;
		default:
			throw new Error('unsupported matrix size'); // TODO
	}
}

export function matLeftInverse<M extends number, N extends number>(
	mat: Matrix<M, N>,
): Matrix<N, M> | null {
	if ((mat.m as number) === mat.n) {
		return matInverse(mat as Matrix) as Matrix<N, M> | null;
	}
	const inv = mat.m < mat.n ? null : matInverse(matMulATransposeB(mat, mat));
	return inv ? matMulABTranspose(inv, mat) : null;
}

export function matRightInverse<M extends number, N extends number>(
	mat: Matrix<M, N>,
): Matrix<N, M> | null {
	if ((mat.m as number) === mat.n) {
		return matInverse(mat as Matrix) as Matrix<N, M> | null;
	}
	const inv = mat.n < mat.m ? null : matInverse(matMulABTranspose(mat, mat));
	return inv ? matMulATransposeB(mat, inv) : null;
}

export const mat1Determinant = ({ v: [v00] }: Matrix<1, 1>): number => v00;

export function mat1Inverse({ v: [v00] }: Matrix<1, 1>): Matrix<1, 1> | null {
	if (Math.abs(v00) < 1e-8) {
		return null;
	}
	return { v: [1 / v00], m: 1, n: 1 };
}

export function mat1LeftInverse<M extends number>(
	mat: Matrix<M, 1>,
): Matrix<1, M> | null {
	if (mat.m === mat.n) {
		return mat1Inverse(mat as Matrix as Matrix<1, 1>) as Matrix<1, M> | null;
	}
	const inv = mat.m < mat.n ? null : mat1Inverse(matMulATransposeB(mat, mat));
	return inv ? matMulABTranspose(inv, mat) : null;
}

export function mat1RightInverse<N extends number>(
	mat: Matrix<1, N>,
): Matrix<N, 1> | null {
	if (mat.m === mat.n) {
		return mat1Inverse(mat as Matrix as Matrix<1, 1>) as Matrix<N, 1> | null;
	}
	const inv = mat.n < mat.m ? null : mat1Inverse(matMulABTranspose(mat, mat));
	return inv ? matMulATransposeB(mat, inv) : null;
}

export const mat2Determinant = ({
	v: [v00, v01, v10, v11],
}: Matrix<2, 2>): number => v00 * v11 - v10 * v01;

export function mat2Inverse({
	v: [v00, v01, v10, v11],
}: Matrix<2, 2>): Matrix<2, 2> | null {
	const det = v00 * v11 - v10 * v01;
	if (Math.abs(det) < 1e-8) {
		return null;
	}

	const m = 1 / det;
	return { v: [v11 * m, -v01 * m, -v10 * m, v00 * m], m: 2, n: 2 };
}

export function mat2LeftInverse<M extends number>(
	mat: Matrix<M, 2>,
): Matrix<2, M> | null {
	if (mat.m === mat.n) {
		return mat2Inverse(mat as Matrix as Matrix<2, 2>) as Matrix<2, M> | null;
	}
	const inv = mat.m < mat.n ? null : mat2Inverse(matMulATransposeB(mat, mat));
	return inv ? matMulABTranspose(inv, mat) : null;
}

export function mat2RightInverse<N extends number>(
	mat: Matrix<2, N>,
): Matrix<N, 2> | null {
	if (mat.m === mat.n) {
		return mat2Inverse(mat as Matrix as Matrix<2, 2>) as Matrix<N, 2> | null;
	}
	const inv = mat.n < mat.m ? null : mat2Inverse(matMulABTranspose(mat, mat));
	return inv ? matMulATransposeB(mat, inv) : null;
}

export const mat3Determinant = ({
	v: [v00, v01, v02, v10, v11, v12, v20, v21, v22],
}: Matrix<3, 3>): number =>
	v00 * (v22 * v11 - v12 * v21) +
	v01 * (v12 * v20 - v22 * v10) +
	v02 * (v21 * v10 - v11 * v20);

export function mat3Inverse({
	v: [v00, v01, v02, v10, v11, v12, v20, v21, v22],
}: Matrix<3, 3>): Matrix<3, 3> | null {
	// thanks, https://en.wikipedia.org/wiki/Inverse_matrix#Inversion_of_3_%C3%97_3_matrices

	const A = v22 * v11 - v12 * v21;
	const B = v12 * v20 - v22 * v10;
	const C = v21 * v10 - v11 * v20;

	const det = v00 * A + v01 * B + v02 * C;
	if (Math.abs(det) < 1e-8) {
		return null;
	}

	const m = 1 / det;
	return {
		v: [
			A * m,
			(v02 * v21 - v22 * v01) * m,
			(v12 * v01 - v02 * v11) * m,
			B * m,
			(v22 * v00 - v02 * v20) * m,
			(v02 * v10 - v12 * v00) * m,
			C * m,
			(v01 * v20 - v21 * v00) * m,
			(v11 * v00 - v01 * v10) * m,
		],
		m: 3,
		n: 3,
	};
}

export function mat3LeftInverse<M extends number>(
	mat: Matrix<M, 3>,
): Matrix<3, M> | null {
	if (mat.m === mat.n) {
		return mat3Inverse(mat as Matrix as Matrix<3, 3>) as Matrix<3, M> | null;
	}
	const inv = mat.m < mat.n ? null : mat3Inverse(matMulATransposeB(mat, mat));
	return inv ? matMulABTranspose(inv, mat) : null;
}

export function mat3RightInverse<N extends number>(
	mat: Matrix<3, N>,
): Matrix<N, 3> | null {
	if (mat.m === mat.n) {
		return mat3Inverse(mat as Matrix as Matrix<3, 3>) as Matrix<N, 3> | null;
	}
	const inv = mat.n < mat.m ? null : mat3Inverse(matMulABTranspose(mat, mat));
	return inv ? matMulATransposeB(mat, inv) : null;
}

export const mat4Determinant = ({
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
}: Matrix<4, 4>): number =>
	(v00 * v11 - v01 * v10) * (v22 * v33 - v23 * v32) -
	(v00 * v12 - v02 * v10) * (v21 * v33 - v23 * v31) +
	(v00 * v13 - v03 * v10) * (v21 * v32 - v22 * v31) +
	(v01 * v12 - v02 * v11) * (v20 * v33 - v23 * v30) -
	(v01 * v13 - v03 * v11) * (v20 * v32 - v22 * v30) +
	(v02 * v13 - v03 * v12) * (v20 * v31 - v21 * v30);

export function mat4Inverse({
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

	const c0101 = v00 * v11 - v01 * v10;
	const c0102 = v00 * v12 - v02 * v10;
	const c0103 = v00 * v13 - v03 * v10;
	const c0112 = v01 * v12 - v02 * v11;
	const c0113 = v01 * v13 - v03 * v11;
	const c0123 = v02 * v13 - v03 * v12;

	const c2301 = v20 * v31 - v21 * v30;
	const c2302 = v20 * v32 - v22 * v30;
	const c2303 = v20 * v33 - v23 * v30;
	const c2312 = v21 * v32 - v22 * v31;
	const c2313 = v21 * v33 - v23 * v31;
	const c2323 = v22 * v33 - v23 * v32;

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
			(v11 * c2323 - v12 * c2313 + v13 * c2312) * m,
			(v02 * c2313 - v01 * c2323 - v03 * c2312) * m,
			(v31 * c0123 - v32 * c0113 + v33 * c0112) * m,
			(v22 * c0113 - v21 * c0123 - v23 * c0112) * m,
			(v12 * c2303 - v10 * c2323 - v13 * c2302) * m,
			(v00 * c2323 - v02 * c2303 + v03 * c2302) * m,
			(v32 * c0103 - v30 * c0123 - v33 * c0102) * m,
			(v20 * c0123 - v22 * c0103 + v23 * c0102) * m,
			(v10 * c2313 - v11 * c2303 + v13 * c2301) * m,
			(v01 * c2303 - v00 * c2313 - v03 * c2301) * m,
			(v30 * c0113 - v31 * c0103 + v33 * c0101) * m,
			(v21 * c0103 - v20 * c0113 - v23 * c0101) * m,
			(v11 * c2302 - v10 * c2312 - v12 * c2301) * m,
			(v00 * c2312 - v01 * c2302 + v02 * c2301) * m,
			(v31 * c0102 - v30 * c0112 - v32 * c0101) * m,
			(v20 * c0112 - v21 * c0102 + v22 * c0101) * m,
		],
		m: 4,
		n: 4,
	};
}

export function mat4LeftInverse<M extends number>(
	mat: Matrix<M, 4>,
): Matrix<4, M> | null {
	if (mat.m === mat.n) {
		return mat4Inverse(mat as Matrix as Matrix<4, 4>) as Matrix<4, M> | null;
	}
	const inv = mat.m < mat.n ? null : mat4Inverse(matMulATransposeB(mat, mat));
	return inv ? matMul(inv, matTranspose(mat)) : null;
}

export function mat4RightInverse<N extends number>(
	mat: Matrix<4, N>,
): Matrix<N, 4> | null {
	if (mat.m === mat.n) {
		return mat4Inverse(mat as Matrix as Matrix<4, 4>) as Matrix<N, 4> | null;
	}
	const inv =
		mat.n < mat.m ? null : mat4Inverse(matMul(mat, matTranspose(mat)));
	return inv ? matMulATransposeB(mat, inv) : null;
}

function assertMatSizeSame<M extends number, N extends number>(
	a: Matrix<M, N>,
	b: Matrix,
	op: string,
): asserts b is Matrix<M, N> {
	if (a.m !== b.m || a.n !== b.n) {
		throw new Error(
			`invalid matrix operation (${a.m} x ${a.n}) ${op} (${b.m} x ${b.n})`,
		);
	}
}

function assertMatSquare(a: Matrix) {
	if ((a.m as number) !== a.n) {
		throw new Error(`matrix is not square (${a.m} x ${a.n})`);
	}
}

export const MAT1IDENT: Matrix<1, 1> = { v: [1], m: 1, n: 1 };
export const MAT2IDENT: Matrix<2, 2> = { v: [1, 0, 0, 1], m: 2, n: 2 };
export const MAT2ROT90: Matrix<2, 2> = { v: [0, 1, -1, 0], m: 2, n: 2 };
export const MAT3IDENT: Matrix<3, 3> = {
	v: [1, 0, 0, 0, 1, 0, 0, 0, 1],
	m: 3,
	n: 3,
};
export const MAT4IDENT: Matrix<4, 4> = {
	v: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
	m: 4,
	n: 4,
};

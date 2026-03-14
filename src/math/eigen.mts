import {
	internalAssertMatSquare,
	mat2Determinant,
	mat2Trace,
	mat3Determinant,
	mat3Trace,
	mat4Determinant,
	mat4Trace,
	matSumDiagDeterminant2,
	matSumDiagDeterminant3,
	type Matrix,
	type SquareMatrix,
} from './Matrix.mts';
import {
	polynomial3Roots,
	polynomial4Roots,
	polynomial5Roots,
} from './Polynomial.mts';
import { vecFrom, type Vector } from './Vector.mts';

export function matEigenvalues<N extends number>(
	mat: SquareMatrix<N>,
): number[] {
	internalAssertMatSquare(mat);
	switch (mat.m) {
		case 0:
			return [];
		case 1:
			return mat1Eigenvalues(mat as Matrix as SquareMatrix<1>);
		case 2:
			return mat2Eigenvalues(mat as Matrix as SquareMatrix<2>);
		case 3:
			return mat3Eigenvalues(mat as Matrix as SquareMatrix<3>);
		case 4:
			return mat4Eigenvalues(mat as Matrix as SquareMatrix<4>);
		default:
			throw new Error('unsupported matrix size'); // TODO: https://en.wikipedia.org/wiki/QR_algorithm

		// Maybe best performance by implementing https://arxiv.org/pdf/2410.21550 ? (also must check license requirements)
	}
}

const MAT0_EIGVEC: Vector<0> = { v: [], m: 1, n: 0 };
const MAT1_EIGVEC: Vector<1> = { v: [1], m: 1, n: 1 };

export function matEigenvector<N extends number>(
	mat: SquareMatrix<N>,
	eigenvector: number,
): Vector<N> {
	internalAssertMatSquare(mat);
	switch (mat.m) {
		case 0:
			return MAT0_EIGVEC as Vector as Vector<N>;
		case 1:
			return MAT1_EIGVEC as Vector as Vector<N>;
		case 2:
			return mat2Eigenvector(
				mat as Matrix as SquareMatrix<2>,
				eigenvector,
			) as Vector as Vector<N>;
		case 3:
			return mat3Eigenvector(
				mat as Matrix as SquareMatrix<3>,
				eigenvector,
			) as Vector as Vector<N>;
		case 4:
			return mat4Eigenvector(
				mat as Matrix as SquareMatrix<4>,
				eigenvector,
			) as Vector as Vector<N>;
		default:
			throw new Error('unsupported matrix size'); // TODO
	}
}

export const mat1Eigenvalues = ({ v: [v00] }: SquareMatrix<1>): [number] => [
	v00,
];

export const mat1Eigenvector = () => MAT1_EIGVEC;

export const mat2Eigenvalues = (mat: SquareMatrix<2>) =>
	polynomial3Roots([mat2Determinant(mat), -mat2Trace(mat), 1]);

export const mat2Eigenvector = (
	{ v: [v00, v01, v10, v11] }: SquareMatrix<2>,
	v: number,
) =>
	Math.abs(v10) > Math.abs(v01) ? vecFrom(v - v11, v10) : vecFrom(v01, v - v00);

// May be worth implementing https://www.geometrictools.com/Documentation/RobustEigenSymmetric3x3.pdf for symmetrix 3x3 matrices

export const mat3Eigenvalues = (mat: SquareMatrix<3>) =>
	polynomial4Roots([
		-mat3Determinant(mat),
		matSumDiagDeterminant2(mat),
		-mat3Trace(mat),
		1,
	]);

export const mat3Eigenvector = (
	_mat: SquareMatrix<3>,
	_v: number,
): Vector<3> => {
	throw new Error('TODO');
};

export const mat4Eigenvalues = (mat: SquareMatrix<4>) =>
	polynomial5Roots([
		mat4Determinant(mat),
		-matSumDiagDeterminant3(mat),
		matSumDiagDeterminant2(mat),
		-mat4Trace(mat),
		1,
	]);

export const mat4Eigenvector = (
	_mat: SquareMatrix<4>,
	_v: number,
): Vector<4> => {
	throw new Error('TODO');
};

import { approxEqualsMatrix } from '../test-helpers/approxEqualsMatrix.mts';
import { binomial } from './binomial.mts';
import {
	mat1LeftInverse,
	mat1RightInverse,
	mat2Determinant,
	mat2LeftInverse,
	mat2RightInverse,
	mat3Determinant,
	mat3LeftInverse,
	mat3RightInverse,
	mat4LeftInverse,
	mat4RightInverse,
	matAdd,
	matBinaryOp,
	matDeterminant,
	matFrom,
	matFromArray,
	matFromArrayFn,
	matFromDiag,
	matIdent,
	matInverse,
	matLeftInverse,
	matLerp,
	matMid,
	matMinor,
	matMul,
	matMulABTranspose,
	matMulATransposeB,
	matPrint,
	matReshape,
	matRightInverse,
	matScale,
	matScaleAdd,
	matSub,
	matSumDiagDeterminant2,
	matSumDiagDeterminant3,
	matTrace,
	matTranspose,
	matUnaryOp,
	matZero,
} from './Matrix.mts';
import 'lean-test';

describe('matFrom', () => {
	it('creates a sized matrix with data in row major order', () => {
		const mat = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		expect(mat.m).equals(3);
		expect(mat.n).equals(2);
		expect(mat.v).equals([1, 2, 3, 4, 5, 6]);
	});

	it('rejects inconsistent sizes', () => {
		expect(() => matFrom([[1, 2], [3], [5, 6]])).throws(
			'inconsistent matrix size',
		);
	});

	it('creates a 0x0 matrix if requested', () => {
		expect(matFrom([]), approxEqualsMatrix([]));
	});
});

describe('matFromDiag', () => {
	it('creates a diagonal matrix', () => {
		expect(matFromDiag([1]), approxEqualsMatrix([[1]]));

		expect(
			matFromDiag([1, 2, 3]),
			approxEqualsMatrix([
				[1, 0, 0],
				[0, 2, 0],
				[0, 0, 3],
			]),
		);
	});

	it('creates a 0x0 matrix if requested', () => {
		expect(matFromDiag([]), approxEqualsMatrix([]));
	});
});

describe('matFromArray', () => {
	it('splits an array into a given size', () => {
		expect(
			matFromArray([1, 2, 3, 4, 5, 6], 2),
			approxEqualsMatrix([
				[1, 2],
				[3, 4],
				[5, 6],
			]),
		);

		expect(
			matFromArray([1, 2, 3, 4, 5, 6], 3),
			approxEqualsMatrix([
				[1, 2, 3],
				[4, 5, 6],
			]),
		);

		expect(
			matFromArray([1, 2, 3, 4, 5, 6], 6),
			approxEqualsMatrix([[1, 2, 3, 4, 5, 6]]),
		);

		expect(
			matFromArray([1, 2, 3, 4, 5, 6], 1),
			approxEqualsMatrix([[1], [2], [3], [4], [5], [6]]),
		);
	});

	it('rejects invalid splits', () => {
		expect(() => matFromArray([1, 2, 3, 4, 5, 6], 4)).throws(
			'invalid array length',
		);
	});

	it('creates a 0xn matrix if requested', () => {
		const mat = matFromArray([], 3);
		expect(mat.m).equals(0);
		expect(mat.n).equals(3);
		expect(mat.v).equals([]);
	});
});

describe('matFromArrayFn', () => {
	it('maps values to rows', () => {
		expect(
			matFromArrayFn([1, 2], (v) => [v, v + 10]),
			approxEqualsMatrix([
				[1, 11],
				[2, 12],
			]),
		);
	});

	it('rejects inconsistent sizes', () => {
		expect(() =>
			matFromArrayFn([1, 2], (v) => (v === 2 ? [1, 1] : [1])),
		).throws('inconsistent matrix size');
	});
});

describe('matZero', () => {
	it('creates a zero matrix', () => {
		expect(
			matZero(2, 3),
			approxEqualsMatrix([
				[0, 0, 0],
				[0, 0, 0],
			]),
		);
	});

	it('creates a 0x0 matrix if requested', () => {
		expect(matZero(0, 0), approxEqualsMatrix([]));
	});
});

describe('matIdent', () => {
	it('creates an identity matrix', () => {
		expect(matIdent(1), approxEqualsMatrix([[1]]));

		expect(
			matIdent(2),
			approxEqualsMatrix([
				[1, 0],
				[0, 1],
			]),
		);

		expect(
			matIdent(3),
			approxEqualsMatrix([
				[1, 0, 0],
				[0, 1, 0],
				[0, 0, 1],
			]),
		);
	});

	it('creates a 0x0 matrix if requested', () => {
		expect(matIdent(0), approxEqualsMatrix([]));
	});
});

describe('matPrint', () => {
	it('stringifies a matrix', () => {
		expect(
			matPrint(
				matFrom([
					[1, 2, 3],
					[4, 5, 6],
				]),
			),
		).equals(
			[
				'[    1.000    2.000    3.000',
				'     4.000    5.000    6.000 ] (2x3)',
			].join('\n'),
		);
	});

	it('allows customised precision and cell size', () => {
		expect(
			matPrint(
				matFrom([
					[1, 2, 3],
					[4, 5, 6],
				]),
				{ precision: 1, width: 4 },
			),
		).equals(['[  1.0  2.0  3.0', '   4.0  5.0  6.0 ] (2x3)'].join('\n'));
	});

	it('stringifies a 0x0 matrix', () => {
		expect(matPrint(matFrom([]))).equals('[  ] (0x0)');
	});
});

describe('matReshape', () => {
	it('resizes a matrix by wrapping values row-wise', () => {
		const mat = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		expect(
			matReshape(mat, 3),
			approxEqualsMatrix([
				[1, 2, 3],
				[4, 5, 6],
			]),
		);
	});

	it('rejects invalid sizes', () => {
		const mat = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		expect(() => matReshape(mat, 4)).throws('invalid matrix reshaping');
	});
});

describe('matTranspose', () => {
	it('returns the transpose of the matrix', () => {
		const mat = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		expect(
			matTranspose(mat),
			approxEqualsMatrix([
				[1, 3, 5],
				[2, 4, 6],
			]),
		);
	});
});

describe('matUnaryOp', () => {
	it('runs a function on every element of the matrix', () => {
		const mat = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		expect(
			matUnaryOp(mat, (v) => v * v),
			approxEqualsMatrix([
				[1, 4],
				[9, 16],
				[25, 36],
			]),
		);
	});
});

describe('matBinaryOp', () => {
	it('runs an elementwise operation on two matrices', () => {
		const mat1 = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		const mat2 = matFrom([
			[7, 8],
			[9, 10],
			[11, 12],
		]);
		expect(
			matBinaryOp(mat1, mat2, (a, b) => a * b),
			approxEqualsMatrix([
				[7, 16],
				[27, 40],
				[55, 72],
			]),
		);
	});

	it('rejects matrices of different sizes', () => {
		const mat1 = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		const mat2 = matFrom([
			[1, 2, 3],
			[4, 5, 6],
		]);
		expect(() => matBinaryOp(mat1, mat2, (a, b) => a * b)).throws(
			'invalid matrix operation (3 x 2) + (2 x 3)',
		);
	});
});

describe('matAdd', () => {
	it('elementwise adds two matrices', () => {
		const mat1 = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		const mat2 = matFrom([
			[7, 8],
			[9, 10],
			[11, 12],
		]);
		expect(
			matAdd(mat1, mat2),
			approxEqualsMatrix([
				[8, 10],
				[12, 14],
				[16, 18],
			]),
		);
	});
});

describe('matSub', () => {
	it('elementwise subtracts two matrices', () => {
		const mat1 = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		const mat2 = matFrom([
			[7, 8],
			[9, 10],
			[11, 12],
		]);
		expect(
			matSub(mat1, mat2),
			approxEqualsMatrix([
				[-6, -6],
				[-6, -6],
				[-6, -6],
			]),
		);
	});
});

describe('matScale', () => {
	it('elementwise scales a matrix', () => {
		const mat = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		expect(
			matScale(mat, 3),
			approxEqualsMatrix([
				[3, 6],
				[9, 12],
				[15, 18],
			]),
		);
	});
});

describe('matScaleAdd', () => {
	it('elementwise scales a matrix and adds another', () => {
		const mat1 = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		const mat2 = matFrom([
			[7, 8],
			[9, 10],
			[11, 12],
		]);
		expect(
			matScaleAdd(mat1, 3, mat2),
			approxEqualsMatrix([
				[1 * 3 + 7, 2 * 3 + 8],
				[3 * 3 + 9, 4 * 3 + 10],
				[5 * 3 + 11, 6 * 3 + 12],
			]),
		);
	});
});

describe('matLerp', () => {
	it('elementwise linearly interpolates between two matrices', () => {
		const mat1 = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		const mat2 = matFrom([
			[7, 8],
			[9, 10],
			[11, 12],
		]);
		expect(
			matLerp(mat1, mat2, 1 / 3),
			approxEqualsMatrix([
				[3, 4],
				[5, 6],
				[7, 8],
			]),
		);
	});
});

describe('matMid', () => {
	it('elementwise interpolates between two matrices', () => {
		const mat1 = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		const mat2 = matFrom([
			[7, 8],
			[9, 10],
			[11, 12],
		]);
		expect(
			matMid(mat1, mat2),
			approxEqualsMatrix([
				[4, 5],
				[6, 7],
				[8, 9],
			]),
		);
	});
});

describe('matMul', () => {
	it('multiplies two matrices', () => {
		const matA = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		const matB = matFrom([
			[9, 8, 7],
			[6, 5, 4],
		]);
		expect(
			matMul(matA, matB),
			approxEqualsMatrix([
				[21, 18, 15],
				[51, 44, 37],
				[81, 70, 59],
			]),
		);
		expect(
			matMul(matB, matA),
			approxEqualsMatrix([
				[68, 92],
				[41, 56],
			]),
		);
	});

	it('rejects incompatible matrix dimensions', () => {
		const matA = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		const matB = matFrom([[9, 8, 7]]);
		expect(() => matMul(matA, matB as any)).throws();
		expect(() => matMul(matB, matA)).not(throws());
	});
});

describe('matMulATransposeB', () => {
	it('multiplies two matrices, transposing the first', () => {
		const matA = matFrom([
			[1, 3, 5],
			[2, 4, 6],
		]);
		const matB = matFrom([
			[9, 8, 7],
			[6, 5, 4],
		]);
		expect(
			matMulATransposeB(matA, matB),
			approxEqualsMatrix([
				[21, 18, 15],
				[51, 44, 37],
				[81, 70, 59],
			]),
		);
		expect(
			matMulATransposeB(matB, matA),
			approxEqualsMatrix([
				[21, 51, 81],
				[18, 44, 70],
				[15, 37, 59],
			]),
		);
	});

	it('rejects incompatible matrix dimensions', () => {
		const matA = matFrom([
			[1, 3, 5],
			[2, 4, 6],
		]);
		expect(() => matMulATransposeB(matA, matFrom([[9, 8]]) as any)).throws();
		expect(() => matMulATransposeB(matA, matFrom([[9], [8]]))).not(throws());
	});
});

describe('matMulABTranspose', () => {
	it('multiplies two matrices, transposing the second', () => {
		const matA = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		const matB = matFrom([
			[9, 6],
			[8, 5],
			[7, 4],
		]);
		expect(
			matMulABTranspose(matA, matB),
			approxEqualsMatrix([
				[21, 18, 15],
				[51, 44, 37],
				[81, 70, 59],
			]),
		);
		expect(
			matMulABTranspose(matB, matA),
			approxEqualsMatrix([
				[21, 51, 81],
				[18, 44, 70],
				[15, 37, 59],
			]),
		);
	});

	it('rejects incompatible matrix dimensions', () => {
		const matA = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		expect(() => matMulABTranspose(matA, matFrom([[9], [8]]) as any)).throws();
		expect(() => matMulABTranspose(matA, matFrom([[9, 8]]))).not(throws());
	});
});

describe('matTrace', () => {
	it('returns the sum of the matrix diagonal', () => {
		const mat = matFrom([
			[1, 2, 3],
			[4, 5, 6],
			[7, 8, 9],
		]);
		expect(matTrace(mat)).equals(1 + 5 + 9);
	});

	it('returns 0 for 0x0 matrices', () => {
		expect(matTrace(matFrom([]))).equals(0);
	});

	it('rejects non-square matrices', () => {
		const mat = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		expect(() => matTrace(mat as any)).throws('matrix is not square');
	});
});

describe('matMinor', () => {
	it('removes a row and column from the matrix', () => {
		const mat = matFrom([
			[1, 2, 3, 4],
			[5, 6, 7, 8],
			[9, 10, 11, 12],
		]);

		expect(
			matMinor(mat, 1, 2),
			approxEqualsMatrix([
				[1, 2, 4],
				[9, 10, 12],
			]),
		);

		expect(
			matMinor(mat, 0, 0),
			approxEqualsMatrix([
				[6, 7, 8],
				[10, 11, 12],
			]),
		);

		expect(
			matMinor(mat, 2, 3),
			approxEqualsMatrix([
				[1, 2, 3],
				[5, 6, 7],
			]),
		);
	});

	it('rejects out-of-bounds rows and columns', () => {
		const mat = matFrom([
			[1, 2, 3, 4],
			[5, 6, 7, 8],
			[9, 10, 11, 12],
		]);
		expect(() => matMinor(mat, -1, 1)).throws('row -1 out of bounds');
		expect(() => matMinor(mat, 3, 1)).throws('row 3 out of bounds');
		expect(() => matMinor(mat, 1, -1)).throws('column -1 out of bounds');
		expect(() => matMinor(mat, 1, 4)).throws('column 4 out of bounds');
	});
});

describe('matDeterminant', () => {
	it('returns 1 for identity matrices', () => {
		for (let i = 1; i < 10; ++i) {
			expect(matDeterminant(matIdent(i))).equals(1);
		}
	});

	it('returns the product of the diagonal for diagonal matrices', () => {
		let diagonal: number[] = [];
		let product = 1;
		for (let i = 1; i < 10; ++i) {
			const v = i + 1;
			diagonal.push(v);
			product *= v;
			expect(matDeterminant(matFromDiag(diagonal))).equals(product);
		}
	});

	it('returns 0 for zero matrices', () => {
		for (let i = 1; i < 10; ++i) {
			expect(matDeterminant(matZero(i, i))).equals(0);
		}
	});

	it('returns 0 for 0x0 matrices', () => {
		expect(matDeterminant(matFrom([]))).equals(0);
	});

	it('returns the determinant of 1x1 matrices', () => {
		expect(matDeterminant(matFrom([[2]]))).equals(2);
	});

	it('returns the determinant of 2x2 matrices', () => {
		expect(
			matDeterminant(
				matFrom([
					[1, 2],
					[3, 4],
				]),
			),
		).equals(-2);
	});

	it('returns the determinant of 3x3 matrices', () => {
		expect(
			matDeterminant(
				matFrom([
					[1, 2, 1],
					[3, 4, 5],
					[6, 6, 7],
				]),
			),
		).equals(10);
	});

	it('returns the determinant of 4x4 matrices', () => {
		expect(
			matDeterminant(
				matFrom([
					[1, 2, 3, 1],
					[4, 5, 6, 7],
					[8, 9, 8, 9],
					[10, 10, 11, 11],
				]),
			),
		).equals(-72);
	});

	it('returns the determinant of 5x5 matrices', () => {
		expect(
			matDeterminant(
				matFrom([
					[1, 2, 1, 2, 1],
					[3, 1, 2, 1, 1],
					[1, 1, 2, 3, 3],
					[2, 3, 1, 2, 3],
					[3, 1, 3, 1, 2],
				]),
			),
		).equals(-28);
	});

	it('is numerically stable', () => {
		expect(
			matDeterminant(
				matScale(
					matFrom([
						[1, 2, 1, 2, 1],
						[3, 1, 2, 1, 1],
						[1, 1, 2, 3, 3],
						[2, 3, 1, 2, 3],
						[3, 1, 3, 1, 2],
					]),
					1 / 3,
				),
			),
		).isNear(-28 / (3 * 3 * 3 * 3 * 3), { tolerance: 1e-6 });
	});

	it('rejects non-square matrices', () => {
		expect(() => matDeterminant(matFrom([[1], [0]]) as any)).throws(
			'matrix is not square',
		);
	});
});

describe('matInverse', () => {
	it('leaves identity matrices unchanged', () => {
		for (let i = 1; i <= 4; ++i) {
			expect(matInverse(matIdent(i)), approxEqualsMatrix(matIdent(i)));
		}
	});

	it('returns the inverse of 1x1 matrices', () => {
		expect(matInverse(matFrom([[2]])), approxEqualsMatrix([[0.5]]));
	});

	it('returns the inverse of 2x2 matrices', () => {
		expect(
			matInverse(
				matFrom([
					[-1, 1.5],
					[1, -1],
				]),
			),
			approxEqualsMatrix([
				[2, 3],
				[2, 2],
			]),
		);
	});

	it('returns the inverse of 3x3 matrices', () => {
		expect(
			matInverse(
				matFrom([
					[1, 2, 0],
					[2, 4, 1],
					[0, 1, 4],
				]),
			),
			approxEqualsMatrix([
				[-15, 8, -2],
				[8, -4, 1],
				[-2, 1, 0],
			]),
		);
	});

	it('returns the inverse of 4x4 matrices', () => {
		expect(
			matInverse(
				matFrom([
					[0.5, 0, 0, 0.5],
					[0.5, 1, 0, 0],
					[0, 1, 0, 1.5],
					[0, 0, 0.5, 0.5],
				]),
			),
			approxEqualsMatrix([
				[1.5, 0.5, -0.5, 0],
				[-0.75, 0.75, 0.25, 0],
				[-0.5, 0.5, -0.5, 2],
				[0.5, -0.5, 0.5, 0],
			]),
		);
	});

	it('returns null if the matrix is not invertable', () => {
		for (let i = 1; i <= 4; ++i) {
			expect(matInverse(matZero(i, i))).isNull();
		}
	});

	it('rejects non-square matrices', () => {
		expect(() => matInverse(matFrom([[1], [0]]) as any)).throws(
			'matrix is not square',
		);
	});
});

describe('matLeftInverse', () => {
	it('returns a left inverse matrix for non-square inputs', () => {
		const mat = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		const inv = matLeftInverse(mat);
		expect(inv).isTruthy();
		expect(matMul(inv!, mat), approxEqualsMatrix(matIdent(2)));

		// dimension-optimised version gives same result
		expect(mat2LeftInverse(mat)).equals(inv);
	});

	it('returns null if the matrix is the wrong shape for a left inverse to exist', () => {
		const mat = matFrom([
			[1, 2, 3],
			[4, 5, 6],
		]);
		expect(matLeftInverse(mat)).isNull();

		// dimension-optimised version gives same result
		expect(mat3LeftInverse(mat)).isNull();
	});

	it('returns the regular inverse for square matrices', () => {
		const mat = matFrom([
			[1, 2],
			[3, 4],
		]);
		expect(matLeftInverse(mat)).equals(matInverse(mat));

		// dimension-optimised version gives same result
		expect(mat2LeftInverse(mat)).equals(matInverse(mat));
	});

	it('returns null if the matrix is not invertible', () => {
		expect(matLeftInverse(matZero(3, 2))).isNull();

		// dimension-optimised versions
		expect(mat1LeftInverse(matZero(5, 1))).isNull();
		expect(mat2LeftInverse(matZero(5, 2))).isNull();
		expect(mat3LeftInverse(matZero(5, 3))).isNull();
		expect(mat4LeftInverse(matZero(5, 4))).isNull();
	});
});

describe('matRightInverse', () => {
	it('returns a right inverse matrix for non-square inputs', () => {
		const mat = matFrom([
			[1, 2, 3],
			[4, 5, 6],
		]);
		const inv = matRightInverse(mat);
		expect(inv).isTruthy();
		expect(matMul(mat, inv!), approxEqualsMatrix(matIdent(2)));

		// dimension-optimised version gives same result
		expect(mat2RightInverse(mat)).equals(inv);
	});

	it('returns null if the matrix is the wrong shape for a right inverse to exist', () => {
		const mat = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		expect(matRightInverse(mat)).isNull();

		// dimension-optimised version gives same result
		expect(mat3RightInverse(mat)).isNull();
	});

	it('returns the regular inverse for square matrices', () => {
		const mat = matFrom([
			[1, 2],
			[3, 4],
		]);
		expect(matRightInverse(mat)).equals(matInverse(mat));

		// dimension-optimised version gives same result
		expect(mat2RightInverse(mat)).equals(matInverse(mat));
	});

	it('returns null if the matrix is not invertible', () => {
		expect(matRightInverse(matZero(2, 3))).isNull();

		// dimension-optimised versions
		expect(mat1RightInverse(matZero(1, 5))).isNull();
		expect(mat2RightInverse(matZero(2, 5))).isNull();
		expect(mat3RightInverse(matZero(3, 5))).isNull();
		expect(mat4RightInverse(matZero(4, 5))).isNull();
	});
});

describe('matSumDiagDeterminant2', () => {
	it('returns the sum of the determinants of the diagonal 2x2 minors (for 3x3 input)', () => {
		const mat = matFrom([
			[1, 2, 1],
			[3, 4, 5],
			[6, 6, 7],
		]);
		expect(matSumDiagDeterminant2(mat)).equals(
			mat2Determinant(matMinor(mat, 0, 0)) +
				mat2Determinant(matMinor(mat, 1, 1)) +
				mat2Determinant(matMinor(mat, 2, 2)),
		);
	});

	it('returns binomial(n,2) for identity matrices', () => {
		for (let n = 2; n < 10; ++n) {
			expect(matSumDiagDeterminant2(matIdent(n))).equals(binomial(n, 2));
		}
	});

	it('returns 0 for zero matrices', () => {
		for (let n = 1; n < 10; ++n) {
			expect(matSumDiagDeterminant2(matZero(n, n))).equals(0);
		}
	});

	it('returns the sum of the determinants of the diagonal 2x2 minors (for 4x4 input)', () => {
		const mat = matFrom([
			[1, 2, 3, 1],
			[4, 5, 6, 7],
			[8, 9, 8, 9],
			[10, 10, 11, 11],
		]);
		expect(matSumDiagDeterminant2(mat)).equals(
			mat2Determinant(matMinor(matMinor(mat, 0, 0), 0, 0)) +
				mat2Determinant(matMinor(matMinor(mat, 0, 0), 1, 1)) +
				mat2Determinant(matMinor(matMinor(mat, 0, 0), 2, 2)) +
				mat2Determinant(matMinor(matMinor(mat, 1, 1), 1, 1)) +
				mat2Determinant(matMinor(matMinor(mat, 1, 1), 2, 2)) +
				mat2Determinant(matMinor(matMinor(mat, 2, 2), 2, 2)),
		);
	});

	it('returns the determinant for 2x2 matrices', () => {
		const mat = matFrom([
			[1, 2],
			[3, 4],
		]);
		expect(matSumDiagDeterminant2(mat)).equals(matDeterminant(mat));
	});

	it('returns 0 for 1x1 matrices', () => {
		const mat = matFrom([[1]]);
		expect(matSumDiagDeterminant2(mat)).equals(0);
	});
});

describe('matSumDiagDeterminant3', () => {
	it('returns the sum of the determinants of the diagonal 3x3 minors', () => {
		const mat = matFrom([
			[1, 2, 3, 1],
			[4, 5, 6, 7],
			[8, 9, 8, 9],
			[10, 10, 11, 11],
		]);
		expect(matSumDiagDeterminant3(mat)).equals(
			mat3Determinant(matMinor(mat, 0, 0)) +
				mat3Determinant(matMinor(mat, 1, 1)) +
				mat3Determinant(matMinor(mat, 2, 2)) +
				mat3Determinant(matMinor(mat, 3, 3)),
		);
	});

	it('returns binomial(n,3) for identity matrices', () => {
		for (let n = 3; n < 10; ++n) {
			expect(matSumDiagDeterminant3(matIdent(n))).equals(binomial(n, 3));
		}
	});

	it('returns 0 for zero matrices', () => {
		for (let n = 1; n < 10; ++n) {
			expect(matSumDiagDeterminant3(matZero(n, n))).equals(0);
		}
	});

	it('returns the determinant for 3x3 matrices', () => {
		const mat = matFrom([
			[1, 2, 1],
			[3, 4, 5],
			[6, 6, 7],
		]);
		expect(matSumDiagDeterminant3(mat)).equals(matDeterminant(mat));
	});

	it('returns 0 for 2x2 matrices', () => {
		const mat = matFrom([
			[1, 2],
			[3, 4],
		]);
		expect(matSumDiagDeterminant3(mat)).equals(0);
	});
});

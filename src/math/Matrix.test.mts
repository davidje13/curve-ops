import {
	matFrom,
	matIdent,
	matInverse,
	matMul,
	matMulATransposeB,
	matPrint,
	matZero,
	type Matrix,
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
	it('multiplies two matrices', () => {
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

describe('matInverse', () => {
	it('leaves identity matrices unchanged', () => {
		expect(matInverse(matIdent(1)), approxEqualsMatrix(matIdent(1)));
		expect(matInverse(matIdent(2)), approxEqualsMatrix(matIdent(2)));
		expect(matInverse(matIdent(3)), approxEqualsMatrix(matIdent(3)));
		expect(matInverse(matIdent(4)), approxEqualsMatrix(matIdent(4)));
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
		expect(matInverse(matZero(1, 1))).isNull();
		expect(matInverse(matZero(2, 2))).isNull();
		expect(matInverse(matZero(3, 3))).isNull();
		expect(matInverse(matZero(4, 4))).isNull();
	});

	it('rejects non-square matrices', () => {
		expect(() => matInverse(matFrom([[1], [0]]) as any)).throws();
	});
});

function approxEqualsMatrix(
	expected: Matrix | number[][],
	tolerance: number = 1e-6,
) {
	if (Array.isArray(expected)) {
		expected = matFrom(expected);
	}
	return (actual: unknown) => {
		if (
			typeof actual !== 'object' ||
			!actual ||
			!('m' in actual) ||
			!('n' in actual) ||
			!('v' in actual) ||
			!Array.isArray(actual.v)
		) {
			throw new Error('not a matrix');
		}
		if (actual.m !== expected.m || actual.n !== expected.n) {
			return {
				pass: false,
				message: `Expected (${expected.m}x${expected.n}) matrix, got (${actual.m}x${actual.n})`,
			};
		}
		for (let i = 0; i < expected.m * expected.n; ++i) {
			const expectedV = expected.v[i]!;
			const actualV = actual.v[i];
			if (Math.abs(expectedV - actualV) > tolerance) {
				return {
					pass: false,
					message: `Expected\n${matPrint(expected)},\ngot\n${matPrint(actual as Matrix)}`,
				};
			}
		}
		return {
			pass: true,
			message: `Expected matrix not matching\n${matPrint(expected)},\nbut matched.`,
		};
	};
}

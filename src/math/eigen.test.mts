import { matchesDirectionOf } from '../test-helpers/matchesDirectionOf.mts';
import { matEigenvalues, matEigenvector } from './eigen.mts';
import { matFrom, matFromDiag, matIdent, matZero } from './Matrix.mts';
import { vecFrom } from './Vector.mts';
import 'lean-test';

describe('matEigenvalues', () => {
	it('returns eigenvalues for a 1x1 matrix', () => {
		expect(matEigenvalues(matFrom([[4]]))).equals([4]);
	});

	it('returns 1 for an identity matrix', () => {
		for (let n = 1; n <= 4; ++n) {
			expect(matEigenvalues(matIdent(n))).equals([1]);
		}
	});

	it('returns diagonal values for diagonal matrices', () => {
		const diag: number[] = [];
		for (let n = 1; n <= 4; ++n) {
			diag.push(n + 1);
			const eigenvalues = matEigenvalues(matFromDiag(diag));
			for (const v of diag) {
				expect(eigenvalues).contains(isNear(v));
			}
			expect(eigenvalues).hasLength(diag.length);
		}
	});

	it('returns 0 for a zero matrix', () => {
		for (let n = 1; n <= 4; ++n) {
			expect(matEigenvalues(matZero(n, n))).equals([0]);
		}
	});

	it('returns eigenvalues for a 2x2 matrix', () => {
		const eigenvalues = matEigenvalues(
			matFrom([
				[2, 1],
				[1, 2],
			]),
		);
		expect(eigenvalues).contains(isNear(1));
		expect(eigenvalues).contains(isNear(3));
		expect(eigenvalues).hasLength(2);
	});

	it('only returns real 2x2 eigenvalues (skew)', () => {
		const eigenvalues = matEigenvalues(
			matFrom([
				[1, 1],
				[0, 1],
			]),
		);
		expect(eigenvalues).contains(isNear(1));
		expect(eigenvalues).hasLength(1);
	});

	it('only returns real 2x2 eigenvalues (rotation)', () => {
		const eigenvalues = matEigenvalues(
			matFrom([
				[0, 1],
				[-1, 0],
			]),
		);
		expect(eigenvalues).hasLength(0);
	});

	it('returns eigenvalues for a 3x3 matrix', () => {
		const eigenvalues = matEigenvalues(
			matFrom([
				[3, 2, 1],
				[2, 3, 1],
				[2, 1, 3],
			]),
		);
		expect(eigenvalues).contains(isNear(6));
		expect(eigenvalues).contains(isNear(2));
		expect(eigenvalues).contains(isNear(1));
		expect(eigenvalues).hasLength(3);
	});

	it('only returns real 3x3 eigenvalues', () => {
		const eigenvalues = matEigenvalues(
			matFrom([
				[3, 2, 1],
				[1, 3, 2],
				[2, 1, 3],
			]),
		);
		expect(eigenvalues).contains(isNear(6));
		expect(eigenvalues).hasLength(1);
	});

	it('returns eigenvalues for a 4x4 matrix', () => {
		const eigenvalues = matEigenvalues(
			matFrom([
				[1, 2, 2, 1],
				[0, 2, 0, 1],
				[0, 1, 3, 0],
				[0, 0, 0, 4],
			]),
		);
		expect(eigenvalues).contains(isNear(1));
		expect(eigenvalues).contains(isNear(2));
		expect(eigenvalues).contains(isNear(3));
		expect(eigenvalues).contains(isNear(4));
		expect(eigenvalues).hasLength(4);
	});

	it('only returns real 4x4 eigenvalues', () => {
		const eigenvalues = matEigenvalues(
			matFrom([
				[4, 3, 2, 1],
				[1, 4, 3, 2],
				[2, 1, 4, 3],
				[3, 2, 1, 4],
			]),
		);
		expect(eigenvalues).contains(isNear(10));
		expect(eigenvalues).contains(isNear(2));
		expect(eigenvalues).hasLength(2);
	});

	it('returns nothing for a 0x0 matrix', () => {
		expect(matEigenvalues(matFrom([]))).equals([]);
	});

	it('rejects non-square matrices', () => {
		const mat = matFrom([
			[1, 2],
			[3, 4],
			[5, 6],
		]);
		expect(() => matEigenvalues(mat as any)).throws('matrix is not square');
	});
});

describe('matEigenvector', () => {
	it('returns an eigenvector for a given 2x2 matrix and eigenvalue', () => {
		const mat = matFrom([
			[2, 1],
			[1, 2],
		]);

		expect(
			matEigenvector(mat, 3),
			matchesDirectionOf(vecFrom(1, 1), EIGENVEC_TOLERANCE),
		);
		expect(
			matEigenvector(mat, 1),
			matchesDirectionOf(vecFrom(-1, 1), EIGENVEC_TOLERANCE),
		);
	});

	// TODO
	it.ignore(
		'returns an eigenvector for a given 3x3 matrix and eigenvalue',
		() => {
			const mat = matFrom([
				[3, 2, 1],
				[2, 3, 1],
				[2, 1, 3],
			]);

			expect(
				matEigenvector(mat, 6),
				matchesDirectionOf(vecFrom(1, 1, 1), EIGENVEC_TOLERANCE),
			);
			expect(
				matEigenvector(mat, 2),
				matchesDirectionOf(vecFrom(-1, -1, 3), EIGENVEC_TOLERANCE),
			);
			expect(
				matEigenvector(mat, 1),
				matchesDirectionOf(vecFrom(-3, 2, 2), EIGENVEC_TOLERANCE),
			);
		},
	);

	// TODO
	it.ignore(
		'returns an eigenvector for a given 4x4 matrix and eigenvalue',
		() => {
			const mat = matFrom([
				[1, 2, 2, 1],
				[0, 2, 0, 1],
				[0, 1, 3, 0],
				[0, 0, 0, 4],
			]);

			expect(
				matEigenvector(mat, 4),
				matchesDirectionOf(vecFrom(2, 1, 1, 2), EIGENVEC_TOLERANCE),
			);
			expect(
				matEigenvector(mat, 3),
				matchesDirectionOf(vecFrom(1, 0, 1, 0), EIGENVEC_TOLERANCE),
			);
			expect(
				matEigenvector(mat, 2),
				matchesDirectionOf(vecFrom(0, -1, 1, 0), EIGENVEC_TOLERANCE),
			);
			expect(
				matEigenvector(mat, 1),
				matchesDirectionOf(vecFrom(1, 0, 0, 0), EIGENVEC_TOLERANCE),
			);
		},
	);

	it('returns {} for a 0x0 matrix', () => {
		expect(matEigenvector(matFrom([]), 1000)).equals(vecFrom());
	});

	it('returns {1} for a 1x1 matrix', () => {
		expect(matEigenvector(matFrom([[4]]), 1000)).equals(vecFrom(1));
	});
});

const EIGENVEC_TOLERANCE = {
	minLength: 0.1,
	allowNegative: true,
};

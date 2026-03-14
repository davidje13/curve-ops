import { matFrom, matPrint, type Matrix } from '../math/Matrix.mts';

export function approxEqualsMatrix(
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
			if (Math.abs(expectedV - actualV) > tolerance || Number.isNaN(actualV)) {
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

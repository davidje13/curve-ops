import {
	vecDot,
	vecFrom,
	vecLen,
	vecPrint,
	type Vector,
} from '../math/Vector.mts';

export function matchesDirectionOf(
	expected: Vector | number[],
	{ minLength = 1e-6, allowNegative = false, tolerance = 1e-6 } = {},
) {
	if (Array.isArray(expected)) {
		expected = vecFrom(...expected);
	}
	const lE = vecLen(expected);

	return (actual: unknown) => {
		if (
			typeof actual !== 'object' ||
			!actual ||
			!('m' in actual) ||
			actual.m !== 1 ||
			!('n' in actual) ||
			!('v' in actual) ||
			!Array.isArray(actual.v)
		) {
			throw new Error('not a vector');
		}
		if (actual.m !== expected.m) {
			return {
				pass: false,
				message: `Expected ${expected.m}-d vector, got ${actual.m}-d`,
			};
		}
		const actualV = actual as Vector;
		const lA = vecLen(actualV);
		if (lA < minLength) {
			return {
				pass: false,
				message: `Expected vector with length >= ${minLength}, but got ${vecPrint(actualV)} (${lA}).`,
			};
		}
		let match = false;
		if (!lE) {
			match = lA <= tolerance;
		} else {
			const dot = vecDot(expected, actualV);
			match =
				(dot >= 0 || allowNegative) &&
				Math.abs(Math.sqrt(lE * lA) - Math.sqrt(Math.abs(dot))) <= tolerance;
		}
		return {
			pass: match,
			message: `Expected vector ${match ? 'not ' : ''}in direction ${vecPrint(expected)}, but got ${vecPrint(actualV)}.`,
		};
	};
}

import { quatFrom, quatPrint, type Quaternion } from '../math/Quaternion.mts';

export function approxEqualsQuaternion(
	expected: Quaternion | [number, number, number, number],
	tolerance: number = 1e-6,
) {
	if (Array.isArray(expected)) {
		expected = quatFrom(...expected);
	}
	return (actual: unknown) => {
		if (
			typeof actual !== 'object' ||
			!actual ||
			!('w' in actual) ||
			!('x' in actual) ||
			!('y' in actual) ||
			!('z' in actual) ||
			typeof actual.w !== 'number' ||
			typeof actual.x !== 'number' ||
			typeof actual.y !== 'number' ||
			typeof actual.z !== 'number'
		) {
			throw new Error('not a quaternion');
		}
		if (
			Math.abs(actual.w - expected.w) <= tolerance &&
			Math.abs(actual.x - expected.x) <= tolerance &&
			Math.abs(actual.y - expected.y) <= tolerance &&
			Math.abs(actual.z - expected.z) <= tolerance
		) {
			return {
				pass: true,
				message: `Expected quaternion not matching ${quatPrint(expected)}, but matched.`,
			};
		}
		return {
			pass: false,
			message: `Expected ${quatPrint(expected)}, got ${quatPrint(actual as Quaternion)}`,
		};
	};
}

import { approxEqualsMatrix } from '../test-helpers/approxEqualsMatrix.mts';
import { approxEqualsQuaternion } from '../test-helpers/approxEqualsQuaternion.mts';
import { bezierAt, bezierFromQuad } from './geometry/Bezier.mts';
import {
	mat3FromQuat,
	mat3FromUnitQuat,
	quatAdd,
	quatConjugate,
	quatDist,
	quatDist2,
	quatDiv,
	quatDot,
	quatExp,
	quatFrom,
	quatFromMat3Exact,
	quatFromRotationAround,
	quatInv,
	quatLerp,
	quatLerpShortestPath,
	quatLerpShortestPathUnit,
	quatLerpUnit,
	quatLog,
	quatMad,
	quatMul,
	quatNearest,
	quatNorm,
	quatNorm2,
	quatScale,
	quatSlerp,
	quatSlerpShortestPath,
	quatSquad,
	quatSub,
	quatUnit,
	quatVectorNorm,
	quatVectorNorm2,
} from './Quaternion.mts';
import { matFrom, matIdent, matMul } from './Matrix.mts';
import { vecFrom, vecNorm } from './Vector.mts';
import 'lean-test';

describe('quatFrom', () => {
	it('returns a quaternion from components', () => {
		expect(quatFrom(1, 2, 3, 4)).equals({ w: 1, x: 2, y: 3, z: 4 });
	});

	it('defaults to a 0 vector', () => {
		expect(quatFrom(1)).equals({ w: 1, x: 0, y: 0, z: 0 });
	});
});

describe('quatFromRotationAround', () => {
	it('returns a quaternion representing a rotation', () => {
		for (let i = 0; i < 10; ++i) {
			const angle = Math.PI * (i / 10);
			const quat = quatFromRotationAround(vecFrom(0, 0, 1), angle);
			expect(quatNorm(quat)).isNear(1);
			expect(quat).equals({
				w: Math.cos(angle * 0.5),
				x: 0,
				y: 0,
				z: Math.sin(angle * 0.5),
			});
		}
	});
});

describe('quatFromMat3Exact', () => {
	it('returns a quaternion matching a rotation matrix (xy)', () => {
		for (let i = 1; i < 10; ++i) {
			const angle = Math.PI * (i / 10);
			const cc = Math.cos(angle);
			const ss = Math.sin(angle);
			expect(
				quatFromMat3Exact(
					matFrom([
						[cc, -ss, 0],
						[ss, cc, 0],
						[0, 0, 1],
					]),
				),
				approxEqualsQuaternion(quatFromRotationAround(vecFrom(0, 0, 1), angle)),
			);
		}
	});

	it('returns a quaternion matching a rotation matrix (yz)', () => {
		for (let i = 1; i < 10; ++i) {
			const angle = Math.PI * (i / 10);
			const cc = Math.cos(angle);
			const ss = Math.sin(angle);
			expect(
				quatFromMat3Exact(
					matFrom([
						[1, 0, 0],
						[0, cc, -ss],
						[0, ss, cc],
					]),
				),
				approxEqualsQuaternion(quatFromRotationAround(vecFrom(1, 0, 0), angle)),
			);
		}
	});

	it('returns a quaternion matching a rotation matrix (zx)', () => {
		for (let i = 1; i < 10; ++i) {
			const angle = Math.PI * (i / 10);
			const cc = Math.cos(angle);
			const ss = Math.sin(angle);
			expect(
				quatFromMat3Exact(
					matFrom([
						[cc, 0, ss],
						[0, 1, 0],
						[-ss, 0, cc],
					]),
				),
				approxEqualsQuaternion(quatFromRotationAround(vecFrom(0, 1, 0), angle)),
			);
		}
	});

	it('returns an identity quaternion for an identity matrix', () => {
		const quat = quatFromMat3Exact(matIdent(3));
		expect(quat).equals({ w: 1, x: 0, y: 0, z: 0 });
	});

	it('returns a full rotation quaternion for a full rotation', () => {
		const quat = quatFromMat3Exact(
			matFrom([
				[-1, 0, 0],
				[0, -1, 0],
				[0, 0, 1],
			]),
		);
		expect(quat).equals({ w: 0, x: 0, y: 0, z: 1 });
	});
});

//describe('quatFromMat3BestFit', () => {
//	it('extracts a rotation quaternion from a matrix with errors', () => {
//		// TODO
//	});
//});

describe('mat3FromQuat', () => {
	it('returns a rotation matrix matching a non-normalised quaternion', () => {
		for (let i = 1; i < 10; ++i) {
			const angle = Math.PI * (i / 10);
			const mat = mat3FromQuat(quatFromRotationAround(vecFrom(0, 0, 1), angle));
			const cc = Math.cos(angle);
			const ss = Math.sin(angle);
			expect(
				mat,
				approxEqualsMatrix([
					[cc, -ss, 0],
					[ss, cc, 0],
					[0, 0, 1],
				]),
			);
		}
	});
});

describe('mat3FromUnitQuat', () => {
	it('returns a rotation matrix matching a normalised quaternion', () => {
		for (let i = 1; i < 10; ++i) {
			const angle = Math.PI * (i / 10);
			const mat = mat3FromUnitQuat(
				quatFromRotationAround(vecFrom(0, 0, 1), angle),
			);
			const cc = Math.cos(angle);
			const ss = Math.sin(angle);
			expect(
				mat,
				approxEqualsMatrix([
					[cc, -ss, 0],
					[ss, cc, 0],
					[0, 0, 1],
				]),
			);
		}
	});
});

describe('quatMul', () => {
	it('combines two rotations', () => {
		const angle1 = Math.PI * 0.3;
		const angle2 = Math.PI * 0.1;
		const q1 = quatFromRotationAround(vecFrom(0, 0, 1), angle1);
		const q2 = quatFromRotationAround(vecFrom(0, 0, 1), angle2);
		expect(
			quatMul(q1, q2),
			approxEqualsQuaternion(
				quatFromRotationAround(vecFrom(0, 0, 1), angle1 + angle2),
			),
		);
	});

	it('is equivalent to rotation matrix multiplication', () => {
		const angle1 = Math.PI * 0.3;
		const angle2 = Math.PI * 0.1;
		const q1 = quatFromRotationAround(vecFrom(0, 0, 1), angle1);
		const q2 = quatFromRotationAround(vecFrom(0, 1, 0), angle2);
		const m1 = mat3FromUnitQuat(q1);
		const m2 = mat3FromUnitQuat(q2);
		const q12 = quatMul(q1, q2);
		const q21 = quatMul(q2, q1);
		const m12 = matMul(m1, m2);
		const m21 = matMul(m2, m1);
		expect(mat3FromUnitQuat(q12), approxEqualsMatrix(m12));
		expect(mat3FromUnitQuat(q21), approxEqualsMatrix(m21));
	});

	it('is transitive if the rotations are coplanar', () => {
		const angle1 = Math.PI * 0.3;
		const angle2 = -Math.PI * 0.1;
		const q1 = quatFromRotationAround(vecFrom(0, 0, 1), angle1);
		const q2 = quatFromRotationAround(vecFrom(0, 0, 1), angle2);
		expect(quatMul(q1, q2), approxEqualsQuaternion(quatMul(q2, q1)));
	});
});

describe('quatDiv', () => {
	it('combines two rotations, negating the second', () => {
		const angle1 = Math.PI * 0.3;
		const angle2 = Math.PI * 0.1;
		const q1 = quatFromRotationAround(vecFrom(0, 0, 1), angle1);
		const q2 = quatFromRotationAround(vecFrom(0, 0, 1), angle2);
		expect(
			quatDiv(q1, q2),
			approxEqualsQuaternion(
				quatFromRotationAround(vecFrom(0, 0, 1), angle1 - angle2),
			),
		);
	});
});

describe('quatAdd', () => {
	it('elementwise adds two quaternions', () => {
		expect(quatAdd(quatFrom(1, 2, 3, 4), quatFrom(5, 6, 7, 8))).equals(
			quatFrom(6, 8, 10, 12),
		);
	});
});

describe('quatSub', () => {
	it('elementwise subtrtacts two quaternions', () => {
		expect(quatSub(quatFrom(1, 2, 3, 4), quatFrom(5, 6, 7, 8))).equals(
			quatFrom(-4, -4, -4, -4),
		);
	});
});

describe('quatScale', () => {
	it('elementwise scales a quaternion', () => {
		expect(quatScale(quatFrom(1, 2, 3, 4), 3)).equals(quatFrom(3, 6, 9, 12));
	});
});

describe('quatMad', () => {
	it('elementwise scales a quaternion and adds another', () => {
		expect(quatMad(quatFrom(1, 2, 3, 4), 3, quatFrom(5, 6, 7, 8))).equals(
			quatFrom(8, 12, 16, 20),
		);
	});
});

describe('quatNorm', () => {
	it('returns the norm of a quaternion', () => {
		expect(quatNorm(quatFrom(1, 2, 3, 4))).isNear(5.48, { decimalPlaces: 2 });
		expect(quatNorm(quatFrom(0, 0, 0, 0))).equals(0);
	});
});

describe('quatNorm2', () => {
	it('returns the squared norm of a quaternion', () => {
		expect(quatNorm2(quatFrom(1, 2, 3, 4))).equals(30);
		expect(quatNorm2(quatFrom(0, 0, 0, 0))).equals(0);
	});
});

describe('quatVectorNorm', () => {
	it('returns the length of the vector part of the quaternion', () => {
		expect(quatVectorNorm(quatFrom(5, 3, 4, 12))).isNear(13);
		expect(quatVectorNorm(quatFrom(10, 0, 0, 0))).equals(0);
	});
});

describe('quatVectorNorm2', () => {
	it('returns the squared length of the vector part of the quaternion', () => {
		expect(quatVectorNorm2(quatFrom(5, 3, 4, 12))).equals(169);
		expect(quatVectorNorm2(quatFrom(10, 0, 0, 0))).equals(0);
	});
});

describe('quatDot', () => {
	it('returns the dot product of two quaternions', () => {
		expect(quatDot(quatFrom(1, 2, 3, 4), quatFrom(5, 6, 7, 8))).equals(70);
	});
});

describe('quatDist', () => {
	it('returns the distance between two quaternions', () => {
		expect(quatDist(quatFrom(2, 3, 1, 2), quatFrom(3, 5, 4, 6))).isNear(5.48, {
			decimalPlaces: 2,
		});
		expect(quatDist(quatFrom(1, 2, 3, 4), quatFrom(1, 2, 3, 4))).equals(0);
	});
});

describe('quatDist2', () => {
	it('returns the squared distance between two quaternions', () => {
		expect(quatDist2(quatFrom(4, 3, 2, 1), quatFrom(5, 4, 3, 2))).equals(4);
		expect(quatDist2(quatFrom(1, 2, 3, 4), quatFrom(1, 2, 3, 4))).equals(0);
	});
});

describe('quatUnit', () => {
	it('returns a unit (normalised) quaternion', () => {
		expect(quatUnit(quatFrom(4, 0, 0, 0))).equals(quatFrom(1, 0, 0, 0));
		expect(quatUnit(quatFrom(0, -2, 0, 0))).equals(quatFrom(0, -1, 0, 0));
	});

	it('accepts an optional scaling factor', () => {
		expect(quatUnit(quatFrom(4, 0, 0, 0), 2)).equals(quatFrom(2, 0, 0, 0));
	});
});

describe('quatNearest', () => {
	it('returns the closer of the two representations of a quaternion rotation to another quaternion', () => {
		const quat = quatFrom(0.9, 0, 0, 0.1);
		expect(quatNearest(quat, quatFrom(0, 0, 0, 1))).equals(quat);
		expect(quatNearest(quat, quatFrom(0, 0, 0, -1))).equals(
			quatFrom(-0.9, -0, -0, -0.1),
		);
	});
});

describe('quatLerp', () => {
	it('linearly interpolates between two quaternions', () => {
		const q1 = quatFrom(1, 2, 3, 4);
		const q2 = quatFrom(7, 8, 9, 10);
		expect(quatLerp(q1, q2, 1 / 3)).equals(quatFrom(3, 4, 5, 6));
	});

	it('can interpolate between two identical quaternions', () => {
		const q = quatFrom(1, 2, 3, 4);
		expect(quatLerp(q, q, 1 / 3)).equals(q);
	});

	it('returns the input quaternions at the ends', () => {
		const q1 = quatFromRotationAround(
			vecNorm(vecFrom(0, 1, 2)),
			Math.PI * 0.05,
		);
		const q2 = quatFromRotationAround(
			vecNorm(vecFrom(2, 1, 0)),
			Math.PI * 0.35,
		);
		expect(quatLerp(q1, q2, 0), approxEqualsQuaternion(q1));
		expect(quatLerp(q1, q2, 1), approxEqualsQuaternion(q2));
	});
});

describe('quatLerpShortestPath', () => {
	it('linearly interpolates between two quaternions', () => {
		const q1 = quatFrom(1, 2, 3, 4);
		const q2 = quatFrom(7, 8, 9, 10);
		expect(quatLerpShortestPath(q1, q2, 1 / 3)).equals(quatFrom(3, 4, 5, 6));
	});

	it('negates the source quaternion if it makes the shorter path', () => {
		const q1 = quatFrom(1, 2, 3, 4);
		const q2 = quatFrom(-7, -8, -9, -10);
		expect(quatLerpShortestPath(q1, q2, 1 / 3)).equals(
			quatFrom(-3, -4, -5, -6),
		);
	});

	it('can interpolate between two identical quaternions', () => {
		const q = quatFrom(1, 2, 3, 4);
		expect(quatLerpShortestPath(q, q, 1 / 3)).equals(q);
		expect(quatLerpShortestPath(quatScale(q, -1), q, 1 / 3)).equals(q);
	});
});

describe('quatLerpUnit', () => {
	it('linearly interpolates between two quaternions and normalises the result', () => {
		const q1 = quatFrom(1, 2, 3, 4);
		const q2 = quatFrom(7, 8, 9, 10);
		expect(quatLerpUnit(q1, q2, 1 / 3)).equals(quatUnit(quatFrom(3, 4, 5, 6)));
	});
});

describe('quatLerpShortestPathUnit', () => {
	it('linearly interpolates between two quaternions and normalises the result', () => {
		const q1 = quatFrom(1, 2, 3, 4);
		const q2 = quatFrom(7, 8, 9, 10);
		expect(quatLerpShortestPathUnit(q1, q2, 1 / 3)).equals(
			quatUnit(quatFrom(3, 4, 5, 6)),
		);
	});

	it('negates the source quaternion if it makes the shorter path', () => {
		const q1 = quatFrom(1, 2, 3, 4);
		const q2 = quatFrom(-7, -8, -9, -10);
		expect(quatLerpShortestPathUnit(q1, q2, 1 / 3)).equals(
			quatUnit(quatFrom(-3, -4, -5, -6)),
		);
	});
});

describe('quatSlerp', () => {
	it('spherically interpolates between two quaternions', () => {
		const axis = vecNorm(vecFrom(0, 1, 2));
		const q1 = quatFromRotationAround(axis, Math.PI * 0.05);
		const q2 = quatFromRotationAround(axis, Math.PI * 0.35);
		expect(
			quatSlerp(q1, q2, 1 / 3),
			approxEqualsQuaternion(quatFromRotationAround(axis, Math.PI * 0.15)),
		);
	});

	it('returns the input quaternions at the ends', () => {
		const q1 = quatFromRotationAround(
			vecNorm(vecFrom(0, 1, 2)),
			Math.PI * 0.05,
		);
		const q2 = quatFromRotationAround(
			vecNorm(vecFrom(2, 1, 0)),
			Math.PI * 0.35,
		);
		expect(quatSlerp(q1, q2, 0), approxEqualsQuaternion(q1));
		expect(quatSlerp(q1, q2, 1), approxEqualsQuaternion(q2));
	});

	it('can interpolate between two identical quaternions', () => {
		const q = quatUnit(quatFrom(1, 2, 3, 4));
		expect(quatSlerp(q, q, 1 / 3)).equals(q);
		expect(quatSlerp(quatScale(q, -1), q, 1 / 3)).equals(quatScale(q, -1));
		expect(quatSlerp(quatScale(q, -1), q, 2 / 3)).equals(q);
	});
});

describe('quatSlerpShortestPath', () => {
	it('spherically interpolates between two quaternions', () => {
		const axis = vecNorm(vecFrom(0, 1, 2));
		const q1 = quatFromRotationAround(axis, Math.PI * 0.05);
		const q2 = quatFromRotationAround(axis, Math.PI * 0.35);
		expect(
			quatSlerpShortestPath(q1, q2, 1 / 3),
			approxEqualsQuaternion(quatFromRotationAround(axis, Math.PI * 0.15)),
		);
	});

	it('negates the source quaternion if it makes the shorter path', () => {
		const axis = vecNorm(vecFrom(0, 1, 2));
		const q1 = quatScale(quatFromRotationAround(axis, Math.PI * 0.05), -1);
		const q2 = quatFromRotationAround(axis, Math.PI * 0.35);
		expect(
			quatSlerpShortestPath(q1, q2, 1 / 3),
			approxEqualsQuaternion(quatFromRotationAround(axis, Math.PI * 0.15)),
		);
	});

	it('can interpolate between two identical quaternions', () => {
		const q = quatUnit(quatFrom(1, 2, 3, 4));
		expect(quatSlerpShortestPath(q, q, 1 / 3)).equals(q);
		expect(quatSlerpShortestPath(quatScale(q, -1), q, 1 / 3)).equals(q);
		expect(quatSlerpShortestPath(quatScale(q, -1), q, 2 / 3)).equals(q);
	});
});

describe('quatSquad', () => {
	it('spherically interpolates between two quaternions with additional control points', () => {
		const axis = vecNorm(vecFrom(0, 1, 2));
		const a0 = Math.PI * 0.3;
		const a1 = Math.PI * 0.1; // d(0) = 0 (a1 = a0-(a3-a0)/2)
		const a2 = Math.PI * 0.9; // d(1) = 1 (a2 = a3+(a3-a0)/2)
		const a3 = Math.PI * 0.7;
		const q0 = quatFromRotationAround(axis, a0);
		const s1 = quatFromRotationAround(axis, a1);
		const s2 = quatFromRotationAround(axis, a2);
		const q3 = quatFromRotationAround(axis, a3);
		const bezierEquiv = bezierFromQuad(
			vecFrom(a0),
			vecFrom(a1),
			vecFrom(a2),
			vecFrom(a3),
		);
		for (let i = 0; i <= 100; ++i) {
			const t = i / 100;
			const a = bezierAt(bezierEquiv, t).v[0];
			expect(
				quatSquad(q0, s1, s2, q3, t),
				approxEqualsQuaternion(quatFromRotationAround(axis, a)),
			);
		}
	});
});

describe('quatConjugate', () => {
	it('returns the reverse rotation', () => {
		const axis = vecNorm(vecFrom(0, 1, 2));
		const angle = Math.PI * 0.2;
		const quat = quatFromRotationAround(axis, angle);
		expect(
			quatConjugate(quat),
			approxEqualsQuaternion(quatFromRotationAround(axis, -angle)),
		);
	});

	it('maintains the length of the quaternion', () => {
		const quat = quatFrom(1, 2, 3, 4);
		expect(quatNorm(quatConjugate(quat))).isNear(quatNorm(quat));
	});
});

describe('quatInv', () => {
	it('returns the reverse rotation', () => {
		const axis = vecNorm(vecFrom(0, 1, 2));
		const angle = Math.PI * 0.2;
		const quat = quatFromRotationAround(axis, angle);
		console.log(quatNorm(quat), quatNorm2(quat));
		expect(
			quatInv(quat),
			approxEqualsQuaternion(quatFromRotationAround(axis, -angle)),
		);
	});

	it('inverts the length of the quaternion', () => {
		const quat = quatFrom(1, 2, 3, 4);
		expect(quatNorm(quatInv(quat))).isNear(1 / quatNorm(quat));
	});
});

describe('quatExp', () => {
	it('calculates the exponent of a quaternion', () => {
		expect(
			quatExp(quatFrom(0, 0, Math.PI * 0.25, 0)),
			approxEqualsQuaternion(quatFrom(Math.SQRT1_2, 0, Math.SQRT1_2, 0)),
		);

		// test cases from https://www.mathworks.com/help/nav/ref/quaternion.exp.html
		expect(
			quatExp(quatFrom(16, 2, 3, 13)),
			approxEqualsQuaternion(quatFrom(5352500, 1051600, 1577400, 6835200), 1e2),
		);

		expect(
			quatExp(quatFrom(5, 11, 10, 8)),
			approxEqualsQuaternion(
				quatFrom(-57.359, -89.189, -81.081, -64.865),
				1e-3,
			),
		);

		expect(
			quatExp(quatFrom(9, 7, 6, 12)),
			approxEqualsQuaternion(quatFrom(-6799.1, 2039.1, 1747.8, 3495.6), 1e-1),
		);

		expect(
			quatExp(quatFrom(4, 14, 15, 1)),
			approxEqualsQuaternion(quatFrom(-6.66, 36.931, 39.569, 2.6379), 1e-3),
		);
	});

	it('matches real-value exponentiation for purely real values', () => {
		for (let i = 0; i < 10; ++i) {
			expect(
				quatExp(quatFrom(i)),
				approxEqualsQuaternion(quatFrom(Math.exp(i))),
			);
		}
	});
});

describe('quatLog', () => {
	it('calculates the natural logarithm of a quaternion', () => {
		expect(
			quatLog(quatFrom(Math.SQRT1_2, 0, Math.SQRT1_2, 0)),
			approxEqualsQuaternion(quatFrom(0, 0, Math.PI * 0.25, 0)),
		);

		// test cases from https://www.mathworks.com/help/nav/ref/quaternion.log.html
		expect(
			quatLog(quatFrom(0.53767, 0.86217, -0.43359, 2.7694)),
			approxEqualsQuaternion(quatFrom(1.0925, 0.40848, -0.20543, 1.3121), 1e-4),
		);

		expect(
			quatLog(quatFrom(1.8339, 0.31877, 0.34262, -1.3499)),
			approxEqualsQuaternion(
				quatFrom(0.8436, 0.14767, 0.15872, -0.62533),
				1e-4,
			),
		);

		expect(
			quatLog(quatFrom(-2.2588, -1.3077, 3.5784, 3.0349)),
			approxEqualsQuaternion(quatFrom(1.6807, -0.53829, 1.473, 1.2493), 1e-4),
		);
	});

	it('matches real-value natural logarithm for purely real values', () => {
		for (let i = 1; i < 10; ++i) {
			expect(
				quatLog(quatFrom(i)),
				approxEqualsQuaternion(quatFrom(Math.log(i))),
			);
		}
	});

	it('reverses exponentiation if norm <= 1', () => {
		const quat = quatFrom(0.1, 0.2, 0.3, 0.4);
		expect(quatLog(quatExp(quat)), approxEqualsQuaternion(quat));
	});
});

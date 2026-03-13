import { approxEqualsMatrix } from '../test-helpers/approxEqualsMatrix.mts';
import {
	mat3FromQuat,
	mat3FromUnitQuat,
	quatAdd,
	quatDist,
	quatDist2,
	quatDiv,
	quatDot,
	quatFrom,
	quatFromMat3Exact,
	quatFromRotationAround,
	quatMad,
	quatMul,
	quatNearest,
	quatNorm,
	quatNorm2,
	quatScale,
	quatSub,
	quatUnit,
	quatVectorNorm,
} from './Quaternion.mts';
import { matFrom, matIdent, matMul } from './Matrix.mts';
import { vecFrom } from './Vector.mts';
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
	it('returns a normalised quaternion representing a rotation', () => {
		const angle = Math.PI * 0.3;
		expect(quatFromRotationAround(vecFrom(0, 0, 1), angle)).equals({
			w: Math.cos(angle * 0.5),
			x: 0,
			y: 0,
			z: Math.sin(angle * 0.5),
		});
	});
});

describe('quatFromMat3Exact', () => {
	it('returns a quaternion matching a rotation matrix (xy)', () => {
		for (let i = 1; i < 10; ++i) {
			const angle = Math.PI * (i / 10);
			const cc = Math.cos(angle);
			const ss = Math.sin(angle);
			const quat = quatFromMat3Exact(
				matFrom([
					[cc, -ss, 0],
					[ss, cc, 0],
					[0, 0, 1],
				]),
			);
			expect(quat.w).isNear(Math.cos(angle / 2));
			expect(quat.x).isNear(0);
			expect(quat.y).isNear(0);
			expect(quat.z).isNear(Math.sin(angle / 2));
		}
	});

	it('returns a quaternion matching a rotation matrix (yz)', () => {
		for (let i = 1; i < 10; ++i) {
			const angle = Math.PI * (i / 10);
			const cc = Math.cos(angle);
			const ss = Math.sin(angle);
			const quat = quatFromMat3Exact(
				matFrom([
					[1, 0, 0],
					[0, cc, -ss],
					[0, ss, cc],
				]),
			);
			expect(quat.w).isNear(Math.cos(angle / 2));
			expect(quat.x).isNear(Math.sin(angle / 2));
			expect(quat.y).isNear(0);
			expect(quat.z).isNear(0);
		}
	});

	it('returns a quaternion matching a rotation matrix (zx)', () => {
		for (let i = 1; i < 10; ++i) {
			const angle = Math.PI * (i / 10);
			const cc = Math.cos(angle);
			const ss = Math.sin(angle);
			const quat = quatFromMat3Exact(
				matFrom([
					[cc, 0, ss],
					[0, 1, 0],
					[-ss, 0, cc],
				]),
			);
			expect(quat.w).isNear(Math.cos(angle / 2));
			expect(quat.x).isNear(0);
			expect(quat.y).isNear(Math.sin(angle / 2));
			expect(quat.z).isNear(0);
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
		const q12 = quatMul(q1, q2);
		const q3 = quatFromRotationAround(vecFrom(0, 0, 1), angle1 + angle2);
		expect(q12.w).isNear(q3.w);
		expect(q12.x).isNear(q3.x);
		expect(q12.y).isNear(q3.y);
		expect(q12.z).isNear(q3.z);
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
		const q12 = quatMul(q1, q2);
		const q21 = quatMul(q2, q1);
		expect(q12.w).isNear(q21.w);
		expect(q12.x).isNear(q21.x);
		expect(q12.y).isNear(q21.y);
		expect(q12.z).isNear(q21.z);
	});
});

describe('quatDiv', () => {
	it('combines two rotations, negating the second', () => {
		const angle1 = Math.PI * 0.3;
		const angle2 = Math.PI * 0.1;
		const q1 = quatFromRotationAround(vecFrom(0, 0, 1), angle1);
		const q2 = quatFromRotationAround(vecFrom(0, 0, 1), angle2);
		const q12 = quatDiv(q1, q2);
		const q3 = quatFromRotationAround(vecFrom(0, 0, 1), angle1 - angle2);
		expect(q12.w).isNear(q3.w);
		expect(q12.x).isNear(q3.x);
		expect(q12.y).isNear(q3.y);
		expect(q12.z).isNear(q3.z);
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

// TODO
// quatLerp
// quatLerpShortestPath
// quatLerpUnit
// quatLerpShortestPathUnit
// quatSlerp
// quatSlerpShortestPath
// quatSlerpUnit
// quatSlerpShortestPathUnit
// quatConjugate
// quatInv
// quatExp
// quatLog

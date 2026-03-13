import { matFrom } from './Matrix.mts';
import {
	matFromVecArray,
	vec2Cross,
	vec3Cross,
	vecAdd,
	vecAngle,
	vecArrayFromMat,
	vecDist,
	vecDist2,
	vecDot,
	vecFrom,
	vecLen,
	vecLen2,
	vecLerp,
	vecMad,
	vecMid,
	vecMul,
	vecNorm,
	vecReflect,
	vecSub,
} from './Vector.mts';
import 'lean-test';

describe('vecFrom', () => {
	it('creates a vector from coordinates', () => {
		expect(vecFrom(1, 2, 3)).equals({ v: [1, 2, 3], m: 1, n: 3 });
	});
});

describe('vecArrayFromMat', () => {
	it('reads vectors from a matrix', () => {
		expect(
			vecArrayFromMat(
				matFrom([
					[1, 2, 3],
					[4, 5, 6],
				]),
			),
		).equals([vecFrom(1, 2, 3), vecFrom(4, 5, 6)]);
	});
});

describe('matFromVecArray', () => {
	it('creates a matrix from stacked vectors', () => {
		expect(matFromVecArray([vecFrom(1, 2, 3), vecFrom(4, 5, 6)])).equals(
			matFrom([
				[1, 2, 3],
				[4, 5, 6],
			]),
		);
	});
});

describe('vecDot', () => {
	it('returns the dot product of two vectors', () => {
		expect(vecDot(vecFrom(1, 2, 3), vecFrom(4, 5, 6))).equals(32);
	});
});

describe('vec2Cross', () => {
	it('returns the cross product of two 2D vectors', () => {
		expect(vec2Cross(vecFrom(1, 2), vecFrom(3, 4))).equals(-2);
	});
});

describe('vec3Cross', () => {
	it('returns the cross product of two 3D vectors', () => {
		expect(vec3Cross(vecFrom(1, 2, 3), vecFrom(4, 5, 6))).equals(
			vecFrom(2 * 6 - 3 * 5, 3 * 4 - 1 * 6, 1 * 5 - 2 * 4),
		);
	});
});

describe('vecReflect', () => {
	it('reflects a vector in a plane', () => {
		expect(vecReflect(vecFrom(1, 2, 3), vecFrom(1, 0, 0))).equals(
			vecFrom(-1, 2, 3),
		);

		expect(vecReflect(vecFrom(1, 2, 3), vecFrom(0, 1, 0))).equals(
			vecFrom(1, -2, 3),
		);

		expect(vecReflect(vecFrom(1, 2, 3), vecFrom(0, 0, 1))).equals(
			vecFrom(1, 2, -3),
		);
	});
});

describe('vecLen2', () => {
	it('returns the squared length of a vector', () => {
		expect(vecLen2(vecFrom(0, 0, 0))).equals(0);
		expect(vecLen2(vecFrom(3, 4, 12))).equals(169);
	});
});

describe('vecLen', () => {
	it('returns the length of a vector', () => {
		expect(vecLen(vecFrom(0, 0, 0))).equals(0);
		expect(vecLen(vecFrom(3, 4, 12))).isNear(13, { tolerance: 1e-16 });
	});
});

describe('vecDist2', () => {
	it('returns the squared distance between two vectors', () => {
		expect(vecDist2(vecFrom(1, 2, 3), vecFrom(1, 2, 3))).equals(0);
		expect(vecDist2(vecFrom(1, 2, 3), vecFrom(4, 6, 15))).equals(169);
	});
});

describe('vecDist', () => {
	it('returns the distance between two vectors', () => {
		expect(vecDist(vecFrom(1, 2, 3), vecFrom(1, 2, 3))).equals(0);
		expect(vecDist(vecFrom(1, 2, 3), vecFrom(4, 6, 15))).isNear(13, {
			tolerance: 1e-16,
		});
	});
});

describe('vecNorm', () => {
	it('returns a normalised vector', () => {
		expect(vecNorm(vecFrom(4, 0, 0))).equals(vecFrom(1, 0, 0));
		expect(vecNorm(vecFrom(0, -2, 0))).equals(vecFrom(0, -1, 0));
	});

	it('accepts an optional scaling factor', () => {
		expect(vecNorm(vecFrom(4, 0, 0), 2)).equals(vecFrom(2, 0, 0));
	});
});

describe('vecAngle', () => {
	it('returns the angle in radians between two vectors', () => {
		expect(vecAngle(vecFrom(1, 0, 0), vecFrom(1, 0, 0))).equals(0);
		expect(vecAngle(vecFrom(1, 0, 0), vecFrom(-1, 0, 0))).isNear(Math.PI);
		expect(vecAngle(vecFrom(1, 0, 0), vecFrom(0, 1, 0))).isNear(Math.PI * 0.5);
		expect(vecAngle(vecFrom(1, 0, 0), vecFrom(0, 0, 1))).isNear(Math.PI * 0.5);
		expect(vecAngle(vecFrom(1, 0, 0), vecFrom(0, 0, -1))).isNear(Math.PI * 0.5);
	});

	it('does not require normalised vectors', () => {
		expect(vecAngle(vecFrom(2, 0, 0), vecFrom(0, 3, 0))).isNear(Math.PI * 0.5);
	});
});

describe('vecAdd', () => {
	it('elementwise adds two vectors', () => {
		expect(vecAdd(vecFrom(1, 2, 3), vecFrom(4, 5, 6))).equals(vecFrom(5, 7, 9));
	});
});

describe('vecMul', () => {
	it('elementwise scales a vector', () => {
		expect(vecMul(vecFrom(1, 2, 3), 3)).equals(vecFrom(3, 6, 9));
	});
});

describe('vecMad', () => {
	it('elementwise scales a vector and adds another', () => {
		expect(vecMad(vecFrom(1, 2, 3), 3, vecFrom(4, 5, 6))).equals(
			vecFrom(7, 11, 15),
		);
	});
});

describe('vecSub', () => {
	it('elementwise subtracts two vectors', () => {
		expect(vecSub(vecFrom(1, 2, 3), vecFrom(4, 5, 6))).equals(
			vecFrom(-3, -3, -3),
		);
	});
});

describe('vecLerp', () => {
	it('elementwise linearly interpolates between two vectors', () => {
		expect(vecLerp(vecFrom(1, 2, 3), vecFrom(4, 5, 6), 1 / 3)).equals(
			vecFrom(2, 3, 4),
		);
	});
});

describe('vecMid', () => {
	it('returns the midpoint between two vectors', () => {
		expect(vecMid(vecFrom(1, 2, 3), vecFrom(4, 5, 6))).equals(
			vecFrom(2.5, 3.5, 4.5),
		);
	});
});

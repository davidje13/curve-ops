import {
	MAT3IDENT,
	matAdd,
	matFrom,
	matMul,
	matScale,
	type Matrix,
} from '../../Matrix.mts';
import {
	vec3Cross,
	vecDot,
	vecNorm,
	vecSub,
	type Vector,
} from '../../Vector.mts';

export function matFromEyeTargetUp(
	eye: Vector<3>,
	target: Vector<3>,
	up: Vector<3>,
): Matrix<4, 4> {
	const z = vecNorm(vecSub(eye, target));
	const x = vecNorm(vec3Cross(up, z));
	const y = vec3Cross(z, x);

	return matFrom([
		[x.v[0], y.v[0], z.v[0], vecDot(eye, x)],
		[x.v[1], y.v[1], z.v[1], vecDot(eye, y)],
		[x.v[2], y.v[2], z.v[2], vecDot(eye, z)],
		[0, 0, 0, 1],
	]);
}

export const matSkewSymmetricCrossProduct = ({
	v: [x, y, z],
}: Vector<3>): Matrix<3, 3> =>
	matFrom([
		[0, -z, y],
		[z, 0, -x],
		[-y, x, 0],
	]);

export function matFromRotationBetween(
	fromNorm: Vector<3>,
	toNorm: Vector<3>,
): Matrix<3, 3> {
	// thanks, https://math.stackexchange.com/a/476311
	const scale = 1 + vecDot(fromNorm, toNorm);
	if (scale < 1e-6) {
		return MAT3IDENT;
	}
	const ssm = matSkewSymmetricCrossProduct(vec3Cross(fromNorm, toNorm));

	return matAdd(MAT3IDENT, matAdd(ssm, matScale(matMul(ssm, ssm), 1 / scale)));
}

import type { Matrix } from '../../Matrix.mts';
import { vecFrom, type Vector } from '../../Vector.mts';

export function matProjectVec3(
	{
		v: [
			v00,
			v01,
			v02,
			v03,
			v10,
			v11,
			v12,
			v13,
			v20,
			v21,
			v22,
			v23,
			v30,
			v31,
			v32,
			v33,
		],
	}: Matrix<4, 4>,
	{ v: [x, y, z] }: Vector<3>,
): Vector<3> {
	const m = 1 / (x * v30 + y * v31 + z * v32 + v33);
	return vecFrom(
		(x * v00 + y * v01 + z * v02 + v03) * m,
		(x * v10 + y * v11 + z * v12 + v13) * m,
		(x * v20 + y * v21 + z * v22 + v23) * m,
	);
}

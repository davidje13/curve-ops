import type { SizedArray } from '../../util/SizedArray.mts';
import {
	internalMatFromFlat,
	matAdd,
	matLerp,
	matMid,
	matScale,
	matScaleAdd,
	matSub,
	type Matrix,
} from '../Matrix.mts';

export type Vector<Dim extends number = number> = Matrix<1, Dim>;

export const vecFrom = <const P extends ReadonlyArray<number>>(
	...coords: P
): Vector<P['length']> => ({ v: coords as any, m: 1, n: coords.length });

export function vecArrayFromMat<Dim extends number, Points extends number>({
	v,
	m,
	n,
}: Matrix<Points, Dim>): SizedArray<Vector<Dim>, Points> {
	const r: Vector<Dim>[] = [];
	for (let i = 0; i < m; ++i) {
		r.push(internalMatFromFlat(v.slice(i * n, i * n + n), 1, n));
	}
	return r as SizedArray<Vector<Dim>, Points>;
}

export const matFromVecArray = <
	Dim extends number,
	const T extends Vector<Dim>[],
>(
	vecs: T,
) =>
	internalMatFromFlat(
		vecs.flatMap((pt) => pt.v),
		vecs.length as T['length'],
		vecs[0]?.n ?? (0 as Dim),
	);

export function vecDot<Dim extends number>(a: Vector<Dim>, b: Vector<Dim>) {
	assertVecSizeSame(a, b, '.');
	let r = 0;
	for (let i = 0; i < a.n; ++i) {
		r += a.v[i]! * b.v[i]!;
	}
	return r;
}

export const vec2Cross = (
	{ v: [ax, ay] }: Vector<2>,
	{ v: [bx, by] }: Vector<2>,
) => ax * by - ay * bx;

export const vec3Cross = (
	{ v: [ax, ay, az] }: Vector<3>,
	{ v: [bx, by, bz] }: Vector<3>,
): Vector<3> => ({
	v: [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx],
	m: 1,
	n: 3,
});

export const vecReflect = <Dim extends number>(
	vec: Vector<Dim>,
	surfaceNorm: Vector<Dim>,
) => vecMad(surfaceNorm, -2 * vecDot(vec, surfaceNorm), vec);

export const vecLen2 = <Dim extends number>(vec: Vector<Dim>) =>
	vecDot(vec, vec);
export const vecLen = <Dim extends number>({ v }: Vector<Dim>) =>
	Math.hypot(...v);

export const vecDist2 = <Dim extends number>(a: Vector<Dim>, b: Vector<Dim>) =>
	vecLen2(vecSub(a, b));
export const vecDist = <Dim extends number>(a: Vector<Dim>, b: Vector<Dim>) =>
	vecLen(vecSub(a, b));

export const vecNorm = <Dim extends number>(vec: Vector<Dim>, length = 1) =>
	vecMul(vec, length / vecLen(vec));

export const vecAngle = <Dim extends number>(a: Vector<Dim>, b: Vector<Dim>) =>
	Math.acos(
		Math.max(
			-1,
			Math.min(1, vecDot(a, b) / Math.sqrt(vecLen2(a) * vecLen2(b))),
		),
	);

export const vecAdd: <N extends number>(
	a: Vector<N>,
	b: Vector<N>,
) => Vector<N> = matAdd;

export const vecMul: <N extends number>(a: Vector<N>, b: number) => Vector<N> =
	matScale;

export const vecMad: <N extends number>(
	a: Vector<N>,
	s: number,
	b: Vector<N>,
) => Vector<N> = matScaleAdd;

export const vecSub: <N extends number>(
	a: Vector<N>,
	b: Vector<N>,
) => Vector<N> = matSub;

export const vecLerp: <N extends number>(
	a: Vector<N>,
	b: Vector<N>,
	t: number,
) => Vector<N> = matLerp;

export const vecMid: <N extends number>(
	a: Vector<N>,
	b: Vector<N>,
) => Vector<N> = matMid;

function assertVecSizeSame<S extends number>(
	a: Vector<S>,
	b: Vector,
	op: string,
): asserts b is Vector<S> {
	if (a.n !== b.n) {
		throw new Error(`invalid vector operation (${a.n}) ${op} (${b.n})`);
	}
}

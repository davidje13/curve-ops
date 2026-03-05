import type { Decrement, Increment } from '../../types/numeric.mts';
import { zeros, type SizedArrayWithLength } from '../../util/SizedArray.mts';
import { binomial } from '../binomial.mts';
import {
	internalMatFromFlat,
	MAT2ROT90,
	matFromDiag,
	matInverse,
	matLeftInverse,
	matMul,
	type Matrix,
} from '../Matrix.mts';
import { vec3Cross, vecAdd, vecNorm, type Vector } from './Vector.mts';

export type Bezier<Points extends number, Dim extends number> = Matrix<
	Points,
	Dim
>;

export const bezierAt = <Points extends number, Dim extends number>(
	curve: Bezier<Points, Dim>,
	t: number,
) => bezierAtMulti(curve, [t]);

export const bezierOrder = (curve: Bezier<number, number>) => curve.m - 1;

export function bezierElevateOrder<Points extends number, Dim extends number>({
	v,
	m,
	n,
}: Bezier<Points, Dim>): Bezier<Increment<Points>, Dim> {
	const newM = (m + 1) as Increment<Points>;
	const newV: number[] = [];
	for (let i = 0; i < newM; ++i) {
		const f = i / m;
		for (let j = 0; j < n; ++j) {
			newV.push((1 - f) * (v[i * n + j] ?? 0) + f * (v[(i - 1) * n + j] ?? 0));
		}
	}
	return internalMatFromFlat(newV, newM, n);
}

const BEZIER_LOWER_ORDER_CACHE = /*@__PURE__*/ new Map<number, Matrix>();
export function bezierLowerOrder<Points extends number, Dim extends number>(
	curve: Bezier<Points, Dim>,
): Bezier<Decrement<Points>, Dim> {
	// thanks, https://pomax.github.io/bezierinfo/#reordering

	const m = curve.m;
	let transform = BEZIER_LOWER_ORDER_CACHE.get(m) as
		| Matrix<Decrement<Points>, Points>
		| undefined
		| null;
	if (!transform) {
		const newM = (m - 1) as Decrement<Points>;
		const mv = zeros(m * newM);
		mv[0] = mv[m * newM - 1] = 1;
		for (let i = 1; i < newM; ++i) {
			mv[i * m] = 1 - (mv[i * m - 1] = i / newM);
		}
		const M = internalMatFromFlat(mv, m, newM);
		transform = matLeftInverse(M);
		if (!transform) {
			throw new Error('unexpected non-invertible elevation matrix');
		}
		BEZIER_LOWER_ORDER_CACHE.set(m, transform);
	}
	return matMul(transform, curve);
}

const BEZIER_M_CACHE = /*@__PURE__*/ new Map<number, Matrix>();
export function bezierM<Points extends number>(
	n: Points,
): Matrix<Points, Points> {
	const cached = BEZIER_M_CACHE.get(n);
	if (cached) {
		return cached as Matrix<Points, Points>;
	}
	const v = zeros(n * n);
	for (let i = 0; i < n; ++i) {
		const b1 = binomial(n - 1, i) * ((i & 1) * 2 - 1);
		for (let j = 0; j <= i; ++j) {
			const b2 = binomial(i, j) * ((j & 1) * 2 - 1);
			v[i * n + j] = b1 * b2;
		}
	}
	const m = internalMatFromFlat(v, n, n);
	BEZIER_M_CACHE.set(n, m);
	return m;
}

const BEZIER_M_INV_CACHE = /*@__PURE__*/ new Map<number, Matrix>();
export function bezierMInv<Points extends number>(
	n: Points,
): Matrix<Points, Points> {
	const cached = BEZIER_M_INV_CACHE.get(n);
	if (cached) {
		return cached as Matrix<Points, Points>;
	}
	const Minv = matInverse(bezierM(n));
	if (!Minv) {
		throw new Error('unexpected non-invertible bezier matrix');
	}
	BEZIER_M_INV_CACHE.set(n, Minv);
	return Minv;
}

export function bezierAtMulti<
	Points extends number,
	Dim extends number,
	const Ts extends number[],
>(curve: Bezier<Points, Dim>, ts: Ts): Matrix<Ts['length'], Dim> {
	const ordP1 = curve.m;
	const tVals: number[] = [];
	for (let i = 0; i < ts.length; ++i) {
		const t = ts[i]!;
		for (let j = 0, v = 1; j < ordP1; ++j) {
			tVals.push(v);
			v *= t;
		}
	}
	return matMul(
		internalMatFromFlat(tVals, ts.length as Ts['length'], ordP1),
		matMul(bezierM(curve.m), curve),
	);
}

export function bezierDerivative<Points extends number, Dim extends number>({
	v,
	m,
	n,
}: Bezier<Points, Dim>): Bezier<Decrement<Points>, Dim> {
	const newM = (m - 1) as Decrement<Points>;
	const newV: number[] = [];
	for (let i = 0; i < newM; ++i) {
		for (let j = 0; j < n; ++j) {
			const p = i * n + j;
			newV.push(newM * (v[p + n]! - v[p]!));
		}
	}
	return internalMatFromFlat(newV, newM, n);
}

export const bezierTangentAt = <Points extends number, Dim extends number>(
	curve: Bezier<Points, Dim>,
	t: number,
): Vector<Dim> => vecNorm(bezierAt(bezierDerivative(curve), t));

export const bezierNormalAt = <Points extends number>(
	curve: Bezier<Points, 2>,
	t: number,
): Vector<2> => matMul(bezierTangentAt(curve, t), MAT2ROT90);

export const bezierFrenetNormalAt = <Points extends number>(
	curve: Bezier<Points, 3>,
	t: number,
): Vector<3> => {
	// thanks, https://pomax.github.io/bezierinfo/#pointvectors3d

	const d1 = bezierDerivative(curve);
	const d2 = bezierDerivative(d1);
	const a = vecNorm(bezierAt(d1, t));
	const b = vecNorm(vecAdd(a, bezierAt(d2, t)));
	const r = vecNorm(vec3Cross(b, a));
	return vec3Cross(r, a);
};

export function bezierBisect<Points extends number, Dim extends number>(
	curve: Bezier<Points, Dim>,
	t = 0.5,
): [Bezier<Points, Dim>, Bezier<Points, Dim>] {
	// thanks, https://pomax.github.io/bezierinfo/#matrixsplit

	const s = curve.m;
	const M = bezierM(s);
	const Minv = bezierMInv(s);
	const Z = matFromDiag(powers(t, s)) as Matrix<Points, Points>;
	const Q1 = matMul(matMul(Minv, Z), M);
	const q2v: number[] = [];
	for (let i = 0; i < s; ++i) {
		for (let j = 0; j <= i; ++j) {
			q2v.push(Q1.v[i * (s + 1) - j]!);
		}
		for (let j = i + 1; j < s; ++j) {
			q2v.push(0);
		}
	}
	const Q2 = internalMatFromFlat(q2v.reverse(), s, s);
	return [matMul(Q1, curve), matMul(Q2, curve)];
}

export function bezierSplit<Points extends number, Dim extends number>(
	curve: Bezier<Points, Dim>,
	splits: number[],
	minRange = 1e-6,
): Bezier<Points, Dim>[] {
	let remaining = curve;
	let pt = 0;
	const r = [];
	for (const t of splits.filter((t) => t > 0 && t < 1).sort()) {
		if (t <= pt + minRange) {
			continue;
		}
		const st = (t - pt) / (1 - pt);
		const [a, b] = bezierBisect(remaining, st);
		r.push(a);
		remaining = b;
	}
	r.push(remaining);
	return r;
}

function powers<N extends number>(
	base: number,
	n: N,
): SizedArrayWithLength<number, N> {
	const r: number[] = [];
	for (let j = 0, v = 1; j < n; ++j) {
		r.push(v);
		v *= base;
	}
	return r as SizedArrayWithLength<number, N>;
}

import type { Decrement, Increment } from '../../types/numeric.mts';
import { cached } from '../../util/cached.mts';
import {
	zeros,
	type SizedArrayWithLength,
	type SizeOf,
} from '../../util/SizedArray.mts';
import { binomial } from '../binomial.mts';
import {
	internalMatFromFlat,
	MAT2ROT90,
	matAddColumnwise,
	matFromArrayFn,
	matFromDiag,
	matInverse,
	matLeftInverse,
	matMul,
	matMulABTranspose,
	matWindow,
	type Matrix,
	type SquareMatrix,
} from '../Matrix.mts';
import { polynomialRoots, type Polynomial } from '../Polynomial.mts';
import {
	matFromVecArray,
	vec3Cross,
	vecAdd,
	vecFrom,
	vecLerp,
	vecMad,
	vecNorm,
	vecSub,
	type Vector,
} from '../Vector.mts';
import type { Polyline } from './Polyline.mts';

export type Bezier<Points extends number, Dim extends number> = Matrix<
	Points,
	Dim
>;

export const bezierFromVecs: <const T extends readonly Vector<number>[]>(
	vecs: T,
) => Bezier<SizeOf<T>, T[number]['n']> = matFromVecArray;

export const bezierFromEndpoints = <Points extends number, Dim extends number>(
	p0: Vector<Dim>,
	p1: Vector<Dim>,
	m: Points,
): Bezier<Points, Dim> => {
	const pts: Vector<Dim>[] = [];
	for (let i = 0; i <= m; ++i) {
		pts.push(vecLerp(p0, p1, i / m));
	}
	return matFromVecArray(pts) as Bezier<Points, Dim>;
};

export const bezierFromQuad = <Dim extends number>(
	p0: Vector<Dim>,
	c0: Vector<Dim>,
	c1: Vector<Dim>,
	p1: Vector<Dim>,
): Bezier<4, Dim> =>
	matFromVecArray([p0, vecLerp(c0, p1, 1 / 3), vecLerp(c1, p0, 1 / 3), p1]);

export function bezierFromPolylineVertsLeastSquares<
	Points extends number,
	Dim extends number,
>(polyline: Polyline<Dim>, m: Points): Bezier<Points, Dim> | null {
	// thanks, https://pomax.github.io/bezierinfo/#curvefitting

	if (!polyline.length || m < 2) {
		return null;
	}

	const p0 = polyline[0]!;
	const pN = polyline[polyline.length - 1]!;

	if (polyline.length > 2) {
		const dist0 = p0.d;
		const distM = 1 / (pN.d - dist0);

		const reducedM = Math.min(polyline.length, m);
		const TTinv = matLeftInverse(
			matFromArrayFn(polyline, ({ d }) =>
				powers((d - dist0) * distM, reducedM),
			),
		);
		if (TTinv) {
			const reducedBezier = matMul(
				bezierMInv(reducedM),
				matMul(TTinv, matFromVecArray(polyline)),
			);
			return bezierElevateOrderTo(reducedBezier, m);
		}
	}

	// if we reach this, the points must be colinear;
	// draw a straight line from start to end
	return bezierFromEndpoints(p0, pN, m);
}

export function bezierFromPolylineVertsLeastSquaresFixEnds<
	Points extends number,
	Dim extends number,
>(polyline: Polyline<Dim>, m: Points): Bezier<Points, Dim> | null {
	if (!polyline.length || m < 2) {
		return null;
	}

	const p0 = polyline[0]!;
	const pN = polyline[polyline.length - 1]!;

	if (polyline.length > 2) {
		const dist0 = p0.d;
		const distM = 1 / (pN.d - dist0);
		const dN = vecSub(pN, p0);

		// We subtract the start point from all points to trivially remove the
		// first row+column of M.
		// Then to remove the last row+column of M, we must rearrange them to be
		// all 0s except the last.
		// The structure of M means we can just add all rows above to the last row
		// to make it be 0 (except the last term which will be 1).
		// When we add a row [A] to another row [B], we must subtract the t-value B
		// from the t-value A to maintain the equations,
		// So we subtract the last t-value from all the others.
		// This leaves the last control point linearly independent of the others,
		// so we can just multiply it by the last t-value and subtract it from each
		// point.

		const reducedM = Math.min(polyline.length, m);
		const adjustedPoints: Vector<Dim>[] = [];
		const Tv: number[] = [];
		for (let i = 1; i < polyline.length - 1; ++i) {
			const pt = polyline[i]!;
			const t = (pt.d - dist0) * distM;
			const rawTPowers = powers(t, reducedM - 1, t);
			const lastT = rawTPowers.pop()!;
			Tv.push(...rawTPowers.map((tN) => tN - lastT));
			adjustedPoints.push(vecSub(pt, vecMad(dN, lastT, p0)));
		}
		const TTinv = matLeftInverse(
			internalMatFromFlat(Tv, polyline.length - 2, reducedM - 2),
		);
		if (TTinv) {
			const controls = matAddColumnwise(
				matMul(
					bezierMInvFixEnds(reducedM),
					matMul(TTinv, matFromVecArray(adjustedPoints)),
				),
				p0,
			);
			const reducedBezier = internalMatFromFlat(
				[...p0.v, ...controls.v, ...pN.v],
				reducedM,
				controls.n,
			);
			return bezierElevateOrderTo(reducedBezier, m);
		}
	}

	// if we reach this, the points must be colinear;
	// draw a straight line from start to end
	return bezierFromEndpoints(p0, pN, m);
}

const bezierMInvFixEnds = /*@__PURE__*/ cached(
	<Points extends number>(
		n: Points,
	): SquareMatrix<Decrement<Decrement<Points>>> => {
		const Minv = matInverse(matWindow(bezierM(n), 1, 1, n - 2, n - 2));
		if (!Minv) {
			throw new Error('unexpected non-invertible bezier matrix');
		}
		return Minv;
	},
);

export const bezierAt = <Points extends number, Dim extends number>(
	curve: Bezier<Points, Dim>,
	t: number,
) => bezierAtMulti(curve, [t]);

export function bezierAtMulti<
	Points extends number,
	Dim extends number,
	const Ts extends readonly number[],
>(curve: Bezier<Points, Dim>, ts: Ts): Matrix<SizeOf<Ts>, Dim> {
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
		internalMatFromFlat(tVals, ts.length as SizeOf<Ts>, ordP1),
		matMul(bezierM(curve.m), curve),
	);
}

export const bezierPolynomials = <Points extends number, Dim extends number>(
	curve: Bezier<Points, Dim>,
): SizedArrayWithLength<Polynomial<Points>, Dim> => {
	const { m, n } = curve;
	const M = matMul(bezierM(m), curve);
	const r: Polynomial[] = [];
	for (let dim = 0; dim < n; ++dim) {
		const poly: number[] = [];
		for (let i = 0; i < m; ++i) {
			poly.push(M.v[i * n + dim]!);
		}
		r.push(poly);
	}
	return r as SizedArrayWithLength<Polynomial<Points>, Dim>;
};

export const polynomialFromBezierValues = <P extends number[]>(
	...values: P
): Polynomial<SizeOf<P>> =>
	matMulABTranspose(bezierM(values.length), vecFrom(...values)).v as Polynomial<
		SizeOf<P>
	>;

export function internalSkewedTValues(gradient0: number, m: number) {
	if (m < 3 || m > 5 || Math.abs(gradient0 - 1) < Number.EPSILON) {
		return (p: number) => p;
	}
	const n = m - 1;
	const pts = [0];
	const c1 = gradient0 / n;
	for (let i = 0; i < n; ++i) {
		pts.push(c1 + (1 - c1) * (i / n));
	}
	const poly = polynomialFromBezierValues(...pts);
	return (p: number) =>
		polynomialRoots(poly, p, { min: 0, max: 0, maxError: 1e-2 })[0] ?? p;
}

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

export function bezierElevateOrderTo<
	Points extends number,
	Dim extends number,
	NewPoints extends number,
>(curve: Bezier<Points, Dim>, newM: NewPoints): Bezier<NewPoints, Dim> {
	// could optimise this to a single step instead of going via every intermediate bezier
	if (newM < curve.m) {
		throw new Error('curve is higher order than target');
	}
	let c: Bezier<number, Dim> = curve;
	while (c.m < newM) {
		c = bezierElevateOrder(c);
	}
	return c as Bezier<NewPoints, Dim>;
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

export const bezierM = /*@__PURE__*/ cached(
	<Points extends number>(n: Points): SquareMatrix<Points> => {
		const v = zeros(n * n);
		for (let i = 0; i < n; ++i) {
			const b1 = binomial(n - 1, i) * ((i & 1) * 2 - 1);
			for (let j = 0; j <= i; ++j) {
				const b2 = binomial(i, j) * ((j & 1) * 2 - 1);
				v[i * n + j] = b1 * b2;
			}
		}
		const m = internalMatFromFlat(v, n, n);
		return m;
	},
);

export const bezierMInv = /*@__PURE__*/ cached(
	<Points extends number>(n: Points): SquareMatrix<Points> => {
		const Minv = matInverse(bezierM(n));
		if (!Minv) {
			throw new Error('unexpected non-invertible bezier matrix');
		}
		return Minv;
	},
);

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

export const bezierTranslate = <Points extends number, Dim extends number>(
	curve: Bezier<Points, Dim>,
	shift: Vector<Dim>,
): Bezier<Points, Dim> => matAddColumnwise(curve, shift);

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
	const Z = matFromDiag(powers(t, s)) as SquareMatrix<Points>;
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
	splits: readonly number[],
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
	begin = 1,
): SizedArrayWithLength<number, N> {
	const r: number[] = [];
	for (let j = 0, v = begin; j < n; ++j) {
		r.push(v);
		v *= base;
	}
	return r as SizedArrayWithLength<number, N>;
}

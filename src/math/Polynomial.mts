import type { Decrement, Increment, Max } from '../types/numeric.mts';
import { zeros, type SizedArray } from '../util/SizedArray.mts';

export type Polynomial<N extends number = number> = SizedArray<number, N>;

export const polynomialAt = (poly: Polynomial, t: number): number =>
	poly.reduceRight((v, n) => v * t + n, 0);

export const polynomialMul = (...polynomials: Polynomial[]): Polynomial =>
	polynomials.reduce((a, b) => {
		const r = zeros(a.length + b.length - 1);
		for (let i = 0; i < a.length; ++i) {
			for (let j = 0; j < b.length; ++j) {
				r[i + j]! += a[i]! * b[j]!;
			}
		}
		return r;
	});

export const polynomialDerivative = <P extends Polynomial>(poly: P) =>
	poly.map((v, i) => v * i).slice(1) as Polynomial<Decrement<P['length']>>;

export const polynomialIntegral = <P extends Polynomial>(poly: P, c = 0) =>
	[c, ...poly.map((v, i) => v / (i + 1))] as Polynomial<Increment<P['length']>>;

export const polynomialAdd = <N extends number, M extends number>(
	a: Polynomial<N>,
	b: Polynomial<M>,
) =>
	(a.length >= b.length
		? a.map((av, i) => av + (b[i] ?? 0))
		: b.map((bv, i) => (a[i] ?? 0) + bv)) as Polynomial<Max<N, M>>;

export const polynomialSub = <N extends number, M extends number>(
	a: Polynomial<N>,
	b: Polynomial<M>,
) =>
	(a.length >= b.length
		? a.map((av, i) => av - (b[i] ?? 0))
		: b.map((bv, i) => (a[i] ?? 0) - bv)) as Polynomial<Max<N, M>>;

export const polynomialScale = <P extends Polynomial>(
	poly: P,
	scale: number,
): P => poly.map((v) => v * scale) as P;

export const polynomialShift = <P extends Polynomial & [number, ...number[]]>(
	poly: P,
	shift: number,
): P => {
	if (!poly.length) {
		throw new Error('cannot shift empty polynomial');
	}
	const r = [...poly];
	r[0]! += shift;
	return r as P;
};

/** returns a polynomial with the given solutions, scaled such that the highest order term = 1 */
export const polynomialWithSolutions = <const S extends number[]>(
	...solutions: S
) =>
	polynomialMul(...solutions.map((s) => [-s, 1])) as Polynomial<
		Increment<S['length']>
	>;

export function polynomialRoots(
	poly: Polynomial,
	y = 0,
	bounds: { min?: number; max?: number; maxError?: number } = {},
): number[] {
	let filter = NO_FILTER;
	if (bounds.min !== undefined || bounds.max !== undefined) {
		const min = bounds.min ?? Number.NEGATIVE_INFINITY;
		const max = bounds.max ?? Number.POSITIVE_INFINITY;
		filter = (l) => l.filter((v) => v >= min && v <= max);
	}
	switch (poly.length) {
		case 0:
		case 1:
			return [];
		case 2:
			return filter(polynomial2Roots(poly as Polynomial<2>, y));
		case 3:
			return filter(polynomial3Roots(poly as Polynomial<3>, y));
		case 4:
			return filter(polynomial4Roots(poly as Polynomial<4>, y));
		case 7:
			return polynomial7SignedRoots(poly as Polynomial<7>, y, bounds).map(
				(v) => v[0],
			);
		default:
			throw new Error('unsupported polynomial order');
	}
}

export const polynomial2Roots = ([f0, f1]: Polynomial<2>, y = 0): number[] =>
	f1 ? [(y - f0) / f1] : [];

export function polynomial3Roots([f0, f1, f2]: Polynomial<3>, y = 0): number[] {
	if (!f2) {
		return polynomial2Roots([f0, f1], y);
	}
	const disc = f1 * f1 - 4 * f2 * (f0 - y);
	const m = 0.5 / f2;
	if (disc > 0) {
		const root = Math.sqrt(disc);
		return [(-f1 + root) * m, (-f1 - root) * m];
	}
	if (!disc) {
		return [-f1 * m];
	}
	return [];
}

export function polynomial4Roots(
	[f0, f1, f2, f3]: Polynomial<4>,
	y = 0,
): number[] {
	if (!f3) {
		return polynomial3Roots([f0, f1, f2], y);
	}

	// thanks, https://pomax.github.io/bezierinfo/#extremities
	// a->f2	b->f1	c->f0	d->f3

	const m = 1 / f3;
	const s = f2 * m * (1 / 3);
	const p = f1 * m * (1 / 3) - s * s;
	const p3 = p * p * p;
	const q = (s * (2 * s * s - f1 * m) + (f0 - y) * m) * 0.5;
	const disc = q * q + p3;

	if (Math.abs(disc) < Number.EPSILON) {
		if (Math.abs(q) < Number.EPSILON) {
			return [-s];
		}
		const u1 = Math.cbrt(q);
		return [-2 * u1 - s, u1 - s];
	}

	if (disc < 0) {
		const r = Math.sqrt(-p3);
		const phi = Math.acos(Math.max(-1, Math.min(1, -q / r))) * (1 / 3);
		const t1 = 2 * Math.cbrt(r);
		return [
			t1 * Math.cos(phi - Math.PI * (2 / 3)) - s,
			t1 * Math.cos(phi) - s,
			t1 * Math.cos(phi + Math.PI * (2 / 3)) - s,
		];
	}

	const root = Math.sqrt(disc);
	return [Math.cbrt(root - q) - Math.cbrt(root + q) - s];
}

export function polynomial7SignedRoots(
	f: Polynomial<7>,
	y = 0,
	{ min = 0, max = 1, maxError = 1e-4 } = {},
) {
	// returns 0 points and sign of derivative
	// does not include double roots
	// (i.e. sign of derivative is always +1 or -1, not 0)

	// equation is order >4, so cannot be directly solved;
	// solve its third derivative instead, then use binary search to
	// find all turning points and crossings.
	// (technically the second derivative is already analytically
	// solvable, but it is a complex algorithm)

	const df = polynomialDerivative(f);
	const ddf = polynomialDerivative(df);

	// solve third derivative = 0 analytically
	const starts = polynomial4Roots(polynomialDerivative(ddf))
		.filter((x) => x > min && x < max)
		.sort();
	starts.push(max);

	interface Values {
		y: number;
		d: number;
		dd: number;
	}

	const at = (x: number): Values => ({
		y: polynomialAt(f, x) - y,
		d: polynomialAt(df, x),
		dd: polynomialAt(ddf, x),
	});

	function maybeSolutionBetween(lv: Values, hv: Values) {
		// check if our points straddle the axis, or the derivative or
		// second derivative changes in a way that could suggest a
		// crossing. (no need to check third+ derivative, since we
		// already use its roots as our starting points, so it will
		// never cross 0 within a segment)
		const yl0 = lv.y < 0;
		const dl0 = lv.d < 0;
		return (
			yl0 !== hv.y < 0 ||
			(dl0 !== yl0 && yl0 === hv.d < 0) ||
			(lv.dd < 0 !== dl0 && dl0 === hv.dd < 0)
		);
	}

	const solutions: [number, -1 | 1][] = [];

	function recur(l: number, h: number, lv: Values, hv: Values) {
		if (h - l > maxError) {
			const mid = (l + h) * 0.5;
			const midv = at(mid);
			if (maybeSolutionBetween(lv, midv)) {
				recur(l, mid, lv, midv);
			}
			if (maybeSolutionBetween(midv, hv)) {
				recur(mid, h, midv, hv);
			}
		} else if (lv.y < 0 !== hv.y < 0) {
			solutions.push([l + ((h - l) * lv.y) / (lv.y - hv.y), lv.y < 0 ? 1 : -1]);
		}
	}

	let l = min;
	let lv = at(min);
	for (const h of starts) {
		const hv = at(h);
		if (maybeSolutionBetween(lv, hv)) {
			recur(l, h, lv, hv);
		}
		l = h;
		lv = hv;
	}

	return solutions;
}

const NO_FILTER = (l: number[]) => l;

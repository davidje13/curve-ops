import {
	mat2LeftInverse,
	mat3LeftInverse,
	mat4LeftInverse,
	matElementNorm,
	matFrom,
	matFromArrayFn,
	matMul,
	matReshape,
	matScale,
	matSub,
} from '../../Matrix.mts';
import {
	polynomial3Roots,
	polynomial4Roots,
	type Polynomial,
} from '../../Polynomial.mts';
import type { Bezier } from '../Bezier.mts';
import { aaBoxFromXY, type AxisAlignedBox } from './AxisAlignedBox.mts';
import type { LineSegment } from './LineSegment.mts';
import type { Polyline2D } from './Polyline2D.mts';
import {
	matFromPts,
	ptAdd,
	ptCross,
	ptDist,
	ptDist2,
	ptDot,
	ptLen,
	ptLen2,
	ptLerp,
	ptMad,
	ptMid,
	ptMul,
	ptNorm,
	ptRot90,
	ptsFromMat,
	ptSub,
	ptSVG,
	type Pt,
} from './Pt.mts';
import {
	bezier2At,
	bezier2FromPolylinePtsLeastSquares,
	bezier2FromPolylinePtsLeastSquaresFixEnds,
	internalBezier2SubdivisionCount,
	internalSubdivideIntegralInvApprox,
	type QuadraticBezier,
} from './QuadraticBezier.mts';

export interface CubicBezier {
	readonly p0: Pt;
	readonly c1: Pt;
	readonly c2: Pt;
	readonly p3: Pt;
}

export const bezier3FromPts = (
	p0: Pt,
	c1: Pt,
	c2: Pt,
	p3: Pt,
): CubicBezier => ({ p0, c1, c2, p3 });

export const bezier3FromBezier = (curve: Bezier<4, 2>): CubicBezier =>
	bezier3FromPts(...ptsFromMat(curve));

export function bezier3FromPolylinePtsLeastSquares(
	points: Polyline2D,
): CubicBezier | null {
	// thanks, https://pomax.github.io/bezierinfo/#curvefitting

	if (!points.length) {
		return null;
	}

	if (points.length >= 4) {
		const p0 = points[0]!;
		const pN = points[points.length - 1]!;
		const dist0 = p0.d;
		const distM = 1 / (pN.d - dist0);

		const TTinv = mat4LeftInverse(
			matFromArrayFn(points, ({ d }) => {
				const t = (d - dist0) * distM;
				const tt = t * t;
				return [1, t, tt, tt * t];
			}),
		);
		if (TTinv) {
			const C = matMul(bezier3MInv, matMul(TTinv, matFromPts(points)));
			return bezier3FromPts(...ptsFromMat(C));
		}
	}

	const curve = bezier2FromPolylinePtsLeastSquares(points);
	return curve ? bezier3FromBezier2(curve) : null;
}

export function bezier3FromPolylinePtsLeastSquaresFixEnds(
	points: Polyline2D,
	prevControl: Pt | null | undefined,
): CubicBezier | null {
	if (!points.length) {
		return null;
	}

	const p0 = points[0]!;
	const pN = points[points.length - 1]!;

	if (points.length > 3) {
		const candidates: { _curve: CubicBezier; _distMult: number }[] = [];
		const dist0 = p0.d;
		const distM = 1 / (pN.d - dist0);
		const dN = ptSub(pN, p0);

		const Tv: [number, number][] = [];
		const adjustedPoints: Pt[] = [];
		for (let i = 1; i < points.length - 1; ++i) {
			const pt = points[i]!;
			const t = (pt.d - dist0) * distM;
			const tt = t * t;
			const ttt = tt * t;
			Tv.push([t - ttt, tt - ttt]);
			adjustedPoints.push(ptSub(pt, ptMad(dN, ttt, p0)));
		}

		if (prevControl && ptDist2(p0, prevControl)) {
			const c1n = ptNorm(ptSub(p0, prevControl));
			const TTinv = mat3LeftInverse(
				matReshape(
					matFromArrayFn(Tv, ([t1, t2]) => [
						c1n.x * (t1 - 2 * t2),
						t2,
						0,
						c1n.y * (t1 - 2 * t2),
						0,
						t2,
					]),
					3,
				),
			);
			if (TTinv) {
				const C = matScale(
					matMul(TTinv, matReshape(matFromPts(adjustedPoints), 1)),
					1 / 3,
				);
				const [c1l, c2x, c2y] = C.v;
				if (c1l > 0) {
					candidates.push({
						_curve: {
							p0,
							c1: ptMad(c1n, c1l, p0),
							c2: ptAdd(p0, { x: c2x, y: c2y }),
							p3: pN,
						},
						_distMult: 1,
					});
				}
			}
		}

		const TTinv = mat2LeftInverse(matFrom(Tv));
		if (TTinv) {
			const C = matMul(
				bezier3MInvFixEnds,
				matMul(TTinv, matFromPts(adjustedPoints)),
			);
			const [c1, c2] = ptsFromMat(C);
			candidates.push({
				_curve: { p0, c1: ptAdd(c1, p0), c2: ptAdd(c2, p0), p3: pN },
				_distMult: 4,
			});
		}

		if (candidates.length === 1) {
			return candidates[0]!._curve;
		} else if (candidates.length > 1) {
			let best: CubicBezier | undefined;
			let bestDist = Number.POSITIVE_INFINITY;
			for (const c of candidates) {
				const dist = bezier3RMSDistance(c._curve, points) * c._distMult;
				if (dist < bestDist) {
					best = c._curve;
					bestDist = dist;
				}
			}
			return best!;
		}
	}

	const curve = bezier2FromPolylinePtsLeastSquaresFixEnds(points, prevControl);
	return curve ? bezier3FromBezier2(curve) : null;
}

const bezier3MInvFixEnds = /*@__PURE__*/ matFrom([
	[1 / 3, 0],
	[2 / 3, 1 / 3],
]);

export const bezier3M = /*@__PURE__*/ matFrom([
	[1, 0, 0, 0],
	[-3, 3, 0, 0],
	[3, -6, 3, 0],
	[-1, 3, -3, 1],
]);

export const bezier3MInv = /*@__PURE__*/ matFrom([
	[1, 0, 0, 0],
	[1, 1 / 3, 0, 0],
	[1, 2 / 3, 1 / 3, 0],
	[1, 1, 1, 1],
]);

export const bezier3FromQuad = (
	p0: Pt,
	c0: Pt,
	c1: Pt,
	p1: Pt,
): CubicBezier => ({
	p0,
	c1: ptLerp(c0, p1, 1 / 3),
	c2: ptLerp(c1, p0, 1 / 3),
	p3: p1,
});

export const bezier3FromBezier2 = ({
	p0,
	c1,
	p2,
}: QuadraticBezier): CubicBezier => ({
	p0: p0,
	c1: ptLerp(p0, c1, 2 / 3),
	c2: ptLerp(c1, p2, 1 / 3),
	p3: p2,
});

export const bezier3FromLine = ({ p0, p1 }: LineSegment): CubicBezier => ({
	p0: p0,
	c1: ptLerp(p0, p1, 1 / 3),
	c2: ptLerp(p0, p1, 2 / 3),
	p3: p1,
});

export const bezierFromBezier3 = ({
	p0,
	c1,
	c2,
	p3,
}: CubicBezier): Bezier<4, 2> => matFromPts([p0, c1, c2, p3]);

export function bezier3At({ p0, c1, c2, p3 }: CubicBezier, t: number): Pt {
	const T = 1 - t;
	return ptMad(
		ptMad(p0, T * T, ptMad(c1, 3 * t * T, ptMul(c2, 3 * t * t))),
		T,
		ptMul(p3, t * t * t),
	);
}

export function bezier3XAt({ p0, c1, c2, p3 }: CubicBezier, t: number): number {
	const T = 1 - t;
	return p0.x * T * T * T + (3 * T * (c1.x * T + c2.x * t) + p3.x * t * t) * t;
}

export function bezier3YAt({ p0, c1, c2, p3 }: CubicBezier, t: number): number {
	const T = 1 - t;
	return p0.y * T * T * T + (3 * T * (c1.y * T + c2.y * t) + p3.y * t * t) * t;
}

export const polynomialFromBezier3Values = (
	p0: number,
	c1: number,
	c2: number,
	p3: number,
): Polynomial<4> => [
	p0,
	3 * (c1 - p0),
	3 * (p0 - 2 * c1 + c2),
	p3 - p0 + 3 * (c1 - c2),
];

export const bezier3PolynomialX = ({
	p0,
	c1,
	c2,
	p3,
}: CubicBezier): Polynomial<4> =>
	polynomialFromBezier3Values(p0.x, c1.x, c2.x, p3.x);

export const bezier3PolynomialY = ({
	p0,
	c1,
	c2,
	p3,
}: CubicBezier): Polynomial<4> =>
	polynomialFromBezier3Values(p0.y, c1.y, c2.y, p3.y);

export const bezier3Derivative = ({
	p0,
	c1,
	c2,
	p3,
}: CubicBezier): QuadraticBezier => ({
	p0: ptMul(ptSub(c1, p0), 3),
	c1: ptMul(ptSub(c2, c1), 3),
	p2: ptMul(ptSub(p3, c2), 3),
});

export const bezier3TangentAt = (curve: CubicBezier, t: number): Pt =>
	ptNorm(bezier2At(bezier3Derivative(curve), t));

export const bezier3NormalAt = (curve: CubicBezier, t: number): Pt =>
	ptRot90(bezier3TangentAt(curve, t));

export const bezier3OpenArea = (curve: CubicBezier) =>
	bezier3SignedArea(curve) + 0.5 * ptCross(curve.p3, curve.p0);

export function bezier3SignedArea({ p0, c1, c2, p3 }: CubicBezier) {
	// translate to p0 = 0
	const C1 = ptSub(c1, p0);
	const C2 = ptSub(c2, p0);
	const P3 = ptSub(p3, p0);

	// thanks, https://en.wikipedia.org/wiki/Green%27s_theorem
	// integral(L dx + M dy) = int(int(dM/dx - dL/dy))dA
	// for area: dM/dx - dL/dy = 1 => M = 0.5 x, L = -0.5 x
	// area = 0.5 * integral_ccw(x dy - y dx)
	// area = -0.5 * integral_cw(cross(c(t), dc(t)/dt))
	// c(t) = 3 * c1 * t + 3 * (c2 - 2 * c1) * t^2 + (p3 + 3 * (c1 - c2)) * t^3
	// dc(t)/dt = 3 * c1 + 6 * (c2 - 2 * c1) * t + 3 * (p3 + 3 * (c1 - c2)) * t^2
	// B = c1.x, C = c2.x, D = p3.x
	// X = c1.y, Y = c2.y, Z = p3.y

	// cross(c(t), dc(t)/dt) = (9 B Y - 6 B Z - 9 C X + 3 C Z + 6 D X - 3 D Y) * t^4 + (6 B Z - 18 B Y + 18 C X - 6 D X) * t^3 + (9 B Y - 9 C X) * t^2
	// integral(cross(...)) = (9 B Y - 6 B Z - 9 C X + 3 C Z + 6 D X - 3 D Y)/5 * t^5 + (6 B Z - 18 B Y + 18 C X - 6 D X)/4 * t^4 + (3 B Y - 3 C X) * t^3
	// int(...)[0 1] = (BY - CX + BZ - DX + 2(CZ - DY))*3/10
	// area = -0.5 * integral = (cross(c2,c1) + cross(p3,c1) + 2*cross(p3,c2))*3/20

	return 0.15 * (ptCross(C2, C1) + ptCross(P3, C1) + 2 * ptCross(P3, C2));
}

export function bezier3RMSDistance(
	curve: CubicBezier,
	points: Polyline2D,
): number {
	if (!points.length) {
		return 0;
	}

	const p0 = points[0]!;
	const pN = points[points.length - 1]!;
	const dist0 = p0.d;
	const distM = 1 / (pN.d - dist0);
	const diff = matSub(
		matMul(
			matMul(
				matFromArrayFn(points, ({ d }) => {
					const t = (d - dist0) * distM;
					const tt = t * t;
					return [1, t, tt, tt * t];
				}),
				bezier3M,
			),
			bezierFromBezier3(curve),
		),
		matFromPts(points),
	);
	return matElementNorm(diff);
}

export const bezier3Transform = (
	{ p0, c1, c2, p3 }: CubicBezier,
	transform: (pt: Pt) => Pt,
): CubicBezier => ({
	p0: transform(p0),
	c1: transform(c1),
	c2: transform(c2),
	p3: transform(p3),
});

export const bezier3Scale = (
	{ p0, c1, c2, p3 }: CubicBezier,
	scaleX: number,
	scaleY = scaleX,
): CubicBezier => ({
	p0: { x: p0.x * scaleX, y: p0.y * scaleY },
	c1: { x: c1.x * scaleX, y: c1.y * scaleY },
	c2: { x: c2.x * scaleX, y: c2.y * scaleY },
	p3: { x: p3.x * scaleX, y: p3.y * scaleY },
});

export const bezier3Translate = (
	{ p0, c1, c2, p3 }: CubicBezier,
	shift: Pt,
): CubicBezier => ({
	p0: ptAdd(p0, shift),
	c1: ptAdd(c1, shift),
	c2: ptAdd(c2, shift),
	p3: ptAdd(p3, shift),
});

export const bezier3TsAtXEq = (curve: CubicBezier, x: number) =>
	polynomial4Roots(bezier3PolynomialX(curve), x);

export const bezier3TsAtYEq = (curve: CubicBezier, y: number) =>
	polynomial4Roots(bezier3PolynomialY(curve), y);

// thanks, https://pomax.github.io/bezierinfo/#extremities
export const bezier3XTurningPointTs = ({ p0, c1, c2, p3 }: CubicBezier) =>
	polynomial3Roots([
		c1.x - p0.x,
		2 * (p0.x + c2.x) - 4 * c1.x,
		p3.x - p0.x + 3 * (c1.x - c2.x),
	]);

// thanks, https://pomax.github.io/bezierinfo/#extremities
export const bezier3YTurningPointTs = ({ p0, c1, c2, p3 }: CubicBezier) =>
	polynomial3Roots([
		c1.y - p0.y,
		2 * (p0.y + c2.y) - 4 * c1.y,
		p3.y - p0.y + 3 * (c1.y - c2.y),
	]);

// thanks, https://fontforge.org/docs/techref/pfaeditmath.html#finding-points-of-inflection-of-a-spline
export function bezier3InflectionTs({ p0, c1, c2, p3 }: CubicBezier) {
	const C1 = ptSub(c1, p0);
	const C2 = ptSub(c2, p0);
	const P3 = ptSub(p3, p0);
	const c1c2 = ptCross(C1, C2);
	const c1p3 = ptCross(C1, P3);
	return polynomial3Roots([
		c1c2,
		c1p3 - 3 * c1c2,
		3 * c1c2 - 2 * c1p3 + ptCross(C2, P3),
	]);
}

export const bezier3Bounds = (curve: CubicBezier): AxisAlignedBox =>
	aaBoxFromXY(
		[
			curve.p0.x,
			curve.p3.x,
			...bezier3XTurningPointTs(curve)
				.filter((t) => t > 0 && t < 1)
				.map(bezier3XAt.bind(null, curve)),
		],
		[
			curve.p0.y,
			curve.p3.y,
			...bezier3YTurningPointTs(curve)
				.filter((t) => t > 0 && t < 1)
				.map(bezier3YAt.bind(null, curve)),
		],
	);

export function bezier3LengthEstimate(
	curve: CubicBezier,
	maxError = Number.POSITIVE_INFINITY,
	recursionLimit = 10,
): LengthEstimate {
	// Algorithm from kurbo (https://raphlinus.github.io/curves/2018/12/28/bezier-arclength.html / https://github.com/linebender/kurbo/blob/8e05b2e15fce702673354cfd81b232d94bea6068/kurbo/src/cubicbez.rs#L628)
	// Kurbo Copyright (c) 2018 Raph Levien, available as Apache-2.0 or MIT

	const d01 = ptSub(curve.c1, curve.p0);
	const d12 = ptSub(curve.c2, curve.c1);
	const d23 = ptSub(curve.p3, curve.c2);
	const chord = ptDist(curve.p0, curve.p3);
	const polygon = ptLen(d01) + ptLen(d12) + ptLen(d23);
	if (polygon - chord < maxError * 2) {
		return { best: (polygon + chord) * 0.5, maxError };
	}
	const lp_lc = polygon - chord;
	const dd1 = ptSub(d12, d01);
	const dd2 = ptSub(d23, d12);
	// The following values are scaled to reduce operation count
	const dm = ptMad(ptAdd(d01, d23), 0.5, d12); // 2 * first derivative at midpoint
	const dm1 = ptAdd(dd2, dd1); // 2 * second derivative at midpoint
	const dm2 = ptSub(dd2, dd1); // 2 * third derivative at midpoint

	let est = 0;
	for (const [wi, xi] of GAUSS_LEGENDRE_COEFFS_8_HALF) {
		const d = ptMad(dm2, xi * xi * 0.5, dm);
		est +=
			wi *
			(ptLen2(ptMad(dm2, xi, dm1)) / ptLen2(ptMad(dm1, xi, d)) +
				ptLen2(ptMad(dm2, -xi, dm1)) / ptLen2(ptMad(dm1, -xi, d)));
	}
	est *= est * est;
	let coeffs = GAUSS_LEGENDRE_COEFFS_8_HALF;
	let err = Math.min(est * 2.5e-6, 3e-2) * lp_lc;
	if (err > maxError) {
		coeffs = GAUSS_LEGENDRE_COEFFS_16_HALF;
		err = Math.min(est * est * 1.5e-11, 9e-3) * lp_lc;
		if (err > maxError) {
			coeffs = GAUSS_LEGENDRE_COEFFS_24_HALF;
			err = Math.min(est * est * est * 3.5e-16, 3.5e-3) * lp_lc;
			if (err > maxError && recursionLimit > 0) {
				const [s0, s1] = bezier3Bisect(curve);
				const se = maxError * 0.5;
				const sr = recursionLimit - 1;
				const l1 = bezier3LengthEstimate(s0, se, sr);
				const l2 = bezier3LengthEstimate(s1, maxError - l1.maxError, sr);
				return {
					best: l1.best + l2.best,
					maxError: l1.maxError + l2.maxError,
				};
			}
		}
	}

	let l = 0;
	for (const [wi, xi] of coeffs) {
		const d = ptMad(dm2, xi * xi * 0.5, dm);
		const s = ptMul(dm1, xi);
		l += wi * (ptLen(ptAdd(d, s)) + ptDist(d, s));
	}
	return { best: 0.75 * l, maxError: err };
}

export function bezier3Bisect(
	curve: CubicBezier,
	t = 0.5,
): [CubicBezier, CubicBezier] {
	// thanks, https://en.wikipedia.org/wiki/De_Casteljau's_algorithm
	const i0 = ptLerp(curve.p0, curve.c1, t);
	const i1 = ptLerp(curve.c1, curve.c2, t);
	const i2 = ptLerp(curve.c2, curve.p3, t);
	const j0 = ptLerp(i0, i1, t);
	const j1 = ptLerp(i1, i2, t);
	const p = ptLerp(j0, j1, t);
	return [
		{ p0: curve.p0, c1: i0, c2: j0, p3: p },
		{ p0: p, c1: j1, c2: i2, p3: curve.p3 },
	];
}

export function bezier3Split(
	{ p0, c1, c2, p3 }: CubicBezier,
	splits: readonly number[],
	minRange = 1e-6,
): CubicBezier[] {
	// thanks, https://en.wikipedia.org/wiki/De_Casteljau's_algorithm
	let pp0 = p0;
	let pc1 = c1;
	let pc2 = c2;
	const pEnd = p3;
	let pt = 0;
	const r = [];
	for (const t of splits.filter((t) => t > 0 && t < 1).sort()) {
		if (t <= pt + minRange) {
			continue;
		}
		const st = (t - pt) / (1 - pt);
		const i0 = ptLerp(pp0, pc1, st);
		const i1 = ptLerp(pc1, pc2, st);
		const i2 = ptLerp(pc2, pEnd, st);
		const j0 = ptLerp(i0, i1, st);
		const j1 = ptLerp(i1, i2, st);
		const p = ptLerp(j0, j1, st);
		r.push({ p0: pp0, c1: i0, c2: j0, p3: p });
		pp0 = p;
		pc1 = j1;
		pc2 = i2;
		pt = t;
	}
	r.push({ p0: pp0, c1: pc1, c2: pc2, p3: pEnd });
	return r;
}

function internalBezier3SubdivideBezier2(
	{ p0, c1, c2, p3 }: CubicBezier,
	maxError: number,
	maxDivisions = 1000,
): { t: number; c: QuadraticBezier }[] {
	const f1 = ptMul(ptSub(c1, p0), 3);
	const f2 = ptMul(ptMad(c1, -2, ptAdd(p0, c2)), 3);
	const f3 = ptMad(ptSub(c1, c2), 3, ptSub(p3, p0));

	let tA = 0;
	let pA = p0;
	let dA = f1;

	const parts: { t: number; c: QuadraticBezier }[] = [];
	const lenPolygon = ptDist(p0, c1) + ptDist(c1, c2) + ptDist(c2, p3);
	const n =
		// TODO: better way to pick division count which uses maxError properly
		Math.max(
			Math.ceil(
				Math.min(Math.sqrt(Math.sqrt(lenPolygon / maxError)), maxDivisions),
			),
			2,
		);
	function addDivision(tB: number, maxRecur: number) {
		const dB = ptMad(ptMad(f3, 3 * tB, ptMul(f2, 2)), tB, f1);
		if (ptDot(dB, dA) < 0 && maxRecur > 0) {
			addDivision((tA + tB) * 0.5, maxRecur - 1);
			addDivision(tB, maxRecur - 1);
			return;
		}
		const pB = ptMad(ptMad(ptMad(f3, tB, f2), tB, f1), tB, p0);
		const den = ptCross(dA, dB);
		const chord = ptSub(pB, pA);
		const l1 = ptCross(chord, dB);
		const l2 = ptCross(chord, dA);
		if (l2 * den < 0 && l1 * den > 0) {
			parts.push({
				t: tB,
				c: { p0: pA, c1: ptMad(dA, l1 / den, pA), p2: pB },
			});
		} else if (maxRecur > 0) {
			addDivision((tA + tB) * 0.5, 1);
			addDivision(tB, 1);
			return;
		} else {
			parts.push({ t: tB, c: { p0: pA, c1: ptMid(pA, pB), p2: pB } });
		}
		tA = tB;
		pA = pB;
		dA = dB;
	}
	for (let i = 1; i <= n; ++i) {
		addDivision(i / n, 5);
	}

	return parts;
}

export const bezier3SubdivideBezier2 = (
	curve: CubicBezier,
	maxError: number,
	maxDivisions = 1000,
): QuadraticBezier[] =>
	internalBezier3SubdivideBezier2(curve, maxError, maxDivisions).map(
		({ c }) => c,
	);

export function bezier3Subdivide(
	curve: CubicBezier,
	maxError: number,
	maxDivisions = 1000,
): readonly Pt[] {
	const parts = internalBezier3SubdivideBezier2(
		curve,
		maxError,
		maxDivisions / 10,
	);
	let prevT = 0;
	let sumN = 0;
	const partInfo: {
		n: number;
		am: number;
		a0: number;
		tm: number;
		t0: number;
	}[] = [];
	for (const part of parts) {
		const { a0, a2, n } = internalBezier2SubdivisionCount(part.c, maxError);
		const x0 = internalSubdivideIntegralInvApprox(a0);
		const x2 = internalSubdivideIntegralInvApprox(a2);
		const am = (a2 - a0) / n;
		const tm = (part.t - prevT) / (x2 - x0);
		partInfo.push({
			n: sumN,
			am,
			a0: a0 - sumN * am,
			tm,
			t0: prevT - x0 * tm,
		});
		sumN += n;
		prevT = part.t;
	}
	const { p0, c1, c2, p3 } = curve;
	const N = Math.ceil(Math.min(sumN, maxDivisions));
	if (N <= 2) {
		return [p0, p3];
	}
	const pts: Pt[] = [p0];
	const f1 = ptMul(ptSub(c1, p0), 3);
	const f2 = ptMul(ptMad(c1, -2, ptAdd(p0, c2)), 3);
	const f3 = ptMad(ptSub(c1, c2), 3, ptSub(p3, p0));

	const nm = sumN / N;
	let p = 0;
	for (let i = 1; i < N; i++) {
		const n = i * nm;
		while (n > (partInfo[p + 1]?.n ?? Number.POSITIVE_INFINITY)) {
			++p;
		}
		const info = partInfo[p]!;
		const t =
			internalSubdivideIntegralInvApprox(n * info.am + info.a0) * info.tm +
			info.t0;
		pts.push(ptMad(ptMad(ptMad(f3, t, f2), t, f1), t, p0));
	}
	pts.push(p3);
	return pts;
}

export const bezier3SVG = (
	curve: CubicBezier,
	precision?: number | undefined,
	prefix = 'M',
	controlLines = false,
) =>
	`${prefix}${ptSVG(curve.p0, precision)}${controlLines ? 'L' : 'C'}${ptSVG(
		curve.c1,
		precision,
	)} ${ptSVG(curve.c2, precision)} ${ptSVG(curve.p3, precision)}`;

// Constants source: https://github.com/linebender/kurbo/blob/8e05b2e15fce702673354cfd81b232d94bea6068/kurbo/src/common.rs#L814
// Kurbo Copyright (c) 2018 Raph Levien, available as Apache-2.0 or MIT
const GAUSS_LEGENDRE_COEFFS_8_HALF: readonly [number, number][] = [
	[0.362683783378362, 0.1834346424956498],
	[0.3137066458778873, 0.525532409916329],
	[0.2223810344533745, 0.7966664774136267],
	[0.1012285362903763, 0.9602898564975363],
];
const GAUSS_LEGENDRE_COEFFS_16_HALF: readonly [number, number][] = [
	[0.1894506104550685, 0.0950125098376374],
	[0.1826034150449236, 0.2816035507792589],
	[0.1691565193950025, 0.4580167776572274],
	[0.1495959888165767, 0.6178762444026438],
	[0.1246289712555339, 0.755404408355003],
	[0.0951585116824928, 0.8656312023878318],
	[0.0622535239386479, 0.9445750230732326],
	[0.0271524594117541, 0.9894009349916499],
];
const GAUSS_LEGENDRE_COEFFS_24_HALF: readonly [number, number][] = [
	[0.1279381953467522, 0.0640568928626056],
	[0.1258374563468283, 0.1911188674736163],
	[0.1216704729278034, 0.3150426796961634],
	[0.1155056680537256, 0.4337935076260451],
	[0.1074442701159656, 0.5454214713888396],
	[0.0976186521041139, 0.6480936519369755],
	[0.0861901615319533, 0.7401241915785544],
	[0.0733464814110803, 0.8200019859739029],
	[0.0592985849154368, 0.8864155270044011],
	[0.0442774388174198, 0.9382745520027328],
	[0.0285313886289337, 0.9747285559713095],
	[0.0123412297999872, 0.9951872199970213],
];

interface LengthEstimate {
	best: number;
	maxError: number;
}

import {
	internalMatFromFlat,
	mat1LeftInverse,
	mat3LeftInverse,
	matElementNorm,
	matFrom,
	matFromArrayFn,
	matMul,
	matReshape,
	matScale,
	matSub,
} from '../../Matrix.mts';
import {
	polynomial2Roots,
	polynomial3Roots,
	type Polynomial,
} from '../../Polynomial.mts';
import type { Bezier } from '../Bezier.mts';
import { aaBoxFromXY, type AxisAlignedBox } from './AxisAlignedBox.mts';
import {
	internalLineScaledNormalisation,
	lineAt,
	type LineSegment,
} from './LineSegment.mts';
import type { Polyline2D } from './Polyline2D.mts';
import {
	matFromPts,
	ptAdd,
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

export interface QuadraticBezier {
	readonly p0: Pt;
	readonly c1: Pt;
	readonly p2: Pt;
}

export const bezier2FromPts = (p0: Pt, c1: Pt, p2: Pt): QuadraticBezier => ({
	p0,
	c1,
	p2,
});

export const bezier2FromBezier = (curve: Bezier<3, 2>): QuadraticBezier =>
	bezier2FromPts(...ptsFromMat(curve));

export function bezier2FromPolylinePtsLeastSquares(
	points: Polyline2D,
): QuadraticBezier | null {
	// thanks, https://pomax.github.io/bezierinfo/#curvefitting

	if (!points.length) {
		return null;
	}

	const p0 = points[0]!;
	const pN = points[points.length - 1]!;

	if (points.length >= 3) {
		const dist0 = p0.d;
		const distM = 1 / (pN.d - dist0);
		const TTinv = mat3LeftInverse(
			matFromArrayFn(points, ({ d }) => {
				const t = (d - dist0) * distM;
				return [1, t, t * t];
			}),
		);
		if (TTinv) {
			const C = matMul(bezier2MInv, matMul(TTinv, matFromPts(points)));
			return bezier2FromPts(...ptsFromMat(C));
		}
	}

	return bezier2FromLine({ p0, p1: pN });
}

export function bezier2FromPolylinePtsLeastSquaresFixEnds(
	points: Polyline2D,
	prevControl: Pt | null | undefined,
): QuadraticBezier | null {
	if (!points.length) {
		return null;
	}

	const p0 = points[0]!;
	const pN = points[points.length - 1]!;

	if (points.length > 2) {
		const candidates: { _curve: QuadraticBezier; _distMult: number }[] = [];
		const dist0 = p0.d;
		const distM = 1 / (pN.d - dist0);
		const dN = ptSub(pN, p0);

		const Tv: number[] = [];
		const adjustedPoints: Pt[] = [];
		for (let i = 1; i < points.length - 1; ++i) {
			const pt = points[i]!;
			const t = (pt.d - dist0) * distM;
			const tt = t * t;
			Tv.push(t - tt);
			adjustedPoints.push(ptSub(pt, ptMad(dN, tt, p0)));
		}

		if (prevControl && ptDist2(p0, prevControl)) {
			const c1n = ptNorm(ptSub(p0, prevControl));
			const TTinv = mat1LeftInverse(
				matReshape(
					matFromArrayFn(Tv, (t1) => [c1n.x * t1, c1n.y * t1]),
					1,
				),
			);
			if (TTinv) {
				const C = matScale(
					matMul(TTinv, matReshape(matFromPts(adjustedPoints), 1)),
					0.5,
				);
				const [c1l] = C.v;
				if (c1l > 0) {
					candidates.push({
						_curve: { p0, c1: ptMad(c1n, c1l, p0), p2: pN },
						_distMult: 1,
					});
				}
			}
		}

		const TTinv = mat1LeftInverse(
			internalMatFromFlat(Tv, points.length - 2, 1),
		);
		if (TTinv) {
			const C = matScale(matMul(TTinv, matFromPts(adjustedPoints)), 0.5);
			const [c1] = ptsFromMat(C);
			candidates.push({
				_curve: { p0, c1: ptAdd(c1, p0), p2: pN },
				_distMult: 4,
			});
		}

		if (candidates.length === 1) {
			return candidates[0]!._curve;
		} else if (candidates.length > 1) {
			let best: QuadraticBezier | undefined;
			let bestDist = Number.POSITIVE_INFINITY;
			for (const c of candidates) {
				const dist = bezier2RMSDistance(c._curve, points) * c._distMult;
				if (dist < bestDist) {
					best = c._curve;
					bestDist = dist;
				}
			}
			return best!;
		}
	}

	if (points.length >= 2 && prevControl && ptDist2(p0, prevControl)) {
		const dN = ptSub(pN, p0);
		const d = ptLen(pN);
		const c1n = ptNorm(ptSub(p0, prevControl));
		const TCurve = d ? Math.max(ptDot(c1n, ptMul(dN, 1 / d)), 0) : 1;
		const m = 1 / 3; // bias curve towards start to reduce wobble (0.5 is unbiased)
		return {
			p0,
			c1: ptMad(c1n, TCurve * d * m, p0),
			p2: pN,
		};
	}

	return bezier2FromLine({ p0, p1: pN });
}

export const bezier2M = /*@__PURE__*/ matFrom([
	[1, 0, 0],
	[-2, 2, 0],
	[1, -2, 1],
]);

export const bezier2MInv = /*@__PURE__*/ matFrom([
	[1, 0, 0],
	[1, 0.5, 0],
	[1, 1, 1],
]);

export const bezier2FromLine = ({ p0, p1 }: LineSegment): QuadraticBezier => ({
	p0: p0,
	c1: ptMid(p0, p1),
	p2: p1,
});

export const bezierFromBezier2 = ({
	p0,
	c1,
	p2,
}: QuadraticBezier): Bezier<3, 2> => matFromPts([p0, c1, p2]);

export function bezier2At({ p0, c1, p2 }: QuadraticBezier, t: number): Pt {
	const T = 1 - t;
	return ptMad(ptMad(p0, T, ptMul(c1, 2 * t)), T, ptMul(p2, t * t));
}

export function bezier2XAt({ p0, c1, p2 }: QuadraticBezier, t: number): number {
	const T = 1 - t;
	return p0.x * T * T + (2 * c1.x * T + p2.x * t) * t;
}

export function bezier2YAt({ p0, c1, p2 }: QuadraticBezier, t: number): number {
	const T = 1 - t;
	return p0.y * T * T + (2 * c1.y * T + p2.y * t) * t;
}

export const polynomialFromBezier2Values = (
	p0: number,
	c1: number,
	p2: number,
): Polynomial<3> => [p0, 2 * (c1 - p0), p0 - 2 * c1 + p2];

export const bezier2PolynomialX = ({
	p0,
	c1,
	p2,
}: QuadraticBezier): Polynomial<3> =>
	polynomialFromBezier2Values(p0.x, c1.x, p2.x);

export const bezier2PolynomialY = ({
	p0,
	c1,
	p2,
}: QuadraticBezier): Polynomial<3> =>
	polynomialFromBezier2Values(p0.y, c1.y, p2.y);

export const bezier2Derivative = ({
	p0,
	c1,
	p2,
}: QuadraticBezier): LineSegment => ({
	p0: ptMul(ptSub(c1, p0), 2),
	p1: ptMul(ptSub(p2, c1), 2),
});

export const bezier2TangentAt = (curve: QuadraticBezier, t: number): Pt =>
	ptNorm(lineAt(bezier2Derivative(curve), t));

export const bezier2NormalAt = (curve: QuadraticBezier, t: number): Pt =>
	ptRot90(bezier2TangentAt(curve, t));

export function bezier2RMSDistance(
	curve: QuadraticBezier,
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
					return [1, t, t * t];
				}),
				bezier2M,
			),
			bezierFromBezier2(curve),
		),
		matFromPts(points),
	);
	return matElementNorm(diff);
}

export const bezier2Transform = (
	{ p0, c1, p2 }: QuadraticBezier,
	transform: (pt: Pt) => Pt,
): QuadraticBezier => ({
	p0: transform(p0),
	c1: transform(c1),
	p2: transform(p2),
});

export const bezier2Scale = (
	{ p0, c1, p2 }: QuadraticBezier,
	scaleX: number,
	scaleY = scaleX,
): QuadraticBezier => ({
	p0: { x: p0.x * scaleX, y: p0.y * scaleY },
	c1: { x: c1.x * scaleX, y: c1.y * scaleY },
	p2: { x: p2.x * scaleX, y: p2.y * scaleY },
});

export const bezier2Translate = (
	{ p0, c1, p2 }: QuadraticBezier,
	shift: Pt,
): QuadraticBezier => ({
	p0: ptAdd(p0, shift),
	c1: ptAdd(c1, shift),
	p2: ptAdd(p2, shift),
});

export const bezier2TsAtXEq = (curve: QuadraticBezier, x: number) =>
	polynomial3Roots(bezier2PolynomialX(curve), x);

export const bezier2TsAtYEq = (curve: QuadraticBezier, y: number) =>
	polynomial3Roots(bezier2PolynomialY(curve), y);

export const bezier2XTurningPointTs = ({ p0, c1, p2 }: QuadraticBezier) =>
	polynomial2Roots([c1.x - p0.x, p2.x - 2 * c1.x + p0.x]);

export const bezier2YTurningPointTs = ({ p0, c1, p2 }: QuadraticBezier) =>
	polynomial2Roots([c1.y - p0.y, p2.y - 2 * c1.y + p0.y]);

export const bezier2Bounds = (curve: QuadraticBezier): AxisAlignedBox =>
	aaBoxFromXY(
		[
			curve.p0.x,
			curve.p2.x,
			...bezier2XTurningPointTs(curve)
				.filter((t) => t > 0 && t < 1)
				.map(bezier2XAt.bind(null, curve)),
		],
		[
			curve.p0.y,
			curve.p2.y,
			...bezier2YTurningPointTs(curve)
				.filter((t) => t > 0 && t < 1)
				.map(bezier2YAt.bind(null, curve)),
		],
	);

export function bezier2LengthEstimate(
	curve: QuadraticBezier,
	maxError = Number.POSITIVE_INFINITY,
): LengthEstimate {
	const norm = internalLineScaledNormalisation({ p0: curve.p0, p1: curve.p2 });
	if (!norm) {
		const best = ptDist(curve.p0, curve.c1);
		return { best, maxError: best * Number.EPSILON };
	}
	const lChord = Math.sqrt(norm.scale2);
	const nC1 = norm.fn(curve.c1);
	const nnC1 = { x: nC1.x > 0.5 ? 1 - nC1.x : nC1.x, y: Math.abs(nC1.y) };
	if (nnC1.y < 2 * maxError * lChord) {
		const X = 0.5 - nnC1.x;
		const best = X > 0.5 ? X + 0.25 / X : 1;
		return {
			best: best * lChord,
			maxError: (nnC1.y * 0.5 + best * Number.EPSILON) * lChord,
		};
	}
	if (norm.scale2 < 16 * Number.EPSILON) {
		const lPolygon = ptDist(curve.p0, curve.c1) + ptDist(curve.c1, curve.p2);
		const best = (lPolygon * 2 + lChord) * 0.25;
		const err =
			Math.min(lChord, lPolygon - lChord) * 0.25 + best * Number.EPSILON;
		if (err > maxError && lPolygon > lChord * 2) {
			const [b1, b2] = bezier2Bisect(curve);
			const est1 = bezier2LengthEstimate(b1, maxError * 0.5);
			const est2 = bezier2LengthEstimate(b2, maxError - est1.maxError);
			return {
				best: est1.best + est2.best,
				maxError: est1.maxError + est2.maxError,
			};
		}
		return { best, maxError: err };
	}

	const derivative1p0 = { x: nnC1.x * 2, y: nnC1.y * 2 };
	const derivative2 = { x: 2 - derivative1p0.x * 2, y: -derivative1p0.y * 2 };
	const AA = ptLen2(derivative2);

	// thanks, https://raphlinus.github.io/curves/2018/12/28/bezier-arclength.html
	if (AA < 1e-3) {
		const x = derivative2.x * 0.5;
		const y = derivative2.y * 0.5;
		const l2 = x * x + y * y;
		const l4 = l2 * l2;
		const l8 = l4 * l4;

		let len = 0;
		for (const [wi, xi] of GAUSS_LEGENDRE_COEFFS_7) {
			len += wi * ptLen(ptMad(derivative2, 0.5 * xi + 0.5, derivative1p0));
		}
		return {
			best: len * lChord * 0.5,
			maxError:
				0.025 *
				(ptLen(nnC1) + ptDist(nnC1, { x: 1, y: 0 }) - 1) *
				Math.tanh(l8 * l8) *
				lChord,
		};
	}

	const BB_AA = ptDot(derivative2, derivative1p0) / AA;
	const CC_AA = ptLen2(derivative1p0) / AA;
	const C_A = Math.sqrt(CC_AA);
	const L_A = Math.sqrt(1 + 2 * BB_AA + CC_AA);

	const m = CC_AA - BB_AA * BB_AA;
	const v = (1 + BB_AA + L_A) * (C_A - BB_AA);
	const num = (1 + BB_AA) * L_A - BB_AA * C_A + m * Math.log(v / m);

	const scale = Math.sqrt(AA) * lChord * 0.5;
	return { best: num * scale, maxError: 1e-14 * scale };
}

export function bezier2Bisect(
	{ p0, c1, p2 }: QuadraticBezier,
	t = 0.5,
): [QuadraticBezier, QuadraticBezier] {
	// thanks, https://en.wikipedia.org/wiki/De_Casteljau's_algorithm
	const i0 = ptLerp(p0, c1, t);
	const i1 = ptLerp(c1, p2, t);
	const p = ptLerp(i0, i1, t);
	return [
		{ p0: p0, c1: i0, p2: p },
		{ p0: p, c1: i1, p2: p2 },
	];
}

export function bezier2Split(
	{ p0, c1, p2 }: QuadraticBezier,
	splits: readonly number[],
	minRange = 1e-6,
): QuadraticBezier[] {
	// thanks, https://en.wikipedia.org/wiki/De_Casteljau's_algorithm
	let pp0 = p0;
	let pc1 = c1;
	const pEnd = p2;
	let pt = 0;
	const r = [];
	for (const t of splits.filter((t) => t > 0 && t < 1).sort()) {
		if (t <= pt + minRange) {
			continue;
		}
		const st = (t - pt) / (1 - pt);
		const i0 = ptLerp(pp0, pc1, st);
		const i1 = ptLerp(pc1, pEnd, st);
		const p = ptLerp(i0, i1, st);
		r.push({ p0: pp0, c1: i0, p2: p });
		pp0 = p;
		pc1 = i1;
		pt = t;
	}
	r.push({ p0: pp0, c1: pc1, p2: pEnd });
	return r;
}

export const bezier2SVG = (
	{ p0, c1, p2 }: QuadraticBezier,
	precision?: number | undefined,
	prefix = 'M',
	controlLines = false,
) =>
	`${prefix}${ptSVG(p0, precision)}${controlLines ? 'L' : 'Q'}${ptSVG(c1, precision)} ${ptSVG(
		p2,
		precision,
	)}`;

interface LengthEstimate {
	best: number;
	maxError: number;
}

// Constants source: https://github.com/linebender/kurbo/blob/8e05b2e15fce702673354cfd81b232d94bea6068/kurbo/src/common.rs#L804
// Kurbo Copyright (c) 2018 Raph Levien, available as Apache-2.0 or MIT
const GAUSS_LEGENDRE_COEFFS_7: readonly [number, number][] = [
	[0.4179591836734694, 0],
	[0.3818300505051189, 0.4058451513773972],
	[0.3818300505051189, -0.4058451513773972],
	[0.2797053914892766, -0.7415311855993945],
	[0.2797053914892766, 0.7415311855993945],
	[0.1294849661688697, -0.9491079123427585],
	[0.1294849661688697, 0.9491079123427585],
];

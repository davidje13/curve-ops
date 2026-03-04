import {
	bezier3FromBezier2,
	bezier3FromLine,
	bezier3FromPts,
	type CubicBezier,
} from './CubicBezier.mts';
import {
	array2DToMat,
	arrayToMat,
	fnToMat,
	mat1Inv,
	mat2Inv,
	mat3Inv,
	mat4Inv,
	matFrom,
	matMul,
	matMulATransposeB,
	matReshape,
	matScale,
	matToPtArray,
	ptArrayToMat,
} from './Matrix.mts';
import {
	ptAdd,
	ptDist2,
	ptDot,
	ptLen,
	ptLen2,
	ptMad,
	ptMul,
	ptNorm,
	ptSub,
	type Pt,
	type PtWithDist,
} from './Pt.mts';
import {
	bezier2FromLine,
	bezier2FromPts,
	type QuadraticBezier,
} from './QuadraticBezier.mts';
import { solveCubic, solveQuadratic } from './roots.mts';

export function leastSquaresFitQuadratic(
	points: PtWithDist[],
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
		const P = ptArrayToMat(points);
		const T = fnToMat(points, ({ d }) => {
			const t = (d - dist0) * distM;
			return [1, t, t * t];
		});
		const TTinv = mat3Inv(matMulATransposeB(T, T));
		if (TTinv) {
			const C = matMul(QUADRATIC_M_INV, matMul(TTinv, matMulATransposeB(T, P)));
			return bezier2FromPts(...matToPtArray(C));
		}
	}

	// if we reach this, the points must be colinear;
	// draw a straight line from start to end
	return bezier2FromLine({ p0, p1: pN });
}

export function leastSquaresFitCubic(points: PtWithDist[]): CubicBezier | null {
	// thanks, https://pomax.github.io/bezierinfo/#curvefitting

	if (!points.length) {
		return null;
	}

	if (points.length >= 4) {
		const p0 = points[0]!;
		const pN = points[points.length - 1]!;
		const dist0 = p0.d;
		const distM = 1 / (pN.d - dist0);
		const P = ptArrayToMat(points);
		const T = fnToMat(points, ({ d }) => {
			const t = (d - dist0) * distM;
			const tt = t * t;
			return [1, t, tt, tt * t];
		});

		const TTinv = mat4Inv(matMulATransposeB(T, T));
		if (TTinv) {
			const C = matMul(CUBIC_M_INV, matMul(TTinv, matMulATransposeB(T, P)));
			return bezier3FromPts(...matToPtArray(C));
		}
	}

	const curve = leastSquaresFitQuadratic(points);
	return curve ? bezier3FromBezier2(curve) : null;
}

export function leastSquaresFitCubicFixEnds(
	points: PtWithDist[],
	prevControl: Pt | null = null,
): CubicBezier | null {
	if (points.length === 0) {
		return null;
	}

	const p0 = points[0]!;
	const pN = points[points.length - 1]!;
	const dN = ptSub(pN, p0);
	const dist0 = p0.d;
	const distM = 1 / (pN.d - dist0);

	if (points.length >= 4) {
		if (prevControl && ptDist2(p0, prevControl)) {
			const c1n = ptNorm(ptSub(p0, prevControl));
			const TCurve = ptLen2(dN) ? ptDot(c1n, ptNorm(dN)) ** 2 : 1;
			const adjustedPoints: Pt[] = [];
			const Tv: [number, number][] = [];
			for (let i = 1; i < points.length - 1; ++i) {
				const pt = points[i]!;
				const p = (pt.d - dist0) * distM;

				// find appropriate t values if we assume the line begins
				// with the same gradient as prevControl

				// p = (TCurve/2 - 1/2) t^3 + (3/2 - 3/2 TCurve) t^2 + Bt
				const t =
					solveCubic(TCurve * 0.5 - 0.5, 1.5 - TCurve * 1.5, TCurve, -p).filter(
						(t) => t >= 0 && t <= 1,
					)[0] ?? p;

				const tt = t * t;
				const ttt = tt * t;
				adjustedPoints.push(ptMad(dN, -ttt, ptSub(pt, p0)));
				Tv.push([t - tt, t - ttt]);
			}
			const PP = ptArrayToMat(adjustedPoints);
			const TT = fnToMat(Tv, ([t1, t2]) => {
				const t2mt1 = t2 - t1;
				return [c1n.x * (t1 - t2mt1), t2mt1, 0, c1n.y * (t1 - t2mt1), 0, t2mt1];
			});
			const P = matReshape(PP, 1);
			const T = matReshape(TT, 3);
			const TTinv = mat3Inv(matMulATransposeB(T, T));
			if (TTinv) {
				const C = matScale(matMul(TTinv, matMulATransposeB(T, P)), 1 / 3);
				const [c1l, c2x, c2y] = C.v;
				if (c1l! > 0) {
					return {
						p0,
						c1: ptMad(c1n, c1l!, p0),
						c2: ptAdd(p0, { x: c2x!, y: c2y! }),
						p3: pN,
					};
				}
			}
		}

		const adjustedPoints: Pt[] = [];
		const Tv: [number, number][] = [];
		for (let i = 1; i < points.length - 1; ++i) {
			const pt = points[i]!;
			const t = (pt.d - dist0) * distM;
			const tt = t * t;
			const ttt = tt * t;
			adjustedPoints.push(ptMad(dN, -ttt, ptSub(pt, p0)));
			Tv.push([t - tt, t - ttt]);
		}
		const P = ptArrayToMat(adjustedPoints);
		const T = array2DToMat(Tv);
		const TTinv = mat2Inv(matMulATransposeB(T, T));
		if (TTinv) {
			const C = matMul(
				CUBIC_M_INV_FIXED_ENDS,
				matMul(TTinv, matMulATransposeB(T, P)),
			);
			const [c1, c2] = matToPtArray(C);
			return { p0, c1: ptAdd(p0, c1!), c2: ptAdd(p0, c2!), p3: pN };
		}
	}

	if (points.length >= 3) {
		if (prevControl && ptDist2(p0, prevControl)) {
			const c1n = ptNorm(ptSub(p0, prevControl));
			const TCurve = ptLen2(dN) ? ptDot(c1n, ptNorm(dN)) ** 2 : 1;
			const adjustedPoints: Pt[] = [];
			const Tv: number[] = [];
			for (let i = 1; i < points.length - 1; ++i) {
				const pt = points[i]!;
				const p = (pt.d - dist0) * distM;

				// find appropriate t values if we assume the line begins
				// with the same gradient as prevControl

				// p = t*t*(1 - TCurve/2) + t*TCurve/2
				const t =
					solveQuadratic(1 - TCurve * 0.5, TCurve * 0.5, -p).filter(
						(t) => t >= 0 && t <= 1,
					)[0] ?? p;

				const tt = t * t;
				adjustedPoints.push(ptMad(dN, -tt, ptSub(pt, p0)));
				Tv.push(t - tt);
			}
			const PP = ptArrayToMat(adjustedPoints);
			const TT = fnToMat(Tv, (t1) => [c1n.x * t1, c1n.y * t1]);
			const P = matReshape(PP, 1);
			const T = matReshape(TT, 1);
			const TTinv = mat1Inv(matMulATransposeB(T, T));
			if (TTinv) {
				const C = matMul(
					QUADRATIC_M_INV_FIXED_ENDS,
					matMul(TTinv, matMulATransposeB(T, P)),
				);
				const [c1l] = C.v;
				if (c1l! > 0) {
					return bezier3FromBezier2({ p0, c1: ptMad(c1n, c1l!, p0), p2: pN });
				}
			}
		}

		const adjustedPoints: Pt[] = [];
		const Tv: number[] = [];
		for (let i = 1; i < points.length - 1; ++i) {
			const pt = points[i]!;
			const t = (pt.d - dist0) * distM;
			const tt = t * t;
			adjustedPoints.push(ptMad(dN, -tt, ptSub(pt, p0)));
			Tv.push(t - tt);
		}
		const P = ptArrayToMat(adjustedPoints);
		const T = arrayToMat(Tv, 1);
		const TTinv = mat1Inv(matMulATransposeB(T, T));
		if (TTinv) {
			const C = matMul(
				QUADRATIC_M_INV_FIXED_ENDS,
				matMul(TTinv, matMulATransposeB(T, P)),
			);
			const [c1] = matToPtArray(C);
			return bezier3FromBezier2({ p0, c1: ptAdd(p0, c1!), p2: pN });
		}
	}

	if (points.length >= 2 && prevControl && ptDist2(p0, prevControl)) {
		const dN = ptSub(pN, p0);
		const d = ptLen(pN);
		const c1n = ptNorm(ptSub(p0, prevControl));
		const TCurve = d ? Math.max(ptDot(c1n, ptMul(dN, 1 / d)), 0) : 1;
		const m = 1 / 3; // bias curve towards start to reduce wobble (0.5 is unbiased)
		return bezier3FromBezier2({
			p0,
			c1: ptMad(c1n, TCurve * d * m, p0),
			p2: pN,
		});
	}

	return bezier3FromLine({ p0, p1: pN });
}

// P = points                                         [  n x dim]
// T = expanded t-values for points (1, t, tt, ttt)   [  n x d+1]
// M = term multipliers (depends on degree)           [d+1 x d+1]
// C = constants for curve                            [d+1 x dim]

// C = M^-1 * (trans(T)*T)^-1 * trans(T) * P

//const QUADRATIC_M = matFrom([
//	[1, 0, 0],
//	[-2, 2, 0],
//	[1, -2, 1],
//]);

//const CUBIC_M = matFrom([
//	//1, t, t2, t3
//	[1, 0, 0, 0], // p0
//	[-3, 3, 0, 0], // c1
//	[3, -6, 3, 0], // c2
//	[-1, 3, -3, 1], // p3
//]);

const QUADRATIC_M_INV = /*@__PURE__*/ matFrom([
	[1, 0, 0],
	[1, 0.5, 0],
	[1, 1, 1],
]);
const QUADRATIC_M_INV_FIXED_ENDS = /*@__PURE__*/ matFrom([[0.5]]);
const CUBIC_M_INV = /*@__PURE__*/ matFrom([
	[1, 0, 0, 0],
	[1, 1 / 3, 0, 0],
	[1, 2 / 3, 1 / 3, 0],
	[1, 1, 1, 1],
]);
const CUBIC_M_INV_FIXED_ENDS = /*@__PURE__*/ matFrom([
	[1 / 3, 1 / 3],
	[1 / 3, 2 / 3],
]);

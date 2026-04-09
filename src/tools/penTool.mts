import {
	bezier3FromPolylinePtsLeastSquaresFixEnds,
	bezier3LengthEstimate,
	type CubicBezier,
} from '../math/geometry/2d/CubicBezier.mts';
import {
	bezier3Normalise,
	nBezier3Area,
} from '../math/geometry/2d/NormalisedCubicBezier.mts';
import { ptDist, type Point2D } from '../math/geometry/2d/Point2D.mts';
import type { PointWithDist2D } from '../math/geometry/2d/Polyline2D.mts';
import { movementThrottle } from './movement.mts';

export function penTool(
	onBegin: (pt: Point2D) => void,
	onSegment: (curve: CubicBezier, points: number) => void,
	onLive: (curve: CubicBezier) => void,
	onDone: () => void,
	onCancel: () => void,
	minStep: number,
	maxN: number,
	minError: number,
	maxError: number,
) {
	const minError2 = minError * minError;
	const maxError2 = maxError * maxError;

	const live: PointWithDist2D[] = [];
	let prevControl: Point2D | undefined;
	let best!: Fit;

	return movementThrottle(
		(pt) => {
			live.length = 0;
			live.push({ ...pt, d: 0 });
			prevControl = undefined;
			best = doFit(live, undefined);
			onBegin(pt);
		},
		(_, pt, done) => {
			const prevPt = live[live.length - 1]!;
			live.push({ ...pt, d: prevPt.d + ptDist(prevPt, pt) });

			let fit = doFit(live, prevControl);
			if (fit.d < minError2 || best.n < 2 || fit.d < best.d) {
				best = fit;
			}
			if (fit.d > maxError2 || live.length > maxN) {
				onSegment(best.c, best.n);
				live.splice(0, best.n - 1);
				prevControl = best.c.c2;
				fit = doFit(live, prevControl);
				best = fit;
			}

			if (!done) {
				onLive(fit.c);
			} else {
				if (live.length > 1) {
					onSegment(fit.c, fit.n);
				}
				onDone();
			}
		},
		onCancel,
		minStep,
		1000,
	);
}

function doFit(
	points: readonly PointWithDist2D[],
	prevControl: Point2D | undefined,
): Fit {
	if (!points.length) {
		throw new Error('nothing to fit');
	}
	const p0 = points[0]!;
	const pN = points[points.length - 1]!;
	const curve = bezier3FromPolylinePtsLeastSquaresFixEnds(points, prevControl);
	if (!curve || points.length < 2) {
		return {
			n: points.length,
			c: { p0, c1: p0, c2: pN, p3: pN },
			d: Number.POSITIVE_INFINITY,
		};
	}
	const norm = bezier3Normalise(curve);
	let targetNormArea = 0;
	const targetLength = pN.d - p0.d;
	let prevPt = norm.fn(p0);
	for (let i = 1; i < points.length; ++i) {
		const pt = norm.fn(points[i]!);
		const w = pt.x - prevPt.x;
		targetNormArea += (w * (prevPt.y + pt.y)) / 2;
		prevPt = pt;
	}
	const scale = Math.sqrt(norm.scale2);
	const dArea = (targetNormArea - nBezier3Area(norm.curve)) * scale;
	const dLength =
		targetLength - bezier3LengthEstimate(curve, 0.01 * scale).best;
	return {
		n: points.length,
		c: curve,
		d: dArea * dArea + dLength * dLength,
	};
}

interface Fit {
	readonly n: number;
	readonly c: CubicBezier;
	readonly d: number;
}

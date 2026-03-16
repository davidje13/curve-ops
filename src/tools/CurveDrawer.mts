import {
	bezier3LengthEstimate,
	type CubicBezier,
} from '../math/geometry/2d/CubicBezier.mts';
import { leastSquaresFitCubicFixEnds } from '../math/geometry/2d/leastSquaresBezier.mts';
import {
	bezier3Normalise,
	nBezier3Area,
} from '../math/geometry/2d/NormalisedCubicBezier.mts';
import { ptDist, type Pt } from '../math/geometry/2d/Pt.mts';
import type { PtWithDist } from '../math/geometry/2d/Polyline2D.mts';

export class CurveDrawer {
	declare private _state:
		| { _live: PtWithDist[]; _prevControl: Pt | null; _best: Fit }
		| undefined;
	declare private readonly _minError: number;
	declare private readonly _maxError: number;

	constructor(
		private readonly onBegin: (pt: Pt) => void,
		private readonly onSegment: (curve: CubicBezier, points: number) => void,
		private readonly onLive: (curve: CubicBezier) => void,
		private readonly onDone: () => void,
		private readonly onCancel: () => void,
		private readonly minStep: number,
		private readonly maxN: number,
		minError: number,
		maxError: number,
	) {
		this._minError = minError * minError;
		this._maxError = maxError * maxError;
		this._state = undefined;
	}

	_fit(points: readonly PtWithDist[], prevControl: Pt | null): Fit {
		if (!points.length) {
			throw new Error('nothing to fit');
		}
		const p0 = points[0]!;
		const pN = points[points.length - 1]!;
		const curve = leastSquaresFitCubicFixEnds(points, prevControl);
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

	begin = (pt: Pt) => {
		const wpt = { ...pt, d: 0 };
		this._state = {
			_live: [wpt],
			_prevControl: null,
			_best: this._fit([wpt], null),
		};
		this.onBegin(pt);
	};

	draw = (pt: Pt, done = false) => {
		const s = this._state;
		if (!s) {
			return;
		}
		const live = s._live;
		const prevPt = live[live.length - 1]!;
		const dist = ptDist(prevPt, pt);
		if (!done && dist < this.minStep) {
			return;
		}
		const wpt = { ...pt, d: prevPt.d + dist };
		live.push(wpt);

		let fit = this._fit(live, s._prevControl);
		if (fit.d < this._minError || s._best.n < 2 || fit.d < s._best.d) {
			s._best = fit;
		}
		if (fit.d > this._maxError || live.length > this.maxN) {
			this.onSegment(s._best.c, s._best.n);
			live.splice(0, s._best.n - 1);
			s._prevControl = s._best.c.c2;
			fit = this._fit(live, s._prevControl);
			s._best = fit;
		}

		if (!done) {
			this.onLive(fit.c);
		} else if (live.length > 1) {
			this.onSegment(fit.c, fit.n);
			this.onDone();
		}
	};

	cancel = () => {
		this._state = undefined;
		this.onCancel();
	};
}

interface Fit {
	readonly n: number;
	readonly c: CubicBezier;
	readonly d: number;
}

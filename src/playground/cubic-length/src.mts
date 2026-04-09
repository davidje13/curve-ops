import {
	type CubicBezier,
	type Point2D,
	bezier3At,
	bezier3FromPts,
	bezier3LengthEstimate,
	bezier3Normalise,
	bezier3Split,
	bezier3SVG,
	bezier3XTurningPointTs,
	bezier3YTurningPointTs,
	nBezier3InflectionTs,
	ptDist,
	ptDist2,
	ptSVG,
} from '../../index.mts';
import { makeInteractive } from '../dom.mts';

const maxError = 1e-4;
const samples = 1000;

const printLengthEstimate = (est: { best: number; maxError: number }) =>
	`${est.best.toFixed(6)} ±${est.maxError.toPrecision(1)}`;

document.body.append(
	makeInteractive(({ addText, addSVGPath, addHandle, computed }) => {
		const p0 = addHandle('end', { x: 0.1, y: 0.1 });
		const p1 = addHandle('mid', { x: 0.9, y: 0.1 });
		const p2 = addHandle('mid', { x: 0.1, y: 0.9 });
		const p3 = addHandle('end', { x: 0.7, y: 0.9 });
		const bezier = computed(() => bezier3FromPts(p0, p1, p2, p3));
		addSVGPath('ctl', () => bezier3SVG(bezier.current, undefined, 'M', true));
		addSVGPath('curve', () => bezier3SVG(bezier.current));

		addSVGPath('split', () => {
			const norm = bezier3Normalise(bezier.current);
			const curveInflectionTs = nBezier3InflectionTs(norm.curve);
			const curveXLimTs = bezier3XTurningPointTs(norm.curve);
			const curveYLimTs = bezier3YTurningPointTs(norm.curve);

			const splits = [...curveInflectionTs, ...curveXLimTs, ...curveYLimTs]
				.filter((t) => t > 0 && t < 1)
				.sort();

			return splits
				.map((t) => `M${ptSVG(bezier3At(bezier.current, t))}v0.001`)
				.join('');
		});

		addText(() => {
			const begin1 = performance.now();
			for (let r = 0; r < samples; ++r) {
				bezier3LengthEstimate(bezier.current, maxError);
			}
			const end1 = performance.now();

			return `Estimated Length [${maxError.toPrecision(1)}]: ${printLengthEstimate(
				bezier3LengthEstimate(bezier.current, maxError),
			)} (${((end1 - begin1) / samples).toFixed(4)}ms)`;
		});

		addText(() => {
			const norm = bezier3Normalise(bezier.current);
			const curveXLimTs = bezier3XTurningPointTs(norm.curve);

			const begin2 = performance.now();
			for (let r = 0; r < samples; ++r) {
				guidedLengthEstimate(bezier.current, maxError, curveXLimTs);
			}
			const end2 = performance.now();

			return `Guided Estimated Length [${maxError.toPrecision(
				1,
			)}]: ${printLengthEstimate(
				guidedLengthEstimate(bezier.current, maxError, curveXLimTs),
			)} (${((end2 - begin2) / samples).toFixed(4)}ms)`;
		});

		addText(() => {
			return `True Length: ${measureCubic(
				bezier3At.bind(null, bezier.current),
				0,
				1,
				1e6,
			).toFixed(6)}`;
		});
	}),
);

function guidedLengthEstimate(
	curve: CubicBezier,
	maxError: number,
	splits: readonly number[],
	recursionLimit = 10,
) {
	const est0 = bezier3LengthEstimate(curve, maxError, 0);

	if (est0.maxError > maxError && recursionLimit > 0) {
		// sort sub-curve small-to-large so that we can give greatest error tolerance to the larger curves
		const s = bezier3Split(curve, splits).sort(
			(a, b) => ptDist2(a.p0, a.p3) - ptDist2(b.p0, b.p3),
		);
		if (s.length > 1) {
			const sr = recursionLimit - 1;
			const l = { best: 0, maxError: 0 };
			for (let i = 0; i < s.length; ++i) {
				const se = (maxError - l.maxError) / (s.length - i);
				const est = bezier3LengthEstimate(s[i]!, se, sr);
				l.best += est.best;
				l.maxError += est.maxError;
			}
			return l;
		}
		return bezier3LengthEstimate(curve, maxError, recursionLimit);
	}

	return est0;
}

function measureCubic(
	f: (t: number) => Point2D,
	start: number,
	end: number,
	steps: number,
) {
	let sum = 0;
	let prev = f(start);
	const range = end - start;
	for (let i = 1; i <= steps; ++i) {
		const p = start + range * (i / steps);
		const pt = f(p);
		sum += ptDist(pt, prev);
		prev = pt;
	}
	return sum;
}

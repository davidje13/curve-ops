import {
	type CubicBezier,
	type Pt,
	bezier3At,
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
} from '../index.mts';
import { grabbable, mk, mkSVG } from './dom.mts';

(() => {
	const pathCtl = mkSVG('path', { class: 'ctl' });
	const pathCurve = mkSVG('path', { class: 'curve' });
	const pathSplits = mkSVG('path', { class: 'split' });
	const svg = mkSVG(
		'svg',
		{
			version: '1.1',
			viewBox: '0 0 1 1',
			width: 500,
			height: 500,
		},
		[pathCtl, pathCurve, pathSplits],
	);
	const dc0 = mk('div', { class: 'ctl end' });
	const dc1 = mk('div', { class: 'ctl mid' });
	const dc2 = mk('div', { class: 'ctl mid' });
	const dc3 = mk('div', { class: 'ctl end' });
	const out = mk('pre');

	document.body.append(
		mk('div', { class: 'item' }, [
			mk('div', { class: 'playground' }, [svg, dc0, dc1, dc2, dc3]),
			out,
		]),
	);

	function update() {
		const bezier = { p0, c1: p1, c2: p2, p3 };
		pathCtl.setAttribute('d', bezier3SVG(bezier, undefined, 'M', 'L'));
		pathCurve.setAttribute('d', bezier3SVG(bezier));

		const norm = bezier3Normalise(bezier);
		const curveInflectionTs = nBezier3InflectionTs(norm.curve);
		const curveXLimTs = bezier3XTurningPointTs(norm.curve);
		const curveYLimTs = bezier3YTurningPointTs(norm.curve);

		const splits = [...curveInflectionTs, ...curveXLimTs, ...curveYLimTs]
			.filter((t) => t > 0 && t < 1)
			.sort();

		pathSplits.setAttribute(
			'd',
			splits.map((t) => `M${ptSVG(bezier3At(bezier, t))}v0.001`).join(''),
		);

		const printLengthEstimate = (est: { best: number; maxError: number }) =>
			`${est.best.toFixed(6)} ±${est.maxError.toPrecision(1)}`;

		const maxError = 1e-4;
		const samples = 1000;
		const begin1 = performance.now();
		for (let r = 0; r < samples; ++r) {
			bezier3LengthEstimate(bezier, maxError);
		}
		const end1 = performance.now();
		const begin2 = performance.now();
		for (let r = 0; r < samples; ++r) {
			guidedLengthEstimate(bezier, maxError, curveXLimTs);
		}
		const end2 = performance.now();
		out.innerText = [
			`Estimated Length [${maxError.toPrecision(1)}]: ${printLengthEstimate(
				bezier3LengthEstimate(bezier, maxError),
			)} (${((end1 - begin1) / samples).toFixed(4)}ms)`,
			`Guided Estimated Length [${maxError.toPrecision(
				1,
			)}]: ${printLengthEstimate(
				guidedLengthEstimate(bezier, maxError, curveXLimTs),
			)} (${((end2 - begin2) / samples).toFixed(4)}ms)`,
			`True Length: ${measureCubic(
				bezier3At.bind(null, bezier),
				0,
				1,
				1e6,
			).toFixed(6)}`,
		].join('\n');
	}

	const p0 = grabbable(dc0, update, { x: 0.1, y: 0.1 });
	const p1 = grabbable(dc1, update, { x: 0.9, y: 0.1 });
	const p2 = grabbable(dc2, update, { x: 0.1, y: 0.9 });
	const p3 = grabbable(dc3, update, { x: 0.7, y: 0.9 });
	update();
})();

function guidedLengthEstimate(
	curve: CubicBezier,
	maxError: number,
	splits: number[],
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
	f: (t: number) => Pt,
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

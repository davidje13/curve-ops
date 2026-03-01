import { circleSVG } from '../math/Circle.mts';
import {
	bezier3At,
	bezier3LengthEstimate,
	bezier3Split,
	bezier3SVG,
	bezier3XTurningPointTs,
	bezier3YTurningPointTs,
	type CubicBezier,
} from '../math/CubicBezier.mts';
import {
	intersectBezier3Circle,
	intersectBezier3Rect,
} from '../math/intersection.mts';
import { leastSquaresFitCubicFixEnds } from '../math/leastSquaresBezier.mts';
import {
	bezier3Normalise,
	nBezier3Area,
	nBezier3InflectionTs,
	nBezier3Moment,
} from '../math/NormalisedCubicBezier.mts';
import { rectFromLine, rectSVG } from '../math/Rectangle.mjs';
import {
	PT0,
	ptDist,
	ptDist2,
	ptLerp,
	ptMad,
	ptMul,
	ptNorm,
	ptPolyline,
	ptRot90,
	ptSub,
	ptSVG,
	type Pt,
} from '../math/Pt.mts';
import { CurveDrawer } from './CurveDrawer.mts';
import { DragHandler } from './DragHandler.mts';
import { lineFromPts } from '../math/Line.mts';

(() => {
	const svg = mkSVG('svg', {
		version: '1.1',
		viewBox: '0 0 1 1',
		width: 500,
		height: 500,
	});
	const pathLive = mkSVG('path', { class: 'live' });

	document.body.append(mk('div', { class: 'playground draw' }, [svg]));

	const drawer = new CurveDrawer(
		() => svg.replaceChildren(pathLive),
		(seg, n) =>
			svg.append(mkSVG('path', { class: `done n${n}`, d: bezier3SVG(seg) })),
		(live) => pathLive.setAttribute('d', bezier3SVG(live)),
		() => {
			pathLive.setAttribute('d', '');
		},
		() => svg.replaceChildren(),
		0.005,
		100,
		0.0005,
		0.0008,
	);
	const drawPointer = new DragHandler(
		svg,
		1,
		1,
		drawer.begin,
		drawer.draw,
		drawer.cancel,
	);
	svg.addEventListener('pointerdown', drawPointer.begin);
})();

(() => {
	const pathCtl = mkSVG('path', { class: 'ctl' });
	const pathCurve = mkSVG('path', { class: 'curve' });
	const svg = mkSVG(
		'svg',
		{
			version: '1.1',
			viewBox: '0 0 1 1',
			width: 500,
			height: 500,
		},
		[pathCtl, pathCurve],
	);

	const dcprev = mk('div', { class: 'ctl prev' });
	const dc0 = mk('div', { class: 'ctl end' });
	const dcs = [];
	for (let i = 0; i < 2; ++i) {
		dcs.push(mk('div', { class: 'ctl mid' }));
	}
	const dcN = mk('div', { class: 'ctl end' });

	document.body.append(
		mk('div', { class: 'playground' }, [svg, dcprev, dc0, ...dcs, dcN]),
	);

	const pts: Pt[] = [];

	function update() {
		const bezier = leastSquaresFitCubicFixEnds(ptPolyline(pts), pprev);
		if (bezier) {
			pathCtl.setAttribute('d', bezier3SVG(bezier, undefined, 'M', 'L'));
			pathCurve.setAttribute('d', bezier3SVG(bezier));
		} else {
			pathCtl.setAttribute('d', '');
			pathCurve.setAttribute('d', '');
		}
	}

	const lineStart = { x: 0.2, y: 0.5 };
	const lineEnd = { x: 0.8, y: 0.5 };
	const pprev = grabbable(dcprev, update, { x: 0.1, y: 0.4 });
	pts.push(grabbable(dc0, update, lineStart));
	for (let i = 0; i < dcs.length; ++i) {
		pts.push(
			grabbable(
				dcs[i]!,
				update,
				ptLerp(lineStart, lineEnd, (i + 1) / (dcs.length + 1)),
			),
		);
	}
	pts.push(grabbable(dcN, update, lineEnd));
	update();
})();

(() => {
	const circle = { c: { x: 0.5, y: 0.5 }, r: 0.2 };
	const box = rectFromLine(
		lineFromPts({ x: 0.3, y: 0.7 }, { x: 0.9, y: 0.5 }),
		0.1,
	);

	const pathCtl = mkSVG('path', { class: 'ctl' });
	const pathCurve = mkSVG('path', { class: 'curve' });
	const pathSplits = mkSVG('path', { class: 'split' });
	const pathIntersections = mkSVG('path', { class: 'intersections' });
	const svg = mkSVG(
		'svg',
		{
			version: '1.1',
			viewBox: '0 0 1 1',
			width: 500,
			height: 500,
		},
		[
			mkSVG('path', { class: 'intersection-shape', d: circleSVG(circle) }),
			mkSVG('path', { class: 'intersection-shape', d: rectSVG(box) }),
			pathCtl,
			pathCurve,
			pathSplits,
			pathIntersections,
		],
	);
	const dc0 = mk('div', { class: 'ctl end' });
	const dc1 = mk('div', { class: 'ctl mid' });
	const dc2 = mk('div', { class: 'ctl mid' });
	const dc3 = mk('div', { class: 'ctl end' });
	const out = mk('pre');

	document.body.append(
		mk('div', { class: 'playground' }, [svg, dc0, dc1, dc2, dc3]),
		out,
	);

	function update() {
		const bezier = { p0, c1: p1, c2: p2, p3 };
		pathCtl.setAttribute('d', bezier3SVG(bezier, undefined, 'M', 'L'));
		pathCurve.setAttribute('d', bezier3SVG(bezier));

		const norm = bezier3Normalise(bezier);
		const normBezier = norm.curve;

		const curveInflectionTs = nBezier3InflectionTs(normBezier);
		const curveXLimTs = bezier3XTurningPointTs(normBezier);
		const curveYLimTs = bezier3YTurningPointTs(normBezier);

		const splits = [...curveInflectionTs, ...curveXLimTs, ...curveYLimTs]
			.filter((t) => t > 0 && t < 1)
			.sort();

		pathSplits.setAttribute(
			'd',
			splits.map((t) => `M${ptSVG(bezier3At(bezier, t))}v0.001`).join(''),
		);

		const intersectionsCircle = intersectBezier3Circle(bezier, circle, 1e-2);
		const intersectionsBox = intersectBezier3Rect(bezier, box);
		const intersections = [...intersectionsCircle, ...intersectionsBox];
		pathIntersections.setAttribute(
			'd',
			intersections
				.map(({ t1, d1 }) => {
					const pt = bezier3At(bezier, t1);
					const dir = ptNorm(ptSub(bezier3At(bezier, t1 + d1 * 0.01), pt));
					const w = ptMul(ptRot90(dir), 0.015);
					return `M${ptSVG(pt)}l${ptSVG(ptMad(dir, 0.02, ptMul(w, -0.5)))}l${ptSVG(w)}Z`;
				})
				.join(''),
		);

		const curveArea = nBezier3Area(normBezier);
		const curveMoment = nBezier3Moment(normBezier);

		const printLengthEstimate = (est: { best: number; maxError: number }) =>
			`${est.best.toFixed(6)} ±${est.maxError.toPrecision(1)}`;

		const scale = Math.sqrt(norm.scale2);
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
			`Area: ${(curveArea * scale * scale).toFixed(3)}`,
			`Estimated Length [${maxError.toPrecision(1)}]: ${printLengthEstimate(
				bezier3LengthEstimate(bezier, maxError),
			)} (${((end1 - begin1) / samples).toFixed(4)}ms)`,
			`Guided Estimated Length [${maxError.toPrecision(
				1,
			)}]: ${printLengthEstimate(
				guidedLengthEstimate(bezier, maxError, curveXLimTs),
			)} (${((end2 - begin2) / samples).toFixed(4)}ms)`,
			`True Length: ${measureFunction(
				bezier3At.bind(null, bezier),
				0,
				1,
				1e-6,
			).toFixed(6)}`,
			`Moment: ${(curveMoment * scale * scale * scale).toFixed(3)}`,
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

function measureFunction(
	f: (t: number) => Pt,
	start: number,
	end: number,
	step: number,
) {
	let sum = 0;
	let prev = f(start);
	for (let p = start + step; p < end; p += step) {
		const pt = f(p);
		sum += ptDist(pt, prev);
		prev = pt;
	}
	const pt = f(end);
	sum += ptDist(pt, prev);
	return sum;
}

function grabbable(o: HTMLElement, update: () => void, initial: Pt = PT0): Pt {
	const r = { ...initial };
	const draw = () => {
		o.style.left = `${r.x * 100}%`;
		o.style.top = `${r.y * 100}%`;
	};
	const move = (p: Pt) => {
		r.x = p.x;
		r.y = p.y;
		draw();
		update();
	};
	const handler = new DragHandler(o.parentElement!, 1, 1, move, move, () => {});
	o.addEventListener('pointerdown', handler.begin);
	draw();
	return r;
}

function mk(
	type: string,
	attrs: Record<string, string | number> = {},
	children: (string | Element)[] = [],
) {
	const o: HTMLElement = document.createElement(type);
	for (const k in attrs) {
		o.setAttribute(k, String(attrs[k]));
	}
	o.append(...children);
	return o;
}

function mkSVG(
	type: string,
	attrs: Record<string, string | number> = {},
	children: (string | Element)[] = [],
) {
	const o: SVGElement = document.createElementNS(
		'http://www.w3.org/2000/svg',
		type,
	);
	for (const k in attrs) {
		o.setAttribute(k, String(attrs[k]));
	}
	o.append(...children);
	return o;
}

import {
	type Pt,
	bezier3At,
	bezier3LengthEstimate,
	bezier3Normalise,
	bezier3SVG,
	bezier3TangentAt,
	circleSVG,
	CurveDrawer,
	intersectBezier3Circle,
	intersectBezier3Rect,
	leastSquaresFitCubicFixEnds,
	lineFromPts,
	nBezier3Area,
	nBezier3Moment,
	ptLerp,
	ptMad,
	ptMul,
	ptPolyline,
	ptRot90,
	ptSVG,
	rectFromLine,
	rectSVG,
} from '../index.mts';
import { bezier3FromPts } from '../math/geometry/2d/CubicBezier.mts';
import { grabbable, mk, mkSVG } from './dom.mts';
import { DragHandler } from './DragHandler.mts';

(() => {
	const svg = mkSVG('svg', {
		version: '1.1',
		viewBox: '0 0 1 1',
		width: 500,
		height: 500,
	});
	const pathLive = mkSVG('path', { class: 'live' });

	document.body.append(mk('div', { class: 'item playground draw' }, [svg]));

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
		mk('div', { class: 'item playground' }, [svg, dcprev, dc0, ...dcs, dcN]),
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
			pathIntersections,
		],
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
		const bezier = bezier3FromPts(p0, p1, p2, p3);
		//const bezier = bezier3FromQuad(p0, p1, p2, p3);
		pathCtl.setAttribute('d', bezier3SVG(bezier, undefined, 'M', 'L'));
		pathCurve.setAttribute('d', bezier3SVG(bezier));

		const norm = bezier3Normalise(bezier);
		const normBezier = norm.curve;

		const intersectionsCircle = intersectBezier3Circle(bezier, circle, 1e-2);
		const intersectionsBox = intersectBezier3Rect(bezier, box);
		const intersections = [...intersectionsCircle, ...intersectionsBox];
		pathIntersections.setAttribute(
			'd',
			intersections
				.map(({ t1, d1 }) => {
					const pt = bezier3At(bezier, t1);
					const dir = ptMul(bezier3TangentAt(bezier, t1), d1 * 0.02);
					const w = ptMul(ptRot90(dir), 0.75);
					return `M${ptSVG(pt)}l${ptSVG(ptMad(w, -0.5, dir))}l${ptSVG(w)}Z`;
				})
				.join(''),
		);

		const curveArea = nBezier3Area(normBezier);
		const curveMoment = nBezier3Moment(normBezier);

		const printLengthEstimate = (est: { best: number; maxError: number }) =>
			`${est.best.toFixed(6)} ±${est.maxError.toPrecision(1)}`;

		const scale = Math.sqrt(norm.scale2);
		const maxError = 1e-4;
		out.innerText = [
			`Area: ${(curveArea * scale * scale).toFixed(3)}`,
			`Length: ${printLengthEstimate(bezier3LengthEstimate(bezier, maxError))}`,
			`Moment: ${(curveMoment * scale * scale * scale).toFixed(3)}`,
		].join('\n');
	}

	const p0 = grabbable(dc0, update, { x: 0.1, y: 0.1 });
	const p1 = grabbable(dc1, update, { x: 0.9, y: 0.1 });
	const p2 = grabbable(dc2, update, { x: 0.1, y: 0.9 });
	const p3 = grabbable(dc3, update, { x: 0.7, y: 0.9 });
	update();
})();

import {
	type Pt,
	bezier3SVG,
	CurveDrawer,
	leastSquaresFitCubicFixEnds,
	ptLerp,
	ptPolyline,
} from '../../index.mts';
import { grabbable, mk, mkSVG } from '../dom.mts';
import { DragHandler } from '../DragHandler.mts';

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

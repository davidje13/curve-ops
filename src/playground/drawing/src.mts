import {
	type Pt,
	bezier3SVG,
	CurveDrawer,
	leastSquaresFitCubicFixEnds,
	ptLerp,
	ptPolyline,
} from '../../index.mts';
import { makeInteractive, mkSVG } from '../dom.mts';

document.body.append(
	makeInteractive(({ addSVGElement, addDragHandler }) => {
		const hold = addSVGElement(mkSVG('g'));
		const pathLive = mkSVG('path', { class: 'live' });

		const drawer = new CurveDrawer(
			() => hold.replaceChildren(pathLive),
			(seg, n) =>
				hold.append(mkSVG('path', { class: `done n${n}`, d: bezier3SVG(seg) })),
			(live) => pathLive.setAttribute('d', bezier3SVG(live)),
			() => {
				pathLive.setAttribute('d', '');
			},
			() => hold.replaceChildren(),
			0.005,
			100,
			0.0005,
			0.0008,
		);
		addDragHandler(drawer.begin, drawer.draw, drawer.cancel);
	}),

	makeInteractive(({ addSVGPath, addHandle, computed }) => {
		const lineStart = { x: 0.2, y: 0.5 };
		const lineEnd = { x: 0.8, y: 0.5 };
		const controlCount = 2;
		const pts: Pt[] = [];
		const pprev = addHandle('prev', { x: 0.1, y: 0.4 });
		pts.push(addHandle('end', lineStart));
		for (let i = 0; i < controlCount; ++i) {
			pts.push(
				addHandle(
					'mid',
					ptLerp(lineStart, lineEnd, (i + 1) / (controlCount + 1)),
				),
			);
		}
		pts.push(addHandle('end', lineEnd));

		const bezier = computed(() =>
			leastSquaresFitCubicFixEnds(ptPolyline(pts), pprev),
		);
		addSVGPath('ctl', () =>
			bezier.current ? bezier3SVG(bezier.current, undefined, 'M', 'L') : null,
		);
		addSVGPath('curve', () =>
			bezier.current ? bezier3SVG(bezier.current) : null,
		);
	}),
);

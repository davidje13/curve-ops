import { bezier3SVG, CurveDrawer } from '../../index.mts';
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
);

import {
	bezier3At,
	bezier3FromPts,
	bezier3SVG,
	bezier3TangentAt,
	circleSVG,
	intersectBezier3Circle,
	intersectBezier3Rect,
	lineFromPts,
	ptMad,
	ptMul,
	ptRot90,
	ptSVG,
	rectFromLine,
	rectSVG,
} from '../../index.mts';
import { grabbable, mk, mkSVG } from '../dom.mts';

(() => {
	const circle = { c: { x: 0.5, y: 0.3 }, r: 0.2 };
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

	document.body.append(
		mk('div', { class: 'playground item' }, [svg, dc0, dc1, dc2, dc3]),
	);

	function update() {
		const bezier = bezier3FromPts(p0, p1, p2, p3);
		//const bezier = bezier3FromQuad(p0, p1, p2, p3);
		pathCtl.setAttribute('d', bezier3SVG(bezier, undefined, 'M', 'L'));
		pathCurve.setAttribute('d', bezier3SVG(bezier));

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
	}

	const p0 = grabbable(dc0, update, { x: 0.1, y: 0.1 });
	const p1 = grabbable(dc1, update, { x: 0.9, y: 0.1 });
	const p2 = grabbable(dc2, update, { x: 0.1, y: 0.9 });
	const p3 = grabbable(dc3, update, { x: 0.7, y: 0.9 });
	update();
})();

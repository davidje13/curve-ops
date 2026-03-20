import {
	bezier3Bounds,
	bezier3SVG,
	intersectBezier3CircleFn,
	isOverlapAABox,
	isOverlapAABoxCircleR2,
	movementThrottle,
	penTool,
	polyline2DSVG,
	ptDist2,
	ptSVG,
	rectBounds,
	rectFromLine,
	SingleLinkedList,
	subtractBezier3Circle,
	subtractBezier3Rect,
	type AxisAlignedBox,
	type Circle,
	type CircleIntersectionFn,
	type CubicBezier,
	type Pt,
} from '../../index.mts';
import {
	makeInteractive,
	makeNumericInput,
	makeRadio,
	makeSelect,
	mk,
	mkSVG,
} from '../dom.mts';
import { pointsOptions } from './sample-curves.mts';

interface BezierSegment {
	_curve: CubicBezier;
	_element: SVGElement;
	_circFn: CircleIntersectionFn | null;
	_bounds: AxisAlignedBox;
}

document.body.append(
	makeInteractive(({ addElement, addSVGElement, addDragHandler }) => {
		const tool = makeRadio(
			'tool',
			[{ name: 'Pen' }, { name: 'Eraser' }],
			' ',
			0,
		);
		addElement(tool.input);

		const paths = new SingleLinkedList<BezierSegment>();
		let active: SingleLinkedList<BezierSegment> | undefined;
		const hold = addSVGElement(mkSVG('g'));

		const eraserRad = 0.03;
		function doErase(from: Pt, to: Pt) {
			const rr = eraserRad * eraserRad;
			const endCap: Circle = { c: to, r: eraserRad };
			const line =
				ptDist2(from, to) > rr * 0.1 * 0.1
					? rectFromLine({ p0: from, p1: to }, eraserRad * 2)
					: null;
			const lineBounds = line ? rectBounds(line) : null;

			paths.forEach((seg, { replace }) => {
				let parts = [seg._curve];
				if (isOverlapAABoxCircleR2(seg._bounds, endCap.c, rr)) {
					seg._circFn ??= intersectBezier3CircleFn(seg._curve);
					parts = subtractBezier3Circle(seg._curve, endCap, seg._circFn);
				}
				if (lineBounds && isOverlapAABox(seg._bounds, lineBounds)) {
					parts = parts.flatMap((c) => subtractBezier3Rect(c, line!));
				}
				if (parts.length !== 1) {
					// removed or split
					const split = parts.map(
						(part): BezierSegment => ({
							_curve: part,
							_element: mkSVG('path', { class: 'done', d: bezier3SVG(part) }),
							_circFn: null,
							_bounds: bezier3Bounds(part),
						}),
					);
					seg._element.replaceWith(...split.map((v) => v._element));
					replace(...split);
				} else if (parts[0] !== seg._curve) {
					// replaced
					const curve = parts[0]!;
					seg._curve = curve;
					seg._circFn = null;
					seg._bounds = bezier3Bounds(curve);
					seg._element.setAttribute('d', bezier3SVG(curve));
				}
			});
		}

		const eraser = movementThrottle(null, doErase, null, 0.005, 200);

		const pathLive = addSVGElement(mkSVG('path', { class: 'live' }));
		const pen = penTool(
			() => {
				active = new SingleLinkedList<BezierSegment>();
			},
			(seg, n) => {
				if (!active) {
					return;
				}
				const element = mkSVG('path', {
					class: `done n${n}`,
					d: bezier3SVG(seg),
				});
				active.push({
					_curve: seg,
					_element: element,
					_circFn: null,
					_bounds: bezier3Bounds(seg),
				});
				hold.append(element);
			},
			(live) => pathLive.setAttribute('d', bezier3SVG(live)),
			() => {
				pathLive.setAttribute('d', '');
				if (active) {
					paths.concat(active);
					active = undefined;
				}
			},
			() => {
				active?.forEach((seg) => seg._element.remove());
				active = undefined;
			},
			0.005,
			50,
			0.0005,
			0.0008,
		);
		addDragHandler((pt) =>
			tool.current()?.name === 'Pen' ? pen(pt) : eraser(pt),
		);
	}),

	makeInteractive(
		({ addElement, addSVGElement, addSVGPath, addUpdateFn, update }) => {
			const guide = addSVGPath('ctl');
			const hold = addSVGElement(mkSVG('g'));

			const minStep = makeNumericInput(0, 1, 'any', 0.005, update);
			const maxN = makeNumericInput(2, 1000, 1, 100, update);
			const minError = makeNumericInput(0, 1, 'any', 0.0002, update);
			const maxError = makeNumericInput(0, 1, 'any', 0.0003, update);
			const pointsSelect = makeSelect(pointsOptions, 0, update);
			addElement(
				mk('div', {}, [
					pointsSelect.input,
					mk('br'),
					mk('label', {}, ['min step ', minStep.input]),
					mk('br'),
					mk('label', {}, ['max points ', maxN.input]),
					mk('br'),
					mk('label', {}, ['min error ', minError.input]),
					mk('br'),
					mk('label', {}, ['max error ', maxError.input]),
				]),
			);

			addUpdateFn(() => {
				const points = pointsSelect.current().points;
				const pen = penTool(
					() => hold.replaceChildren(),
					(seg, n) =>
						hold.append(
							mkSVG('path', { class: `done n${n}`, d: bezier3SVG(seg) }),
							mkSVG('path', {
								class: 'join',
								d: 'M' + ptSVG(seg.p3) + 'h0.001',
							}),
						),
					() => {},
					() => {},
					() => {},
					minStep.current(),
					maxN.current(),
					minError.current(),
					maxError.current(),
				);
				guide.setAttribute('d', polyline2DSVG(points));
				const path = pen(points[0]!);
				for (let i = 1; i < points.length - 1; ++i) {
					path.move(points[i]!);
				}
				path.move(points[points.length - 1]!, true);
			});
		},
	),
);

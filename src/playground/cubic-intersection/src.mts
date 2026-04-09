import {
	aaBox2SVG,
	bezier3At,
	bezier3FromPts,
	bezier3SVG,
	bezier3TangentAt,
	circleBounds,
	circleContains,
	circleSVG,
	cutBezier3Circle,
	cutBezier3Rect,
	intersectBezier3Circle,
	intersectBezier3CircleFn,
	intersectBezier3Rect,
	line2FromPts,
	ptDist,
	ptMad,
	ptMul,
	ptRot90,
	ptSVG,
	rectBounds,
	rectContains,
	rectFromLineSeg2,
	rectSVG,
} from '../../index.mts';
import { makeInteractive, mk } from '../dom.mts';

document.body.append(
	makeInteractive(
		({ addElement, addSVGPath, addHandle, addUpdateFn, computed }) => {
			const cc = addHandle('end', { x: 0.5, y: 0.3 });
			const cd = addHandle('mid', { x: 0.5, y: 0.5 });
			const circle = computed(() => ({ c: cc, r: ptDist(cd, cc) }));
			addSVGPath('bounds', () => aaBox2SVG(circleBounds(circle.current)));
			addSVGPath('intersection-shape', () => circleSVG(circle.current));

			const l0 = addHandle('end', { x: 0.3, y: 0.7 });
			const l1 = addHandle('end', { x: 0.9, y: 0.5 });
			const box = computed(() => rectFromLineSeg2(line2FromPts(l0, l1), 0.1));
			addSVGPath('bounds', () => aaBox2SVG(rectBounds(box.current)));
			addSVGPath('intersection-shape', () => rectSVG(box.current));

			const ww = 100;
			const hh = 100;
			const c = addElement(
				mk('canvas', {
					width: ww,
					height: hh,
					class: 'overlay',
				}) as HTMLCanvasElement,
			);
			c.style.imageRendering = 'pixelated';
			const ctx = c.getContext('2d');
			const img = new ImageData(ww, hh);
			addUpdateFn(() => {
				for (let j = 0; j < hh; ++j) {
					const y = (j + 0.5) / hh;
					for (let i = 0; i < ww; ++i) {
						const pt = { x: (i + 0.5) / ww, y };
						const inC = circleContains(circle.current, pt);
						const inB = rectContains(box.current, pt);
						img.data[(j * ww + i) * 4 + 3] = inC || inB ? 255 : 0;
					}
				}
				ctx?.putImageData(img, 0, 0);
			});
		},
	),

	makeInteractive(({ addSVGPath, addHandle, computed }) => {
		const cc = addHandle('end', { x: 0.5, y: 0.3 });
		const cd = addHandle('mid', { x: 0.5, y: 0.5 });
		const circle = computed(() => ({ c: cc, r: ptDist(cd, cc) }));
		addSVGPath('intersection-shape', () => circleSVG(circle.current));

		const l0 = addHandle('end', { x: 0.3, y: 0.7 });
		const l1 = addHandle('end', { x: 0.9, y: 0.5 });
		const box = computed(() => rectFromLineSeg2(line2FromPts(l0, l1), 0.1));
		addSVGPath('intersection-shape', () => rectSVG(box.current));

		const p0 = addHandle('end', { x: 0.1, y: 0.1 });
		const p1 = addHandle('mid', { x: 0.9, y: 0.1 });
		const p2 = addHandle('mid', { x: 0.1, y: 0.9 });
		const p3 = addHandle('end', { x: 0.7, y: 0.9 });
		const bezier = computed(() => bezier3FromPts(p0, p1, p2, p3));
		//const bezier = computed(() => bezier3FromQuad(p0, p1, p2, p3));
		addSVGPath('ctl', () => bezier3SVG(bezier.current, undefined, 'M', true));
		addSVGPath('curve', () => bezier3SVG(bezier.current));

		addSVGPath('intersections', () => {
			const intersectionsCircle = intersectBezier3Circle(
				bezier.current,
				circle.current,
				1e-2,
			);
			const intersectionsBox = intersectBezier3Rect(
				bezier.current,
				box.current,
			);
			const intersections = [...intersectionsCircle, ...intersectionsBox];
			return intersections
				.map(({ t1, d1 }) => {
					const pt = bezier3At(bezier.current, t1);
					const dir = ptMul(bezier3TangentAt(bezier.current, t1), d1 * 0.02);
					const w = ptMul(ptRot90(dir), 0.75);
					return `M${ptSVG(pt)}l${ptSVG(ptMad(w, -0.5, dir))}l${ptSVG(w)}Z`;
				})
				.join('');
		});
	}),

	makeInteractive(({ addSVGPath, addHandle, computed }) => {
		const cc = addHandle('end', { x: 0.5, y: 0.3 });
		const cd = addHandle('mid', { x: 0.5, y: 0.5 });
		const circle = computed(() => ({ c: cc, r: ptDist(cd, cc) }));
		addSVGPath('intersection-shape', () => circleSVG(circle.current));

		const l0 = addHandle('end', { x: 0.3, y: 0.7 });
		const l1 = addHandle('end', { x: 0.9, y: 0.5 });
		const box = computed(() => rectFromLineSeg2(line2FromPts(l0, l1), 0.1));
		addSVGPath('intersection-shape', () => rectSVG(box.current));

		const p0 = addHandle('end', { x: 0.1, y: 0.1 });
		const p1 = addHandle('mid', { x: 0.9, y: 0.1 });
		const p2 = addHandle('mid', { x: 0.1, y: 0.9 });
		const p3 = addHandle('end', { x: 0.7, y: 0.9 });
		const bezier = computed(() => bezier3FromPts(p0, p1, p2, p3));
		addSVGPath('ctl', () => bezier3SVG(bezier.current, undefined, 'M', true));

		addSVGPath('curve', () =>
			cutBezier3Circle(
				bezier.current,
				circle.current,
				intersectBezier3CircleFn(bezier.current),
			)
				.flatMap((c) => (c.inside ? [] : cutBezier3Rect(c, box.current)))
				.filter((c) => !c.inside)
				.map((c) => bezier3SVG(c))
				.join(''),
		);
	}),
);

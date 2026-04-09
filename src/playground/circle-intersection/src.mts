import {
	circleSVG,
	intersectCircleCircle,
	intersectLineSeg2Circle,
	line2At,
	line2SVG,
	line2Tangent,
	lineSeg2TNearestPt2,
	ptDist,
	ptMad,
	ptMul,
	ptRot90,
	ptSVG,
} from '../../index.mts';
import { makeInteractive } from '../dom.mts';

document.body.append(
	makeInteractive(({ addSVGPath, addHandle, computed }) => {
		const cc1 = addHandle('end', { x: 0.5, y: 0.3 });
		const cd1 = addHandle('mid', { x: 0.5, y: 0.5 });
		const circle1 = computed(() => ({ c: cc1, r: ptDist(cd1, cc1) }));
		addSVGPath('intersection-shape', () => circleSVG(circle1.current));

		const cc2 = addHandle('end', { x: 0.8, y: 0.4 });
		const cd2 = addHandle('mid', { x: 0.8, y: 0.6 });
		const circle2 = computed(() => ({ c: cc2, r: ptDist(cd2, cc2) }));
		addSVGPath('intersection-shape', () => circleSVG(circle2.current));

		const l0 = addHandle('end', { x: 0.3, y: 0.7 });
		const l1 = addHandle('end', { x: 0.9, y: 0.5 });
		const line = computed(() => ({ p0: l0, p1: l1 }));
		addSVGPath('intersection-shape', () => line2SVG(line.current));

		addSVGPath('split', () => {
			const t1 = lineSeg2TNearestPt2(line.current, circle1.current.c);
			const t2 = lineSeg2TNearestPt2(line.current, circle2.current.c);
			return [
				`M${ptSVG(line2At(line.current, t1))}v0.001`,
				`M${ptSVG(line2At(line.current, t2))}v0.001`,
			].join('');
		});

		addSVGPath('split', () =>
			intersectCircleCircle(circle1.current, circle2.current)
				.map((pt) => `M${ptSVG(pt)}v0.001`)
				.join(''),
		);

		addSVGPath('intersections', () => {
			const intersections1 = intersectLineSeg2Circle(
				line.current,
				circle1.current,
			);
			const intersections2 = intersectLineSeg2Circle(
				line.current,
				circle2.current,
			);
			const intersections = [...intersections1, ...intersections2];
			return intersections
				.map(({ t1, d1 }) => {
					const pt = line2At(line.current, t1);
					const dir = ptMul(line2Tangent(line.current), d1 * 0.02);
					const w = ptMul(ptRot90(dir), 0.75);
					return `M${ptSVG(pt)}l${ptSVG(ptMad(w, -0.5, dir))}l${ptSVG(w)}Z`;
				})
				.join('');
		});
	}),
);

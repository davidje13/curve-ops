import {
	bezier2FromPts,
	bezier2SVG,
	bezier2Subdivide,
	bezier3FromPts,
	bezier3SVG,
	bezier3Subdivide,
	bezier3SubdivideBezier2,
	polyline2DSVG,
	ptSVG,
} from '../../index.mts';
import { makeInteractive, makeNumericInput, mk } from '../dom.mts';

document.body.append(
	makeInteractive(({ addElement, addSVGPath, addHandle, computed, update }) => {
		const maxError = makeNumericInput(0, 1, 'any', 1e-4, update);
		addElement(
			mk('div', {}, [mk('label', {}, ['Max error ', maxError.input])]),
		);

		const p0 = addHandle('end', { x: 0.1, y: 0.9 });
		const c1 = addHandle('mid', { x: 0.5, y: 0.1 });
		const p2 = addHandle('end', { x: 0.9, y: 0.9 });

		const bezier = computed(() => bezier2FromPts(p0, c1, p2));
		const lines = computed(() =>
			bezier2Subdivide(bezier.current, maxError.current()),
		);

		addSVGPath('ctl', () => bezier2SVG(bezier.current, undefined, 'M', true));
		addSVGPath('ctl', () => bezier2SVG(bezier.current));
		addSVGPath('curve', () => polyline2DSVG(lines.current));
		addSVGPath('split', () =>
			lines.current.map((pt) => `M${ptSVG(pt)}v0.001`).join(''),
		);
	}),

	makeInteractive(({ addElement, addSVGPath, addHandle, computed, update }) => {
		const maxError = makeNumericInput(0, 1, 'any', 1e-4, update);
		addElement(
			mk('div', {}, [mk('label', {}, ['Max error ', maxError.input])]),
		);

		const p0 = addHandle('end', { x: 0.1, y: 0.9 });
		const c1 = addHandle('mid', { x: 0.2, y: 0.1 });
		const c2 = addHandle('mid', { x: 0.6, y: 0.4 });
		const p3 = addHandle('end', { x: 0.9, y: 0.9 });

		const bezier = computed(() => bezier3FromPts(p0, c1, c2, p3));
		const divided = computed(() =>
			bezier3SubdivideBezier2(bezier.current, maxError.current()),
		);

		addSVGPath('ctl', () => bezier3SVG(bezier.current, undefined, 'M', true));
		addSVGPath('ctl', () => bezier3SVG(bezier.current));
		addSVGPath('curve', () =>
			divided.current
				.map((c, i) => bezier2SVG(c, undefined, i ? 'L' : 'M'))
				.join(''),
		);
		addSVGPath('split', () =>
			divided.current.map(({ p0 }) => `M${ptSVG(p0)}v0.001`).join(''),
		);
	}),

	makeInteractive(({ addElement, addSVGPath, addHandle, computed, update }) => {
		const maxError = makeNumericInput(0, 1, 'any', 1e-4, update);
		addElement(
			mk('div', {}, [mk('label', {}, ['Max error ', maxError.input])]),
		);

		const p0 = addHandle('end', { x: 0.1, y: 0.9 });
		const c1 = addHandle('mid', { x: 0.2, y: 0.1 });
		const c2 = addHandle('mid', { x: 0.6, y: 0.4 });
		const p3 = addHandle('end', { x: 0.9, y: 0.9 });

		const bezier = computed(() => bezier3FromPts(p0, c1, c2, p3));
		const lines = computed(() =>
			bezier3Subdivide(bezier.current, maxError.current()),
		);

		addSVGPath('ctl', () => bezier3SVG(bezier.current, undefined, 'M', true));
		addSVGPath('ctl', () => bezier3SVG(bezier.current));
		addSVGPath('curve', () => polyline2DSVG(lines.current));
		addSVGPath('split', () =>
			lines.current.map((pt) => `M${ptSVG(pt)}v0.001`).join(''),
		);
	}),
);

import {
	type Pt,
	bezierFromBezier3,
	bezierFromPolylineVertsLeastSquares,
	bezierFromPolylineVertsLeastSquaresFixEnds,
	bezierSVG,
	leastSquaresFitCubicFixEnds,
	polyline2DSVG,
	polylineFromVecs,
	ptLerp,
	vecFromPt,
} from '../../index.mts';
import { polyline2DFromPolyline } from '../../math/geometry/2d/Polyline2D.mts';
import {
	makeCheckbox,
	makeInteractive,
	makeNumericInput,
	mk,
} from '../dom.mts';

document.body.append(
	makeInteractive(({ addElement, addSVGPath, addHandle, computed, update }) => {
		const fixEnds = makeCheckbox('Fix ends', true, update);
		addElement(mk('div', {}, [fixEnds.input]));

		const fixStartGrad = makeCheckbox('Fix start gradient', true, update);
		addElement(mk('div', {}, [fixStartGrad.input]));

		const curveOrder = makeNumericInput(1, 20, 1, 3, update);
		addElement(
			mk('div', {}, [mk('label', {}, ['Curve order', curveOrder.input])]),
		);

		const lineStart = { x: 0.2, y: 0.5 };
		const lineEnd = { x: 0.8, y: 0.5 };
		const controlCount = 8;
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

		const polyline = computed(() => polylineFromVecs(pts.map(vecFromPt)));

		const bezier = computed(() => {
			try {
				if (!fixEnds.current()) {
					return bezierFromPolylineVertsLeastSquares(
						polyline.current,
						curveOrder.current() + 1,
					);
				} else if (!fixStartGrad.current()) {
					return bezierFromPolylineVertsLeastSquaresFixEnds(
						polyline.current,
						curveOrder.current() + 1,
					);
				} else {
					if (curveOrder.current() === 3) {
						const bezier3 = leastSquaresFitCubicFixEnds(
							polyline2DFromPolyline(polyline.current),
							pprev,
						);
						return bezier3 ? bezierFromBezier3(bezier3) : null;
					}
					return null;
				}
			} catch (err) {
				console.error(err);
				return null;
			}
		});

		addSVGPath('ctl', () =>
			polyline2DSVG(polyline2DFromPolyline(polyline.current)),
		);

		addSVGPath('ctl', () =>
			bezier.current ? bezierSVG(bezier.current, undefined, 'M', true) : null,
		);
		addSVGPath('curve', () =>
			bezier.current ? bezierSVG(bezier.current) : null,
		);
	}),
);

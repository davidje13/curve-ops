import { bezierAtMulti, type Bezier } from '../Bezier.mts';
import { ptsFromMat, ptSVG } from './Pt.mts';

export function bezierSVG(
	curve: Bezier<number, 2>,
	precision?: number | undefined,
	prefix = 'M',
	controlLines = false,
): string {
	const pts = ptsFromMat(curve).map((pt) => ptSVG(pt, precision));
	if (controlLines || curve.m < 3) {
		return prefix + pts.join('L');
	}
	switch (curve.m) {
		case 3:
			return `${prefix}${pts[0]}Q${pts[1]} ${pts[2]}`;
		case 4:
			return `${prefix}${pts[0]}C${pts[1]} ${pts[2]} ${pts[3]}`;
		default:
			const n = 30; // TODO: pick dynamically and/or pick smarter t values
			const ts: number[] = [];
			for (let i = 0; i <= n; ++i) {
				ts.push(i / n);
			}
			return (
				prefix +
				ptsFromMat(bezierAtMulti(curve, ts))
					.map((pt) => ptSVG(pt, precision))
					.join('L')
			);
	}
}

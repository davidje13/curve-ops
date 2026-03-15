import {
	bezier2Bisect,
	bezier2Derivative,
	bezier2FromBezier,
	bezier2LengthEstimate,
	lineAt,
	lineDerivative,
	matMulABTranspose,
	matReshape,
	ptCross,
	ptDist,
	ptDot,
	ptLen,
	ptSub,
	vecFrom,
	type Matrix,
	type QuadraticBezier,
} from '../../index.mts';

self.addEventListener(
	'message',
	({
		data: { buffer, curveMatrix, w, h, xL, xS, xH, yL, yS, yH },
	}: MessageEvent<TaskData>) => {
		const errorValues = new Float64Array(buffer, 0, w * h);
		const mx = 1 / (w - 1);
		const my = 1 / (h - 1);
		for (let y = yL; y < yH; y += yS) {
			const yv = 1 - y * my;
			for (let x = xL; x < xH; x += xS) {
				const curve = bezier2FromBezier(
					matReshape(matMulABTranspose(vecFrom(1, x * mx, yv), curveMatrix), 2),
				);
				const trueLength = measureQuadArclen7(curve, 1e-16);
				const est = bezier2LengthEstimate(curve, 1e-13);
				errorValues[y * w + x] = Math.abs(trueLength - est.best) / trueLength;
			}
		}
		self.postMessage({});
	},
);

function measureQuadArclen7(
	curve: QuadraticBezier,
	maxError: number,
	maxRecursion = 22,
): number {
	// Baseline comparison code adapted from Kurbo https://github.com/linebender/kurbo/blob/d4b3c46ded3d9af45ba3696fa2cd13ea2fc823c6/kurbo/examples/arclen_accuracy.rs#L79-L98
	// Kurbo Copyright (c) 2018 Raph Levien, available as Apache-2.0 or MIT

	const d1 = bezier2Derivative(curve);
	const d2 = lineDerivative(d1);

	const d = ptSub(curve.p2, curve.p0);
	const lChord = ptLen(d);
	const lPolygon = ptDist(curve.p0, curve.c1) + ptDist(curve.c1, curve.p2);
	if (lChord < Number.EPSILON) {
		return (lChord + lPolygon) * 0.5;
	}
	const dhypot2 = lChord * lChord * 2;
	const x = ptDot(d, d2) / dhypot2;
	const y = ptCross(d, d2) / dhypot2;
	const l2 = x * x + y * y;
	const l4 = l2 * l2;
	const l8 = l4 * l4;
	const estErr = 2.5e-2 * (lPolygon - lChord) * Math.tanh(l8 * l8);
	if (estErr > maxError) {
		if (!maxRecursion) {
			return Number.NaN;
		}
		const [curve0, curve1] = bezier2Bisect(curve);
		return (
			measureQuadArclen7(curve0, maxError * 0.5, maxRecursion - 1) +
			measureQuadArclen7(curve1, maxError * 0.5, maxRecursion - 1)
		);
	}

	let len = 0;
	for (const [wi, xi] of GAUSS_LEGENDRE_COEFFS_7) {
		len += wi * ptLen(lineAt(d1, 0.5 * xi + 0.5));
	}
	return len * 0.5;
}

const GAUSS_LEGENDRE_COEFFS_7: [number, number][] = [
	[0.4179591836734694, 0],
	[0.3818300505051189, 0.4058451513773972],
	[0.3818300505051189, -0.4058451513773972],
	[0.2797053914892766, -0.7415311855993945],
	[0.2797053914892766, 0.7415311855993945],
	[0.1294849661688697, -0.9491079123427585],
	[0.1294849661688697, 0.9491079123427585],
];

interface TaskData {
	buffer: SharedArrayBuffer;
	curveMatrix: Matrix<6, 3>;
	w: number;
	h: number;
	xL: number;
	xS: number;
	xH: number;
	yL: number;
	yS: number;
	yH: number;
}

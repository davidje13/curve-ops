import { PT0, ptDist, type Pt } from './Pt.mts';
import {
	bezier2At,
	bezier2FromPts,
	bezier2LengthEstimate,
	type QuadraticBezier,
} from './QuadraticBezier.mts';
import 'lean-test';

describe('bezier2LengthEstimate', () => {
	it(
		'provides a length estimate within the given error tolerance',
		{ repeat: 100 },
		() => {
			checkCurveLength(bezier2FromPts(randomPt(), randomPt(), randomPt()));
		},
	);

	it('works with closed loops', { repeat: 20 }, () => {
		const p0 = randomPt();
		checkCurveLength(bezier2FromPts(p0, randomPt(), p0));
	});

	it('works with edge cases', () => {
		const PT1 = { x: 1, y: 0 };
		checkCurveLength(bezier2FromPts(PT0, PT0, PT0), 0);
		checkCurveLength(bezier2FromPts(PT0, PT0, PT1), 1);
		checkCurveLength(bezier2FromPts(PT0, PT1, PT1), 1);
		checkCurveLength(bezier2FromPts(PT0, { x: 0.5, y: 0 }, PT1), 1);
	});

	it('is accurate near edge cases', () => {
		const PT1 = { x: 1, y: 0 };
		for (let i = 1; i < 1000; ++i) {
			const d = Number.EPSILON * Math.pow(1.03, i);
			checkCurveLength(bezier2FromPts(PT0, { x: d, y: 0 }, PT1), 1);
			checkCurveLength(bezier2FromPts(PT0, { x: 0, y: d }, PT1));
			checkCurveLength(bezier2FromPts(PT0, { x: d, y: d }, PT1));
			checkCurveLength(bezier2FromPts(PT0, { x: 1 - d, y: 0 }, PT1), 1);
			checkCurveLength(bezier2FromPts(PT0, { x: 0.5 + d, y: 0 }, PT1), 1);
			checkCurveLength(bezier2FromPts(PT0, PT0, { x: d, y: 0 }), d);
			checkCurveLength(bezier2FromPts(PT0, { x: d, y: 0 }, { x: d, y: 0 }), d);
			checkCurveLength(bezier2FromPts(PT0, { x: 0, y: 1 }, { x: d, y: 0 }));
		}
	});
});

function checkCurveLength(
	curve: QuadraticBezier,
	trueLength?: number | undefined,
) {
	const hasTrueLength = trueLength !== undefined;
	if (trueLength === undefined) {
		trueLength = measureFunction(bezier2At.bind(null, curve), 0, 1, 1e5);
	}
	try {
		const estLength = bezier2LengthEstimate(curve, 1e-13);
		expect(estLength.best).isGreaterThanOrEqual(0);
		expect(estLength.maxError).isGreaterThanOrEqual(0);
		expect(estLength.maxError).isLessThanOrEqual(1e-13);

		expect(estLength.best).isNear(trueLength, {
			tolerance: hasTrueLength ? estLength.maxError : 1e-8,
		});
	} catch (err) {
		console.log('failed for', curve);
		throw err;
	}
}

const randomPt = (range = 1) => ({
	x: Math.random() * range,
	y: Math.random() * range,
});

function measureFunction(
	f: (t: number) => Pt,
	start: number,
	end: number,
	steps: number,
) {
	let sum = 0;
	let prev = f(start);
	const range = end - start;
	for (let i = 1; i <= steps; ++i) {
		const p = start + range * (i / steps);
		const pt = f(p);
		sum += ptDist(pt, prev);
		prev = pt;
	}
	return sum;
}

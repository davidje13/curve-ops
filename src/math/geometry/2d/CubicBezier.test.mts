import { PT0, ptDist, type Pt } from './Pt.mts';
import {
	bezier3At,
	bezier3FromPts,
	bezier3LengthEstimate,
	type CubicBezier,
} from './CubicBezier.mts';
import 'lean-test';

describe('bezier3LengthEstimate', () => {
	it(
		'provides a length estimate within the given error tolerance',
		{ repeat: 100 },
		() => {
			checkCurveLength(
				bezier3FromPts(randomPt(), randomPt(), randomPt(), randomPt()),
			);
		},
	);

	it('works with closed loops', { repeat: 20 }, () => {
		const p0 = randomPt();
		checkCurveLength(bezier3FromPts(p0, randomPt(), randomPt(), p0));
	});

	it('works with edge cases', () => {
		const PT1 = { x: 1, y: 0 };
		checkCurveLength(bezier3FromPts(PT0, PT0, PT0, PT0), 0);
		checkCurveLength(bezier3FromPts(PT0, PT0, PT0, PT1), 1);
		checkCurveLength(bezier3FromPts(PT0, PT0, PT1, PT1), 1);
		checkCurveLength(bezier3FromPts(PT0, PT1, PT1, PT1), 1);
		checkCurveLength(bezier3FromPts(PT0, PT1, PT0, PT1), 1);
		checkCurveLength(
			bezier3FromPts(PT0, PT1, { x: 2, y: 0 }, { x: 3, y: 0 }),
			3,
		);
	});

	it('is accurate near edge cases', () => {
		const PT1 = { x: 1, y: 0 };
		for (let i = 1; i < 100; ++i) {
			const d = Number.EPSILON * Math.pow(1.34, i);
			checkCurveLength(bezier3FromPts(PT0, PT0, { x: d, y: 0 }, PT1), 1);
			checkCurveLength(bezier3FromPts(PT0, { x: 1 - d, y: 0 }, PT1, PT1), 1);
			checkCurveLength(bezier3FromPts(PT0, PT0, PT0, { x: d, y: 0 }), d);
			checkCurveLength(
				bezier3FromPts(PT0, PT0, { x: d, y: 0 }, { x: d, y: 0 }),
				d,
			);
			checkCurveLength(
				bezier3FromPts(PT0, { x: 1 + d, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }),
				3,
			);
		}
	});
});

function checkCurveLength(curve: CubicBezier, trueLength?: number | undefined) {
	const hasTrueLength = trueLength !== undefined;
	if (trueLength === undefined) {
		trueLength = measureFunction(bezier3At.bind(null, curve), 0, 1, 1e5);
	}
	try {
		for (const maxError of [1e-1, 1e-4, 1e-6, 1e-8]) {
			const estLength = bezier3LengthEstimate(curve, maxError);
			expect(estLength.best).isGreaterThanOrEqual(0);
			expect(estLength.maxError).isGreaterThanOrEqual(0);
			expect(estLength.maxError).isLessThanOrEqual(maxError + Number.EPSILON);

			expect(estLength.best).isNear(trueLength, {
				tolerance: hasTrueLength ? estLength.maxError : maxError,
			});
		}
	} catch (err) {
		console.log('failed for', curve);
		throw err;
	}
}

const randomPt = () => ({ x: Math.random(), y: Math.random() });

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

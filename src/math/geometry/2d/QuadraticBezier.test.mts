import { ptDist, type Pt } from './Pt.mts';
import {
	bezier2At,
	bezier2FromPts,
	bezier2LengthEstimate,
} from './QuadraticBezier.mts';
import 'lean-test';

describe('bezier2LengthEstimate', () => {
	it(
		'provides a length estimate within the given error tolerance',
		{ repeat: 100 },
		() => {
			const curve = bezier2FromPts(randomPt(), randomPt(), randomPt());
			const trueLength = measureFunction(
				bezier2At.bind(null, curve),
				0,
				1,
				1e5,
			);
			try {
				for (const maxError of [1e-1, 1e-4, 1e-6, 1e-8]) {
					const estLength = bezier2LengthEstimate(curve, maxError);
					expect(estLength.best).isGreaterThan(0);
					expect(estLength.maxError).isGreaterThanOrEqual(0);

					expect(estLength.best).isNear(trueLength, { tolerance: maxError });
					expect(estLength.maxError).isLessThanOrEqual(maxError);
				}
			} catch (err) {
				console.log('failed for', curve);
				throw err;
			}
		},
	);
});

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

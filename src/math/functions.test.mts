import { erf, erfc } from './functions.mts';
import 'lean-test';

describe('erf', () => {
	it('returns 0 at 0', () => {
		expect(erf(0)).equals(0);
	});

	it('returns ±1 at infinity', () => {
		expect(erf(Number.POSITIVE_INFINITY)).equals(1);
		expect(erf(Number.NEGATIVE_INFINITY)).equals(-1);
	});

	it('returns -1 at -infinity', () => {
		expect(erf(Number.NEGATIVE_INFINITY)).equals(-1);
	});

	it('is an odd function', () => {
		for (let i = 0; i < 1000; ++i) {
			const x = i * 0.01;
			expect(erf(-x)).isNear(-erf(x), { tolerance: 2e-9 });
		}
	});

	it('returns known values', () => {
		expect(erf(0.001)).isNear(0.0011283788, { tolerance: 2e-9 });
		expect(erf(1)).isNear(0.8427007929, { tolerance: 2e-9 });
		expect(erf(2)).isNear(0.995322265, { tolerance: 2e-9 });
	});
});

describe('erfc', () => {
	it('returns 1-erf(x)', () => {
		for (let i = 0; i < 1000; ++i) {
			const x = i * 0.01;
			expect(erfc(x)).isNear(1 - erf(x), { tolerance: 2e-9 });
		}
	});

	it('returns known values at high precision', () => {
		expect(erfc(1)).isNear(0.15729920705028513, { tolerance: 2e-9 });
		expect(erfc(2)).isNear(0.00467773498104726, { tolerance: 2e-10 });
		expect(erfc(3)).isNear(0.00002209049699858, { tolerance: 1e-14 });
		expect(erfc(4)).isNear(1.541725790028001e-8, { tolerance: 1e-21 });
		expect(erfc(5)).isNear(1.537459794428034e-12, { tolerance: 1e-25 });
		expect(erfc(6)).isNear(2.151973671249891e-17, { tolerance: 1e-30 });
	});

	it('is symmetric about 0,1', () => {
		for (let i = 0; i < 1000; ++i) {
			const x = i * 0.01;
			expect(erfc(-x)).isNear(2 - erfc(x), { tolerance: 2e-9 });
		}
	});

	it('returns 0 at +infinity', () => {
		expect(erfc(Number.POSITIVE_INFINITY)).equals(0);
	});

	it('returns 2 at -infinity', () => {
		expect(erfc(Number.NEGATIVE_INFINITY)).equals(2);
	});
});

import { binomial } from './binomial.mts';
import 'lean-test';

describe('binomial', () => {
	it('returns 1 if b = 0', () => {
		for (let i = 0; i < 100; ++i) {
			expect(binomial(i, 0)).equals(1);
		}
	});

	it('returns 1 if b = a', () => {
		for (let i = 1; i < 100; ++i) {
			expect(binomial(i, i)).equals(1);
		}
	});

	it('returns 0 if a < 0', () => {
		for (let i = -50; i < 50; ++i) {
			expect(binomial(-1, i)).equals(0);
		}
	});

	it('returns 0 if b < 0 or b > a', () => {
		for (let i = 0; i < 100; ++i) {
			expect(binomial(i, -1)).equals(0);
			expect(binomial(i, i + 1)).equals(0);
		}
	});

	it('is symmetric', () => {
		for (let i = 0; i < 100; ++i) {
			for (let j = 0; j < i / 2; ++j) {
				expect(binomial(i, j)).equals(binomial(i, i - j));
			}
		}
	});

	it('returns binomial values', () => {
		expect(binomial(2, 1)).equals(2);

		expect(binomial(3, 1)).equals(3);

		expect(binomial(4, 1)).equals(4);
		expect(binomial(4, 2)).equals(6);

		expect(binomial(5, 1)).equals(5);
		expect(binomial(5, 2)).equals(10);

		expect(binomial(6, 1)).equals(6);
		expect(binomial(6, 2)).equals(15);
		expect(binomial(6, 3)).equals(20);

		expect(binomial(7, 1)).equals(7);
		expect(binomial(7, 2)).equals(21);
		expect(binomial(7, 3)).equals(35);

		for (let i = 8; i < 100; ++i) {
			for (let j = 0; j < i / 2; ++j) {
				expect(binomial(i, j)).equals(
					binomial(i - 1, j - 1) + binomial(i - 1, j),
				);
			}
		}
	});
});

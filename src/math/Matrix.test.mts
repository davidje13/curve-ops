import { matFrom } from './Matrix.mts';
import 'lean-test';

describe('matFrom', () => {
	it('creates a sized matrix with data in row major order', () => {
		const mat = matFrom([1, 2], [3, 4], [5, 6]);
		expect(mat.m).equals(3);
		expect(mat.n).equals(2);
		expect(mat.v).equals([1, 2, 3, 4, 5, 6]);
	});
});

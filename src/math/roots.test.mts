import { solveLinear, solveQuadratic } from './roots.mts';
import 'lean-test';

describe('solveLinear', () => {
	it('solves ax+b=0', () => {
		const roots = solveLinear(4, -2);
		expect(roots).hasLength(1);
		expect(roots[0]!).isNear(0.5);
	});

	it('returns no solutions if a is 0', () => {
		const roots = solveLinear(0, -2);
		expect(roots).isEmpty();
	});
});

describe('solveQuadratic', () => {
	it('solves ax^2+bx+c=0', () => {
		const roots = solveQuadratic(2, -12, 16);
		expect(roots).hasLength(2);
		expect(roots[0]!).isNear(4);
		expect(roots[1]!).isNear(2);
	});

	it('returns one solution if the equation has a repeated root', () => {
		const roots = solveQuadratic(1, -6, 9);
		expect(roots).hasLength(1);
		expect(roots[0]!).isNear(3);
	});

	it('returns a linear solution if a is 0', () => {
		const roots = solveQuadratic(0, 4, -2);
		expect(roots).hasLength(1);
		expect(roots[0]!).isNear(0.5);
	});

	it('returns no solutions if the equation has no roots', () => {
		const roots = solveQuadratic(10, 1, 10);
		expect(roots).isEmpty();
	});

	it('returns no solutions if a and b are 0', () => {
		const roots = solveQuadratic(0, 0, 10);
		expect(roots).isEmpty();
	});
});

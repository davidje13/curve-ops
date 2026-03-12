import type { Increment } from '../types/numeric.mts';
import { zeros, type SizedArray } from '../util/SizedArray.mts';
import { solveCubic, solveLinear, solveO6, solveQuadratic } from './roots.mts';
import 'lean-test';

describe('solveLinear', () => {
	it('solves ax+b=0', () => {
		const roots = solveLinear(4, -2);
		expect(roots).toContain(isNear(0.5, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns no solutions if a is 0', () => {
		expect(solveLinear(0, -2)).isEmpty();
		expect(solveLinear(0, 0)).isEmpty();
	});
});

describe('solveQuadratic', () => {
	it('solves ax^2+bx+c=0', () => {
		const roots = solveQuadratic(
			...polynomialScale(polynomialWithSolutions(2, 4), 2),
		);
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).toContain(isNear(4, { tolerance }));
		expect(roots).hasLength(2);
	});

	it('returns one solution if the equation has a repeated root (3,3)', () => {
		const roots = solveQuadratic(...polynomialWithSolutions(3, 3));
		expect(roots).toContain(isNear(3, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns no solutions if the equation has no roots', () => {
		expect(solveQuadratic(10, 1, 10)).isEmpty();
		expect(solveQuadratic(-10, -1, -10)).isEmpty();
	});

	it('returns a linear solution if a is 0', () => {
		const roots = solveQuadratic(0, 4, -2);
		expect(roots).toContain(isNear(0.5, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns no solutions if a and b are 0', () => {
		expect(solveQuadratic(0, 0, 10)).isEmpty();
		expect(solveQuadratic(0, 0, 0)).isEmpty();
	});
});

describe('solveCubic', () => {
	it('solves ax^3+bx^2+cx+d=0', () => {
		const roots = solveCubic(
			...polynomialScale(polynomialWithSolutions(1, 2, 3), 2),
		);
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).toContain(isNear(3, { tolerance }));
		expect(roots).hasLength(3);
	});

	it('returns two solutions if the equation has a repeated root (1,1,2)', () => {
		const roots = solveCubic(...polynomialWithSolutions(1, 1, 2));
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).hasLength(2);
	});

	it('returns two solutions if the equation has a repeated root (1,2,2)', () => {
		const roots = solveCubic(...polynomialWithSolutions(1, 2, 2));
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).hasLength(2);
	});

	it('returns one solution if the equation has a triple repeated root (1,1,1)', () => {
		const roots = solveCubic(...polynomialWithSolutions(1, 1, 1));
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns one solution if the equation has a turning point below y=0', () => {
		const roots = solveCubic(
			...polynomialShift(polynomialWithSolutions(1, 1, 2), 2),
		);
		expect(roots).toContain(isNear(0, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns one solution if the equation has a turning point above y=0', () => {
		const roots = solveCubic(
			...polynomialShift(polynomialWithSolutions(0, 0, 1), -4),
		);
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns a quadratic solution if a is 0', () => {
		const roots = solveCubic(0, 2, -12, 16);
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).toContain(isNear(4, { tolerance }));
		expect(roots).hasLength(2);
	});

	it('returns a linear solution if a and b are 0', () => {
		const roots = solveCubic(0, 0, 4, -2);
		expect(roots).toContain(isNear(0.5, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns no solutions if a, b, and c are 0', () => {
		expect(solveCubic(0, 0, 0, 10)).isEmpty();
		expect(solveCubic(0, 0, 0, 0)).isEmpty();
	});
});

describe('solveO6', () => {
	it('solves ax^6+bx^5+cx^4+dx^3+ex^2+fx+g=0, returning ordered roots', () => {
		const roots = solveO6(
			...polynomialScale(polynomialWithSolutions(1, 2, 3, 4, 5, 6), 2),
			{ min: -1, max: 10, maxError: tolerance },
		);
		expect(roots).hasLength(6);
		expect(roots[0]![0]).isNear(1, { tolerance });
		expect(roots[1]![0]).isNear(2, { tolerance });
		expect(roots[2]![0]).isNear(3, { tolerance });
		expect(roots[3]![0]).isNear(4, { tolerance });
		expect(roots[4]![0]).isNear(5, { tolerance });
		expect(roots[5]![0]).isNear(6, { tolerance });
	});

	it('returns fewer roots if equation has turning points at y<>0', () => {
		const roots = solveO6(
			...polynomialShift(polynomialWithSolutions(1, 2, 3, 4, 5, 6), 5),
			{ min: -1, max: 10, maxError: tolerance },
		);
		expect(roots).hasLength(4);
		expect(roots[0]![0]).isNear(1.04, { tolerance: 1e-2 });
		expect(roots[1]![0]).isNear(1.82, { tolerance: 1e-2 });
		expect(roots[2]![0]).isNear(5.18, { tolerance: 1e-2 });
		expect(roots[3]![0]).isNear(5.96, { tolerance: 1e-2 });
	});

	it('returns direction of each crossing', () => {
		const roots = solveO6(
			...polynomialScale(polynomialWithSolutions(1, 2, 3, 4, 5, 6), 2),
			{ min: -1, max: 10, maxError: tolerance },
		);
		expect(roots).hasLength(6);
		expect(roots[0]![1]).equals(-1);
		expect(roots[1]![1]).equals(1);
		expect(roots[2]![1]).equals(-1);
		expect(roots[3]![1]).equals(1);
		expect(roots[4]![1]).equals(-1);
		expect(roots[5]![1]).equals(1);
	});

	it('only includes crossings within the given range', () => {
		const roots = solveO6(...polynomialWithSolutions(1, 2, 3, 4, 5, 6), {
			min: 2.1,
			max: 5.1,
			maxError: tolerance,
		});
		expect(roots).hasLength(3);
		expect(roots[0]![0]).isNear(3, { tolerance });
		expect(roots[0]![1]).equals(-1);
		expect(roots[1]![0]).isNear(4, { tolerance });
		expect(roots[1]![1]).equals(1);
		expect(roots[2]![0]).isNear(5, { tolerance });
		expect(roots[2]![1]).equals(-1);
	});
});

const polynomialWithSolutions = <const S extends number[]>(...solutions: S) =>
	polynomialMul(...solutions.map((s) => [1, -s])) as SizedArray<
		number,
		Increment<S['length']>
	>;

const polynomialScale = <const S extends number[]>(
	terms: S,
	scale: number,
): S => terms.map((v) => v * scale) as S;

function polynomialShift<const S extends number[]>(terms: S, shift: number): S {
	const r = [...terms];
	r[r.length - 1]! += shift;
	return r as S;
}

const polynomialMul = (...polynomials: number[][]) =>
	polynomials.reduce((a, b) => {
		const r = zeros(a.length + b.length - 1);
		for (let i = 0; i < a.length; ++i) {
			for (let j = 0; j < b.length; ++j) {
				r[i + j]! += a[i]! * b[j]!;
			}
		}
		return r;
	});

const tolerance = 1e-10;
